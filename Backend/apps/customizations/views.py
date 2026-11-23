
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ProductCustomization
from .serializers import ProductCustomizationSerializer


class ProductCustomizationViewSet(viewsets.ModelViewSet):

    serializer_class = ProductCustomizationSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_queryset(self):
        return (
            ProductCustomization.objects
            .filter(user=self.request.user)
            .select_related("product")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        customization = self.get_object()

        customization.status = (
            ProductCustomization.CustomizationStatus.SUBMITTED
        )

        customization.save(update_fields=["status", "updated_at"])

        serializer = self.get_serializer(customization)

        return Response(
            {
                "message": "Customization submitted successfully.",
                "customization": serializer.data,
            },
            status=status.HTTP_200_OK
        )
