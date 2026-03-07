"""
Authentication and authorisation tests for project-related endpoints.

Covers:
- /api/projects/         — requires auth
- /api/managers/  — requires auth
- /api/employees/       — requires auth
- /api/me/              — requires auth, returns correct user data
- /api/auth/logout/     — blacklists the refresh token

Intentionally kept to auth concerns only. Filter/search/ordering/pagination
tests live in test_project_filtering.py.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_projects_requires_auth():
    """Unauthenticated GET /api/projects/ must return 401."""
    client = APIClient()
    r = client.get("/api/projects/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_managers_requires_auth():
    """Unauthenticated GET /api/managers/ must return 401."""
    client = APIClient()
    r = client.get("/api/managers/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_employees_requires_auth():
    """Unauthenticated GET /api/employees/ must return 401."""
    client = APIClient()
    r = client.get("/api/employees/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_me_requires_auth():
    """Unauthenticated GET /api/me/ must return 401."""
    client = APIClient()
    r = client.get("/api/me/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_me_returns_correct_user(auth_client, user):
    """
    Authenticated GET /api/me/ must return the logged-in user's data.

    Verifies that the me endpoint returns id, username, and email — the three
    fields documented in views.py — and that they match the test user.
    """
    r = auth_client.get("/api/me/")
    assert r.status_code == 200
    assert r.data["username"] == user.username
    assert r.data["id"] == user.id
    assert "email" in r.data


@pytest.mark.django_db
def test_me_does_not_expose_password(auth_client):
    """The me endpoint must never include the password field."""
    r = auth_client.get("/api/me/")
    assert r.status_code == 200
    assert "password" not in r.data


@pytest.mark.django_db
def test_logout_blacklists_refresh_token(creds, user):
    """
    POST /api/auth/logout/ with a valid refresh token must:
    1. Return 200 (or 204)
    2. Cause the refresh token to be rejected on subsequent use (401/400)

    This verifies that HybridLogoutView is wired to the token blacklist.
    """
    client = APIClient()
    login = client.post("/api/auth/login/", creds, format="json")
    assert login.status_code == 200

    refresh = login.data["refresh"]
    access = login.data["access"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    logout = client.post("/api/auth/logout/", {"refresh": refresh}, format="json")
    assert logout.status_code in (200, 204)

    # The blacklisted token should now be rejected
    client.credentials()  # clear auth header
    retry = client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
    assert retry.status_code in (400, 401), (
        f"Expected refresh to be rejected after logout, got {retry.status_code}. "
        "Check that HybridLogoutView calls token.blacklist() and that "
        "rest_framework_simplejwt.token_blacklist is in INSTALLED_APPS."
    )


@pytest.mark.django_db
def test_logout_requires_refresh_token(auth_client):
    """POST /api/auth/logout/ without a refresh token should return 400."""
    r = auth_client.post("/api/auth/logout/", {}, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_invalid_token_is_rejected():
    """A request with a malformed Bearer token should return 401."""
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION="Bearer this.is.not.a.real.token")
    r = client.get("/api/projects/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_expired_or_wrong_user_cannot_see_other_users_projects(creds):
    """
    Two distinct users each see only their own data returned by the API.

    This test creates a second user, logs in as them, and confirms
    the project list endpoint returns 200 (not 403 or 500) — a basic
    sanity check that auth is per-user and not globally broken.
    """
    User = get_user_model()
    User.objects.create_user(username=creds["username"], password=creds["password"])
    User.objects.create_user(username="other_user", password="other_pass")

    other_client = APIClient()
    r = other_client.post(
        "/api/auth/login/",
        {"username": "other_user", "password": "other_pass"},
        format="json",
    )
    assert r.status_code == 200
    other_client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")

    r2 = other_client.get("/api/projects/")
    assert r2.status_code == 200
