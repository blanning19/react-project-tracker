from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Optional .env loading for local dev (keep .env out of git)
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(BASE_DIR / ".env", override=True)
except Exception:
    pass


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"

ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

# When using cookie-based refresh (best-practice option), CORS credentials + CSRF become relevant.
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

    # Enable if you use refresh-token rotation/blacklisting (recommended when JWT is used)
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

ROOT_URLCONF = "crud.urls"

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

WSGI_APPLICATION = "crud.wsgi.application"


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
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# DRF defaults (pagination + JWT)
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": int(os.getenv("DRF_PAGE_SIZE", "50")),
}

# SimpleJWT hardening defaults (rotation + blacklist)
SIMPLE_JWT = {
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    # Tune these to your needs
    "ACCESS_TOKEN_LIFETIME": int(os.getenv("JWT_ACCESS_MINUTES", "10")),  # minutes
    "REFRESH_TOKEN_LIFETIME": int(os.getenv("JWT_REFRESH_DAYS", "7")),    # days
    "SIGNING_KEY": os.environ.get("DJANGO_JWT_SIGNING_KEY", SECRET_KEY),
}

# NOTE: Django expects timedelta objects for lifetimes; we convert below.
from datetime import timedelta  # noqa: E402
SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"] = timedelta(minutes=SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"])
SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"] = timedelta(days=SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"])


# CORS
# Comma-separated list. Examples:
#   http://localhost:5173,http://localhost:3000
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
CORS_ALLOW_CREDENTIALS = AUTH_REFRESH_COOKIE_ENABLED

# When using cookie auth, you must configure CSRF trusted origins (scheme + host + optional port)
CSRF_TRUSTED_ORIGINS = [o.strip() for o in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()]


# Production security (only when DEBUG is off)
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "1") == "1"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
