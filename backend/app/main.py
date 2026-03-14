import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Anelka API")

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
