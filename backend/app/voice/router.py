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
from app.voice.calendar_validator import validate_calendar_actions
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
    execute_check_shopping_items,
    execute_uncheck_shopping_items,
)
from app.voice.expense_executor import (
    execute_add_expense,
    execute_add_recurring_expense,
    execute_delete_recurring_expense,
    execute_set_budget,
    execute_list_expenses,
    execute_generate_recurring_expenses,
    execute_save_shopping_as_expense,
)
from app.voice.plans_executor import (
    execute_add_goal,
    execute_update_goal,
    execute_delete_goal,
    execute_toggle_goal,
    execute_add_bucket_item,
    execute_delete_bucket_item,
    execute_toggle_bucket_item,
    execute_list_goals,
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

MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10 MB


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

    # Read with size limit to prevent memory exhaustion
    audio_bytes = await audio.read(MAX_AUDIO_SIZE + 1)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plik audio jest pusty.",
        )
    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Plik audio jest za duży. Maksymalny rozmiar to {MAX_AUDIO_SIZE // (1024 * 1024)} MB.",
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

    # Validate and potentially re-expand calendar dates
    try:
        actions = validate_calendar_actions(actions, now.date())
    except Exception as e:
        logger.error(f"Calendar validation error: {e}", exc_info=True)
        # Don't block — but annotate all calendar actions so user sees the failure
        for action in actions:
            if action.action in {VoiceActionType.add_event}:
                action.validation_errors = action.validation_errors or []
                action.validation_errors.append(
                    "Walidacja dat nie powiodła się — sprawdź daty ręcznie przed potwierdzeniem."
                )

    # Increment voice calls counter
    current_user.voice_calls_total = (current_user.voice_calls_total or 0) + 1
    db.commit()

    return VoiceProcessResponse(transcript=transcript, actions=actions)


@router.post("/execute", response_model=VoiceExecuteResult)
def execute_voice(
    action: VoiceConfirmAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute a confirmed voice action against the database.

    If execution fails with an unexpected exception, roll back
    the session to prevent partial commits from persisting.
    """
    try:
        result = _execute_voice_inner(action, db, current_user)
        return result
    except Exception:
        db.rollback()
        raise


def _execute_voice_inner(
    action: VoiceConfirmAction,
    db: Session,
    current_user: User,
) -> VoiceExecuteResult:
    """Inner execution logic — wrapped in savepoint by execute_voice."""
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

    if action.action == VoiceActionType.check_shopping_items:
        try:
            result = execute_check_shopping_items(db, current_user, action)
            item_count = len(action.items or [])
            msg = f"Oznaczono {item_count} produktów jako kupione na liście \u201E{result['name']}\u201D."
            return VoiceExecuteResult(success=True, message=msg, data={"shopping_list": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute check_shopping_items error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas oznaczania produktów: {str(e)}")

    if action.action == VoiceActionType.uncheck_shopping_items:
        try:
            result = execute_uncheck_shopping_items(db, current_user, action)
            item_count = len(action.items or [])
            msg = f"Odznaczono {item_count} produktów na liście \u201E{result['name']}\u201D."
            return VoiceExecuteResult(success=True, message=msg, data={"shopping_list": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute uncheck_shopping_items error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas odznaczania produktów: {str(e)}")

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

    if action.action == VoiceActionType.generate_recurring_expenses:
        try:
            result = execute_generate_recurring_expenses(db, current_user, action)
            if result["generated"] > 0:
                msg = f"Utworzono {result['generated']} stałych kosztów na {result['month_name']} {result['year']} ({result['total']:.2f} zł)"
            else:
                msg = "Wszystkie stałe koszty zostały już wygenerowane."
            return VoiceExecuteResult(success=True, message=msg, data={"recurring_generation": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute generate_recurring error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas generowania stałych kosztów: {str(e)}")

    # ─── Shopping → Expense bridge ─────────────────────────────────
    if action.action == VoiceActionType.save_shopping_as_expense:
        try:
            result = execute_save_shopping_as_expense(db, current_user, action)
            msg = f"Zapisano zakupy jako wydatek {result['amount']:.2f} zł \u2014 {result['description']}"
            return VoiceExecuteResult(success=True, message=msg, data={"expense": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute save_shopping_as_expense error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas zapisywania zakupów jako wydatek: {str(e)}")

    # ─── Plans actions ───────────────────────────────────────────
    if action.action == VoiceActionType.add_goal:
        try:
            result = execute_add_goal(db, current_user, action)
            msg = f"Dodano cel: {result['title']}"
            return VoiceExecuteResult(success=True, message=msg, data={"goal": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute add_goal error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas dodawania celu: {str(e)}")

    if action.action == VoiceActionType.update_goal:
        try:
            result = execute_update_goal(db, current_user, action)
            msg = f"Zaktualizowano cel: {result['title']}"
            return VoiceExecuteResult(success=True, message=msg, data={"goal": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute update_goal error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas aktualizacji celu: {str(e)}")

    if action.action == VoiceActionType.delete_goal:
        try:
            result = execute_delete_goal(db, current_user, action)
            msg = f"Usunięto cel: {result['title']}"
            return VoiceExecuteResult(success=True, message=msg, data={"goal": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute delete_goal error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd podczas usuwania celu: {str(e)}")

    if action.action == VoiceActionType.toggle_goal:
        try:
            result = execute_toggle_goal(db, current_user, action)
            status = "ukończony" if result["is_completed"] else "aktywny"
            msg = f"Cel \u201E{result['title']}\u201D oznaczony jako {status}."
            return VoiceExecuteResult(success=True, message=msg, data={"goal": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute toggle_goal error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd: {str(e)}")

    if action.action == VoiceActionType.add_bucket_item:
        try:
            result = execute_add_bucket_item(db, current_user, action)
            msg = f"Dodano na listę marzeń: {result['title']}"
            return VoiceExecuteResult(success=True, message=msg, data={"bucket_item": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute add_bucket_item error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd: {str(e)}")

    if action.action == VoiceActionType.delete_bucket_item:
        try:
            result = execute_delete_bucket_item(db, current_user, action)
            msg = f"Usunięto z listy marzeń: {result['title']}"
            return VoiceExecuteResult(success=True, message=msg, data={"bucket_item": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute delete_bucket_item error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd: {str(e)}")

    if action.action == VoiceActionType.toggle_bucket_item:
        try:
            result = execute_toggle_bucket_item(db, current_user, action)
            status = "zrealizowane" if result["is_completed"] else "niezrealizowane"
            msg = f"\u201E{result['title']}\u201D oznaczone jako {status}."
            return VoiceExecuteResult(success=True, message=msg, data={"bucket_item": result})
        except ValueError as e:
            return VoiceExecuteResult(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Voice execute toggle_bucket_item error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd: {str(e)}")

    if action.action == VoiceActionType.list_goals:
        try:
            result = execute_list_goals(db, current_user, action)
            msg = f"Cele: {result['goals_count']}, Lista marzeń: {result['bucket_count']}"
            return VoiceExecuteResult(success=True, message=msg, data={"plans_summary": result})
        except Exception as e:
            logger.error(f"Voice execute list_goals error: {e}", exc_info=True)
            return VoiceExecuteResult(success=False, message=f"Błąd: {str(e)}")

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
