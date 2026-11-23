
from datetime import timedelta
from statistics import median

from django.db.models import Sum, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAdminUser, AllowAny

from .models import Product, ProductSale, ProductCategory
from .serializers import (
    ProductSerializer,
    ProductSaleSerializer,
    ProductMovementSerializer,
    ProductCategorySerializer,
)
from .permissions import ProductPermission


SALES_PERIOD_DAYS = 30


# ==========================================
# PRODUCT CATEGORY VIEWSET
# ==========================================

class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [ProductPermission]

    filter_backends = [SearchFilter, OrderingFilter]

    search_fields = [
        "category_name",
        "description",
    ]

    ordering_fields = [
        "category_name",
        "created_at",
    ]

    ordering = ["category_name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "tree"]:
            return [AllowAny()]

        return [IsAdminUser()]

    @action(
        detail=False,
        methods=["get"],
        url_path="tree",
        permission_classes=[AllowAny],
        authentication_classes=[],
    )
    def tree(self, request):
        categories = ProductCategory.objects.filter(
            parent__isnull=True
        ).order_by("category_name")

        serializer = self.get_serializer(
            categories,
            many=True,
        )

        return Response(serializer.data)


# ==========================================
# PRODUCT VIEWSET
# ==========================================

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [ProductPermission]

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        "product_name",
        "product_description",
        "product_type",
        "categories__category_name",
    ]

    ordering_fields = [
        "price",
        "created_at",
        "product_name",
        "stocks",
    ]

    ordering = ["-created_at"]

    def get_permissions(self):
        # Only staff administrators can access deleted products
        # or restore products.
        if self.action in ["deleted", "restore", "destroy"]:
            return [IsAdminUser()]

        return [ProductPermission()]

    def get_queryset(self):
        # Deleted products are available only through
        # the dedicated deleted-products endpoint.
        if self.action == "deleted":
            queryset = Product.objects.filter(
                is_deleted=True
            )
        else:
            queryset = Product.objects.filter(
                is_deleted=False
            )

        queryset = queryset.prefetch_related("categories")

        product_type = self.request.query_params.get(
            "product_type"
        )

        is_import = self.request.query_params.get(
            "is_import"
        )

        category = self.request.query_params.get(
            "category"
        )

        category_id = self.request.query_params.get(
            "category_id"
        )

        # PRODUCT TYPE FILTER
        if product_type:
            queryset = queryset.filter(
                product_type__iexact=product_type
            )

        # IMPORT FILTER
        if is_import is not None:
            queryset = queryset.filter(
                is_import=is_import.lower() == "true"
            )

        # CATEGORY FILTER INCLUDING DESCENDANTS
        if category or category_id:
            selected_category = None

            if category:
                selected_category = ProductCategory.objects.filter(
                    slug__iexact=category
                ).first()

            elif category_id:
                selected_category = ProductCategory.objects.filter(
                    id=category_id
                ).first()

            if selected_category:
                category_ids = [selected_category.id]
                parent_ids = [selected_category.id]

                while parent_ids:
                    child_ids = list(
                        ProductCategory.objects.filter(
                            parent_id__in=parent_ids
                        ).values_list("id", flat=True)
                    )

                    category_ids.extend(child_ids)
                    parent_ids = child_ids

                queryset = queryset.filter(
                    categories__id__in=category_ids
                )

            else:
                queryset = queryset.none()

        # STOCK FILTER
        stock_filter = self.request.query_params.get(
            "stock_filter"
        )

        if stock_filter == "in-stock":
            queryset = queryset.filter(
                stocks__gt=0
            )

        elif stock_filter == "out-of-stock":
            queryset = queryset.filter(
                stocks=0
            )

        return queryset.distinct()

    # ==========================================
    # SOFT DELETE
    # ==========================================

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete a product.

        The database record and related sales are preserved.
        """

        product = self.get_object()

        product.is_deleted = True

        product.save(
            update_fields=["is_deleted", "updated_at"]
        )

        return Response(
            {
                "detail": "Product successfully moved to deleted products.",
                "product_id": product.id,
                "product_name": product.product_name,
                "is_deleted": product.is_deleted,
            },
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # DELETED PRODUCTS
    # ==========================================

    @action(
        detail=False,
        methods=["get"],
        url_path="deleted",
        permission_classes=[IsAdminUser],
    )
    def deleted(self, request):
        """
        Return soft-deleted products.

        Supports search, ordering, and pagination.
        """

        queryset = self.filter_queryset(
            self.get_queryset()
        )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(
                page,
                many=True,
                context={"request": request},
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = self.get_serializer(
            queryset,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    # ==========================================
    # RESTORE PRODUCT
    # ==========================================

    @action(
        detail=True,
        methods=["post"],
        url_path="restore",
        permission_classes=[IsAdminUser],
    )
    def restore(self, request, pk=None):
        """
        Restore a soft-deleted product.
        """

        product = get_object_or_404(
            Product.objects.prefetch_related("categories"),
            pk=pk,
            is_deleted=True,
        )

        product.is_deleted = False

        product.save(
            update_fields=["is_deleted", "updated_at"]
        )

        serializer = self.get_serializer(
            product,
            context={"request": request},
        )

        return Response(
            {
                "detail": "Product successfully restored.",
                "product": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    # ==========================================
    # PRODUCT MOVEMENT
    # ==========================================

    def get_products_with_movement(self):
        cutoff_date = timezone.now() - timedelta(
            days=SALES_PERIOD_DAYS
        )

        products = list(
            Product.objects.filter(
                is_deleted=False
            ).prefetch_related("categories").annotate(
                units_sold=Coalesce(
                    Sum(
                        "sales__quantity",
                        filter=Q(
                            sales__status=ProductSale.SaleStatus.CONFIRMED,
                            sales__sold_at__gte=cutoff_date,
                        ),
                    ),
                    Value(0),
                )
            )
        )

        sold_quantities = [
            product.units_sold
            for product in products
            if product.units_sold > 0
        ]

        sales_median = (
            median(sold_quantities)
            if sold_quantities
            else 0
        )

        for product in products:
            if product.units_sold == 0:
                movement = "Non-Moving"

            elif product.units_sold >= sales_median:
                movement = "Fast-Moving"

            else:
                movement = "Slow-Moving"

            product.movement_status = movement
            product.sales_period_days = SALES_PERIOD_DAYS

        return products

    @action(
        detail=False,
        methods=["get"],
        url_path="movement",
    )
    def movement(self, request):
        products = self.get_products_with_movement()

        movement_status = request.query_params.get(
            "movement_status"
        )

        if movement_status:
            products = [
                product
                for product in products
                if product.movement_status.lower()
                == movement_status.lower()
            ]

        serializer = ProductMovementSerializer(
            products,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    # ==========================================
    # BEST SELLERS
    # ==========================================

    @action(
        detail=False,
        methods=["get"],
        url_path="best-sellers",
    )
    def best_sellers(self, request):
        products = self.get_queryset().filter(
            is_best_seller=True
        ).order_by("-created_at")

        limit = request.query_params.get(
            "limit",
            "6",
        )

        try:
            limit = max(
                1,
                min(int(limit), 50),
            )

        except (ValueError, TypeError):
            limit = 6

        products = products[:limit]

        serializer = self.get_serializer(
            products,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


# ==========================================
# PRODUCT SALES VIEWSET
# ==========================================

class ProductSaleViewSet(viewsets.ModelViewSet):
    queryset = ProductSale.objects.select_related(
        "product"
    ).all()

    serializer_class = ProductSaleSerializer
    permission_classes = [IsAdminUser]

    http_method_names = [
        "get",
        "post",
        "patch",
        "head",
        "options",
    ]
