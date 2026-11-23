
import json

from rest_framework import serializers

from apps.products.models import Product
from .models import ProductCustomization


class ProductCustomizationSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.product_name",
        read_only=True
    )

    def to_internal_value(self, data):
        # Multipart requests send JSON fields as strings.
        # Convert design_data into a Python dictionary.
        if hasattr(data, "get"):
            design_data = data.get("design_data")

            if isinstance(design_data, str):
                try:
                    parsed_data = json.loads(design_data)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({
                        "design_data": "Invalid JSON format."
                    })

                data = data.copy()
                data["design_data"] = parsed_data

        return super().to_internal_value(data)

    class Meta:
        model = ProductCustomization

        fields = [
            "id",
            "product",
            "product_name",
            "customization_name",
            "design_data",
            "logo_file",
            "preview_image",
            "svg_file",
            "pdf_file",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "product_name",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate_product(self, product):
        if not product.is_customizable:
            raise serializers.ValidationError(
                "This product does not support customization."
            )

        return product

    def validate(self, attrs):
        # Prevent customers from changing the product of an
        # existing customization to a non-customizable product.
        product = attrs.get(
            "product",
            getattr(self.instance, "product", None)
        )

        if product and not product.is_customizable:
            raise serializers.ValidationError({
                "product": "This product does not support customization."
            })

        return attrs

    def validate_logo_file(self, file):
        if file and file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "Logo file must not exceed 10 MB."
            )

        return file

    def validate_preview_image(self, file):
        if file and file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "Preview image must not exceed 10 MB."
            )

        return file

    def validate_svg_file(self, file):
        if file and file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "SVG file must not exceed 10 MB."
            )

        return file

    def validate_pdf_file(self, file):
        if file and file.size > 20 * 1024 * 1024:
            raise serializers.ValidationError(
                "PDF file must not exceed 20 MB."
            )

        return file
