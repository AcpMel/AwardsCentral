
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    ProductSaleViewSet,
    ProductCategoryViewSet,
)

router = DefaultRouter()

# Categories API
router.register(
    r"categories",
    ProductCategoryViewSet,
    basename="product-categories"
)

# Sales API
router.register(
    r"sales",
    ProductSaleViewSet,
    basename="product-sales"
)

# Products API
router.register(
    r"products",
    ProductViewSet,
    basename="products"
)

urlpatterns = router.urls
