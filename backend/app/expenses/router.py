from datetime import date, timedelta
from calendar import monthrange

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, extract
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.expenses.models import (
    Expense, ExpenseCategory, HouseholdMember, RecurringExpense, MonthlyBudget,
)
from app.expenses.schemas import (
    ExpenseCreate, ExpenseUpdate, ExpenseOut,
    ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryOut,
    MemberCreate, MemberUpdate, MemberOut,
    RecurringExpenseCreate, RecurringExpenseUpdate, RecurringExpenseOut,
    BudgetSet, BudgetOut,
    MonthSummary, MonthComparison, CategorySummary, MemberSummary, DailySummary,
)

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


# ─── Default data ───────────────────────────────────────────

DEFAULT_CATEGORIES = [
    {"name": "Jedzenie", "icon": "utensils", "color": "#F9915E", "sort_order": 0},
    {"name": "Transport", "icon": "car", "color": "#60A5FA", "sort_order": 1},
    {"name": "Rozrywka", "icon": "gamepad-2", "color": "#A78BFA", "sort_order": 2},
    {"name": "Zdrowie", "icon": "heart-pulse", "color": "#F472B6", "sort_order": 3},
    {"name": "Dom", "icon": "home", "color": "#34D399", "sort_order": 4},
    {"name": "Ubrania", "icon": "shirt", "color": "#FBBF24", "sort_order": 5},
    {"name": "Rachunki", "icon": "receipt", "color": "#FB923C", "sort_order": 6},
    {"name": "Edukacja", "icon": "book-open", "color": "#38BDF8", "sort_order": 7},
    {"name": "Inne", "icon": "ellipsis", "color": "#9CA3AF", "sort_order": 99},
]

DEFAULT_MEMBERS = [
    {"name": "Ja"},
    {"name": "Partner"},
]


def ensure_default_categories(db: Session, user_id: int):
    count = db.query(ExpenseCategory).filter(ExpenseCategory.user_id == user_id).count()
    if count == 0:
        for cat in DEFAULT_CATEGORIES:
            db.add(ExpenseCategory(**cat, user_id=user_id))
        db.commit()


def ensure_default_members(db: Session, user_id: int):
    count = db.query(HouseholdMember).filter(HouseholdMember.user_id == user_id).count()
    if count == 0:
        for m in DEFAULT_MEMBERS:
            db.add(HouseholdMember(**m, user_id=user_id))
        db.commit()


# ─── Household Members ─────────────────────────────────────

@router.get("/members", response_model=list[MemberOut])
def list_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_members(db, current_user.id)
    return (
        db.query(HouseholdMember)
        .filter(HouseholdMember.user_id == current_user.id)
        .order_by(HouseholdMember.id)
        .all()
    )


@router.post("/members", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def create_member(
    data: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = HouseholdMember(**data.model_dump(), user_id=current_user.id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/members/{member_id}", response_model=MemberOut)
def update_member(
    member_id: int,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.id == member_id, HouseholdMember.user_id == current_user.id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Domownik nie został znaleziony.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.id == member_id, HouseholdMember.user_id == current_user.id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Domownik nie został znaleziony.")
    db.delete(member)
    db.commit()


# ─── Categories ─────────────────────────────────────────────

@router.get("/categories", response_model=list[ExpenseCategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_default_categories(db, current_user.id)
    return (
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.user_id == current_user.id)
        .order_by(ExpenseCategory.sort_order)
        .all()
    )


@router.post("/categories", response_model=ExpenseCategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = ExpenseCategory(**data.model_dump(), user_id=current_user.id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{cat_id}", response_model=ExpenseCategoryOut)
def update_category(
    cat_id: int,
    data: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = (
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.id == cat_id, ExpenseCategory.user_id == current_user.id)
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
        db.query(ExpenseCategory)
        .filter(ExpenseCategory.id == cat_id, ExpenseCategory.user_id == current_user.id)
        .first()
    )
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoria nie została znaleziona.")
    db.delete(cat)
    db.commit()


# ─── Expenses CRUD ──────────────────────────────────────────

@router.get("/", response_model=list[ExpenseOut])
def list_expenses(
    year: int = Query(None),
    month: int = Query(None),
    category_id: int = Query(None),
    paid_by_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(Expense.user_id == current_user.id)
    )
    if year:
        q = q.filter(extract("year", Expense.date) == year)
    if month:
        q = q.filter(extract("month", Expense.date) == month)
    if category_id:
        q = q.filter(Expense.category_id == category_id)
    if paid_by_id:
        q = q.filter(Expense.paid_by_id == paid_by_id)
    return q.order_by(Expense.date.desc(), Expense.id.desc()).all()


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = Expense(**data.model_dump(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(Expense.id == expense.id)
        .first()
    )


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Wydatek nie został znaleziony.")
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Wydatek nie został znaleziony.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(Expense.id == expense.id)
        .first()
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == current_user.id)
        .first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Wydatek nie został znaleziony.")
    db.delete(expense)
    db.commit()


# ─── Recurring Expenses ─────────────────────────────────────

@router.get("/recurring/list", response_model=list[RecurringExpenseOut])
def list_recurring(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(RecurringExpense)
        .options(joinedload(RecurringExpense.category), joinedload(RecurringExpense.paid_by))
        .filter(RecurringExpense.user_id == current_user.id)
        .order_by(RecurringExpense.day_of_month)
        .all()
    )


@router.post("/recurring", response_model=RecurringExpenseOut, status_code=status.HTTP_201_CREATED)
def create_recurring(
    data: RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = RecurringExpense(**data.model_dump(), user_id=current_user.id)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return (
        db.query(RecurringExpense)
        .options(joinedload(RecurringExpense.category), joinedload(RecurringExpense.paid_by))
        .filter(RecurringExpense.id == rec.id)
        .first()
    )


@router.put("/recurring/{rec_id}", response_model=RecurringExpenseOut)
def update_recurring(
    rec_id: int,
    data: RecurringExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = (
        db.query(RecurringExpense)
        .filter(RecurringExpense.id == rec_id, RecurringExpense.user_id == current_user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Wydatek cykliczny nie został znaleziony.")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rec, field, value)
    db.commit()
    db.refresh(rec)
    return (
        db.query(RecurringExpense)
        .options(joinedload(RecurringExpense.category), joinedload(RecurringExpense.paid_by))
        .filter(RecurringExpense.id == rec.id)
        .first()
    )


@router.delete("/recurring/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring(
    rec_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = (
        db.query(RecurringExpense)
        .filter(RecurringExpense.id == rec_id, RecurringExpense.user_id == current_user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Wydatek cykliczny nie został znaleziony.")
    db.delete(rec)
    db.commit()


# ─── Monthly Budget ─────────────────────────────────────────

@router.get("/budget/{year}/{month}", response_model=BudgetOut | None)
def get_budget(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(MonthlyBudget)
        .filter(
            MonthlyBudget.user_id == current_user.id,
            MonthlyBudget.year == year,
            MonthlyBudget.month == month,
        )
        .first()
    )


@router.put("/budget/{year}/{month}", response_model=BudgetOut)
def set_budget(
    year: int,
    month: int,
    data: BudgetSet,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(MonthlyBudget)
        .filter(
            MonthlyBudget.user_id == current_user.id,
            MonthlyBudget.year == year,
            MonthlyBudget.month == month,
        )
        .first()
    )
    if budget:
        budget.amount = data.amount
    else:
        budget = MonthlyBudget(
            year=year, month=month, amount=data.amount, user_id=current_user.id,
        )
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


# ─── Summary & Stats ────────────────────────────────────────

def _build_month_summary(db: Session, user_id: int, year: int, month: int) -> MonthSummary:
    expenses = (
        db.query(Expense)
        .options(joinedload(Expense.category), joinedload(Expense.paid_by))
        .filter(
            Expense.user_id == user_id,
            extract("year", Expense.date) == year,
            extract("month", Expense.date) == month,
        )
        .all()
    )

    recurring = (
        db.query(RecurringExpense)
        .filter(RecurringExpense.user_id == user_id)
        .all()
    )
    recurring_total = sum(r.amount for r in recurring)

    total = sum(e.amount for e in expenses)

    # By category
    cat_map: dict[int | None, dict] = {}
    for e in expenses:
        key = e.category_id
        if key not in cat_map:
            cat_map[key] = {
                "category_id": key,
                "category_name": e.category.name if e.category else "Bez kategorii",
                "category_icon": e.category.icon if e.category else None,
                "category_color": e.category.color if e.category else None,
                "total": 0.0,
                "count": 0,
            }
        cat_map[key]["total"] += e.amount
        cat_map[key]["count"] += 1
    by_category = [CategorySummary(**v) for v in cat_map.values()]
    by_category.sort(key=lambda c: c.total, reverse=True)

    # By member
    mem_map: dict[int | None, dict] = {}
    for e in expenses:
        key = e.paid_by_id
        if key not in mem_map:
            mem_map[key] = {
                "member_id": key,
                "member_name": e.paid_by.name if e.paid_by else "Nieprzypisane",
                "total": 0.0,
                "count": 0,
            }
        mem_map[key]["total"] += e.amount
        mem_map[key]["count"] += 1
    by_member = [MemberSummary(**v) for v in mem_map.values()]
    by_member.sort(key=lambda m: m.total, reverse=True)

    # Daily
    days_in_month = monthrange(year, month)[1]
    daily_map = {i: 0.0 for i in range(1, days_in_month + 1)}
    for e in expenses:
        daily_map[e.date.day] += e.amount
    daily = [
        DailySummary(date=date(year, month, d), total=daily_map[d])
        for d in range(1, days_in_month + 1)
    ]

    # Budget
    budget = (
        db.query(MonthlyBudget)
        .filter(
            MonthlyBudget.user_id == user_id,
            MonthlyBudget.year == year,
            MonthlyBudget.month == month,
        )
        .first()
    )

    return MonthSummary(
        year=year,
        month=month,
        total=round(total, 2),
        recurring_total=round(recurring_total, 2),
        budget=budget.amount if budget else None,
        by_category=by_category,
        by_member=by_member,
        daily=daily,
    )


@router.get("/summary/{year}/{month}", response_model=MonthSummary)
def get_month_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _build_month_summary(db, current_user.id, year, month)


@router.get("/comparison/{year}/{month}", response_model=MonthComparison)
def get_month_comparison(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = _build_month_summary(db, current_user.id, year, month)

    # Previous month
    if month == 1:
        prev_year, prev_month = year - 1, 12
    else:
        prev_year, prev_month = year, month - 1
    previous = _build_month_summary(db, current_user.id, prev_year, prev_month)

    diff = round(current.total - previous.total, 2)
    diff_pct = round((diff / previous.total) * 100, 1) if previous.total > 0 else None

    return MonthComparison(
        current=current,
        previous=previous,
        diff_total=diff,
        diff_percent=diff_pct,
    )
