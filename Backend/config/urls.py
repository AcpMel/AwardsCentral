
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication APIs
    path("api/auth/", include("apps.accounts.urls")),

    # Product, Category, and Sales APIs
    path("api/", include("apps.products.urls")),

    # Customizations APIs
    path("api/customizations/", include("apps.customizations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
