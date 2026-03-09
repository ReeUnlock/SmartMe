import logging

from sqlalchemy.orm import Session

from app.auth.models import User
from app.shopping.models import ShoppingList, ShoppingItem, ShoppingCategory
from app.voice.schemas import VoiceConfirmAction

logger = logging.getLogger(__name__)


def _resolve_category_id(
    db: Session, user: User, category_name: str | None
) -> int | None:
    """Resolve a category name to its ID, returning None if not found."""
    if not category_name:
        return None
    cat = (
        db.query(ShoppingCategory)
        .filter(
            ShoppingCategory.user_id == user.id,
            ShoppingCategory.name.ilike(f"%{category_name}%"),
        )
        .first()
    )
    return cat.id if cat else None


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

    sl = (
        db.query(ShoppingList)
        .filter(
            ShoppingList.user_id == user.id,
            ShoppingList.name.ilike(f"%{action.list_name}%"),
            ShoppingList.is_completed == False,
        )
        .order_by(ShoppingList.created_at.desc())
        .first()
    )
    if not sl:
        raise ValueError(f"Nie znaleziono aktywnej listy '{action.list_name}'.")

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


def execute_delete_shopping_items(
    db: Session, user: User, action: VoiceConfirmAction
) -> dict:
    """Delete items from an existing shopping list by fuzzy name match."""
    if not action.list_name:
        raise ValueError("Brak nazwy listy zakupów.")
    if not action.items:
        raise ValueError("Brak produktów do usunięcia.")

    sl = (
        db.query(ShoppingList)
        .filter(
            ShoppingList.user_id == user.id,
            ShoppingList.name.ilike(f"%{action.list_name}%"),
            ShoppingList.is_completed == False,
        )
        .order_by(ShoppingList.created_at.desc())
        .first()
    )
    if not sl:
        raise ValueError(f"Nie znaleziono aktywnej listy '{action.list_name}'.")

    deleted_names = []
    for item_param in action.items:
        # Fuzzy match by name — find first unchecked item matching
        match = (
            db.query(ShoppingItem)
            .filter(
                ShoppingItem.list_id == sl.id,
                ShoppingItem.user_id == user.id,
                ShoppingItem.name.ilike(f"%{item_param.name}%"),
            )
            .first()
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
