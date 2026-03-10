import logging
from datetime import date

from sqlalchemy.orm import Session

from app.auth.models import User
from app.expenses.models import (
    Expense, ExpenseCategory, HouseholdMember, RecurringExpense, MonthlyBudget,
)
from app.shopping.models import ShoppingList
from app.voice.schemas import VoiceConfirmAction

logger = logging.getLogger(__name__)


def _resolve_category(db: Session, user: User, name: str | None) -> int | None:
    if not name:
        return None
    cat = (
        db.query(ExpenseCategory)
        .filter(
            ExpenseCategory.user_id == user.id,
            ExpenseCategory.name.ilike(f"%{name}%"),
        )
        .first()
    )
    return cat.id if cat else None


def _resolve_member(db: Session, user: User, name: str | None) -> int | None:
    if not name:
        return None
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.user_id == user.id,
            HouseholdMember.name.ilike(f"%{name}%"),
        )
        .first()
    )
    return member.id if member else None


def _ensure_defaults(db: Session, user: User):
    """Ensure default categories and members exist."""
    from app.expenses.router import ensure_default_categories, ensure_default_members
    ensure_default_categories(db, user.id)
    ensure_default_members(db, user.id)


def execute_add_expense(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    _ensure_defaults(db, user)

    if not action.amount or action.amount <= 0:
        raise ValueError("Brak kwoty wydatku.")

    expense_date = date.today()
    if action.expense_date:
        try:
            expense_date = date.fromisoformat(action.expense_date)
        except ValueError:
            pass

    category_id = _resolve_category(db, user, action.expense_category)
    paid_by_id = _resolve_member(db, user, action.paid_by)

    expense = Expense(
        amount=action.amount,
        description=action.expense_description,
        date=expense_date,
        is_shared=action.is_shared or False,
        category_id=category_id,
        paid_by_id=paid_by_id,
        user_id=user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    logger.info(f"Voice: added expense {expense.amount} zł (id={expense.id})")
    return {
        "id": expense.id,
        "amount": expense.amount,
        "description": expense.description,
        "date": str(expense.date),
        "category": action.expense_category,
        "paid_by": action.paid_by,
    }


def execute_add_recurring_expense(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    _ensure_defaults(db, user)

    if not action.recurring_name:
        raise ValueError("Brak nazwy stałego kosztu.")
    if not action.amount or action.amount <= 0:
        raise ValueError("Brak kwoty stałego kosztu.")

    category_id = _resolve_category(db, user, action.expense_category)
    paid_by_id = _resolve_member(db, user, action.paid_by)

    rec = RecurringExpense(
        name=action.recurring_name,
        amount=action.amount,
        day_of_month=action.day_of_month or 1,
        is_shared=action.is_shared or False,
        category_id=category_id,
        paid_by_id=paid_by_id,
        user_id=user.id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    logger.info(f"Voice: added recurring expense '{rec.name}' {rec.amount} zł (id={rec.id})")
    return {
        "id": rec.id,
        "name": rec.name,
        "amount": rec.amount,
        "day_of_month": rec.day_of_month,
    }


def execute_delete_recurring_expense(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    if not action.recurring_name:
        raise ValueError("Brak nazwy stałego kosztu do usunięcia.")

    rec = (
        db.query(RecurringExpense)
        .filter(
            RecurringExpense.user_id == user.id,
            RecurringExpense.name.ilike(f"%{action.recurring_name}%"),
        )
        .first()
    )
    if not rec:
        raise ValueError(f"Nie znaleziono stałego kosztu '{action.recurring_name}'.")

    result = {"id": rec.id, "name": rec.name, "amount": rec.amount}
    db.delete(rec)
    db.commit()

    logger.info(f"Voice: deleted recurring expense '{result['name']}' (id={result['id']})")
    return result


def execute_set_budget(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    if not action.budget_amount or action.budget_amount <= 0:
        raise ValueError("Brak kwoty budżetu.")

    today = date.today()
    year = action.budget_year or today.year
    month = action.budget_month or today.month

    budget = (
        db.query(MonthlyBudget)
        .filter(
            MonthlyBudget.user_id == user.id,
            MonthlyBudget.year == year,
            MonthlyBudget.month == month,
        )
        .first()
    )
    if budget:
        budget.amount = action.budget_amount
    else:
        budget = MonthlyBudget(
            year=year, month=month, amount=action.budget_amount, user_id=user.id,
        )
        db.add(budget)
    db.commit()
    db.refresh(budget)

    MONTH_NAMES = [
        "", "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
        "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
    ]

    logger.info(f"Voice: set budget {budget.amount} zł for {year}-{month}")
    return {
        "id": budget.id,
        "amount": budget.amount,
        "year": year,
        "month": month,
        "month_name": MONTH_NAMES[month],
    }


def execute_list_expenses(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    _ensure_defaults(db, user)

    from sqlalchemy import extract
    from sqlalchemy.orm import joinedload

    today = date.today()
    year = action.budget_year or today.year
    month = action.budget_month or today.month

    expenses = (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(
            Expense.user_id == user.id,
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .order_by(Expense.date.desc())
        .limit(20)
        .all()
    )

    total = sum(e.amount for e in expenses)

    return {
        "year": year,
        "month": month,
        "total": round(total, 2),
        "count": len(expenses),
        "expenses": [
            {
                "amount": e.amount,
                "description": e.description,
                "date": str(e.date),
                "category": e.category.name if e.category else None,
                "paid_by": e.paid_by.name if e.paid_by else None,
            }
            for e in expenses
        ],
    }


def execute_generate_recurring_expenses(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    """Generate recurring expenses for a given month via voice command."""
    from app.expenses.router import generate_recurring_expenses

    today = date.today()
    year = action.budget_year or today.year
    month = action.budget_month or today.month

    created, skipped = generate_recurring_expenses(db, user.id, year, month)

    MONTH_NAMES = [
        "", "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
        "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
    ]

    logger.info(f"Voice: generated {len(created)} recurring expenses for {year}-{month:02d}")
    return {
        "generated": len(created),
        "skipped": skipped,
        "year": year,
        "month": month,
        "month_name": MONTH_NAMES[month],
        "total": round(sum(e.amount for e in created), 2),
    }


def execute_save_shopping_as_expense(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    """Create an expense from a shopping list via voice command."""
    _ensure_defaults(db, user)

    if not action.amount or action.amount <= 0:
        raise ValueError("Brak kwoty wydatku za zakupy.")

    # Find shopping list by name (fuzzy match) or use most recently updated
    sl = None
    if action.list_name:
        sl = (
            db.query(ShoppingList)
            .filter(
                ShoppingList.user_id == user.id,
                ShoppingList.name.ilike(f"%{action.list_name}%"),
            )
            .order_by(ShoppingList.updated_at.desc())
            .first()
        )
        if not sl:
            # Try matching store_name
            sl = (
                db.query(ShoppingList)
                .filter(
                    ShoppingList.user_id == user.id,
                    ShoppingList.store_name.ilike(f"%{action.list_name}%"),
                )
                .order_by(ShoppingList.updated_at.desc())
                .first()
            )

    if not sl:
        # Fallback: most recently updated list
        sl = (
            db.query(ShoppingList)
            .filter(ShoppingList.user_id == user.id)
            .order_by(ShoppingList.updated_at.desc())
            .first()
        )

    if not sl:
        raise ValueError("Nie znaleziono żadnej listy zakupów.")

    # Build description
    store = (sl.store_name or "").strip()
    name = (sl.name or "").strip()
    if store and name and store.lower() != name.lower():
        description = f"Zakupy: {store} \u2014 {name}"
    elif store:
        description = f"Zakupy: {store}"
    elif name:
        description = f"Zakupy: {name}"
    else:
        description = "Zakupy"

    # Resolve date
    expense_date = date.today()
    if action.expense_date:
        try:
            expense_date = date.fromisoformat(action.expense_date)
        except ValueError:
            pass

    # Default category = Jedzenie
    category_id = _resolve_category(db, user, "Jedzenie")

    expense = Expense(
        amount=action.amount,
        description=description,
        date=expense_date,
        is_shared=action.is_shared or False,
        category_id=category_id,
        paid_by_id=None,
        user_id=user.id,
        source="shopping_list",
        source_id=sl.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    logger.info(f"Voice: saved shopping list '{sl.name}' as expense {expense.amount} zł (id={expense.id})")
    return {
        "id": expense.id,
        "amount": expense.amount,
        "description": description,
        "date": str(expense.date),
        "list_name": sl.name,
        "list_id": sl.id,
    }
