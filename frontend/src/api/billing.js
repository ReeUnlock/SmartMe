import { apiFetch } from "./client";

/** Fetch plan pricing info (public, no auth needed). */
export function getPlans() {
  return apiFetch("/billing/plans");
}

/** Get current subscription info. */
export function getSubscription() {
  return apiFetch("/billing/subscription");
}

/** Create Stripe Checkout session for Pro upgrade. */
export function createCheckoutSession() {
  return apiFetch("/billing/checkout", { method: "POST" });
}

/** Create Stripe Customer Portal session. */
export function createPortalSession() {
  return apiFetch("/billing/portal", { method: "POST" });
}
