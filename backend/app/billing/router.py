"""
Billing endpoints — plans, Stripe checkout/portal, webhooks.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.config import settings as cfg
from app.billing.schemas import (
    PlansResponse, PlanInfo, PlanFeature, PricingTier,
    CheckoutSessionResponse, PortalSessionResponse, SubscriptionOut,
)
from app.billing.service import BillingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["billing"])

_FEATURES: list[PlanFeature] = [
    PlanFeature(
        key="voice_commands_per_day",
        name_pl="Komendy głosowe / dzień",
        free_value="1",
        pro_value="Bez limitu",
    ),
    PlanFeature(
        key="shopping_lists",
        name_pl="Aktywne listy zakupów",
        free_value="3",
        pro_value="Bez limitu",
    ),
    PlanFeature(
        key="calendar_events",
        name_pl="Wydarzenia w kalendarzu",
        free_value="10",
        pro_value="Bez limitu",
    ),
    PlanFeature(
        key="goals",
        name_pl="Aktywne cele",
        free_value="1",
        pro_value="Bez limitu",
    ),
    PlanFeature(
        key="bucket_items",
        name_pl="Lista marzeń",
        free_value="1",
        pro_value="Bez limitu",
    ),
    PlanFeature(
        key="receipt_scans",
        name_pl="Skany paragonów / miesiąc",
        free_value="Bez limitu",
        pro_value="Bez limitu",
    ),
]


@router.get("/plans", response_model=PlansResponse)
async def get_plans():
    """Public endpoint — returns pricing info for landing/pricing page."""
    pro_tiers = [
        PricingTier(period="3m", price_pln=99, label="na 3 miesiące", price_id=cfg.STRIPE_PRICE_3M),
        PricingTier(period="12m", price_pln=299, label="na rok", price_id=cfg.STRIPE_PRICE_12M),
    ]
    return PlansResponse(
        free=PlanInfo(plan="free", price_monthly_pln=0, features=_FEATURES),
        pro=PlanInfo(plan="pro", price_monthly_pln=0, features=_FEATURES, pricing_tiers=pro_tiers),
    )


@router.get("/subscription", response_model=SubscriptionOut)
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's subscription info."""
    from app.billing.models import Subscription

    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not sub:
        return SubscriptionOut(plan=current_user.plan, status="active")

    return SubscriptionOut(
        plan=sub.plan,
        status=sub.status,
        current_period_end=sub.current_period_end.isoformat() if sub.current_period_end else None,
    )


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout(
    price_id: Optional[str] = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout session for Pro upgrade."""
    if current_user.plan == "pro":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Masz już plan Pro.",
        )

    # Validate price_id against allowed prices
    allowed_prices = {cfg.STRIPE_PRICE_3M, cfg.STRIPE_PRICE_12M, cfg.STRIPE_PRICE_ID_PRO}
    allowed_prices.discard("")
    if price_id and price_id not in allowed_prices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy identyfikator ceny.",
        )

    svc = BillingService(db)
    try:
        result = svc.create_checkout_session(current_user, price_id=price_id)
        db.commit()
        return CheckoutSessionResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/portal", response_model=PortalSessionResponse)
def create_portal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Customer Portal session for subscription management."""
    svc = BillingService(db)
    try:
        result = svc.create_portal_session(current_user)
        db.commit()
        return PortalSessionResponse(**result)
    except Exception as e:
        logger.error("Portal session failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nie udało się otworzyć portalu zarządzania.",
        )


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe webhook endpoint — no auth, verified by signature."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    svc = BillingService(db)
    try:
        event_type = svc.handle_webhook(payload, sig_header)
        db.commit()
        return {"received": True, "type": event_type}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )
