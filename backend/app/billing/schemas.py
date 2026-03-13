"""Billing schemas — plan info, checkout, portal."""
from pydantic import BaseModel


class PlanFeature(BaseModel):
    key: str
    name_pl: str
    free_value: str
    pro_value: str


class PlanInfo(BaseModel):
    plan: str
    price_monthly_pln: int
    features: list[PlanFeature]


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
