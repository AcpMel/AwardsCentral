
# Backend/apps/products/models.py

from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils.text import slugify


class ProductCategory(models.Model):
    category_name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    description = models.TextField(blank=True)

    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_categories"
        ordering = ["category_name"]
        verbose_name_plural = "Product Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.category_name)
            candidate = base_slug
            counter = 1

            while ProductCategory.objects.filter(
                slug=candidate
            ).exclude(pk=self.pk).exists():
                counter += 1
                candidate = f"{base_slug}-{counter}"

            self.slug = candidate

        super().save(*args, **kwargs)

    def __str__(self):
        if self.parent:
            return f"{self.parent} > {self.category_name}"

        return self.category_name


class Product(models.Model):
    product_name = models.CharField(max_length=255)
    product_description = models.TextField(blank=True)
    stocks = models.PositiveIntegerField(default=0)
    meta_description = models.CharField(max_length=160, blank=True)

    product_image = models.ImageField(
        upload_to="products/images/",
        blank=True,
        null=True,
    )

    product_glb = models.FileField(
        upload_to="products/models/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=["glb"])],
    )

    price = models.DecimalField(max_digits=12, decimal_places=2)
    product_type = models.CharField(max_length=100)

    # Multiple categories can be assigned to one product.
    categories = models.ManyToManyField(
        ProductCategory,
        related_name="products",
        blank=True,
    )

    is_import = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    is_customizable = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]

    def __str__(self):
        return self.product_name


class ProductSale(models.Model):
    class SaleStatus(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="sales",
    )

    quantity = models.PositiveIntegerField()

    status = models.CharField(
        max_length=20,
        choices=SaleStatus.choices,
        default=SaleStatus.CONFIRMED,
    )

    sold_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "product_sales"
        ordering = ["-sold_at"]

    def __str__(self):
        return f"{self.product.product_name} - {self.quantity} sold"
