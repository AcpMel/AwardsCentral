
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer,
    CustomerProfileSerializer,
    CustomerAccountListSerializer,
)

User = get_user_model()


# CUSTOMER REGISTRATION
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


# CUSTOMER / ADMIN LOGIN
class CustomerLoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    authentication_classes = []


# CUSTOMER / ADMIN PROFILE
class CustomerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# CHANGE PASSWORD SERIALIZER
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        trim_whitespace=False
    )

    def validate_current_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Your current password is incorrect."
            )

        return value

    def validate_new_password(self, value):
        user = self.context["request"].user

        try:
            password_validation.validate_password(value, user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages)

        return value


# CHANGE PASSWORD
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)

        request.user.set_password(
            serializer.validated_data["new_password"]
        )

        request.user.save(update_fields=["password"])

        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK
        )


# CUSTOMER ACCOUNT LIST - ADMIN ONLY
class CustomerAccountListView(generics.ListAPIView):
    serializer_class = CustomerAccountListSerializer
    permission_classes = [IsAdminUser]

    queryset = User.objects.all().order_by("-date_joined")
