from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.shopping.models import ShoppingList, ShoppingItem, ShoppingCategory
from app.shopping.schemas import (
    ListCreate, ListUpdate, ListOut,
    ItemCreate, ItemUpdate, ItemOut,
    CategoryCreate, CategoryUpdate, CategoryOut,
)

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
    item = ShoppingItem(**data.model_dump(), list_id=list_id, user_id=current_user.id)
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
    for field, value in data.model_dump(exclude_unset=True).items():
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
