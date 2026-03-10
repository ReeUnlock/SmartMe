from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.shopping.models import ShoppingList, ShoppingItem, ShoppingCategory
from app.shopping.schemas import (
    ListCreate, ListUpdate, ListOut,
    ItemCreate, ItemUpdate, ItemOut,
    CategoryCreate, CategoryUpdate, CategoryOut,
    ReorderItem, ListToExpenseCreate,
)
from app.expenses.models import Expense, ExpenseCategory
from app.expenses.schemas import ExpenseOut

router = APIRouter(prefix="/api/shopping", tags=["shopping"])


# ─── Default categories ────────────────────────────────────────

DEFAULT_CATEGORIES = [
    {"name": "Owoce i warzywa", "icon": "apple", "sort_order": 0},
    {"name": "Nabiał", "icon": "milk", "sort_order": 1},
    {"name": "Pieczywo", "icon": "croissant", "sort_order": 2},
    {"name": "Mięso i ryby", "icon": "beef", "sort_order": 3},
    {"name": "Napoje", "icon": "cup-soda", "sort_order": 4},
    {"name": "Chemia", "icon": "spray-can", "sort_order": 5},
    {"name": "Przekąski", "icon": "cookie", "sort_order": 6},
    {"name": "Inne", "icon": "package", "sort_order": 99},
]


def ensure_default_categories(db: Session, user_id: int):
    count = db.query(ShoppingCategory).filter(ShoppingCategory.user_id == user_id).count()
    if count == 0:
        for cat in DEFAULT_CATEGORIES:
            db.add(ShoppingCategory(**cat, user_id=user_id))
        db.commit()


def get_inne_category_id(db: Session, user_id: int) -> int:
    """Get the 'Inne' fallback category ID, creating defaults if needed."""
    ensure_default_categories(db, user_id)
    cat = (
        db.query(ShoppingCategory)
        .filter(ShoppingCategory.user_id == user_id, ShoppingCategory.name == "Inne")
        .first()
    )
    if cat:
        return cat.id
    # Edge case: defaults exist but 'Inne' was deleted — recreate it
    inne = ShoppingCategory(name="Inne", icon="package", sort_order=99, user_id=user_id)
    db.add(inne)
    db.commit()
    db.refresh(inne)
    return inne.id


# ─── Categories ─────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_categories(db, current_user.id)
    return (
        db.query(ShoppingCategory)
        .filter(ShoppingCategory.user_id == current_user.id)
        .order_by(ShoppingCategory.sort_order)
        .all()
    )


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = ShoppingCategory(**data.model_dump(), user_id=current_user.id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = (
        db.query(ShoppingCategory)
        .filter(ShoppingCategory.id == cat_id, ShoppingCategory.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoria nie została znaleziona.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = (
        db.query(ShoppingCategory)
        .filter(ShoppingCategory.id == cat_id, ShoppingCategory.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoria nie została znaleziona.")
    if cat.name == "Inne":
        raise HTTPException(
            status_code=400,
            detail="Kategoria 'Inne' jest wymagana przez system i nie może zostać usunięta.",
        )
    db.delete(cat)
    db.commit()


# ─── Lists ──────────────────────────────────────────────────────

@router.get("/lists", response_model=list[ListOut])
def list_shopping_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ShoppingList)
        .filter(ShoppingList.user_id == current_user.id)
        .order_by(ShoppingList.is_completed, ShoppingList.created_at.desc())
        .all()
    )


@router.post("/lists", response_model=ListOut, status_code=status.HTTP_201_CREATED)
def create_list(
    data: ListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sl = ShoppingList(**data.model_dump(), user_id=current_user.id)
    db.add(sl)
    db.commit()
    db.refresh(sl)
    return sl


@router.get("/lists/{list_id}", response_model=ListOut)
def get_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sl = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not sl:
        raise HTTPException(status_code=404, detail="Lista nie została znaleziona.")
    return sl


@router.put("/lists/{list_id}", response_model=ListOut)
def update_list(
    list_id: int,
    data: ListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sl = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not sl:
        raise HTTPException(status_code=404, detail="Lista nie została znaleziona.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sl, field, value)
    db.commit()
    db.refresh(sl)
    return sl


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sl = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not sl:
        raise HTTPException(status_code=404, detail="Lista nie została znaleziona.")
    db.delete(sl)
    db.commit()


# ─── Items ──────────────────────────────────────────────────────

@router.post("/lists/{list_id}/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def add_item(
    list_id: int,
    data: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sl = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not sl:
        raise HTTPException(status_code=404, detail="Lista nie została znaleziona.")
    item_data = data.model_dump()
    # Fallback: ensure every item gets a category (default to "Inne")
    if not item_data.get("category_id"):
        item_data["category_id"] = get_inne_category_id(db, current_user.id)
    item = ShoppingItem(**item_data, list_id=list_id, user_id=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    data: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ShoppingItem)
        .filter(ShoppingItem.id == item_id, ShoppingItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Produkt nie został znaleziony.")
    updates = data.model_dump(exclude_unset=True)
    # If category_id is explicitly set to None, fallback to "Inne"
    if "category_id" in updates and not updates["category_id"]:
        updates["category_id"] = get_inne_category_id(db, current_user.id)
    for field, value in updates.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ShoppingItem)
        .filter(ShoppingItem.id == item_id, ShoppingItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Produkt nie został znaleziony.")
    db.delete(item)
    db.commit()


@router.patch("/items/{item_id}/toggle", response_model=ItemOut)
def toggle_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(ShoppingItem)
        .filter(ShoppingItem.id == item_id, ShoppingItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Produkt nie został znaleziony.")
    item.is_checked = not item.is_checked
    db.commit()
    db.refresh(item)
    return item


@router.put("/lists/{list_id}/reorder", response_model=ListOut)
def reorder_items(
    list_id: int,
    items: list[ReorderItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sl = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not sl:
        raise HTTPException(status_code=404, detail="Lista nie została znaleziona.")

    order_map = {r.id: r.sort_order for r in items}
    for item in sl.items:
        if item.id in order_map:
            item.sort_order = order_map[item.id]

    db.commit()
    db.refresh(sl)
    return sl


# ─── Shopping → Expense bridge ───────────────────────────────

def _build_expense_description(sl: ShoppingList) -> str:
    """Build standardized description for expense from shopping list.

    Rules:
    - store_name only          → "Zakupy: {store_name}"
    - list name only           → "Zakupy: {name}"
    - both, same value         → "Zakupy: {store_name}"
    - both, different values   → "Zakupy: {store_name} — {name}"
    """
    store = (sl.store_name or "").strip()
    name = (sl.name or "").strip()

    if store and name and store.lower() != name.lower():
        return f"Zakupy: {store} \u2014 {name}"
    if store:
        return f"Zakupy: {store}"
    if name:
        return f"Zakupy: {name}"
    return "Zakupy"


def _get_expense_category_map(db: Session, user_id: int) -> dict[str, int]:
    """Return {name: id} map of expense categories for this user."""
    cats = (
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.user_id == user_id)
        .all()
    )
    return {c.name: c.id for c in cats}


# Shopping category name → Expense category name
SHOPPING_TO_EXPENSE_CATEGORY = {
    "Owoce i warzywa": "Jedzenie",
    "Nabiał": "Jedzenie",
    "Pieczywo": "Jedzenie",
    "Mięso i ryby": "Jedzenie",
    "Napoje": "Jedzenie",
    "Przekąski": "Jedzenie",
    "Chemia": "Dom",
    "Inne": "Inne",
}


def _split_amount_by_categories(
    items: list[ShoppingItem],
    total: float,
    shopping_categories: dict[int, str],
    expense_cat_map: dict[str, int],
) -> list[tuple[int | None, float]]:
    """Split total proportionally by item count per mapped expense category.

    Returns list of (expense_category_id, amount) tuples.
    Rounding is handled so the sum always equals total exactly.
    """
    if not items:
        fallback_id = expense_cat_map.get("Jedzenie")
        return [(fallback_id, total)]

    # Count items per expense category
    counts: dict[str, int] = {}
    for item in items:
        shop_cat_name = shopping_categories.get(item.category_id, "")
        exp_cat_name = SHOPPING_TO_EXPENSE_CATEGORY.get(shop_cat_name, "Inne")
        counts[exp_cat_name] = counts.get(exp_cat_name, 0) + 1

    total_items = sum(counts.values())
    if total_items == 0:
        fallback_id = expense_cat_map.get("Jedzenie")
        return [(fallback_id, total)]

    # Calculate proportional amounts with banker's rounding
    splits: list[tuple[int | None, float]] = []
    allocated = 0.0
    entries = list(counts.items())

    for i, (exp_cat_name, count) in enumerate(entries):
        exp_cat_id = expense_cat_map.get(exp_cat_name)
        if i == len(entries) - 1:
            # Last entry gets the remainder to guarantee exact sum
            amount = round(total - allocated, 2)
        else:
            amount = round(total * count / total_items, 2)
            allocated += amount
        if amount > 0:
            splits.append((exp_cat_id, amount))

    # If all amounts rounded to 0 somehow, give everything to first category
    if not splits:
        exp_cat_name = entries[0][0]
        exp_cat_id = expense_cat_map.get(exp_cat_name)
        splits = [(exp_cat_id, total)]

    return splits


@router.post("/lists/{list_id}/to-expense", response_model=list[ExpenseOut], status_code=status.HTTP_201_CREATED)
def save_list_as_expense(
    list_id: int,
    data: ListToExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create expense(s) from a shopping list, splitting by item categories."""
    sl = (
        db.query(ShoppingList)
        .options(joinedload(ShoppingList.items).joinedload(ShoppingItem.category))
        .filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not sl:
        raise HTTPException(status_code=404, detail="Lista nie zosta\u0142a znaleziona.")

    description = _build_expense_description(sl)
    expense_date = data.date or date.today()

    # Build category mappings
    shopping_categories = {item.category_id: item.category.name for item in sl.items if item.category}
    expense_cat_map = _get_expense_category_map(db, current_user.id)

    # If user explicitly chose a category, skip smart splitting
    if data.category_id is not None:
        splits = [(data.category_id, data.amount)]
    else:
        checked_items = [item for item in sl.items if item.is_checked]
        splits = _split_amount_by_categories(
            checked_items or sl.items,
            data.amount,
            shopping_categories,
            expense_cat_map,
        )

    expense_ids = []
    for category_id, amount in splits:
        expense = Expense(
            amount=amount,
            description=description,
            date=expense_date,
            is_shared=data.is_shared,
            category_id=category_id,
            paid_by_id=data.paid_by_id,
            user_id=current_user.id,
            source="shopping_list",
            source_id=sl.id,
        )
        db.add(expense)
        db.flush()
        expense_ids.append(expense.id)

    db.commit()

    # Eager-load relationships for response
    expenses = (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(Expense.id.in_(expense_ids))
        .all()
    )
    return expenses
