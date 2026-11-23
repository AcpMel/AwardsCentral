
from rest_framework.routers import DefaultRouter
from .views import ProductCustomizationViewSet

router = DefaultRouter()

router.register(
    r"",
    ProductCustomizationViewSet,
    basename="product-customizations"
)

urlpatterns = router.urls
