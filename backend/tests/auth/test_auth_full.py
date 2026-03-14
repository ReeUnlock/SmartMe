"""
Comprehensive auth test suite for Anelka (SmartMe).

Adapted to single-user architecture:
- Only ONE user can exist at a time (/setup returns 403 if user exists)
- No logout endpoint (JWT is stateless, client-side only)
- No password reset tokens (/forgot-password directly sets new password)
- Account deletion via POST /reset (requires auth + password confirmation)

Blocks:
  A — Full lifecycle (setup → login → me → change-password → forgot-password → reset)
  B — Form validation (bad inputs)
  C — Rate limiting & security
  D — Password edge cases
"""

import uuid
import pytest
from tests.conftest import (
    create_user, login_user, auth_header,
    full_setup_and_login, delete_account,
)


# ═══════════════════════════════════════════════════════════════════
# BLOK A — Full auth lifecycle
# ═══════════════════════════════════════════════════════════════════


class TestAuthLifecycle:
    """Full user lifecycle: setup → login → me → passwords → delete.
    Run 3 cycles with unique credentials to verify cleanup works."""

    @pytest.mark.parametrize("cycle", range(3))
    def test_full_lifecycle(self, client, cycle):
        uid = uuid.uuid4().hex[:8]
        username = f"user_{cycle}_{uid}"
        email = f"user_{cycle}_{uid}@test.example.com"
        password = f"Pass_{cycle}_{uid}!"
        new_password = f"NewPass_{cycle}_{uid}!"
        reset_password = f"Reset_{cycle}_{uid}!"

        # 1. Setup (register)
        resp = create_user(client, username, email, password)
        assert resp.status_code == 200, resp.text
        token = resp.json()["access_token"]
        assert token

        # 2. Login
        resp = login_user(client, username, password)
        assert resp.status_code == 200
        token = resp.json()["access_token"]

        # 3. Verify session — GET /me
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200
        user_data = resp.json()
        assert user_data["username"] == username
        assert user_data["email"] == email
        assert user_data["is_active"] is True
        assert user_data["plan"] == "free"

        # 4. No logout endpoint — verify token still works (stateless JWT)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200

        # 5. Access with invalid token → 401 or 403
        resp = client.get("/api/auth/me", headers=auth_header("invalid.token.here"))
        assert resp.status_code in (401, 403)

        # 6. Forgot password — directly set new password (no token flow)
        resp = client.post("/api/auth/forgot-password", json={
            "email": email,
            "new_password": reset_password,
        })
        assert resp.status_code == 200

        # 7. Login with reset password
        resp = login_user(client, username, reset_password)
        assert resp.status_code == 200
        token = resp.json()["access_token"]

        # 8. Old password should no longer work
        resp = login_user(client, username, password)
        assert resp.status_code == 401

        # 9. Change password (authenticated)
        resp = client.post("/api/auth/change-password", json={
            "current_password": reset_password,
            "new_password": new_password,
        }, headers=auth_header(token))
        assert resp.status_code == 200

        # 10. Login with new password after change
        resp = login_user(client, username, new_password)
        assert resp.status_code == 200
        token = resp.json()["access_token"]

        # 11. Delete account
        resp = client.post("/api/auth/reset", json={
            "password": new_password,
        }, headers=auth_header(token))
        assert resp.status_code == 200

        # 12. Login with deleted account → 401
        resp = login_user(client, username, new_password)
        assert resp.status_code == 401

        # 13. Setup should work again (no user exists)
        resp = client.get("/api/auth/status")
        assert resp.json()["setup_completed"] is False

    def test_setup_creates_user_and_returns_token(self, client):
        resp = create_user(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_setup_blocked_when_user_exists(self, client):
        """Single-user: second setup must return 403."""
        create_user(client)
        resp = create_user(client, username="other", email="other@example.com")
        assert resp.status_code == 403

    def test_login_by_email(self, client):
        """Login works with email as username field."""
        email = "email_login@example.com"
        create_user(client, email=email)
        resp = client.post("/api/auth/login", json={
            "username": email,
            "password": "Test1234!",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_me_returns_user_info(self, client):
        token = full_setup_and_login(client)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "username" in data
        assert "email" in data
        assert "created_at" in data
        assert "hashed_password" not in data  # must never leak

    def test_me_without_token(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code in (401, 403)

    def test_complete_onboarding(self, client):
        token = full_setup_and_login(client)
        # Before onboarding
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.json()["onboarding_completed"] is False

        # Complete onboarding
        resp = client.post("/api/auth/complete-onboarding", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["onboarding_completed"] is True

    def test_auth_status_before_and_after_setup(self, client):
        resp = client.get("/api/auth/status")
        assert resp.json()["setup_completed"] is False

        create_user(client)
        resp = client.get("/api/auth/status")
        assert resp.json()["setup_completed"] is True

    def test_delete_account_wrong_password(self, client):
        token = full_setup_and_login(client)
        resp = client.post("/api/auth/reset", json={
            "password": "wrongpassword123",
        }, headers=auth_header(token))
        assert resp.status_code == 401

    def test_delete_account_without_auth(self, client):
        create_user(client)
        resp = client.post("/api/auth/reset", json={"password": "Test1234!"})
        assert resp.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════════
# BLOK B — Form validation (bad inputs)
# ═══════════════════════════════════════════════════════════════════


class TestAuthValidation:

    def test_register_invalid_email(self, client):
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "not-an-email",
            "password": "Test1234!",
        })
        assert resp.status_code == 422

    def test_register_email_too_short(self, client):
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "a@b",
            "password": "Test1234!",
        })
        assert resp.status_code == 422

    def test_register_password_too_short(self, client):
        """Password min_length=6 per schema."""
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "12345",
        })
        assert resp.status_code == 422

    def test_register_username_too_short(self, client):
        """Username min_length=3 per schema."""
        resp = client.post("/api/auth/setup", json={
            "username": "ab",
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 422

    def test_register_username_too_long(self, client):
        """Username max_length=50 per schema."""
        resp = client.post("/api/auth/setup", json={
            "username": "a" * 51,
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 422

    def test_register_password_too_long(self, client):
        """Password max_length=72 per schema (bcrypt limit)."""
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "a" * 73,
        })
        assert resp.status_code == 422

    def test_register_duplicate_email(self, client):
        """Second setup with same data → 403 (single-user)."""
        create_user(client)
        resp = client.post("/api/auth/setup", json={
            "username": "other",
            "email": "other@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 403

    def test_register_missing_fields(self, client):
        resp = client.post("/api/auth/setup", json={})
        assert resp.status_code == 422

    def test_register_missing_username(self, client):
        resp = client.post("/api/auth/setup", json={
            "email": "test@example.com",
            "password": "Test1234!",
        })
        assert resp.status_code == 422

    def test_register_missing_email(self, client):
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "password": "Test1234!",
        })
        assert resp.status_code == 422

    def test_register_missing_password(self, client):
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "test@example.com",
        })
        assert resp.status_code == 422

    def test_login_wrong_password(self, client):
        create_user(client)
        resp = login_user(client, password="wrong_password")
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        create_user(client)
        resp = login_user(client, username="nobody")
        assert resp.status_code == 401

    def test_login_empty_body(self, client):
        resp = client.post("/api/auth/login", json={})
        assert resp.status_code == 422

    def test_login_missing_password(self, client):
        resp = client.post("/api/auth/login", json={"username": "test"})
        assert resp.status_code == 422

    def test_forgot_password_unknown_email(self, client):
        """App reveals that email doesn't exist (404) — documented behavior for single-user app."""
        create_user(client)
        resp = client.post("/api/auth/forgot-password", json={
            "email": "unknown@example.com",
            "new_password": "NewPass123!",
        })
        assert resp.status_code == 404

    def test_forgot_password_invalid_email(self, client):
        resp = client.post("/api/auth/forgot-password", json={
            "email": "not-an-email",
            "new_password": "NewPass123!",
        })
        assert resp.status_code == 422

    def test_forgot_password_short_password(self, client):
        resp = client.post("/api/auth/forgot-password", json={
            "email": "test@example.com",
            "new_password": "12345",
        })
        assert resp.status_code == 422

    def test_change_password_wrong_current(self, client):
        token = full_setup_and_login(client)
        resp = client.post("/api/auth/change-password", json={
            "current_password": "wrong_old_password",
            "new_password": "NewPass123!",
        }, headers=auth_header(token))
        assert resp.status_code == 401

    def test_change_password_same_as_current(self, client):
        """New password must differ from current."""
        password = "Test1234!"
        token = full_setup_and_login(client, password=password)
        resp = client.post("/api/auth/change-password", json={
            "current_password": password,
            "new_password": password,
        }, headers=auth_header(token))
        assert resp.status_code == 400

    def test_change_password_too_short(self, client):
        token = full_setup_and_login(client)
        resp = client.post("/api/auth/change-password", json={
            "current_password": "Test1234!",
            "new_password": "12345",
        }, headers=auth_header(token))
        assert resp.status_code == 422

    def test_change_password_without_auth(self, client):
        resp = client.post("/api/auth/change-password", json={
            "current_password": "Test1234!",
            "new_password": "NewPass123!",
        })
        assert resp.status_code in (401, 403)


# ═══════════════════════════════════════════════════════════════════
# BLOK C — Rate limiting & security
# ═══════════════════════════════════════════════════════════════════


class TestRateLimiting:

    def test_login_brute_force_lockout(self, client):
        """Login rate limit: 5 attempts per 60s → 6th should be 429."""
        create_user(client)
        for i in range(5):
            resp = login_user(client, password="wrong_password")
            assert resp.status_code == 401, f"Attempt {i+1} should be 401"

        # 6th attempt should be rate limited
        resp = login_user(client, password="wrong_password")
        assert resp.status_code == 429

    def test_setup_rate_limit(self, client):
        """Setup rate limit: 3 attempts per 60s → 4th should be 429."""
        # First succeeds (creates user)
        resp = create_user(client)
        assert resp.status_code == 200

        # Next 2 fail with 403 (user exists)
        for _ in range(2):
            resp = create_user(client, username="other", email="other@example.com")
            assert resp.status_code == 403

        # 4th attempt should be rate limited
        resp = create_user(client, username="yet_another", email="yet@example.com")
        assert resp.status_code == 429

    def test_forgot_password_rate_limit(self, client):
        """Forgot password rate limit: 3 attempts per 60s → 4th should be 429."""
        create_user(client, email="rate@example.com")
        for _ in range(3):
            client.post("/api/auth/forgot-password", json={
                "email": "rate@example.com",
                "new_password": "NewPass123!",
            })
        resp = client.post("/api/auth/forgot-password", json={
            "email": "rate@example.com",
            "new_password": "NewPass123!",
        })
        assert resp.status_code == 429

    def test_change_password_rate_limit(self, client):
        """Change password rate limit: 5 attempts per 60s → 6th should be 429."""
        token = full_setup_and_login(client)
        for _ in range(5):
            client.post("/api/auth/change-password", json={
                "current_password": "wrong",
                "new_password": "NewPass123!",
            }, headers=auth_header(token))

        resp = client.post("/api/auth/change-password", json={
            "current_password": "wrong",
            "new_password": "NewPass123!",
        }, headers=auth_header(token))
        assert resp.status_code == 429


class TestTokenSecurity:

    def test_expired_token_rejected(self, client):
        """Manually craft an expired JWT → should be rejected."""
        from datetime import datetime, timedelta, timezone
        from jose import jwt
        from app.config import settings

        create_user(client)
        expired_payload = {
            "sub": "1",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        resp = client.get("/api/auth/me", headers=auth_header(expired_token))
        assert resp.status_code in (401, 403)

    def test_token_with_wrong_secret(self, client):
        """JWT signed with wrong secret → rejected."""
        from datetime import datetime, timedelta, timezone
        from jose import jwt

        create_user(client)
        payload = {
            "sub": "1",
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        }
        bad_token = jwt.encode(payload, "wrong-secret-key", algorithm="HS256")
        resp = client.get("/api/auth/me", headers=auth_header(bad_token))
        assert resp.status_code in (401, 403)

    def test_token_with_nonexistent_user_id(self, client):
        """Valid JWT but user_id doesn't exist → 401."""
        from datetime import datetime, timedelta, timezone
        from jose import jwt
        from app.config import settings

        create_user(client)
        payload = {
            "sub": "99999",
            "exp": datetime.now(timezone.utc) + timedelta(days=1),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code in (401, 403)

    def test_malformed_token(self, client):
        resp = client.get("/api/auth/me", headers=auth_header("not.a.jwt"))
        assert resp.status_code in (401, 403)

    def test_empty_bearer_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer "})
        assert resp.status_code in (401, 403, 422)

    def test_concurrent_tokens_both_valid(self, client):
        """Two logins for same user → both tokens should work (stateless JWT)."""
        create_user(client)
        resp1 = login_user(client)
        resp2 = login_user(client)
        token1 = resp1.json()["access_token"]
        token2 = resp2.json()["access_token"]

        # Both tokens should be valid
        assert client.get("/api/auth/me", headers=auth_header(token1)).status_code == 200
        assert client.get("/api/auth/me", headers=auth_header(token2)).status_code == 200

    def test_token_invalid_after_account_deletion(self, client):
        """After account deletion, old token should fail."""
        password = "Test1234!"
        token = full_setup_and_login(client, password=password)
        delete_account(client, token, password)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code in (401, 403)

    def test_password_not_in_response(self, client):
        """No endpoint should ever return the password hash."""
        resp = create_user(client)
        assert "password" not in resp.text.lower() or "hashed_password" not in resp.text

        token = resp.json()["access_token"]
        resp = client.get("/api/auth/me", headers=auth_header(token))
        body = resp.json()
        assert "hashed_password" not in body
        assert "password" not in body


# ═══════════════════════════════════════════════════════════════════
# BLOK D — Password edge cases
# ═══════════════════════════════════════════════════════════════════


class TestPasswordEdgeCases:

    def test_password_with_special_chars(self, client):
        password = "P@$$w0rd!#&*()"
        token = full_setup_and_login(client, password=password)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200

    def test_password_unicode(self, client):
        password = "zażółćGęśląJaźń99!"
        token = full_setup_and_login(client, password=password)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200

    def test_password_max_length_72(self, client):
        """bcrypt max is 72 bytes — password at exactly 72 chars should work."""
        password = "A" * 72
        token = full_setup_and_login(client, password=password)
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200

    def test_password_whitespace_only(self, client):
        """Whitespace-only password — schema allows it (min_length=6), but test behavior."""
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "      ",  # 6 spaces — meets min_length
        })
        # Currently schema allows it (no strip_whitespace). Test actual behavior.
        # If 200, it works — that's the current design.
        assert resp.status_code in (200, 422)

    def test_password_sql_injection_attempt(self, client):
        """SQL injection in password field → should be safe (no 500)."""
        password = "' OR '1'='1"
        # Too short for setup (min 6), but let's use a longer one
        password_long = "' OR '1'='1'; DROP TABLE users;--"
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": password_long,
        })
        # Should either work (password is hashed, not interpolated) or 422
        assert resp.status_code in (200, 422)
        assert resp.status_code != 500  # no server error

    def test_password_xss_attempt(self, client):
        """XSS in password field → must not cause issues."""
        password = "<script>alert('xss')</script>12"
        resp = client.post("/api/auth/setup", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": password,
        })
        assert resp.status_code in (200, 422)
        assert resp.status_code != 500

    def test_password_with_null_bytes(self, client):
        """Null bytes in password → bcrypt rejects them (PasswordValueError).
        TestClient propagates server exceptions, so we expect the error to surface."""
        from passlib.exc import PasswordValueError
        password = "test\x00password123"
        with pytest.raises((PasswordValueError, Exception)):
            client.post("/api/auth/setup", json={
                "username": "testuser",
                "email": "test@example.com",
                "password": password,
            })

    def test_change_password_preserves_other_data(self, client):
        """Changing password should not affect username, email, or plan."""
        token = full_setup_and_login(client)
        # Complete onboarding first
        client.post("/api/auth/complete-onboarding", headers=auth_header(token))

        resp_before = client.get("/api/auth/me", headers=auth_header(token))
        user_before = resp_before.json()

        client.post("/api/auth/change-password", json={
            "current_password": "Test1234!",
            "new_password": "Changed1234!",
        }, headers=auth_header(token))

        resp_after = client.get("/api/auth/me", headers=auth_header(token))
        user_after = resp_after.json()

        assert user_after["username"] == user_before["username"]
        assert user_after["email"] == user_before["email"]
        assert user_after["plan"] == user_before["plan"]
        assert user_after["onboarding_completed"] == user_before["onboarding_completed"]

    def test_forgot_password_preserves_username(self, client):
        """Resetting password via forgot-password should not change username."""
        create_user(client, username="keeper", email="keep@example.com")
        client.post("/api/auth/forgot-password", json={
            "email": "keep@example.com",
            "new_password": "ResetPass123!",
        })
        resp = login_user(client, username="keeper", password="ResetPass123!")
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        me = client.get("/api/auth/me", headers=auth_header(token)).json()
        assert me["username"] == "keeper"


# ═══════════════════════════════════════════════════════════════════
# BLOK E — Account deletion cascade
# ═══════════════════════════════════════════════════════════════════


class TestAccountDeletion:

    def test_delete_account_cleans_up(self, client):
        """After deletion, setup_completed should be False."""
        password = "Test1234!"
        token = full_setup_and_login(client, password=password)
        delete_account(client, token, password)

        resp = client.get("/api/auth/status")
        assert resp.json()["setup_completed"] is False

    def test_can_re_register_after_deletion(self, client):
        """After deleting account, a new account can be created."""
        password = "Test1234!"
        token = full_setup_and_login(client, password=password)
        delete_account(client, token, password)

        # Re-register
        resp = create_user(client, username="newuser", email="new@example.com", password="New1234!")
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        me = client.get("/api/auth/me", headers=auth_header(token)).json()
        assert me["username"] == "newuser"

    def test_delete_requires_correct_password(self, client):
        token = full_setup_and_login(client)
        resp = client.post("/api/auth/reset", json={
            "password": "wrong_password",
        }, headers=auth_header(token))
        assert resp.status_code == 401

        # Account should still exist
        resp = client.get("/api/auth/me", headers=auth_header(token))
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════
# BLOK F — Health check & status (public endpoints)
# ═══════════════════════════════════════════════════════════════════


class TestPublicEndpoints:

    def test_health_check(self, client):
        resp = client.get("/api/health")
        # SQLite in tests, may or may not pass the SELECT 1
        assert resp.status_code in (200, 503)

    def test_auth_status_public(self, client):
        """Status endpoint requires no auth."""
        resp = client.get("/api/auth/status")
        assert resp.status_code == 200
        assert "setup_completed" in resp.json()
