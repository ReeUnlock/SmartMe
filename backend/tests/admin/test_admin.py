"""
Admin panel API tests.
Tests admin key auth, health, stats, and users endpoints.
"""
import hashlib

import pytest
from tests.conftest import (
    TestSessionLocal,
    create_user,
    verify_user_email,
    full_setup_and_login,
)


# ── Helpers ────────────────────────────────────────────────────────────────

VALID_ADMIN_KEY = "adm_test_key_for_admin_panel_12345678"
VALID_KEY_HASH = hashlib.sha256(VALID_ADMIN_KEY.encode()).hexdigest()


@pytest.fixture(autouse=True)
def seed_admin_key():
    """Insert a test admin API key into the DB before each test."""
    db = TestSessionLocal()
    try:
        from app.admin.models import AdminApiKey
        db.add(AdminApiKey(key_hash=VALID_KEY_HASH, label="test-key"))
        db.commit()
    finally:
        db.close()


def admin_headers():
    return {"X-Admin-Key": VALID_ADMIN_KEY}


# ── Auth tests ─────────────────────────────────────────────────────────────

def test_no_key_returns_403(client):
    resp = client.get("/api/admin/health")
    assert resp.status_code == 422  # missing required header


def test_wrong_key_returns_403(client):
    resp = client.get("/api/admin/health", headers={"X-Admin-Key": "adm_wrong_key"})
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Invalid admin key"


def test_valid_key_health_200(client):
    resp = client.get("/api/admin/health", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "db_users" in data
    assert "timestamp" in data


# ── Stats tests ────────────────────────────────────────────────────────────

def test_stats_returns_valid_schema(client):
    resp = client.get("/api/admin/stats", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert "total_users" in data
    assert "verified_users" in data
    assert "pro_users" in data
    assert "free_users" in data
    assert "total_events" in data
    assert "total_expenses" in data
    assert "feedback_by_category" in data
    assert "total_estimated_cost_usd" in data
    assert isinstance(data["feedback_by_category"], dict)


def test_stats_counts_users(client):
    # Create a user first
    create_user(client, "admin_test_user", "admin_test@example.com")
    resp = client.get("/api/admin/stats", headers=admin_headers())
    assert resp.status_code == 200
    assert resp.json()["total_users"] >= 1


# ── Users list tests ──────────────────────────────────────────────────────

def test_users_list_returns_pagination(client):
    resp = client.get("/api/admin/users", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert "pages" in data
    assert isinstance(data["users"], list)


def test_users_list_with_search(client):
    create_user(client, "searchme", "searchme@example.com")
    resp = client.get("/api/admin/users?search=searchme", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any(u["username"] == "searchme" for u in data["users"])


def test_users_list_with_plan_filter(client):
    create_user(client, "freeuser", "freeuser@example.com")
    resp = client.get("/api/admin/users?plan=free", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert all(u["plan"] == "free" for u in data["users"])


def test_users_list_pagination(client):
    # Create a few users
    for i in range(3):
        create_user(client, f"pageuser{i}", f"pageuser{i}@example.com")
    resp = client.get("/api/admin/users?page=1&per_page=2", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["users"]) <= 2
    assert data["per_page"] == 2


# ── User detail tests ────────────────────────────────────────────────────

def test_user_detail_not_found(client):
    resp = client.get("/api/admin/users/99999", headers=admin_headers())
    assert resp.status_code == 404


def test_user_detail_returns_data(client):
    create_user(client, "detailuser", "detailuser@example.com")
    # Get user id from list
    resp = client.get("/api/admin/users?search=detailuser", headers=admin_headers())
    user_id = resp.json()["users"][0]["id"]

    resp = client.get(f"/api/admin/users/{user_id}", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "detailuser"
    assert "recent_expenses" in data
    assert "recent_events" in data
    assert "achievements_count" in data


# ── Feedback tests ────────────────────────────────────────────────────────

def test_feedback_list_returns_pagination(client):
    resp = client.get("/api/admin/feedback", headers=admin_headers())
    assert resp.status_code == 200
    data = resp.json()
    assert "feedback" in data
    assert "total" in data
    assert isinstance(data["feedback"], list)


# ── AI cost estimation ───────────────────────────────────────────────────

def test_estimate_user_cost():
    from app.admin.service import estimate_user_cost
    # 0 calls = 0 cost
    assert estimate_user_cost(0, 0) == 0.0
    # Some voice calls should produce a positive cost
    cost = estimate_user_cost(100, 50)
    assert cost > 0
    # Receipt scans are free (Tesseract)
    assert estimate_user_cost(0, 1000) == 0.0
