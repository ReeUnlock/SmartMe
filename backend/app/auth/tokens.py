"""
Auth token utilities — email verification & password reset tokens.
"""
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth.models import AuthToken


def generate_auth_token() -> str:
    """Generate a cryptographically secure 64-character hex token."""
    return secrets.token_hex(32)


def create_auth_token(db: Session, user_id: int, token_type: str) -> str:
    """Create a token in DB, invalidating any previous unused tokens of the same type."""
    # Invalidate old tokens of this type for this user
    db.query(AuthToken).filter(
        AuthToken.user_id == user_id,
        AuthToken.token_type == token_type,
        AuthToken.used_at == None,  # noqa: E711
    ).delete()

    token = generate_auth_token()
    auth_token = AuthToken(
        user_id=user_id,
        token=token,
        token_type=token_type,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(auth_token)
    db.commit()
    return token


def verify_auth_token(db: Session, token: str, token_type: str) -> AuthToken | None:
    """Return token if valid and unused, None otherwise."""
    return db.query(AuthToken).filter(
        AuthToken.token == token,
        AuthToken.token_type == token_type,
        AuthToken.used_at == None,  # noqa: E711
        AuthToken.expires_at > datetime.now(timezone.utc),
    ).first()


def consume_auth_token(db: Session, auth_token: AuthToken):
    """Mark token as used."""
    auth_token.used_at = datetime.now(timezone.utc)
    db.commit()
