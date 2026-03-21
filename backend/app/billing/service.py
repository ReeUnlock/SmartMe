"""
Stripe billing service — checkout, portal, webhook handling.
Graceful no-op when STRIPE_SECRET_KEY is empty (dev mode).
"""
import logging
from datetime import datetime, timezone

import stripe
from sqlalchemy.orm import Session

from app.config import settings
from app.auth.models import User
from app.billing.models import Subscription
from app.common.email import send_upgrade_confirmation, send_downgrade_notice, send_payment_failed

logger = logging.getLogger(__name__)

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    def __init__(self, db: Session):
        self.db = db

    def _get_subscription(self, user_id: int) -> Subscription | None:
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()

    def _find_by_stripe_sub_id(self, stripe_sub_id: str | None) -> Subscription | None:
        if not stripe_sub_id:
            return None
        return self.db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_sub_id
        ).first()

    def _get_or_create_stripe_customer(self, user: User) -> str:
        """Ensure user has a Stripe customer ID."""
        sub = self._get_subscription(user.id)

        if sub and sub.stripe_customer_id:
            return sub.stripe_customer_id

        customer = stripe.Customer.create(
            email=user.email,
            name=user.username,
            metadata={"user_id": str(user.id)},
        )

        if sub:
            sub.stripe_customer_id = customer.id
        else:
            sub = Subscription(
                user_id=user.id,
                plan="free",
                stripe_customer_id=customer.id,
            )
            self.db.add(sub)

        self.db.flush()
        return customer.id

    def create_checkout_session(self, user: User, price_id: str | None = None) -> dict:
        """Create a Stripe Checkout session for Pro upgrade."""
        if not settings.STRIPE_SECRET_KEY:
            raise ValueError("Stripe not configured")

        # Resolve price ID: explicit param → legacy fallback
        if not price_id:
            price_id = settings.STRIPE_PRICE_ID_PRO
        if not price_id:
            raise ValueError("Stripe price ID not configured")

        customer_id = self._get_or_create_stripe_customer(user)

        frontend_url = settings.FRONTEND_URL.rstrip("/")
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{frontend_url}/ustawienia?upgrade=success",
            cancel_url=f"{frontend_url}/ustawienia?upgrade=cancelled",
            client_reference_id=str(user.id),
            metadata={"user_id": str(user.id)},
        )

        logger.info("Checkout session created for user %s", user.id)
        return {"url": session.url, "session_id": session.id}

    def create_portal_session(self, user: User) -> dict:
        """Create a Stripe Customer Portal session."""
        customer_id = self._get_or_create_stripe_customer(user)

        frontend_url = settings.FRONTEND_URL.rstrip("/")
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{frontend_url}/ustawienia",
        )

        return {"url": session.url}

    def handle_webhook(self, payload: bytes, sig_header: str) -> str:
        """Verify Stripe webhook signature and handle events."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET,
            )
        except stripe.error.SignatureVerificationError:
            logger.warning("Invalid Stripe webhook signature")
            raise ValueError("Invalid signature")

        event_type = event["type"]
        data = event["data"]["object"]

        logger.info("Stripe webhook: %s", event_type)

        match event_type:
            case "checkout.session.completed":
                self._handle_checkout_completed(data)
            case "invoice.paid":
                self._handle_invoice_paid(data)
            case "customer.subscription.updated":
                self._handle_subscription_updated(data)
            case "customer.subscription.deleted":
                self._handle_subscription_deleted(data)
            case "invoice.payment_failed":
                self._handle_payment_failed(data)
            case _:
                logger.info("Stripe webhook ignored: %s", event_type)

        return event_type

    def _handle_checkout_completed(self, data: dict) -> None:
        """Set user to Pro after successful checkout."""
        user_id_str = data.get("client_reference_id")
        if not user_id_str:
            return

        user_id = int(user_id_str)
        sub = self._get_subscription(user_id)
        if not sub:
            return

        sub.stripe_subscription_id = data.get("subscription")
        sub.plan = "pro"
        sub.status = "active"

        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            user.plan = "pro"
            send_upgrade_confirmation(user.email, user.username)

        self.db.flush()
        logger.info("User %s upgraded to Pro", user_id)

    def _handle_invoice_paid(self, data: dict) -> None:
        """Update subscription period end on successful payment."""
        stripe_sub_id = data.get("subscription")
        sub = self._find_by_stripe_sub_id(stripe_sub_id)
        if not sub:
            return

        lines = data.get("lines", {}).get("data", [])
        if lines:
            period_end = lines[0].get("period", {}).get("end")
            if period_end:
                sub.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)
                self.db.flush()

    def _handle_subscription_updated(self, data: dict) -> None:
        """Handle plan change or status change."""
        stripe_sub_id = data.get("id")
        sub = self._find_by_stripe_sub_id(stripe_sub_id)
        if not sub:
            return

        status = data.get("status")
        if status == "active":
            sub.status = "active"
        elif status == "past_due":
            sub.status = "past_due"
        elif status == "canceled":
            sub.status = "canceled"
            sub.plan = "free"
            user = self.db.query(User).filter(User.id == sub.user_id).first()
            if user:
                user.plan = "free"
                send_downgrade_notice(user.email, user.username)

        self.db.flush()
        logger.info("Subscription updated: %s → %s", stripe_sub_id, status)

    def _handle_subscription_deleted(self, data: dict) -> None:
        """Downgrade to Free when subscription is cancelled."""
        stripe_sub_id = data.get("id")
        sub = self._find_by_stripe_sub_id(stripe_sub_id)
        if not sub:
            return

        sub.plan = "free"
        sub.status = "canceled"

        user = self.db.query(User).filter(User.id == sub.user_id).first()
        if user:
            user.plan = "free"
            send_downgrade_notice(user.email, user.username)

        self.db.flush()
        logger.info("Subscription deleted, user %s downgraded", sub.user_id)

    def _handle_payment_failed(self, data: dict) -> None:
        """Mark subscription as past_due on payment failure and notify user."""
        stripe_sub_id = data.get("subscription")
        sub = self._find_by_stripe_sub_id(stripe_sub_id)
        if not sub:
            return

        sub.status = "past_due"

        user = self.db.query(User).filter(User.id == sub.user_id).first()
        if user:
            send_payment_failed(user.email, user.username)

        self.db.flush()
        logger.warning("Payment failed for user %s", sub.user_id)
