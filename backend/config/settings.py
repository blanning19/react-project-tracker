from datetime import timedelta
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Optional .env loading for local dev (keep .env out of git)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(BASE_DIR / ".env", override=True)
except Exception:
    pass


DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"

# SECURITY: In production, SECRET_KEY must be explicitly set via environment variable.
# Failing loudly on startup is far safer than running with a weak default key.
# In development (DEBUG=True), fall back to a placeholder so local setup stays easy.
if DEBUG:
    SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")
else:
    _secret = os.getenv("DJANGO_SECRET_KEY")
    if not _secret:
        raise RuntimeError(
            "DJANGO_SECRET_KEY environment variable is not set. "
            "This is required in production. Set it to a long random string."
        )
    SECRET_KEY = _secret

ALLOWED_HOSTS = [
    h.strip()
    for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]

AUTH_REFRESH_COOKIE_ENABLED = os.getenv("DJANGO_AUTH_REFRESH_COOKIE", "0") == "1"


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",
    "django_filters",

    # Required for refresh token blacklisting (used by HybridLogoutView)
    "rest_framework_simplejwt.token_blacklist",

    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database (PostgreSQL only)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "myappdb"),
        "USER": os.getenv("POSTGRES_USER", "postgres"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": int(os.getenv("POSTGRES_CONN_MAX_AGE", "60")),
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True


STATIC_URL = "static/"

# STATIC_ROOT is required by collectstatic in production.
# `python manage.py collectstatic` will copy all static files here,
# and your web server (nginx/gunicorn) should serve from this directory.
STATIC_ROOT = BASE_DIR / "staticfiles"

# MEDIA_ROOT stores user-uploaded files (not currently used, but set explicitly
# so any future file upload feature has a correct base path from the start).
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "api.pagination.ProjectPagination",
    "PAGE_SIZE": int(os.getenv("DRF_PAGE_SIZE", "50")),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("THROTTLE_ANON_RATE", "20/min"),
        "user": os.getenv("THROTTLE_USER_RATE", "200/min"),
    },
}

_jwt_signing_key = os.environ.get("DJANGO_JWT_SIGNING_KEY")
if not DEBUG and not _jwt_signing_key:
    raise RuntimeError(
        "DJANGO_JWT_SIGNING_KEY environment variable is not set. "
        "Set it to a separate secret from DJANGO_SECRET_KEY for production use."
    )

SIMPLE_JWT = {
    # Token lifetimes are set explicitly here so they are visible and auditable.
    # The defaults (5 min access, 1 day refresh) are reasonable but should not
    # be left implicit — a future reader should not have to look up SimpleJWT
    # docs to know how long tokens live in this application.
    #
    # Access token: short-lived. The frontend stores this in memory + sessionStorage.
    # Keeping this ≤ 15 minutes limits exposure if a token is somehow leaked,
    # since it will expire quickly without any server-side action needed.
    #
    # Refresh token: 1 day. Stored in localStorage (local mode) or HttpOnly
    # cookie (cookie mode). Rotation + blacklisting are both enabled, so a
    # stolen refresh token can only be used once before it is invalidated.
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TTL_MINUTES", "15"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_TTL_DAYS", "1"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "SIGNING_KEY": _jwt_signing_key or SECRET_KEY,
}

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if o.strip()
]


# Production security settings — only applied when DEBUG is off.
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "1") == "1"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"