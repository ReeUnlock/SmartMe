import os


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "Anelka")
    ENV: str = os.getenv("ENV", "development")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://anelka:anelka_secret@db:5432/anelka"
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "anelka-dev-secret-key-change-in-prod")
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30"))
    ALGORITHM: str = "HS256"
    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", "/app/uploads")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


settings = Settings()
