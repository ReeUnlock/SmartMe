import json
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.auth.models import User
from app.auth.dependencies import get_current_user
from app.voice.schemas import (
    VoiceActionType,
    VoiceConfirmAction,
    VoiceExecuteResult,
    VoiceProcessResponse,
    VoiceProposedAction,
)
from app.voice.service import transcribe_audio, parse_intent
from app.voice.executor import (
    execute_add_event,
    execute_update_event,
    execute_delete_event,
    execute_delete_all_events,
    execute_list_events,
)
from app.voice.shopping_executor import (
    execute_create_shopping_list,
    execute_add_shopping_items,
    execute_delete_shopping_items,
)
from app.voice.expense_executor import (
    execute_add_expense,
    execute_add_recurring_expense,
    execute_delete_recurring_expense,
    execute_set_budget,
    execute_list_expenses,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice", tags=["voice"])

ALLOWED_AUDIO_TYPES = {
    "audio/webm",
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/m4a",
    "audio/mp4",
    "audio/x-m4a",
    "video/webm",  # browsers sometimes send webm as video/webm
}

ALLOWED_EXTENSIONS = {".webm", ".mp3", ".wav", ".ogg", ".m4a"}


def _check_openai_key():
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Klucz API OpenAI nie jest skonfigurowany. Dodaj OPENAI_API_KEY do zmiennych środowiskowych.",
        )


def _validate_audio_file(file: UploadFile):
    filename = file.filename or "audio.webm"
    ext = ""
    if "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower()

    content_type = file.content_type or ""

    if ext not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nieobsługiwany format pliku audio. Dozwolone: webm, mp3, wav, ogg, m4a.",
        )


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice(
    audio: UploadFile = File(...),
    history: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transcribe audio and parse intent into proposed actions."""
    _check_openai_key()
    _validate_audio_file(audio)

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plik audio jest pusty.",
        )

    filename = audio.filename or "audio.webm"

    try:
        transcript = await transcribe_audio(audio_bytes, filename)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Błąd podczas transkrypcji audio. Spróbuj ponownie.",
        )

    if not transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nie udało się rozpoznać mowy. Spróbuj ponownie.",
        )

    # Parse chat history
    chat_history = []
    if history:
        try:
            chat_history = json.loads(history)
            if not isinstance(chat_history, list):
                chat_history = []
        except (json.JSONDecodeError, TypeError):
            chat_history = []

    try:
        now = datetime.now(ZoneInfo("Europe/Warsaw"))
        actions = await parse_intent(transcript, now, chat_history=chat_history)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)
        )
    except Exception as e:
        logger.error(f"GPT parse error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Błąd podczas analizy komendy. Spróbuj ponownie.",
        )

    return VoiceProcessResponse(transcript=transcript, actions=actions)


@router.post("/execute", response_model=VoiceExecuteResult)
def execute_voice(
    action: VoiceConfirmAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute a confirmed voice action against the database."""
    executors = {
        VoiceActionType.add_event: execute_add_event,
        VoiceActionType.update_event: execute_update_event,
        VoiceActionType.delete_event: execute_delete_event,
    }

    if action.action == VoiceActionType.delete_all_events:
        try:
            deleted = execute_delete_all_events(db, current_user, action)
            count = len(deleted)
            if count == 1:
                msg = "Usunięto 1 wydarzenie."
            else:
                msg = f"Usunięto {count} wydarzeń."
            return VoiceExecuteResult(
                success=True, message=msg, data={"events": deleted}
            )
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute delete_all error: {e}", exc_info=True)
            return VoiceExecuteResult(
                success=False,
                message=f"Błąd podczas usuwania wydarzeń: {str(e)}",
            )

    if action.action == VoiceActionType.list_events:
        try:
            events = execute_list_events(db, current_user, action)
            count = len(events)
            if count == 0:
                msg = "Nie znaleziono wydarzeń w podanym zakresie."
            elif count == 1:
                msg = "Znaleziono 1 wydarzenie."
            else:
                msg = f"Znaleziono {count} wydarzeń."
            return VoiceExecuteResult(
                success=True, message=msg, data={"events": events}
            )
        except Exception as e:
            logger.error(f"Voice execute list error: {e}", exc_info=True)
            return VoiceExecuteResult(
                success=False,
                message=f"Błąd podczas wyszukiwania wydarzeń: {str(e)}",
            )

    # ─── Shopping actions ─────────────────────────────────────────
    if action.action == VoiceActionType.create_shopping_list:
        try:
            result = execute_create_shopping_list(db, current_user, action)
            item_count = len(result.get("items", []))
            msg = f"Utworzono listę \u201E{result['name']}\u201D z {item_count} produktami."
            return VoiceExecuteResult(success=True, message=msg, data={"shopping_list": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute create_shopping_list error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas tworzenia listy: {str(e)}")

    if action.action == VoiceActionType.add_shopping_items:
        try:
            result = execute_add_shopping_items(db, current_user, action)
            item_count = len(action.items or [])
            msg = f"Dodano {item_count} produktów do listy \u201E{result['name']}\u201D."
            return VoiceExecuteResult(success=True, message=msg, data={"shopping_list": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute add_shopping_items error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas dodawania produktów: {str(e)}")

    if action.action == VoiceActionType.delete_shopping_items:
        try:
            result = execute_delete_shopping_items(db, current_user, action)
            item_count = len(action.items or [])
            msg = f"Usuni\u0119to {item_count} produktów z listy \u201E{result['name']}\u201D."
            return VoiceExecuteResult(success=True, message=msg, data={"shopping_list": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute delete_shopping_items error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas usuwania produktów: {str(e)}")

    # ─── Expense actions ──────────────────────────────────────────
    if action.action == VoiceActionType.add_expense:
        try:
            result = execute_add_expense(db, current_user, action)
            msg = f"Dodano wydatek {result['amount']:.2f} zł"
            if result.get("description"):
                msg += f" — {result['description']}"
            return VoiceExecuteResult(success=True, message=msg, data={"expense": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute add_expense error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas dodawania wydatku: {str(e)}")

    if action.action == VoiceActionType.add_recurring_expense:
        try:
            result = execute_add_recurring_expense(db, current_user, action)
            msg = f"Dodano stały koszt \u201E{result['name']}\u201D — {result['amount']:.2f} zł/mies."
            return VoiceExecuteResult(success=True, message=msg, data={"recurring": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute add_recurring error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas dodawania stałego kosztu: {str(e)}")

    if action.action == VoiceActionType.delete_recurring_expense:
        try:
            result = execute_delete_recurring_expense(db, current_user, action)
            msg = f"Usunięto stały koszt \u201E{result['name']}\u201D ({result['amount']:.2f} zł/mies.)"
            return VoiceExecuteResult(success=True, message=msg, data={"recurring": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute delete_recurring error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas usuwania stałego kosztu: {str(e)}")

    if action.action == VoiceActionType.set_budget:
        try:
            result = execute_set_budget(db, current_user, action)
            msg = f"Ustawiono budżet na {result['month_name']} {result['year']}: {result['amount']:.0f} zł"
            return VoiceExecuteResult(success=True, message=msg, data={"budget": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute set_budget error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas ustawiania budżetu: {str(e)}")

    if action.action == VoiceActionType.list_expenses:
        try:
            result = execute_list_expenses(db, current_user, action)
            msg = f"Wydatki za miesiąc: {result['total']:.2f} zł ({result['count']} pozycji)"
            return VoiceExecuteResult(success=True, message=msg, data={"expenses_summary": result})
        except Exception as e:
            logger.error(f"Voice execute list_expenses error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas wczytywania wydatków: {str(e)}")

    if action.action == VoiceActionType.unknown:
        return VoiceExecuteResult(
            success=False,
            message="Nie udało się rozpoznać komendy. Spróbuj powiedzieć inaczej.",
        )

    executor = executors.get(action.action)
    if not executor:
        return VoiceExecuteResult(
            success=False, message="Nieobsługiwany typ akcji."
        )

    try:
        result = executor(db, current_user, action)
        messages = {
            VoiceActionType.add_event: f"Utworzono wydarzenie: {result.get('title', '')}",
            VoiceActionType.update_event: f"Zaktualizowano wydarzenie: {result.get('title', '')}",
            VoiceActionType.delete_event: f"Usunięto wydarzenie: {result.get('title', '')}",
        }
        return VoiceExecuteResult(
            success=True,
            message=messages.get(action.action, "Wykonano."),
            data={"event": result},
        )
    except ValueError as e:
        return VoiceExecuteResult(success=False, message=str(e))
    except Exception as e:
        logger.error(f"Voice execute error: {e}", exc_info=True)
        return VoiceExecuteResult(
            success=False,
            message="Wystąpił błąd podczas wykonywania akcji. Spróbuj ponownie.",
        )
