"""
Calendar date validation and temporal expansion helper.

Validates GPT-produced calendar actions for date correctness and
optionally re-expands predictable temporal patterns using deterministic
Python date math instead of relying solely on GPT arithmetic.

This module is a lightweight safety net — not a full date parser.
"""

import calendar
import logging
from datetime import date, datetime, timedelta
from typing import Optional

from app.voice.schemas import TemporalInterpretation, VoiceActionType, VoiceProposedAction

logger = logging.getLogger(__name__)

CALENDAR_ADD_ACTIONS = {VoiceActionType.add_event}

WEEKDAY_MAP = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

WEEKDAY_NAMES_PL = {
    0: "poniedziałek",
    1: "wtorek",
    2: "środa",
    3: "czwartek",
    4: "piątek",
    5: "sobota",
    6: "niedziela",
}


def _parse_date(s: str) -> Optional[date]:
    """Parse an ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)."""
    try:
        return datetime.fromisoformat(s.split("T")[0]).date()
    except (ValueError, AttributeError):
        return None


def _is_valid_date(d: date) -> bool:
    """Check that a date is a real calendar date."""
    try:
        date(d.year, d.month, d.day)
        return True
    except ValueError:
        return False


def _weekday_name(d: date) -> str:
    return WEEKDAY_NAMES_PL.get(d.weekday(), "?")


def _all_weekdays_in_range(
    start: date, end: date, weekday_indices: list[int]
) -> list[date]:
    """Return all dates matching given weekday indices in [start, end]."""
    results = []
    current = start
    while current <= end:
        if current.weekday() in weekday_indices:
            results.append(current)
        current += timedelta(days=1)
    return sorted(results)


def _interval_dates_in_range(
    start: date, end: date, interval: int
) -> list[date]:
    """Return dates every `interval` days in [start, end]."""
    results = []
    current = start
    while current <= end:
        results.append(current)
        current += timedelta(days=interval)
    return results


def _date_range(start: date, end: date) -> list[date]:
    """Return all dates from start to end inclusive."""
    results = []
    current = start
    while current <= end:
        results.append(current)
        current += timedelta(days=1)
    return results


def validate_calendar_actions(
    actions: list[VoiceProposedAction],
    reference_date: date,
) -> list[VoiceProposedAction]:
    """
    Validate and optionally re-expand calendar add_event actions.

    For actions with temporal_interpretation metadata:
    1. Validates resolved_dates are real calendar dates
    2. Validates weekday correctness for weekday_recurring patterns
    3. Re-expands predictable patterns if GPT got the count wrong
    4. Marks invalid actions with validation_errors

    Returns the (possibly corrected) list of actions.
    """
    # Find the first action with temporal_interpretation
    temporal_action = None
    temporal_idx = None
    for i, action in enumerate(actions):
        if (
            action.action in CALENDAR_ADD_ACTIONS
            and action.temporal_interpretation is not None
        ):
            temporal_action = action
            temporal_idx = i
            break

    if temporal_action is None:
        # No temporal metadata — just validate individual dates
        return _validate_individual_dates(actions, reference_date)

    ti = temporal_action.temporal_interpretation
    pattern = ti.pattern_type

    # Attempt deterministic re-expansion for supported patterns
    if pattern == "weekday_recurring" and ti.weekdays and ti.range_start and ti.range_end:
        return _reexpand_weekday_recurring(
            actions, temporal_action, temporal_idx, ti, reference_date
        )
    elif pattern == "interval_recurring" and ti.interval and ti.range_start and ti.range_end:
        return _reexpand_interval_recurring(
            actions, temporal_action, temporal_idx, ti, reference_date
        )
    elif pattern == "date_range" and ti.range_start and ti.range_end:
        return _reexpand_date_range(
            actions, temporal_action, temporal_idx, ti, reference_date
        )
    elif pattern == "explicit_dates" and ti.resolved_dates:
        return _validate_explicit_dates(
            actions, temporal_action, temporal_idx, ti, reference_date
        )
    elif pattern == "duration_span" and ti.resolved_dates:
        return _validate_explicit_dates(
            actions, temporal_action, temporal_idx, ti, reference_date
        )
    else:
        return _validate_individual_dates(actions, reference_date)


def _validate_individual_dates(
    actions: list[VoiceProposedAction], reference_date: date
) -> list[VoiceProposedAction]:
    """Basic validation: check each action's start_at is a real date."""
    for action in actions:
        if action.action not in CALENDAR_ADD_ACTIONS:
            continue
        if action.start_at is None:
            continue
        errors = []
        d = action.start_at.date() if hasattr(action.start_at, "date") else action.start_at
        if not _is_valid_date(d):
            errors.append(f"Nieprawidłowa data: {d}")
        if errors:
            action.validation_errors = errors
    return actions


def _reexpand_weekday_recurring(
    actions: list[VoiceProposedAction],
    temporal_action: VoiceProposedAction,
    temporal_idx: int,
    ti: TemporalInterpretation,
    reference_date: date,
) -> list[VoiceProposedAction]:
    """Re-expand weekday recurring pattern using deterministic Python math."""
    range_start = _parse_date(ti.range_start)
    range_end = _parse_date(ti.range_end)
    if not range_start or not range_end:
        return _validate_individual_dates(actions, reference_date)

    # Exclude past dates for recurring patterns
    effective_start = max(range_start, reference_date)
    past_excluded = (effective_start - range_start).days if effective_start > range_start else 0

    weekday_indices = []
    for wd in ti.weekdays:
        idx = WEEKDAY_MAP.get(wd.lower())
        if idx is not None:
            weekday_indices.append(idx)

    if not weekday_indices:
        return _validate_individual_dates(actions, reference_date)

    all_dates = _all_weekdays_in_range(range_start, range_end, weekday_indices)
    correct_dates = _all_weekdays_in_range(effective_start, range_end, weekday_indices)
    past_count = len(all_dates) - len(correct_dates)

    if not correct_dates:
        temporal_action.validation_errors = [
            f"Brak pasujących dat w zakresie {effective_start} — {range_end}."
        ]
        return actions

    # Check if GPT already produced the right dates
    gpt_dates = [_parse_date(d) for d in (ti.resolved_dates or [])]
    gpt_dates = [d for d in gpt_dates if d is not None]

    # Count calendar add actions
    calendar_action_count = sum(1 for a in actions if a.action in CALENDAR_ADD_ACTIONS)

    if gpt_dates == correct_dates and calendar_action_count == len(correct_dates):
        logger.debug("Weekday recurring validation passed — GPT dates match.")
        # Still annotate past-date exclusion if it happened
        if past_count > 0:
            ti.past_dates_excluded = past_count
        return _validate_individual_dates(actions, reference_date)

    # GPT got dates or action count wrong — rebuild
    logger.info(
        f"Weekday recurring correction: GPT dates={len(gpt_dates)}, actions={calendar_action_count}, "
        f"correct={len(correct_dates)}. Rebuilding."
    )

    return _rebuild_actions_from_dates(
        actions, temporal_action, temporal_idx, ti, correct_dates,
        past_dates_excluded=past_count,
    )


def _reexpand_interval_recurring(
    actions: list[VoiceProposedAction],
    temporal_action: VoiceProposedAction,
    temporal_idx: int,
    ti: TemporalInterpretation,
    reference_date: date,
) -> list[VoiceProposedAction]:
    """Re-expand interval recurring pattern."""
    range_start = _parse_date(ti.range_start)
    range_end = _parse_date(ti.range_end)
    if not range_start or not range_end or not ti.interval:
        return _validate_individual_dates(actions, reference_date)

    effective_start = max(range_start, reference_date)
    all_dates = _interval_dates_in_range(range_start, range_end, ti.interval)
    correct_dates = _interval_dates_in_range(effective_start, range_end, ti.interval)
    past_count = len(all_dates) - len(correct_dates)

    if not correct_dates:
        temporal_action.validation_errors = [
            f"Brak dat w zakresie {effective_start} — {range_end} z interwałem {ti.interval}."
        ]
        return actions

    gpt_dates = [_parse_date(d) for d in (ti.resolved_dates or [])]
    gpt_dates = [d for d in gpt_dates if d is not None]
    calendar_action_count = sum(1 for a in actions if a.action in CALENDAR_ADD_ACTIONS)

    if gpt_dates == correct_dates and calendar_action_count == len(correct_dates):
        if past_count > 0:
            ti.past_dates_excluded = past_count
        return _validate_individual_dates(actions, reference_date)

    logger.info(
        f"Interval recurring correction: GPT dates={len(gpt_dates)}, actions={calendar_action_count}, "
        f"correct={len(correct_dates)}."
    )

    return _rebuild_actions_from_dates(
        actions, temporal_action, temporal_idx, ti, correct_dates,
        past_dates_excluded=past_count,
    )


def _reexpand_date_range(
    actions: list[VoiceProposedAction],
    temporal_action: VoiceProposedAction,
    temporal_idx: int,
    ti: TemporalInterpretation,
    reference_date: date,
) -> list[VoiceProposedAction]:
    """Re-expand date range pattern."""
    range_start = _parse_date(ti.range_start)
    range_end = _parse_date(ti.range_end)
    if not range_start or not range_end:
        return _validate_individual_dates(actions, reference_date)

    # For date ranges, exclude past dates but track it
    effective_start = max(range_start, reference_date)
    all_dates = _date_range(range_start, range_end)
    correct_dates = _date_range(effective_start, range_end)
    past_count = len(all_dates) - len(correct_dates)

    if not correct_dates:
        temporal_action.validation_errors = [
            f"Nieprawidłowy zakres dat: {range_start} — {range_end}."
        ]
        return actions

    gpt_dates = [_parse_date(d) for d in (ti.resolved_dates or [])]
    gpt_dates = [d for d in gpt_dates if d is not None]
    calendar_action_count = sum(1 for a in actions if a.action in CALENDAR_ADD_ACTIONS)

    if gpt_dates == correct_dates and calendar_action_count == len(correct_dates):
        if past_count > 0:
            ti.past_dates_excluded = past_count
        return _validate_individual_dates(actions, reference_date)

    logger.info(
        f"Date range correction: GPT dates={len(gpt_dates)}, actions={calendar_action_count}, "
        f"correct={len(correct_dates)}."
    )

    return _rebuild_actions_from_dates(
        actions, temporal_action, temporal_idx, ti, correct_dates,
        past_dates_excluded=past_count,
    )


def _validate_explicit_dates(
    actions: list[VoiceProposedAction],
    temporal_action: VoiceProposedAction,
    temporal_idx: int,
    ti: TemporalInterpretation,
    reference_date: date,
) -> list[VoiceProposedAction]:
    """Validate explicit dates — check they're real and warn about past dates."""
    errors = []
    past_count = 0
    for ds in (ti.resolved_dates or []):
        d = _parse_date(ds)
        if d is None:
            errors.append(f"Nieprawidłowy format daty: {ds}")
        elif not _is_valid_date(d):
            errors.append(f"Nieistniejąca data: {ds}")
        elif d < reference_date:
            past_count += 1

    if past_count > 0:
        errors.append(
            f"{past_count} {'data jest' if past_count == 1 else 'dat jest'} w przeszłości — upewnij się, że to zamierzone."
        )

    if errors:
        temporal_action.validation_errors = errors

    return _validate_individual_dates(actions, reference_date)


def _rebuild_actions_from_dates(
    actions: list[VoiceProposedAction],
    template_action: VoiceProposedAction,
    template_idx: int,
    ti: TemporalInterpretation,
    correct_dates: list[date],
    past_dates_excluded: int = 0,
) -> list[VoiceProposedAction]:
    """
    Rebuild the calendar actions using corrected dates.

    Takes the template action (first in the batch) and creates new actions
    for each corrected date, preserving title, color, icon, etc.
    Non-calendar actions in the list are preserved.
    """
    # Separate non-calendar actions that should be preserved
    other_actions = [
        a for i, a in enumerate(actions) if a.action not in CALENDAR_ADD_ACTIONS
    ]

    # Extract time info from template
    template_time = None
    template_end_time = None
    if template_action.start_at:
        template_time = template_action.start_at.time() if hasattr(template_action.start_at, "time") else None
    if template_action.end_at:
        template_end_time = template_action.end_at.time() if hasattr(template_action.end_at, "time") else None

    # Calculate duration for end_at
    duration = None
    if template_action.start_at and template_action.end_at:
        duration = template_action.end_at - template_action.start_at

    # Count how many dates GPT originally produced
    gpt_count = sum(1 for a in actions if a.action in CALENDAR_ADD_ACTIONS)

    # Build correction note
    correction_parts = []
    if gpt_count != len(correct_dates):
        correction_parts.append(
            f"GPT: {gpt_count} wydarzeń → poprawnie: {len(correct_dates)}"
        )
    if past_dates_excluded > 0:
        correction_parts.append(
            f"Pominięto {past_dates_excluded} przeszłych dat"
        )
    validator_note = "; ".join(correction_parts) if correction_parts else "Daty zweryfikowane i poprawione."

    # Build corrected temporal_interpretation
    corrected_ti = TemporalInterpretation(
        source_text=ti.source_text,
        pattern_type=ti.pattern_type,
        resolved_dates=[d.isoformat() for d in correct_dates],
        range_start=ti.range_start,
        range_end=ti.range_end,
        weekdays=ti.weekdays,
        interval=ti.interval,
        needs_clarification=ti.needs_clarification,
        clarification_reason=ti.clarification_reason,
        default_assumption=ti.default_assumption,
        validator_corrected=True,
        validator_note=validator_note,
        past_dates_excluded=past_dates_excluded if past_dates_excluded > 0 else None,
    )

    # Build date summary for confidence_note
    date_strs = [f"{d.day}.{d.month:02d}" for d in correct_dates]
    dates_summary = ", ".join(date_strs)

    new_actions = []
    for i, d in enumerate(correct_dates):
        start_at = None
        end_at = None

        if template_time is not None:
            start_at = datetime.combine(d, template_time)
        elif template_action.all_day:
            start_at = datetime.combine(d, datetime.min.time())

        if duration is not None and start_at is not None:
            end_at = start_at + duration
        elif template_end_time is not None:
            # Handle overnight events (end < start means next day)
            end_date = d
            if template_end_time <= template_time:
                end_date = d + timedelta(days=1)
            end_at = datetime.combine(end_date, template_end_time)

        action = VoiceProposedAction(
            action=template_action.action,
            transcript=template_action.transcript,
            confidence_note=(
                f"{template_action.title} na {dates_summary} ({len(correct_dates)} wydarzeń) — daty zweryfikowane."
                if i == 0
                else f"{template_action.title} na {_weekday_name(d)} {d.day}.{d.month:02d}."
            ),
            title=template_action.title,
            start_at=start_at,
            end_at=end_at,
            all_day=template_action.all_day,
            description=template_action.description,
            location=template_action.location,
            category=template_action.category,
            color=template_action.color,
            icon=template_action.icon,
            temporal_interpretation=corrected_ti if i == 0 else None,
        )
        new_actions.append(action)

    return new_actions + other_actions
