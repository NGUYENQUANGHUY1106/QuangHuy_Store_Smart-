from typing import Any

from rest_framework import serializers

from apps.catalog.images import product_thumbnail
from apps.catalog.models import Product

from .models import Order, OrderItem, OrderStatusEvent


class OrderTransitionSerializer(serializers.Serializer[dict[str, Any]]):
    expected_version = serializers.IntegerField(min_value=1, required=False)


class CheckoutAddressSerializer(serializers.Serializer[dict[str, Any]]):
    receiver = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    street = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False)
    area = serializers.DictField(
        child=serializers.CharField(max_length=100), required=False
    )


class OrderItemSerializer(serializers.ModelSerializer[OrderItem]):
    thumbnail = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()
    reviewed = serializers.SerializerMethodField()

    def get_thumbnail(self, obj: OrderItem) -> str | None:
        return product_thumbnail(obj.variant.product, obj.color_snapshot)

    def get_product_slug(self, obj: OrderItem) -> str | None:
        product = obj.variant.product
        return product.slug if product.status == Product.Status.PUBLISHED else None

    def get_reviewed(self, obj: OrderItem) -> bool:
        return hasattr(obj, "review")

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "variant_id",
            "product_name_snapshot",
            "thumbnail",
            "product_slug",
            "reviewed",
            "sku_snapshot",
            "size_snapshot",
            "color_snapshot",
            "unit_price",
            "qty",
            "line_subtotal",
        ]


class OrderStatusEventSerializer(serializers.ModelSerializer[OrderStatusEvent]):
    class Meta:
        model = OrderStatusEvent
        fields = ["from_status", "to_status", "created_at"]


class OrderSerializer(serializers.ModelSerializer[Order]):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusEventSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "number",
            "status",
            "payment_method",
            "payment_status",
            "currency",
            "subtotal",
            "discount",
            "shipping",
            "total",
            "address_snapshot",
            "version",
            "created_at",
            "items",
            "status_history",
        ]
