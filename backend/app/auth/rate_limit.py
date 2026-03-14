import time
from collections import defaultdict
from fastapi import HTTPException, Request, status


class RateLimiter:
    """Simple in-memory rate limiter by IP. Window-based, not sliding."""

    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, list[float]] = defaultdict(list)

    def check(self, request: Request) -> None:
        key = request.client.host if request.client else "unknown"
        now = time.monotonic()
        cutoff = now - self.window_seconds

        # Clean old entries
        self._attempts[key] = [t for t in self._attempts[key] if t > cutoff]

        if len(self._attempts[key]) >= self.max_attempts:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
            )

        self._attempts[key].append(now)


login_limiter = RateLimiter(max_attempts=5, window_seconds=60)
setup_limiter = RateLimiter(max_attempts=3, window_seconds=60)
register_limiter = RateLimiter(max_attempts=3, window_seconds=60)
password_change_limiter = RateLimiter(max_attempts=5, window_seconds=60)
forgot_password_limiter = RateLimiter(max_attempts=3, window_seconds=60)
resend_verification_limiter = RateLimiter(max_attempts=3, window_seconds=60)
verify_email_limiter = RateLimiter(max_attempts=5, window_seconds=60)
reset_password_limiter = RateLimiter(max_attempts=5, window_seconds=60)
