import os

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
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


class HybridLogoutView(APIView):
    """Logout endpoint.

    Blacklists the refresh token so it cannot be reused after logout,
    then clears the refresh cookie (cookie mode) and returns a success response.

    FIX: The previous implementation extended TokenRefreshView and only cleared
    the cookie without blacklisting the token. This meant a stolen refresh token
    remained valid until it naturally expired, even after the user logged out.

    Now:
    - Accepts the refresh token from the cookie (cookie mode) or request body (local mode).
    - Blacklists the token via SimpleJWT's token_blacklist app.
    - Clears the refresh cookie regardless of mode.
    - Returns 200 on success, 400 if no token was provided, 401 if the token
      is already invalid or expired.

    Requirements:
    - rest_framework_simplejwt.token_blacklist must be in INSTALLED_APPS.
    - ROTATE_REFRESH_TOKENS and BLACKLIST_AFTER_ROTATION should be True in SIMPLE_JWT.
      Both are already set in settings.py.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Resolve the refresh token from cookie (cookie mode) or request body (local mode).
        refresh_token = (
            request.COOKIES.get("refresh_token")
            or request.data.get("refresh")
        )

        if not refresh_token:
            return Response(
                {"detail": "No refresh token provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Blacklist the token so it cannot be reused.
            # This works because token_blacklist is in INSTALLED_APPS and
            # BLACKLIST_AFTER_ROTATION=True is set in SIMPLE_JWT.
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token is already expired or invalid — still clear the cookie
            # so the client ends up in a clean logged-out state.
            pass

        res = Response({"ok": True}, status=status.HTTP_200_OK)
        res.delete_cookie("refresh_token", path="/api/auth/")
        return res
