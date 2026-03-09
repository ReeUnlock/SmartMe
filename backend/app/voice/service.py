import io
import json
import logging
from datetime import datetime, timezone
from string import Template
from zoneinfo import ZoneInfo

from openai import AsyncOpenAI

from app.config import settings
from app.voice.prompts import VOICE_SYSTEM_PROMPT
from app.voice.schemas import ShoppingItemParam, VoiceActionType, VoiceProposedAction

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

        results.append(VoiceProposedAction(
            action=action,
            transcript=transcript,
            confidence_note=item.get("confidence_note"),
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
            list_name=item.get("list_name"),
            items=shopping_items,
        ))

    return results
