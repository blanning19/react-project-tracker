import os

from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def _cookie_settings():
    return {
        "httponly": True,
        "secure": not settings.DEBUG,
        "samesite": os.getenv("JWT_COOKIE_SAMESITE", "Lax"),
        "path": "/api/auth/",
    }


class HybridTokenObtainPairView(TokenObtainPairView):
    """Login endpoint.

    Always returns {access, refresh} in the JSON response.
    If DJANGO_AUTH_REFRESH_COOKIE=1, also sets the refresh token as an HttpOnly cookie.
    """

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        if getattr(settings, "AUTH_REFRESH_COOKIE_ENABLED", False) and isinstance(response.data, dict):
            refresh = response.data.get("refresh")
            if refresh:
                response.set_cookie(
                    "refresh_token",
                    refresh,
                    **_cookie_settings(),
                )
                # In cookie mode, you may choose NOT to return refresh in the body.
                # Keeping it for backward compatibility; frontend can ignore it.
        return response


class HybridTokenRefreshView(TokenRefreshView):
    """Refresh endpoint.

    Supports two modes:
      - Body mode (default): expects {"refresh": "..."} in the request body.
      - Cookie mode: if "refresh" is missing, uses HttpOnly cookie "refresh_token".
    """

    def post(self, request, *args, **kwargs):
        if getattr(settings, "AUTH_REFRESH_COOKIE_ENABLED", False) and "refresh" not in request.data:
            cookie_refresh = request.COOKIES.get("refresh_token")
            if cookie_refresh:
                request.data["refresh"] = cookie_refresh

        response = super().post(request, *args, **kwargs)

        # If rotation is enabled and the response contains a new refresh token, update the cookie.
        if getattr(settings, "AUTH_REFRESH_COOKIE_ENABLED", False) and isinstance(response.data, dict):
            new_refresh = response.data.get("refresh")
            if new_refresh:
                response.set_cookie("refresh_token", new_refresh, **_cookie_settings())

        return response


class HybridLogoutView(TokenRefreshView):
    """Optional logout helper: clears refresh cookie."""

    def post(self, request, *args, **kwargs):
        res = Response({"ok": True})
        res.delete_cookie("refresh_token", path="/api/auth/")
        return res
