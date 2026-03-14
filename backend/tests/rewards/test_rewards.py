"""
Tests for rewards backend persistence (cross-device sync).
Covers: GET/PATCH /api/rewards, defaults, isolation, cascade, auth.
"""

import pytest
from tests.conftest import (
    create_user,
    login_user,
    auth_header,
    full_setup_and_login,
    delete_account,
    TestSessionLocal,
)
from app.rewards.models import UserRewards


# ── Helpers ──────────────────────────────────────────────────────────


def get_rewards(client, token):
    return client.get("/api/rewards", headers=auth_header(token))


def patch_rewards(client, token, data):
    return client.patch("/api/rewards", json=data, headers=auth_header(token))


# ── Tests ────────────────────────────────────────────────────────────


class TestGetRewards:
    def test_get_rewards_creates_defaults(self, client):
        """GET /api/rewards auto-creates row with default values."""
        token = full_setup_and_login(client)
        resp = get_rewards(client, token)

        assert resp.status_code == 200
        data = resp.json()
        assert data["sparks"] == 0
        assert data["level"] == 1
        assert data["streak"] == 0
        assert data["xp"] == 0
        assert data["achievements"] == []
        assert data["challenges_state"] == {}
        assert data["avatar_key"] == "sol"
        assert data["seen_avatar_unlocks"] == []
        assert data["streak_last_date"] is None

    def test_get_rewards_returns_same_row_on_second_call(self, client, db_session):
        """GET /api/rewards twice returns identical data (no duplicate rows)."""
        token = full_setup_and_login(client)

        resp1 = get_rewards(client, token)
        resp2 = get_rewards(client, token)

        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json() == resp2.json()

        # Verify only one row in DB
        rows = db_session.query(UserRewards).all()
        assert len(rows) == 1


class TestPatchRewards:
    def test_patch_rewards_partial_update(self, client):
        """PATCH with subset of fields updates only those fields."""
        token = full_setup_and_login(client)

        resp = patch_rewards(client, token, {"sparks": 42, "level": 3})
        assert resp.status_code == 200

        data = resp.json()
        assert data["sparks"] == 42
        assert data["level"] == 3
        # Other fields unchanged
        assert data["streak"] == 0
        assert data["avatar_key"] == "sol"
        assert data["xp"] == 0
        assert data["achievements"] == []

    def test_patch_rewards_full_update(self, client):
        """PATCH with all fields, then GET to verify persistence."""
        token = full_setup_and_login(client)

        full_data = {
            "sparks": 150,
            "level": 7,
            "streak": 5,
            "streak_last_date": "2026-03-14",
            "xp": 320,
            "achievements": [{"id": "first_expense", "tier": 1}],
            "challenges_state": {"daily": {"date": "2026-03-14", "items": []}},
            "avatar_key": "bloom",
            "seen_avatar_unlocks": ["bloom"],
        }

        resp = patch_rewards(client, token, full_data)
        assert resp.status_code == 200

        # Verify via fresh GET
        resp2 = get_rewards(client, token)
        data = resp2.json()
        assert data["sparks"] == 150
        assert data["level"] == 7
        assert data["streak"] == 5
        assert data["streak_last_date"] == "2026-03-14"
        assert data["xp"] == 320
        assert data["achievements"] == [{"id": "first_expense", "tier": 1}]
        assert data["challenges_state"] == {"daily": {"date": "2026-03-14", "items": []}}
        assert data["avatar_key"] == "bloom"
        assert data["seen_avatar_unlocks"] == ["bloom"]

    def test_patch_achievements_json(self, client):
        """PATCH achievements as structured JSON array."""
        token = full_setup_and_login(client)

        achievements = [
            {"id": "first_expense", "tier": 1, "unlocked_at": "2026-03-14"},
            {"id": "streak_3", "tier": 1, "unlocked_at": "2026-03-14"},
        ]
        resp = patch_rewards(client, token, {"achievements": achievements})
        assert resp.status_code == 200

        data = get_rewards(client, token).json()
        assert data["achievements"] == achievements

    def test_patch_challenges_state_json(self, client):
        """PATCH challenges_state as nested JSON object."""
        token = full_setup_and_login(client)

        challenges = {
            "daily": {"date": "2026-03-14", "items": [{"id": "d1", "progress": 2, "claimed": False}]},
            "weekly": {"weekKey": "2026-W11", "items": []},
            "weekActiveDays": ["2026-03-14"],
        }
        resp = patch_rewards(client, token, {"challenges_state": challenges})
        assert resp.status_code == 200

        data = get_rewards(client, token).json()
        assert data["challenges_state"] == challenges


class TestIsolation:
    def test_rewards_isolated_between_users(self, client):
        """User A's rewards don't leak to user B."""
        token_a = full_setup_and_login(client, "user_a", "a@test.com", "Test1234!")
        token_b = full_setup_and_login(client, "user_b", "b@test.com", "Test1234!")

        patch_rewards(client, token_a, {"sparks": 100, "level": 5})

        data_b = get_rewards(client, token_b).json()
        assert data_b["sparks"] == 0
        assert data_b["level"] == 1

    def test_rewards_persist_across_sessions(self, client):
        """Rewards survive logout + re-login."""
        token = full_setup_and_login(client, "persist_user", "persist@test.com", "Test1234!")
        patch_rewards(client, token, {"sparks": 99, "level": 4})

        # Login again (simulates new session)
        token2 = login_user(client, "persist_user", "Test1234!").json()["access_token"]
        data = get_rewards(client, token2).json()
        assert data["sparks"] == 99
        assert data["level"] == 4


class TestCascade:
    def test_rewards_deleted_with_user(self, client, db_session):
        """Deleting user account cascades to user_rewards row."""
        token = full_setup_and_login(client, "del_user", "del@test.com", "Test1234!")
        patch_rewards(client, token, {"sparks": 50, "level": 2})

        # Verify row exists
        rows_before = db_session.query(UserRewards).all()
        assert len(rows_before) == 1

        # Delete account
        delete_account(client, token, "Test1234!")

        # Verify row is gone
        db_session.expire_all()
        rows_after = db_session.query(UserRewards).all()
        assert len(rows_after) == 0


class TestAuth:
    def test_get_rewards_unauthorized(self, client):
        """GET /api/rewards without token returns 401/403."""
        resp = client.get("/api/rewards")
        assert resp.status_code in (401, 403)

    def test_patch_rewards_unauthorized(self, client):
        """PATCH /api/rewards without token returns 401/403."""
        resp = client.patch("/api/rewards", json={"sparks": 10})
        assert resp.status_code in (401, 403)
