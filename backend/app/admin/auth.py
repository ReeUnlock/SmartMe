import hashlib
from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.admin.models import AdminApiKey


def verify_admin_key(
    x_admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db),
) -> AdminApiKey:
    """Verify admin API key from X-Admin-Key header."""
    key_hash = hashlib.sha256(x_admin_key.encode()).hexdigest()
    api_key = db.query(AdminApiKey).filter(AdminApiKey.key_hash == key_hash).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key",
        )
    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()
    return api_key
