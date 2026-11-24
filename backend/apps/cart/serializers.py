from typing import Any

from rest_framework import serializers

from apps.catalog.images import product_thumbnail
from apps.catalog.models import Product

from .models import CartItem


class CartItemWriteSerializer(serializers.Serializer[dict[str, Any]]):
    variant_id = serializers.UUIDField()
    qty = serializers.IntegerField(min_value=1)


class CartItemSerializer(serializers.ModelSerializer[CartItem]):
    variant_id = serializers.UUIDField(source="variant.id", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    product_name = serializers.CharField(source="variant.product.name", read_only=True)
    size = serializers.CharField(source="variant.size", read_only=True)
    color = serializers.CharField(source="variant.color", read_only=True)
    unit_price = serializers.DecimalField(
        source="variant.unit_price",
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    thumbnail = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    stock_qty = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "variant_id",
            "sku",
            "product_name",
            "thumbnail",
            "size",
            "color",
            "qty",
            "unit_price",
            "currency",
            "stock_qty",
            "is_available",
        ]

    def get_thumbnail(self, obj: CartItem) -> str | None:
        return product_thumbnail(obj.variant.product, obj.variant.color)

    def get_currency(self, obj: CartItem) -> str:
        return "VND"

    def get_stock_qty(self, obj: CartItem) -> int:
        try:
            return obj.variant.inventory.stock_qty
        except Exception:
            return 0

    def get_is_available(self, obj: CartItem) -> bool:
        return (
            obj.variant.is_active
            and obj.variant.product.status == Product.Status.PUBLISHED
            and self.get_stock_qty(obj) >= obj.qty
        )
