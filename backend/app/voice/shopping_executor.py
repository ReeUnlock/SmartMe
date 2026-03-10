import logging
import unicodedata

from sqlalchemy.orm import Session

from app.auth.models import User
from app.shopping.models import ShoppingList, ShoppingItem, ShoppingCategory
from app.shopping.router import get_inne_category_id
from app.voice.schemas import VoiceConfirmAction

logger = logging.getLogger(__name__)


def _resolve_category_id(
    db: Session, user: User, category_name: str | None
) -> int:
    """Resolve a category name to its ID, falling back to 'Inne'."""
    if category_name:
        cat = (
            db.query(ShoppingCategory)
            .filter(
                ShoppingCategory.user_id == user.id,
                ShoppingCategory.name.ilike(f"%{category_name}%"),
            )
            .first()
        )
        if cat:
            return cat.id
    return get_inne_category_id(db, user.id)


def _list_to_dict(sl: ShoppingList) -> dict:
    return {
        "id": sl.id,
        "name": sl.name,
        "is_completed": sl.is_completed,
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "quantity": item.quantity,
                "unit": item.unit,
                "is_checked": item.is_checked,
            }
            for item in sl.items
        ],
    }


# ─── Smart item matching ───────────────────────────────────────

def _normalize(text: str) -> str:
    """Normalize text for comparison: lowercase, strip, collapse spaces,
    remove Polish diacritics."""
    text = text.lower().strip()
    # Replace multiple spaces
    text = " ".join(text.split())
    # Remove Polish diacritics: ą→a, ć→c, ę→e, ł→l, ń→n, ó→o, ś→s, ź→z, ż→z
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def _score_match(query_norm: str, item_name_norm: str) -> int:
    """Score how well a query matches an item name.
    Higher score = better match.

    Returns:
      100 — exact match (normalized)
       80 — item name starts with query
       60 — query is a full word/token in item name
       40 — item name contains query as substring
        0 — no match
    """
    if query_norm == item_name_norm:
        return 100

    if item_name_norm.startswith(query_norm + " ") or item_name_norm.startswith(query_norm):
        # "mleko" matches "mleko bez laktozy" — starts-with
        if item_name_norm.startswith(query_norm + " ") or item_name_norm == query_norm:
            return 80

    # Token match: "ser" matches "ser żółty" but not "serwetki"
    item_tokens = item_name_norm.split()
    if query_norm in item_tokens:
        return 60

    # Substring match: weakest
    if query_norm in item_name_norm:
        return 40

    return 0


def _find_best_item_match(
    db: Session,
    list_id: int,
    user_id: int,
    search_name: str,
    checked_filter: bool | None = None,
) -> ShoppingItem | None:
    """Find the best matching item using tiered scoring.

    Args:
        checked_filter: None=all items, True=only checked, False=only unchecked

    Returns the best match, or raises ValueError if ambiguous or not found.
    """
    query = db.query(ShoppingItem).filter(
        ShoppingItem.list_id == list_id,
        ShoppingItem.user_id == user_id,
    )
    if checked_filter is not None:
        query = query.filter(ShoppingItem.is_checked == checked_filter)

    # Get all candidates from the list
    candidates = query.all()
    if not candidates:
        return None

    search_norm = _normalize(search_name)
    if not search_norm:
        return None

    # Score all candidates
    scored = []
    for item in candidates:
        score = _score_match(search_norm, _normalize(item.name))
        if score > 0:
            scored.append((score, item))

    if not scored:
        return None

    # Sort by score descending
    scored.sort(key=lambda x: x[0], reverse=True)

    best_score = scored[0][0]
    best_item = scored[0][1]

    # Check for ambiguous ties at the top score
    ties = [s for s in scored if s[0] == best_score]
    if len(ties) > 1 and best_score <= 40:
        # Multiple weak substring matches — ambiguous
        names = [t[1].name for t in ties[:3]]
        logger.warning(
            f"Ambiguous match for '{search_name}': {names} (score={best_score})"
        )
        matched_names = ", ".join(f'"{n}"' for n in names)
        raise ValueError(
            f'Niejednoznaczne dopasowanie dla "{search_name}": '
            f"pasuje do {matched_names}. "
            f"Spr\u00f3buj u\u017cy\u0107 dok\u0142adniejszej nazwy."
        )

    return best_item


# ─── Executors ──────────────────────────────────────────────────

def execute_create_shopping_list(
    db: Session, user: User, action: VoiceConfirmAction
) -> dict:
    """Create a new shopping list with items from voice command."""
    list_name = action.list_name
    if not list_name:
        raise ValueError("Brak nazwy listy zakupów.")

    sl = ShoppingList(name=list_name, user_id=user.id)
    db.add(sl)
    db.flush()

    if action.items:
        for i, item_param in enumerate(action.items):
            category_id = _resolve_category_id(db, user, item_param.category)
            item = ShoppingItem(
                name=item_param.name,
                quantity=item_param.quantity,
                unit=item_param.unit,
                is_checked=False,
                sort_order=i,
                list_id=sl.id,
                category_id=category_id,
                user_id=user.id,
            )
            db.add(item)

    db.commit()
    db.refresh(sl)

    logger.info(
        f"Voice: created shopping list '{sl.name}' (id={sl.id}) "
        f"with {len(sl.items)} items"
    )
    return _list_to_dict(sl)


def execute_add_shopping_items(
    db: Session, user: User, action: VoiceConfirmAction
) -> dict:
    """Add items to an existing shopping list found by name."""
    if not action.list_name:
        raise ValueError("Brak nazwy listy zakupów.")
    if not action.items:
        raise ValueError("Brak produktów do dodania.")

    sl = _find_active_list(db, user, action.list_name)

    max_sort = max((item.sort_order for item in sl.items), default=-1)

    for i, item_param in enumerate(action.items):
        category_id = _resolve_category_id(db, user, item_param.category)
        item = ShoppingItem(
            name=item_param.name,
            quantity=item_param.quantity,
            unit=item_param.unit,
            is_checked=False,
            sort_order=max_sort + 1 + i,
            list_id=sl.id,
            category_id=category_id,
            user_id=user.id,
        )
        db.add(item)

    db.commit()
    db.refresh(sl)

    logger.info(
        f"Voice: added {len(action.items)} items to list '{sl.name}' (id={sl.id})"
    )
    return _list_to_dict(sl)


def _find_active_list(db: Session, user: User, list_name: str) -> ShoppingList:
    """Find active shopping list by fuzzy name match."""
    sl = (
        db.query(ShoppingList)
        .filter(
            ShoppingList.user_id == user.id,
            ShoppingList.name.ilike(f"%{list_name}%"),
            ShoppingList.is_completed == False,
        )
        .order_by(ShoppingList.created_at.desc())
        .first()
    )
    if not sl:
        raise ValueError(f"Nie znaleziono aktywnej listy '{list_name}'.")
    return sl


def execute_check_shopping_items(
    db: Session, user: User, action: VoiceConfirmAction
) -> dict:
    """Mark items as checked (bought) on a shopping list."""
    if not action.list_name:
        raise ValueError("Brak nazwy listy zakupów.")
    if not action.items:
        raise ValueError("Brak produktów do oznaczenia.")

    sl = _find_active_list(db, user, action.list_name)

    checked_names = []
    for item_param in action.items:
        match = _find_best_item_match(
            db, sl.id, user.id, item_param.name, checked_filter=False
        )
        if match:
            match.is_checked = True
            checked_names.append(match.name)

    if not checked_names:
        raise ValueError("Nie znaleziono pasujących niekupionych produktów na liście.")

    db.commit()
    db.refresh(sl)

    logger.info(
        f"Voice: checked {len(checked_names)} items on list '{sl.name}' (id={sl.id}): {checked_names}"
    )
    return _list_to_dict(sl)


def execute_uncheck_shopping_items(
    db: Session, user: User, action: VoiceConfirmAction
) -> dict:
    """Mark items as unchecked (not bought) on a shopping list."""
    if not action.list_name:
        raise ValueError("Brak nazwy listy zakupów.")
    if not action.items:
        raise ValueError("Brak produktów do odznaczenia.")

    sl = _find_active_list(db, user, action.list_name)

    unchecked_names = []
    for item_param in action.items:
        match = _find_best_item_match(
            db, sl.id, user.id, item_param.name, checked_filter=True
        )
        if match:
            match.is_checked = False
            unchecked_names.append(match.name)

    if not unchecked_names:
        raise ValueError("Nie znaleziono pasujących kupionych produktów na liście.")

    db.commit()
    db.refresh(sl)

    logger.info(
        f"Voice: unchecked {len(unchecked_names)} items on list '{sl.name}' (id={sl.id}): {unchecked_names}"
    )
    return _list_to_dict(sl)


def execute_delete_shopping_items(
    db: Session, user: User, action: VoiceConfirmAction
) -> dict:
    """Delete items from an existing shopping list using smart matching."""
    if not action.list_name:
        raise ValueError("Brak nazwy listy zakupów.")
    if not action.items:
        raise ValueError("Brak produktów do usunięcia.")

    sl = _find_active_list(db, user, action.list_name)

    deleted_names = []
    for item_param in action.items:
        match = _find_best_item_match(
            db, sl.id, user.id, item_param.name, checked_filter=None
        )
        if match:
            deleted_names.append(match.name)
            db.delete(match)

    if not deleted_names:
        raise ValueError("Nie znaleziono pasujących produktów na liście.")

    db.commit()
    db.refresh(sl)

    logger.info(
        f"Voice: deleted {len(deleted_names)} items from list '{sl.name}' (id={sl.id}): {deleted_names}"
    )
    return _list_to_dict(sl)
