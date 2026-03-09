from datetime import datetime, timedelta
from typing import List

from dateutil.rrule import rrulestr

from app.calendar.models import Event


MAX_EXPANSION_DAYS = 365


def expand_events(events: List[Event], range_start: datetime, range_end: datetime) -> list[dict]:
    """Expand recurring events using RRULE and return a flat sorted list."""
    # Cap expansion to 1 year ahead
    cap = range_start + timedelta(days=MAX_EXPANSION_DAYS)
    if range_end > cap:
        range_end = cap

    result: list[dict] = []

    for event in events:
        event_dict = _event_to_dict(event)

        if not event.rrule:
            # Non-recurring: include if it overlaps the range
            if event.start_at <= range_end and (event.end_at or event.start_at) >= range_start:
                result.append(event_dict)
        else:
            # Recurring: expand using RRULE
            try:
                rule = rrulestr(event.rrule, dtstart=event.start_at)
                duration = (event.end_at - event.start_at) if event.end_at else timedelta(0)

                occurrences = rule.between(range_start, range_end, inc=True)
                for occ in occurrences:
                    instance = event_dict.copy()
                    instance["virtual_date"] = occ
                    instance["start_at"] = occ
                    if event.end_at:
                        instance["end_at"] = occ + duration
                    result.append(instance)
            except (ValueError, TypeError):
                # If RRULE is invalid, return the event as-is
                result.append(event_dict)

    result.sort(key=lambda e: e["start_at"])
    return result


def _event_to_dict(event: Event) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at,
        "end_at": event.end_at,
        "all_day": event.all_day,
        "color": event.color,
        "category": event.category,
        "location": event.location,
        "rrule": event.rrule,
        "google_event_id": event.google_event_id,
        "google_calendar_id": event.google_calendar_id,
        "google_sync_token": event.google_sync_token,
        "user_id": event.user_id,
        "created_at": event.created_at,
        "updated_at": event.updated_at,
        "virtual_date": None,
    }
