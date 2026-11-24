import uuid

from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q, UniqueConstraint


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Brand(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=240, unique=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PUBLISHED,
        db_index=True,
    )
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            CheckConstraint(
                condition=Q(version__gte=1),
                name="catalog_product_version_gte_1",
            )
        ]
        indexes = [
            models.Index(fields=["status", "category"], name="cat_prod_status_cat"),
        ]

    def __str__(self) -> str:
        return self.name


class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="variants",
    )
    sku = models.CharField(max_length=64, unique=True)
    size = models.CharField(max_length=16)
    color = models.CharField(max_length=32)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)
    is_active = models.BooleanField(default=True)
    revision = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["size", "color"]
        constraints = [
            CheckConstraint(
                condition=Q(unit_price__gte=0),
                name="catalog_variant_price_gte_0",
            ),
            CheckConstraint(
                condition=Q(revision__gte=1),
                name="catalog_variant_revision_gte_1",
            ),
            UniqueConstraint(
                fields=["product", "size", "color"],
                name="catalog_variant_product_size_color",
            ),
        ]
        indexes = [
            models.Index(fields=["product", "is_active"], name="cat_var_prod_active"),
        ]

    def __str__(self) -> str:
        return f"{self.sku} — {self.product.name}"


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="images",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="images",
    )
    storage_key = models.CharField(max_length=255)
    webp_data = models.BinaryField(null=True, editable=False)
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "created_at"]


class InventoryBalance(models.Model):
    variant = models.OneToOneField(
        ProductVariant,
        on_delete=models.PROTECT,
        primary_key=True,
        related_name="inventory",
    )
    stock_qty = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(stock_qty__gte=0),
                name="catalog_inventory_stock_gte_0",
            )
        ]


class InventoryMovement(models.Model):
    class Kind(models.TextChoices):
        CHECKOUT = "checkout", "Checkout"
        CANCEL_RETURN = "cancel_return", "Cancel return"
        ADJUST = "adjust", "Adjustment"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name="movements",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    delta = models.IntegerField()
    before_qty = models.PositiveIntegerField()
    after_qty = models.PositiveIntegerField()
    reason = models.CharField(max_length=255)
    operation_key = models.CharField(max_length=128)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["operation_key", "kind"],
                name="catalog_movement_operation_kind",
            ),
            CheckConstraint(
                condition=~Q(delta=0),
                name="catalog_movement_delta_not_zero",
            ),
        ]
