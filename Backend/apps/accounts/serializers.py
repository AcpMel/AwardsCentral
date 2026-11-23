
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False
    )

    password_confirm = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone_number",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        email = value.strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return email

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError({
                "password_confirm": "Passwords do not match."
            })

        try:
            validate_password(password)
        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "password": error.messages
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        # Never grant administrative privileges during registration.
        return User.objects.create_user(
            password=password,
            is_staff=False,
            is_superuser=False,
            is_active=True,
            **validated_data
        )


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = [
            "id",
            "email",
            "is_staff",
            "is_superuser",
        ]

class CustomerAccountListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = fields
