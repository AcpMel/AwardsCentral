
from rest_framework import serializers

from .models import Product, ProductSale, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = [
            "id",
            "category_name",
            "slug",
            "description",
            "parent",
            "created_at",
            "children",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "children",
        ]

    def get_children(self, obj):
        children = obj.children.all().order_by("category_name")

        return ProductCategorySerializer(
            children,
            many=True,
            context=self.context,
        ).data


class ProductSerializer(serializers.ModelSerializer):
    categories = ProductCategorySerializer(
        many=True,
        read_only=True,
    )

    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(),
        many=True,
        source="categories",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "product_name",
            "product_description",
            "stocks",
            "meta_description",
            "product_image",
            "product_glb",
            "price",
            "product_type",
            "categories",
            "category_ids",
            "is_import",
            "is_best_seller",
            "is_customizable",
            "is_deleted",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "is_deleted",
            "created_at",
            "updated_at",
        ]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Product price cannot be negative."
            )

        return value

    def validate_product_glb(self, value):
        if value and not value.name.lower().endswith(".glb"):
            raise serializers.ValidationError(
                "Only .glb files are allowed."
            )

        return value


class ProductSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.product_name",
        read_only=True,
    )

    class Meta:
        model = ProductSale
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "status",
            "sold_at",
        ]

        read_only_fields = [
            "id",
            "sold_at",
        ]


class ProductMovementSerializer(ProductSerializer):
    units_sold = serializers.IntegerField(read_only=True)
    movement_status = serializers.CharField(read_only=True)
    sales_period_days = serializers.IntegerField(read_only=True)
