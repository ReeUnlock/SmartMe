import io
import json
import logging
from datetime import datetime, timezone
from string import Template
from zoneinfo import ZoneInfo

from openai import AsyncOpenAI

from app.config import settings
from app.voice.prompts import VOICE_SYSTEM_PROMPT
from app.voice.schemas import ShoppingItemParam, TemporalInterpretation, VoiceActionType, VoiceProposedAction

logger = logging.getLogger(__name__)


def _get_client() -> AsyncOpenAI:
    if not settings.OPENAI_API_KEY:
        raise ValueError("Klucz API OpenAI nie jest skonfigurowany.")
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    client = _get_client()

    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="pl",
    )

    return transcript.text


async def parse_intent(
    transcript: str,
    current_datetime: datetime | None = None,
    chat_history: list[dict] | None = None,
) -> list[VoiceProposedAction]:
    """Parse a Polish voice transcript into structured actions using GPT."""
    client = _get_client()

    if current_datetime is None:
        current_datetime = datetime.now(ZoneInfo("Europe/Warsaw"))

    system_prompt = Template(VOICE_SYSTEM_PROMPT).safe_substitute(
        current_datetime=current_datetime.strftime("%Y-%m-%d %H:%M:%S %A")
    )

    messages = [{"role": "system", "content": system_prompt}]

    # Add chat history for context (last 10 exchanges)
    if chat_history:
        for entry in chat_history[-20:]:
            role = entry.get("role", "user")
            content = entry.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": transcript})

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    content = response.choices[0].message.content
    parsed = json.loads(content)

    # Support both {"actions": [...]} and legacy single-object format
    raw_actions = parsed.get("actions") if isinstance(parsed.get("actions"), list) else [parsed]

    results = []
    for item in raw_actions:
        action_str = item.get("action", "unknown")
        try:
            action = VoiceActionType(action_str)
        except ValueError:
            action = VoiceActionType.unknown

        # Parse shopping items if present
        raw_items = item.get("items")
        shopping_items = None
        if raw_items and isinstance(raw_items, list):
            shopping_items = [
                ShoppingItemParam(
                    name=si.get("name", ""),
                    quantity=si.get("quantity"),
                    unit=si.get("unit"),
                    category=si.get("category"),
                )
                for si in raw_items
                if si.get("name")
            ]

        # Parse temporal_interpretation if present
        raw_ti = item.get("temporal_interpretation")
        temporal_interp = None
        if raw_ti and isinstance(raw_ti, dict):
            temporal_interp = TemporalInterpretation(
                source_text=raw_ti.get("source_text"),
                pattern_type=raw_ti.get("pattern_type"),
                resolved_dates=raw_ti.get("resolved_dates"),
                range_start=raw_ti.get("range_start"),
                range_end=raw_ti.get("range_end"),
                weekdays=raw_ti.get("weekdays"),
                interval=raw_ti.get("interval"),
                needs_clarification=raw_ti.get("needs_clarification"),
                clarification_reason=raw_ti.get("clarification_reason"),
                default_assumption=raw_ti.get("default_assumption"),
            )

        results.append(VoiceProposedAction(
            action=action,
            transcript=transcript,
            confidence_note=item.get("confidence_note"),
            # Calendar fields
            title=item.get("title"),
            start_at=item.get("start_at"),
            end_at=item.get("end_at"),
            all_day=item.get("all_day"),
            description=item.get("description"),
            location=item.get("location"),
            category=item.get("category"),
            event_id=item.get("event_id"),
            date_query=item.get("date_query"),
            color=item.get("color"),
            icon=item.get("icon"),
            temporal_interpretation=temporal_interp,
            # Shopping fields
            list_name=item.get("list_name"),
            items=shopping_items,
            # Expense fields
            amount=item.get("amount"),
            expense_date=item.get("expense_date"),
            expense_category=item.get("expense_category"),
            paid_by=item.get("paid_by"),
            is_shared=item.get("is_shared"),
            expense_description=item.get("expense_description"),
            recurring_name=item.get("recurring_name"),
            day_of_month=item.get("day_of_month"),
            budget_amount=item.get("budget_amount"),
            budget_year=item.get("budget_year"),
            budget_month=item.get("budget_month"),
            # Plans fields
            goal_title=item.get("goal_title"),
            goal_description=item.get("goal_description"),
            goal_category=item.get("goal_category"),
            goal_color=item.get("goal_color"),
            goal_target_value=item.get("goal_target_value"),
            goal_current_value=item.get("goal_current_value"),
            goal_unit=item.get("goal_unit"),
            goal_deadline=item.get("goal_deadline"),
            goal_id=item.get("goal_id"),
            bucket_title=item.get("bucket_title"),
            bucket_description=item.get("bucket_description"),
            bucket_category=item.get("bucket_category"),
            bucket_id=item.get("bucket_id"),
        ))

    return results
