import uuid

from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q

from apps.catalog.models import ProductVariant
from apps.vouchers.models import Voucher


class CheckoutRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    key = models.CharField(max_length=128)
    request_hash = models.CharField(max_length=64)
    order = models.OneToOneField(
        "Order",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="checkout_request",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "key"],
                name="checkout_request_user_key",
            )
        ]


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        CONFIRMED = "CONFIRMED", "Confirmed"
        SHIPPING = "SHIPPING", "Shipping"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class PaymentMethod(models.TextChoices):
        COD = "COD", "COD"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank transfer"
        VNPAY_SANDBOX = "VNPAY_SANDBOX", "VNPay sandbox"

    class PaymentStatus(models.TextChoices):
        UNPAID = "UNPAID", "Unpaid"
        PAID = "PAID", "Paid"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    number = models.CharField(max_length=32, unique=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="orders",
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    payment_method = models.CharField(
        max_length=32,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    payment_status = models.CharField(
        max_length=16,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    currency = models.CharField(max_length=3, default="VND")
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2)
    address_snapshot = models.JSONField(default=dict)
    version = models.PositiveIntegerField(default=1)
    stock_returned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            CheckConstraint(condition=Q(subtotal__gte=0), name="order_subtotal_gte_0"),
            CheckConstraint(condition=Q(discount__gte=0), name="order_discount_gte_0"),
            CheckConstraint(condition=Q(shipping__gte=0), name="order_shipping_gte_0"),
            CheckConstraint(condition=Q(total__gte=0), name="order_total_gte_0"),
        ]


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    product_name_snapshot = models.CharField(max_length=200)
    sku_snapshot = models.CharField(max_length=64)
    size_snapshot = models.CharField(max_length=16)
    color_snapshot = models.CharField(max_length=32)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)
    qty = models.PositiveIntegerField()
    line_subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["order", "variant"],
                name="order_one_variant_per_order",
            ),
            CheckConstraint(condition=Q(qty__gte=1), name="order_item_qty_gte_1"),
        ]


class OrderStatusEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order,
        on_delete=models.PROTECT,
        related_name="status_history",
    )
    from_status = models.CharField(max_length=16, null=True, blank=True)
    to_status = models.CharField(max_length=16)
    reason = models.CharField(max_length=255, blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
