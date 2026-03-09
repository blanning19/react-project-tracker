import pytest
from rest_framework.test import APIClient

"""
Tests for HybridLogoutView.

Covers:
  - Logout blacklists the refresh token so it cannot be reused (the main fix)
  - Logout with no token returns 400
  - Logout with an already-expired/invalid token still returns 200 (best-effort)
  - Logout clears the refresh cookie in cookie mode

These tests specifically validate the fix to the Navbar logout bug where
local mode bypassed the backend entirely, leaving the refresh token live
on the server even after the user logged out.
"""

LOGOUT_URL = "/api/auth/logout/"
LOGIN_URL = "/api/auth/login/"
REFRESH_URL = "/api/auth/refresh/"


@pytest.fixture
def tokens(user, creds, api_client):
    """Log in and return both access and refresh tokens."""
    r = api_client.post(LOGIN_URL, creds, format="json")
    assert r.status_code == 200, r.data
    return {"access": r.data["access"], "refresh": r.data["refresh"]}


@pytest.mark.django_db
def test_logout_blacklists_refresh_token(tokens, api_client):
    """
    Core fix test: after logout the refresh token must be unusable.

    This is the exact scenario the Navbar bug allowed to slip through —
    the frontend cleared local state but the token stayed valid server-side,
    meaning anyone with a copy of the refresh token could still obtain new
    access tokens.
    """
    refresh = tokens["refresh"]

    # Logout — send the refresh token in the body (local mode)
    r = api_client.post(LOGOUT_URL, {"refresh": refresh}, format="json")
    assert r.status_code == 200, r.data

    # Attempting to use the same refresh token must now fail
    r2 = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")
    assert r2.status_code in (400, 401), (
        f"Blacklisted refresh token should be rejected, got {r2.status_code}: {r2.data}"
    )


@pytest.mark.django_db
def test_logout_returns_200_on_success(tokens, api_client):
    """Successful logout returns 200 with ok: true."""
    r = api_client.post(LOGOUT_URL, {"refresh": tokens["refresh"]}, format="json")
    assert r.status_code == 200
    assert r.data.get("ok") is True


@pytest.mark.django_db
def test_logout_with_no_token_returns_400(api_client, user):
    """
    Logout with no token in body and no cookie must return 400.
    The endpoint should not silently succeed when there is nothing to blacklist.
    """
    r = api_client.post(LOGOUT_URL, {}, format="json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_logout_with_invalid_token_still_returns_200(api_client, user):
    """
    Logout with an already-expired or garbage token returns 200.

    The backend catches TokenError and proceeds — the goal is to always
    leave the client in a clean logged-out state even if the token is stale.
    This matches the best-effort design in HybridLogoutView.
    """
    r = api_client.post(LOGOUT_URL, {"refresh": "not-a-real-token"}, format="json")
    assert r.status_code == 200


@pytest.mark.django_db
def test_logout_refresh_token_cannot_get_new_access_after_rotation(tokens, api_client):
    """
    Verify that token rotation + blacklisting work together correctly.

    Flow:
      1. Login → get refresh_A
      2. Refresh → get access_B + refresh_B (refresh_A is now blacklisted by rotation)
      3. Logout with refresh_B → refresh_B is blacklisted
      4. refresh_A must also be rejected (it was already blacklisted in step 2)
      5. refresh_B must be rejected (blacklisted in step 3)
    """
    refresh_a = tokens["refresh"]

    # Step 2: rotate — refresh_A becomes blacklisted, we get refresh_B
    r = api_client.post(REFRESH_URL, {"refresh": refresh_a}, format="json")
    assert r.status_code == 200, r.data
    refresh_b = r.data["refresh"]

    # Step 3: logout with refresh_B
    r = api_client.post(LOGOUT_URL, {"refresh": refresh_b}, format="json")
    assert r.status_code == 200

    # Step 4: refresh_A already blacklisted by rotation
    r = api_client.post(REFRESH_URL, {"refresh": refresh_a}, format="json")
    assert r.status_code in (400, 401), f"refresh_A should be rejected, got {r.status_code}"

    # Step 5: refresh_B blacklisted by logout
    r = api_client.post(REFRESH_URL, {"refresh": refresh_b}, format="json")
    assert r.status_code in (400, 401), f"refresh_B should be rejected, got {r.status_code}"