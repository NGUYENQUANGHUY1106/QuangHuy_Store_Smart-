import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env", override=False)


def required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ImproperlyConfigured(f"Missing required environment variable: {name}")
    return value


def env_list(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


SECRET_KEY = required("DJANGO_SECRET_KEY")
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")
if not DEBUG and (len(SECRET_KEY) < 50 or not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS):
    raise ImproperlyConfigured(
        "Non-debug settings require a strong key and explicit hosts"
    )

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "apps.identity",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": required("POSTGRES_DB"),
        "USER": required("POSTGRES_USER"),
        "PASSWORD": required("POSTGRES_PASSWORD"),
        "HOST": required("POSTGRES_HOST"),
        "PORT": required("POSTGRES_PORT"),
        "OPTIONS": {
            "connect_timeout": 5,
            "sslmode": os.getenv("POSTGRES_SSLMODE", "prefer"),
        },
    }
}
AUTH_USER_MODEL = "identity.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{name}"}
    for name in (
        "UserAttributeSimilarityValidator",
        "MinimumLengthValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    )
]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication"
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env_list("DJANGO_CORS_ALLOWED_ORIGINS")
CORS_ALLOW_CREDENTIALS = bool(CORS_ALLOWED_ORIGINS)
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 12 * 60 * 60
SESSION_SAVE_EVERY_REQUEST = False
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = "Lax"
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
APPEND_SLASH = False
LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
