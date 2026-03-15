import hashlib
import logging
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text, func
from starlette.background import BackgroundTask

from app.config import settings
from app.database import SessionLocal

from app.auth.router import router as auth_router
from app.calendar.router import router as calendar_router
from app.voice.router import router as voice_router
from app.shopping.router import router as shopping_router
from app.expenses.router import router as expenses_router
from app.plans.router import router as plans_router
from app.feedback.router import router as feedback_router
from app.receipts.router import router as receipts_router
from app.billing.router import router as billing_router
from app.rewards.router import router as rewards_router
from app.admin.router import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Lifespan: admin key seeding ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Seed admin API key on startup if none exists."""
    try:
        db = SessionLocal()
        from app.admin.models import AdminApiKey
        count = db.query(func.count(AdminApiKey.id)).scalar() or 0
        if count == 0:
            raw_key = f"adm_{secrets.token_hex(32)}"
            key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
            db.add(AdminApiKey(key_hash=key_hash, label="auto-generated"))
            db.commit()
            logger.info(
                "\n====================================================\n"
                "ADMIN API KEY (zapisz to, nie będzie pokazany ponownie):\n"
                f"{raw_key}\n"
                "===================================================="
            )
        db.close()
    except Exception:
        logger.warning("Could not seed admin key (table may not exist yet)", exc_info=True)
    yield


app = FastAPI(title="Anelka API", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(calendar_router)
app.include_router(voice_router)
app.include_router(shopping_router)
app.include_router(expenses_router)
app.include_router(plans_router)
app.include_router(feedback_router)
app.include_router(receipts_router)
app.include_router(billing_router)
app.include_router(rewards_router)
app.include_router(admin_router)


# ── last_seen_at middleware ────────────────────────────────────────────────

# Paths to skip for last_seen tracking (public/internal endpoints)
_SKIP_LAST_SEEN_PREFIXES = (
    "/api/health",
    "/api/admin",
    "/api/billing/webhooks",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/setup",
    "/api/auth/verify-email",
    "/api/auth/resend-verification",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/test-",
    "/api/feedback",
    "/api/billing/plans",
)

from app.auth.security import decode_access_token


def _update_last_seen(user_id: int):
    """Background task: update last_seen_at for the authenticated user."""
    db = SessionLocal()
    try:
        db.execute(
            text("UPDATE users SET last_seen_at = :now WHERE id = :uid"),
            {"now": datetime.now(timezone.utc), "uid": user_id},
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.debug("Failed to update last_seen_at", exc_info=True)
    finally:
        db.close()


@app.middleware("http")
async def track_last_seen(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if not path.startswith("/api/") or path.startswith(_SKIP_LAST_SEEN_PREFIXES):
        return response
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        user_id = decode_access_token(token)
        if user_id:
            response.background = BackgroundTask(_update_last_seen, user_id)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Wystąpił błąd serwera. Spróbuj ponownie."},
    )


@app.get("/api/health")
def health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "database": "ok"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "error"},
        )
