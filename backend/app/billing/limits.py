"""Feature limits per plan — Free vs Pro."""

FREE_LIMITS: dict[str, int] = {
    "shopping_lists": 10,
    "expenses_per_month": 100,
    "calendar_events": 50,
    "goals": 5,
    "voice_commands_per_day": 20,
    "receipt_scans_per_month": 10,
}

PRO_LIMITS: dict[str, int | None] = {
    "shopping_lists": None,
    "expenses_per_month": None,
    "calendar_events": None,
    "goals": None,
    "voice_commands_per_day": None,
    "receipt_scans_per_month": None,
}


def get_limit(plan: str, feature: str) -> int | None:
    """Return limit for a feature on a given plan. None = unlimited."""
    if plan == "pro":
        return PRO_LIMITS.get(feature)
    return FREE_LIMITS.get(feature)
