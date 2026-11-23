
from rest_framework.permissions import BasePermission, SAFE_METHODS


class ProductPermission(BasePermission):

    def has_permission(self, request, view):

        # Allow public access to GET, HEAD, and OPTIONS
        if request.method in SAFE_METHODS:
            return True

        # Only administrators can modify products
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )
