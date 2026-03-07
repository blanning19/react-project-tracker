import pytest
from django.core.cache import cache
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView


@pytest.mark.throttle_test
@pytest.mark.django_db
class TestLoginThrottle:
    """
    Verifies that the login endpoint rate-limits excessive requests.

    Marked with @pytest.mark.throttle_test so the global disable_throttling
    fixture in conftest.py skips this class.

    DRF reads throttle_classes from the view instance rather than from
    settings at request time, so we patch the view directly rather than
    relying on settings overrides which DRF may not pick up dynamically.
    """

    LOGIN_URL = "/api/auth/login/"
    BAD_CREDS = {"username": "nobody", "password": "wrongpassword"}

    def _post(self, api_client):
        return api_client.post(self.LOGIN_URL, self.BAD_CREDS, format="json")

    @pytest.fixture(autouse=True)
    def override_throttle(self, settings):
        """
        Patches the login view's throttle_classes directly and uses a real
        in-memory cache so throttle counts actually accumulate.

        Clears the cache before each test so counts from a previous test
        in this class do not carry over.
        """
        # Use a real cache backend so throttle counts are tracked
        settings.CACHES = {
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            }
        }

        # Set a low rate so we only need 5 requests to trigger throttling
        settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["anon"] = "5/min"

        # Patch the throttle class directly onto the view so DRF sees it
        # immediately without relying on settings being re-read at request time
        original_throttle_classes = TokenObtainPairView.throttle_classes
        TokenObtainPairView.throttle_classes = [AnonRateThrottle]

        # Clear any leftover throttle counts from previous tests
        cache.clear()

        yield

        # Restore original state after the test
        TokenObtainPairView.throttle_classes = original_throttle_classes
        cache.clear()

    def test_requests_below_limit_are_allowed(self, api_client):
        """First 5 requests should get through (401 = bad creds, not throttled)."""
        for _ in range(5):
            response = self._post(api_client)
            assert response.status_code == 401, (
                f"Expected 401 (bad credentials), got {response.status_code}"
            )

    def test_request_over_limit_is_throttled(self, api_client):
        """The 6th request should be blocked with 429."""
        for _ in range(5):
            self._post(api_client)

        response = self._post(api_client)
        assert response.status_code == 429, (
            f"Expected 429 (throttled), got {response.status_code}"
        )

    def test_throttle_response_has_retry_after_header(self, api_client):
        """429 response should include Retry-After so clients know when to retry."""
        for _ in range(5):
            self._post(api_client)

        response = self._post(api_client)
        assert response.status_code == 429
        assert "Retry-After" in response, (
            "Throttled response should include a Retry-After header"
        )