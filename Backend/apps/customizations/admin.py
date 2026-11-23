
from django.contrib import admin
from .models import ProductCustomization


@admin.register(ProductCustomization)
class ProductCustomizationAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "customization_name",
        "product",
        "user",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "customization_name",
        "product__product_name",
        "user__email",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )
