import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

TEST_USERNAME = "User1"
TEST_PASSWORD = "password1"

@pytest.fixture
def creds():
    return {"username": TEST_USERNAME, "password": TEST_PASSWORD}

@pytest.fixture
def user(db, creds):
    User = get_user_model()
    return User.objects.create_user(username=creds["username"], password=creds["password"])

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client, user, creds):
    # login and attach bearer token
    r = api_client.post("/api/auth/login/", creds, format="json")
    assert r.status_code == 200, r.data
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return api_client