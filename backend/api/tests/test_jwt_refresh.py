# api/tests/test_jwt_refresh.py
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_refresh_returns_new_access(user, creds):
    client = APIClient()
    login = client.post("/api/auth/login/", creds, format="json")
    assert login.status_code == 200, getattr(login, "data", None)

    refresh = login.data["refresh"]
    r = client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
    assert r.status_code == 200, getattr(r, "data", None)
    assert "access" in r.data


@pytest.mark.django_db
def test_refresh_rejects_bad_token():
    client = APIClient()
    r = client.post("/api/auth/refresh/", {"refresh": "not-a-real-token"}, format="json")
    assert r.status_code in (400, 401)