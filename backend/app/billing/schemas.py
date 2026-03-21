"""Billing schemas — plan info, checkout, portal."""
from pydantic import BaseModel


class PlanFeature(BaseModel):
    key: str
    name_pl: str
    free_value: str
    pro_value: str


class PricingTier(BaseModel):
    period: str          # "3m" | "12m"
    price_pln: int       # 99, 299
    label: str           # "na 3 miesiące", "na rok"
    price_id: str        # Stripe price ID


class PlanInfo(BaseModel):
    plan: str
    price_monthly_pln: int
    features: list[PlanFeature]
    pricing_tiers: list[PricingTier] = []


class PlansResponse(BaseModel):
    free: PlanInfo
    pro: PlanInfo


class CheckoutSessionResponse(BaseModel):
    url: str
    session_id: str


class PortalSessionResponse(BaseModel):
    url: str


class SubscriptionOut(BaseModel):
    plan: str
    status: str
    current_period_end: str | None = None
