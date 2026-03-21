"""Feature limits per plan — Free vs Pro."""

FREE_LIMITS: dict[str, int] = {
    "voice_commands_per_day": 1,
    "shopping_lists": 3,
    "calendar_events": 10,
    "goals": 1,
    "bucket_items": 1,
    "expenses_per_month": 999999,
    "receipt_scans_per_month": 999999,
}

PRO_LIMITS: dict[str, int | None] = {
    "voice_commands_per_day": 999999,
    "shopping_lists": 999999,
    "calendar_events": 999999,
    "goals": 999999,
    "bucket_items": 999999,
    "expenses_per_month": 999999,
    "receipt_scans_per_month": 999999,
}


def get_limit(plan: str, feature: str) -> int | None:
    """Return limit for a feature on a given plan. None = unlimited."""
    if plan == "pro":
        return PRO_LIMITS.get(feature)
    return FREE_LIMITS.get(feature)
