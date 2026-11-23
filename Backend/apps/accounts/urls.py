
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CustomerLoginView,
    CustomerProfileView,
    ChangePasswordView,
    CustomerAccountListView,
)

urlpatterns = [
    path("signup/", RegisterView.as_view(), name="signup"),
    path("login/", CustomerLoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", CustomerProfileView.as_view(), name="profile"),
    path("profiles/", CustomerAccountListView.as_view(), name="profiles"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
