
"""
Django settings for config project.
"""

import os
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured


# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the project's root .env file
load_dotenv(BASE_DIR / ".env")


# =====================================================
# SECURITY SETTINGS
# =====================================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ImproperlyConfigured(
        "SECRET_KEY is missing. Please configure it in your .env file."
    )

DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1"
    ).split(",")
    if host.strip()
]


# =====================================================
# APPLICATION DEFINITION
# =====================================================

INSTALLED_APPS = [
    # Django apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party apps
    "corsheaders",
    "rest_framework",

    # Local apps
    "apps.accounts",
    "apps.products",
    "apps.customizations",
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
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# =====================================================
# DATABASE CONFIGURATION
# =====================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}


# =====================================================
# PASSWORD VALIDATION
# =====================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# =====================================================
# INTERNATIONALIZATION
# =====================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# =====================================================
# STATIC FILES
# =====================================================

STATIC_URL = "static/"


# =====================================================
# EMAIL CONFIGURATION
# =====================================================

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}


# =====================================================
# CUSTOM USER MODEL
# =====================================================

AUTH_USER_MODEL = "accounts.User"


# =====================================================
# DJANGO REST FRAMEWORK
# =====================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 20,
}


# =====================================================
# JWT CONFIGURATION
# =====================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# =====================================================
# MEDIA FILE CONFIGURATION
# =====================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# =====================================================
# CORS CONFIGURATION
# =====================================================

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
