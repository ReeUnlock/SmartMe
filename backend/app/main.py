import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth.router import router as auth_router
from app.calendar.router import router as calendar_router
from app.voice.router import router as voice_router
from app.shopping.router import router as shopping_router
from app.expenses.router import router as expenses_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Anelka API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:81",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(calendar_router)
app.include_router(voice_router)
app.include_router(shopping_router)
app.include_router(expenses_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Wystąpił błąd serwera. Spróbuj ponownie."},
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}
