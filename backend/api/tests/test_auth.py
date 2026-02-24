import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_login_and_me_ok():
    User = get_user_model()
    User.objects.create_user(username="User1", password="password1")

    client = APIClient()

    # Force JSON by setting content_type explicitly (works even if format is ignored)
    r = client.post(
        "/api/auth/login/",
        {"username": "User1", "password": "password1"},
        format="json",
    )

    assert r.status_code == 200, r.data  # show response details if it fails
    access = r.data["access"]

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    r2 = client.get("/api/me/")
    assert r2.status_code == 200
    assert r2.data["username"] == "User1"