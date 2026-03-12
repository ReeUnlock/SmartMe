import logging
import os

logger = logging.getLogger(__name__)

_DEFAULT_SECRET = "anelka-dev-secret-key-change-in-prod"


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Anelka")
    ENV: str = os.getenv("ENV", "development")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://anelka:anelka_secret@db:5432/anelka"
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET)
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30"))
    ALGORITHM: str = "HS256"
    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", "/app/uploads")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:81,http://localhost:3001"
        ).split(",")
    ] + [
        # Capacitor native WebView origins
        "https://localhost",
        "capacitor://localhost",
        "http://localhost",
    ]


settings = Settings()

if settings.SECRET_KEY == _DEFAULT_SECRET:
    if settings.ENV == "production":
        raise RuntimeError(
            "FATAL: SECRET_KEY is set to the default dev value in production. "
            "Set a strong SECRET_KEY in your .env file."
        )
    logger.warning(
        "WARNING: Using default dev SECRET_KEY. "
        "Set SECRET_KEY env var for production."
    )
