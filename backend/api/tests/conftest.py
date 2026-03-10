import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
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
    r = api_client.post("/api/auth/login/", creds, format="json")
    assert r.status_code == 200, r.data
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    return api_client


@pytest.fixture(autouse=True)
def disable_throttling(request, settings):
    """
    Disables DRF throttling for all tests except those marked with
    @pytest.mark.throttle_test.

    Also clears the cache before each non-throttle test so that any
    throttle counts accumulated by a previous throttle_test run do not
    bleed through and cause spurious 429s.
    """
    if request.node.get_closest_marker("throttle_test"):
        return

    # Clear any throttle counts left by a previous test
    cache.clear()

    # Disable throttling via settings
    settings.REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []

    # Also reset the view-level patch in case a throttle test left it set.
    # Import here to avoid circular imports at module load time.
    from rest_framework_simplejwt.views import TokenObtainPairView
    TokenObtainPairView.throttle_classes = []