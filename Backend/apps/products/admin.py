
from django.contrib import admin

from .models import Product, ProductSale, ProductCategory


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "category_name",
        "slug",
        "created_at",
    ]

    search_fields = [
        "category_name",
        "description",
    ]

    prepopulated_fields = {
        "slug": ("category_name",),
    }


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product_name",
        "product_type",
        "price",
        "stocks",
        "is_import",
        "is_best_seller",
        "is_customizable",
        "created_at",
    ]

    list_filter = [
        "product_type",
        "categories",
        "is_import",
        "is_best_seller",
        "is_customizable",
        "created_at",
    ]

    search_fields = [
        "product_name",
        "product_description",
    ]

    list_editable = [
        "stocks",
        "is_best_seller",
    ]

    filter_horizontal = [
        "categories",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-created_at",
    ]


@admin.register(ProductSale)
class ProductSaleAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "quantity",
        "status",
        "sold_at",
    ]

    list_filter = [
        "status",
        "sold_at",
    ]

    search_fields = [
        "product__product_name",
    ]

    readonly_fields = [
        "sold_at",
    ]
