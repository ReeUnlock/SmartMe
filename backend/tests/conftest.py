"""
Shared test fixtures for Anelka backend tests.
Uses SQLite in-memory database — never touches production PostgreSQL.
"""

import os

# Force test environment BEFORE any app imports
os.environ["DATABASE_URL"] = "sqlite:///./test_anelka.db"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["ENV"] = "test"
os.environ["RESEND_API_KEY"] = ""  # disable email sending in tests

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app


# SQLite in-memory engine with shared cache for test isolation
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


# Enable foreign keys for SQLite (disabled by default)
@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestSessionLocal = sessionmaker(bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override FastAPI dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    """Create all tables before each test, drop after — full isolation."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def reset_rate_limiters():
    """Clear rate limiter state between tests to prevent cross-test 429s."""
    from app.auth.rate_limit import (
        login_limiter, setup_limiter, register_limiter,
        password_change_limiter, forgot_password_limiter,
        resend_verification_limiter, verify_email_limiter,
        reset_password_limiter,
    )
    login_limiter._attempts.clear()
    setup_limiter._attempts.clear()
    register_limiter._attempts.clear()
    password_change_limiter._attempts.clear()
    forgot_password_limiter._attempts.clear()
    resend_verification_limiter._attempts.clear()
    verify_email_limiter._attempts.clear()
    reset_password_limiter._attempts.clear()


@pytest.fixture
def client():
    """FastAPI TestClient with overridden DB."""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Direct DB session for test assertions."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Helper functions ──────────────────────────────────────────────


def create_user(client: TestClient, username="testuser", email="test@example.com", password="Test1234!") -> dict:
    """Register a user via /api/auth/setup and return the response JSON."""
    resp = client.post("/api/auth/setup", json={
        "username": username,
        "email": email,
        "password": password,
    })
    return resp


def login_user(client: TestClient, username="testuser", password="Test1234!") -> dict:
    """Login and return response JSON with access_token."""
    resp = client.post("/api/auth/login", json={
        "username": username,
        "password": password,
    })
    return resp


def auth_header(token: str) -> dict:
    """Build Authorization header."""
    return {"Authorization": f"Bearer {token}"}


def verify_user_email(db_session, email="test@example.com"):
    """Directly verify a user's email in the DB (test shortcut)."""
    from datetime import datetime, timezone
    from app.auth.models import User
    user = db_session.query(User).filter(User.email == email).first()
    if user:
        user.is_email_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
        db_session.commit()


def full_setup_and_login(client: TestClient, username="testuser", email="test@example.com", password="Test1234!") -> str:
    """Create user + verify email + login, return JWT token."""
    create_user(client, username, email, password)
    # Verify email directly in DB (tests don't have email delivery)
    db = TestSessionLocal()
    try:
        verify_user_email(db, email)
    finally:
        db.close()
    resp = login_user(client, username, password)
    return resp.json()["access_token"]


def delete_account(client: TestClient, token: str, password: str) -> None:
    """Delete the user account via /api/auth/reset."""
    client.post("/api/auth/reset", json={"password": password}, headers=auth_header(token))
