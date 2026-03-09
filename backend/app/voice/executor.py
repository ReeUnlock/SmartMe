import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth.models import User
from app.calendar.models import Event
from app.voice.schemas import VoiceConfirmAction

logger = logging.getLogger(__name__)


def _event_to_dict(event: Event) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at.isoformat() if event.start_at else None,
        "end_at": event.end_at.isoformat() if event.end_at else None,
        "all_day": event.all_day,
        "color": event.color,
        "icon": event.icon,
        "category": event.category,
        "location": event.location,
    }


def _find_event_by_id_or_title(
    db: Session, user: User, action: VoiceConfirmAction
) -> Event | None:
    """Find event by ID, or by title + date (fuzzy match)."""
    if action.event_id:
        return (
            db.query(Event)
            .filter(Event.id == action.event_id, Event.user_id == user.id)
            .first()
        )
    if action.title:
        query = db.query(Event).filter(
            Event.user_id == user.id,
            Event.title.ilike(f"%{action.title}%"),
        )
        # Narrow by date if available — match events on the same day
        if action.start_at:
            target_date = action.start_at.date() if hasattr(action.start_at, 'date') else action.start_at
            query = query.filter(
                Event.start_at >= datetime.combine(target_date, datetime.min.time()),
                Event.start_at < datetime.combine(target_date, datetime.min.time()) + timedelta(days=1),
            )
        return query.order_by(Event.start_at.asc()).first()
    return None


def execute_add_event(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    """Create a new calendar event from voice command."""
    if not action.title:
        raise ValueError("Brak tytułu wydarzenia.")
    if not action.start_at:
        raise ValueError("Brak daty rozpoczęcia wydarzenia.")

    event = Event(
        title=action.title,
        start_at=action.start_at,
        end_at=action.end_at,
        all_day=action.all_day or False,
        description=action.description,
        location=action.location,
        category=action.category,
        color=action.color,
        icon=action.icon,
        user_id=user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    logger.info(f"Voice: created event '{event.title}' (id={event.id})")
    return _event_to_dict(event)


def execute_update_event(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    """Update an existing calendar event found by ID or fuzzy title match."""
    event = _find_event_by_id_or_title(db, user, action)
    if not event:
        raise ValueError("Nie znaleziono wydarzenia do zaktualizowania.")

    if action.title and not action.event_id:
        # If we searched by title, don't overwrite title unless explicitly new
        pass
    elif action.title:
        event.title = action.title

    if action.start_at is not None:
        event.start_at = action.start_at
    if action.end_at is not None:
        event.end_at = action.end_at
    if action.all_day is not None:
        event.all_day = action.all_day
    if action.description is not None:
        event.description = action.description
    if action.location is not None:
        event.location = action.location
    if action.category is not None:
        event.category = action.category
    if action.color is not None:
        event.color = action.color
    if action.icon is not None:
        event.icon = action.icon

    db.commit()
    db.refresh(event)

    logger.info(f"Voice: updated event '{event.title}' (id={event.id})")
    return _event_to_dict(event)


def execute_delete_event(db: Session, user: User, action: VoiceConfirmAction) -> dict:
    """Delete a calendar event found by ID or fuzzy title match."""
    event = _find_event_by_id_or_title(db, user, action)
    if not event:
        raise ValueError("Nie znaleziono wydarzenia do usunięcia.")

    event_data = _event_to_dict(event)
    db.delete(event)
    db.commit()

    logger.info(f"Voice: deleted event '{event_data['title']}' (id={event_data['id']})")
    return event_data


def execute_delete_all_events(
    db: Session, user: User, action: VoiceConfirmAction
) -> list[dict]:
    """Delete all events in a date range from voice command."""
    if not action.date_query:
        raise ValueError("Brak zakresu dat do usunięcia.")

    try:
        parts = action.date_query.split("/")
        start_str = parts[0].strip()
        end_str = parts[1].strip() if len(parts) > 1 else start_str
        range_start = datetime.strptime(start_str, "%Y-%m-%d").replace(
            tzinfo=timezone.utc
        )
        range_end = datetime.strptime(end_str, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, tzinfo=timezone.utc
        )
    except (ValueError, IndexError):
        raise ValueError(f"Nieprawidłowy zakres dat: {action.date_query}")

    events = (
        db.query(Event)
        .filter(
            Event.user_id == user.id,
            Event.start_at >= range_start,
            Event.start_at <= range_end,
        )
        .order_by(Event.start_at.asc())
        .all()
    )

    if not events:
        raise ValueError("Nie znaleziono wydarzeń w podanym zakresie.")

    deleted = [_event_to_dict(e) for e in events]
    for event in events:
        db.delete(event)
    db.commit()

    logger.info(f"Voice: deleted {len(deleted)} events in range {action.date_query}")
    return deleted


def execute_list_events(
    db: Session, user: User, action: VoiceConfirmAction
) -> list[dict]:
    """List events for a date range from voice query."""
    query = db.query(Event).filter(Event.user_id == user.id)

    if action.date_query:
        try:
            parts = action.date_query.split("/")
            start_str = parts[0].strip()
            end_str = parts[1].strip() if len(parts) > 1 else start_str
            range_start = datetime.strptime(start_str, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
            range_end = datetime.strptime(end_str, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            )
            query = query.filter(
                Event.start_at >= range_start, Event.start_at <= range_end
            )
        except (ValueError, IndexError):
            logger.warning(f"Voice: invalid date_query '{action.date_query}'")

    events = query.order_by(Event.start_at.asc()).limit(50).all()
    return [_event_to_dict(e) for e in events]
