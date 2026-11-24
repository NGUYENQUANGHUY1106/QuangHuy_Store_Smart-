import hashlib
import json
from uuid import UUID

from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.images import prefetch_thumbnails
from apps.catalog.models import InventoryBalance, Product, ProductVariant
from apps.identity.models import User

from .models import Cart, CartItem, CartMergeReceipt
from .serializers import CartItemSerializer, CartItemWriteSerializer


def get_or_create_cart(user: User, *, lock: bool = False) -> Cart:
    carts = Cart.objects.select_for_update() if lock else Cart.objects
    cart, _ = carts.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        cart = Cart.objects.filter(user=user).first()
        if cart is None:
            return Response({"cart_revision": 0, "items": []})
        items = (
            CartItem.objects.filter(cart=cart)
            .select_related(
                "variant",
                "variant__product",
                "variant__inventory",
            )
            .prefetch_related(prefetch_thumbnails("variant__product"))
        )
        return Response(
            {
                "cart_revision": cart.revision,
                "items": CartItemSerializer(items, many=True).data,
            }
        )


class CartItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant_id = serializer.validated_data["variant_id"]
        qty = serializer.validated_data["qty"]

        with transaction.atomic():
            cart = get_or_create_cart(user, lock=True)
            variant = (
                ProductVariant.objects.select_for_update().filter(id=variant_id).first()
            )
            if variant is None:
                raise NotFound()
            balance = InventoryBalance.objects.select_for_update().get(variant=variant)
            if (
                not variant.is_active
                or variant.product.status != Product.Status.PUBLISHED
            ):
                return Response(
                    {
                        "error": {
                            "code": "variant_inactive",
                            "message": "Biến thể không còn hoạt động.",
                        }
                    },
                    status=400,
                )
            existing = (
                CartItem.objects.select_for_update()
                .filter(cart=cart, variant=variant)
                .first()
            )
            total_qty = qty + (existing.qty if existing else 0)
            if balance.stock_qty < total_qty:
                return Response(
                    {
                        "error": {
                            "code": "insufficient_stock",
                            "message": "Sản phẩm không đủ tồn kho.",
                        }
                    },
                    status=409,
                )
            if existing:
                existing.qty = total_qty
                existing.save(update_fields=["qty", "updated_at"])
                created = False
            else:
                CartItem.objects.create(cart=cart, variant=variant, qty=qty)
                created = True
            cart.revision += 1
            cart.save(update_fields=["revision", "updated_at"])

        items = (
            CartItem.objects.filter(cart=cart)
            .select_related("variant", "variant__product", "variant__inventory")
            .prefetch_related(prefetch_thumbnails("variant__product"))
        )
        return Response(
            {
                "cart_revision": cart.revision,
                "items": CartItemSerializer(items, many=True).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, pk: UUID) -> Response:
        user = request.user
        assert isinstance(user, User)
        qty = request.data.get("qty")
        if type(qty) is not int or qty < 1:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Qty phải là số nguyên dương.",
                    }
                },
                status=400,
            )
        with transaction.atomic():
            cart = get_or_create_cart(user, lock=True)
            item = (
                CartItem.objects.select_for_update()
                .select_related("variant")
                .filter(cart=cart, id=pk)
                .first()
            )
            if item is None:
                return Response(
                    {
                        "error": {
                            "code": "not_found",
                            "message": "Không tìm thấy giỏ hàng.",
                        }
                    },
                    status=404,
                )
            balance = InventoryBalance.objects.select_for_update().get(
                variant=item.variant
            )
            if balance.stock_qty < qty:
                return Response(
                    {
                        "error": {
                            "code": "insufficient_stock",
                            "message": "Sản phẩm không đủ tồn kho.",
                        }
                    },
                    status=409,
                )
            item.qty = qty
            item.save(update_fields=["qty", "updated_at"])
            cart.revision += 1
            cart.save(update_fields=["revision", "updated_at"])
        return Response(
            {
                "cart_revision": cart.revision,
                "item": CartItemSerializer(item).data,
            }
        )

    def delete(self, request: Request, pk: UUID) -> Response:
        user = request.user
        assert isinstance(user, User)
        with transaction.atomic():
            cart = get_or_create_cart(user, lock=True)
            item = CartItem.objects.select_for_update().filter(cart=cart, id=pk).first()
            if item is None:
                return Response(
                    {
                        "error": {
                            "code": "not_found",
                            "message": "Không tìm thấy giỏ hàng.",
                        }
                    },
                    status=404,
                )
            item.delete()
            cart.revision += 1
            cart.save(update_fields=["revision", "updated_at"])
        return Response(status=204)


class CartMergeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        items = request.data.get("items")
        if not isinstance(items, list):
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "items phải là danh sách.",
                    }
                },
                status=400,
            )
        serializer = CartItemWriteSerializer(data=items, many=True)
        serializer.is_valid(raise_exception=True)
        if not items:
            raise ValidationError({"items": "Danh sách không được trống."})
        raw_key = request.headers.get("Idempotency-Key")
        try:
            key = UUID(raw_key) if raw_key is not None else None
        except ValueError as error:
            raise ValidationError({"idempotency_key": "Dùng UUID hợp lệ."}) from error
        entries = sorted(
            serializer.validated_data,
            key=lambda line: (line["variant_id"], line["qty"]),
        )
        digest = hashlib.sha256(
            json.dumps(
                [(str(line["variant_id"]), line["qty"]) for line in entries]
            ).encode()
        ).hexdigest()
        with transaction.atomic():
            cart = get_or_create_cart(user, lock=True)
            receipt = (
                CartMergeReceipt.objects.filter(cart=cart, key=key).first()
                if key
                else None
            )
            if receipt and receipt.payload_digest != digest:
                return Response(
                    {
                        "error": {
                            "code": "idempotency_conflict",
                            "message": "Khóa đã dùng cho giỏ hàng khác.",
                        }
                    },
                    status=409,
                )
            if receipt is None:
                for entry in entries:
                    variant = (
                        ProductVariant.objects.select_for_update()
                        .filter(id=entry["variant_id"])
                        .first()
                    )
                    if variant is None:
                        raise NotFound()
                    balance = InventoryBalance.objects.select_for_update().get(
                        variant=variant
                    )
                    existing = CartItem.objects.filter(
                        cart=cart, variant=variant
                    ).first()
                    total_qty = entry["qty"] + (existing.qty if existing else 0)
                    if (
                        not variant.is_active
                        or variant.product.status != Product.Status.PUBLISHED
                        or balance.stock_qty < total_qty
                    ):
                        transaction.set_rollback(True)
                        return Response(
                            {
                                "error": {
                                    "code": "insufficient_stock",
                                    "message": "Sản phẩm không còn đủ tồn kho.",
                                }
                            },
                            status=409,
                        )
                    if existing:
                        existing.qty = total_qty
                        existing.save(update_fields=["qty", "updated_at"])
                    else:
                        CartItem.objects.create(
                            cart=cart, variant=variant, qty=total_qty
                        )
                cart.revision += 1
                cart.save(update_fields=["revision", "updated_at"])
                if key is not None:
                    CartMergeReceipt.objects.create(
                        cart=cart, key=key, payload_digest=digest
                    )
            lines = (
                CartItem.objects.filter(cart=cart)
                .select_related("variant", "variant__product", "variant__inventory")
                .prefetch_related(prefetch_thumbnails("variant__product"))
            )
            return Response(
                {
                    "cart_revision": cart.revision,
                    "items": CartItemSerializer(lines, many=True).data,
                }
            )
