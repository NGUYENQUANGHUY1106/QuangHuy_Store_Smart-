import uuid

from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q

from apps.catalog.models import ProductVariant


class Cart(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    revision = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class CartItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    qty = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "variant"],
                name="cart_one_variant_per_cart",
            ),
            CheckConstraint(
                condition=Q(qty__gte=1),
                name="cart_qty_gte_1",
            ),
        ]


class CartMergeReceipt(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    key = models.UUIDField()
    payload_digest = models.CharField(max_length=64)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "key"], name="cart_unique_merge_key"
            )
        ]
