from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.calendar.models import Event
from app.calendar.schemas import EventCreate, EventUpdate, EventOut
from app.calendar.service import expand_events

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/events", response_model=list[EventOut])
def list_events(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        range_start = datetime.strptime(start, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        range_end = datetime.strptime(end, "%Y-%m-%d").replace(
            hour=23, minute=59, second=59, tzinfo=timezone.utc
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy format daty. Użyj YYYY-MM-DD.",
        )

    events = (
        db.query(Event)
        .filter(
            Event.user_id == current_user.id,
            # Include events that start before range end
            # Recurring events need to be fetched broadly
            (Event.start_at <= range_end) | (Event.rrule.isnot(None)),
        )
        .all()
    )

    expanded = expand_events(events, range_start, range_end)
    return expanded


@router.post("/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check for duplicate event type on the same day
    event_date = data.start_at.date()
    day_start = datetime(event_date.year, event_date.month, event_date.day, tzinfo=timezone.utc)
    day_end = day_start.replace(hour=23, minute=59, second=59)

    duplicate = (
        db.query(Event)
        .filter(
            Event.user_id == current_user.id,
            Event.title == data.title,
            Event.start_at >= day_start,
            Event.start_at <= day_end,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Wydarzenie \"{data.title}\" już istnieje w tym dniu.",
        )

    event = Event(**data.model_dump(), user_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/events/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wydarzenie nie zostało znalezione.",
        )
    return event


@router.put("/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wydarzenie nie zostało znalezione.",
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == current_user.id)
        .first()
    )
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wydarzenie nie zostało znalezione.",
        )
    db.delete(event)
    db.commit()
