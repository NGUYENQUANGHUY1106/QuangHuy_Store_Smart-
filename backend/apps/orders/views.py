from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from decimal import Decimal
from typing import TypedDict
from uuid import UUID

from django.core import signing
from django.db import transaction
from django.db.models import Prefetch, QuerySet
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart, CartItem
from apps.cart.serializers import CartItemWriteSerializer
from apps.catalog.images import prefetch_thumbnails
from apps.catalog.models import (
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductVariant,
)
from apps.identity.models import User
from apps.identity.permissions import IsAdminRole
from apps.vouchers.models import Voucher

from .models import CheckoutRequest, Order, OrderItem, OrderStatusEvent
from .serializers import (
    CheckoutAddressSerializer,
    OrderSerializer,
    OrderTransitionSerializer,
)


def prefetch_order_items() -> Prefetch[str, QuerySet[OrderItem], str]:
    return Prefetch(
        "items",
        queryset=OrderItem.objects.select_related(
            "variant__product", "review"
        ).prefetch_related(prefetch_thumbnails("variant__product")),
    )


def generate_order_number() -> str:
    now = timezone.now()
    return f"QHS-{now:%y%m%d-%H%M%S-%f}"


class CheckoutConflict(APIException):
    status_code = 409

    def __init__(self, code: str, message: str) -> None:
        super().__init__({"error": {"code": code, "message": message}})


class CheckoutAmounts(TypedDict):
    user: str
    lines: list[tuple[str, int, str]]
    voucher: str
    subtotal: str
    discount: str
    shipping: str
    total: str


def checkout_pricing(
    user: User,
    lines: list[tuple[int, ProductVariant, InventoryBalance | None]],
    voucher_code: str,
    *,
    lock_voucher: bool = False,
) -> tuple[CheckoutAmounts, Voucher | None]:
    if not lines:
        raise CheckoutConflict("cart_empty", "Giỏ hàng trống.")
    amounts = [
        (str(variant.pk), qty, str(variant.unit_price)) for qty, variant, _ in lines
    ]
    subtotal = Decimal("0")
    for qty, variant, balance in lines:
        if not variant.is_active or variant.product.status != Product.Status.PUBLISHED:
            raise CheckoutConflict(
                "variant_inactive", "Có sản phẩm không còn hoạt động."
            )
        if balance is None or balance.stock_qty < qty:
            raise CheckoutConflict("insufficient_stock", "Sản phẩm không đủ tồn kho.")
        subtotal += variant.unit_price * qty

    discount = Decimal("0")
    voucher = None
    if voucher_code:
        vouchers = (
            Voucher.objects.select_for_update() if lock_voucher else Voucher.objects
        )
        voucher = vouchers.filter(code=voucher_code, is_active=True).first()
        now = timezone.now()
        if (
            voucher is None
            or now < voucher.start_date
            or now > voucher.end_date
            or voucher.used_count >= voucher.usage_limit
            or subtotal < voucher.min_order_value
        ):
            raise CheckoutConflict(
                "voucher_invalid", "Voucher không hợp lệ cho đơn hàng."
            )
        if voucher.discount_type == Voucher.DiscountType.PERCENT:
            discount = subtotal * voucher.value / Decimal("100")
            if voucher.max_discount is not None:
                discount = min(discount, voucher.max_discount)
        else:
            discount = voucher.value
        discount = min(discount.quantize(Decimal("1")), subtotal)

    shipping = Decimal("0") if subtotal >= Decimal("500000") else Decimal("30000")
    total = subtotal - discount + shipping
    quote: CheckoutAmounts = {
        "user": str(user.pk),
        "lines": amounts,
        "voucher": voucher_code,
        "subtotal": str(subtotal),
        "discount": str(discount),
        "shipping": str(shipping),
        "total": str(total),
    }
    return quote, voucher


def normalize_voucher_code(data: Mapping[str, object]) -> str:
    return str(data.get("voucher_code", "")).strip().upper()


def direct_selection(data: Mapping[str, object]) -> tuple[UUID, int] | None:
    if "direct_item" not in data:
        return None
    item = CartItemWriteSerializer(data=data["direct_item"])
    item.is_valid(raise_exception=True)
    return item.validated_data["variant_id"], item.validated_data["qty"]


class CheckoutQuoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        direct = direct_selection(request.data)
        if direct is None:
            items = (
                CartItem.objects.filter(cart__user=user)
                .select_related("variant__product", "variant__inventory")
                .order_by("variant_id")
            )
            lines = [
                (item.qty, item.variant, getattr(item.variant, "inventory", None))
                for item in items
            ]
        else:
            variant = (
                ProductVariant.objects.select_related("product", "inventory")
                .filter(pk=direct[0])
                .first()
            )
            if variant is None:
                raise CheckoutConflict(
                    "variant_inactive", "Sản phẩm không còn hoạt động."
                )
            lines = [(direct[1], variant, getattr(variant, "inventory", None))]
        quote, _ = checkout_pricing(user, lines, normalize_voucher_code(request.data))
        return Response(
            {
                "subtotal": quote["subtotal"],
                "discount": quote["discount"],
                "shipping": quote["shipping"],
                "total": quote["total"],
                "currency": "VND",
                "quote_token": signing.dumps(
                    quote, salt="checkout-direct" if direct else "checkout-preview"
                ),
            }
        )


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        key = request.headers.get("Idempotency-Key", "").strip()
        if len(key) < 16 or len(key) > 128:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Idempotency-Key phải có 16–128 ký tự.",
                    }
                },
                status=400,
            )
        payment_method = str(request.data.get("payment_method", "COD")).upper()
        if payment_method not in {
            Order.PaymentMethod.COD,
            Order.PaymentMethod.BANK_TRANSFER,
            Order.PaymentMethod.VNPAY_SANDBOX,
        }:
            return Response(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Phương thức thanh toán không hợp lệ.",
                    }
                },
                status=400,
            )
        address = CheckoutAddressSerializer(data=request.data.get("address_snapshot"))
        canonical = json.dumps(
            request.data, sort_keys=True, ensure_ascii=False, default=str
        )
        request_hash = hashlib.sha256(canonical.encode()).hexdigest()

        with transaction.atomic():
            # Serialize requests even before the first idempotency claim exists.
            User.objects.select_for_update().only("pk").get(pk=user.pk)
            existing = (
                CheckoutRequest.objects.select_for_update()
                .filter(
                    user=user,
                    key=key,
                )
                .first()
            )
            if existing:
                if existing.request_hash != request_hash:
                    return Response(
                        {
                            "error": {
                                "code": "idempotency_conflict",
                                "message": "Key đã dùng với payload khác.",
                            }
                        },
                        status=409,
                    )
                if existing.order:
                    return Response(
                        OrderSerializer(existing.order).data,
                        status=200,
                        headers={"Idempotency-Replayed": "true"},
                    )

            address.is_valid(raise_exception=True)
            direct = direct_selection(request.data)
            cart = None
            if direct is None:
                cart = Cart.objects.select_for_update().filter(user=user).first()
                if cart is None:
                    raise CheckoutConflict("cart_empty", "Giỏ hàng trống.")
                cart_items = (
                    CartItem.objects.select_for_update(of=("self",))
                    .filter(cart=cart)
                    .select_related("variant")
                    .order_by("variant_id")
                )
                quantities = [(item.variant_id, item.qty) for item in cart_items]
                product_ids = {item.variant.product_id for item in cart_items}
            else:
                if "quote_token" not in request.data:
                    raise ValidationError({"detail": "Cần báo giá trước khi mua ngay."})
                variant = ProductVariant.objects.filter(pk=direct[0]).first()
                if variant is None:
                    raise CheckoutConflict(
                        "variant_inactive", "Sản phẩm không còn hoạt động."
                    )
                quantities = [direct]
                product_ids = {variant.product_id}
            list(
                Product.objects.select_for_update()
                .filter(pk__in=product_ids)
                .order_by("pk")
                .values_list("pk", flat=True)
            )
            locked_inventory = []
            for variant_id, qty in quantities:
                variant = (
                    ProductVariant.objects.select_for_update(of=("self",))
                    .select_related("product")
                    .filter(id=variant_id)
                    .first()
                )
                if variant is None:
                    raise CheckoutConflict(
                        "variant_inactive", "Sản phẩm không còn hoạt động."
                    )
                balance = (
                    InventoryBalance.objects.select_for_update()
                    .filter(variant=variant)
                    .first()
                )
                locked_inventory.append((qty, variant, balance))

            quote, voucher = checkout_pricing(
                user,
                locked_inventory,
                normalize_voucher_code(request.data),
                lock_voucher=True,
            )
            if "quote_token" in request.data:
                token = request.data["quote_token"]
                try:
                    expected = (
                        signing.loads(
                            token,
                            salt="checkout-direct" if direct else "checkout-preview",
                        )
                        if isinstance(token, str)
                        else None
                    )
                except signing.BadSignature:
                    expected = None
                if expected != json.loads(json.dumps(quote)):
                    raise CheckoutConflict(
                        "quote_changed",
                        "Giỏ hàng hoặc tổng tiền đã thay đổi. Hãy tải lại báo giá.",
                    )

            subtotal = Decimal(quote["subtotal"])
            discount = Decimal(quote["discount"])
            shipping = Decimal(quote["shipping"])
            total = Decimal(quote["total"])

            claim = CheckoutRequest.objects.create(
                user=user,
                key=key,
                request_hash=request_hash,
            )
            order = Order.objects.create(
                number=generate_order_number(),
                user=user,
                voucher=voucher,
                status=Order.Status.PENDING,
                payment_method=payment_method,
                payment_status=(
                    Order.PaymentStatus.PAID
                    if payment_method
                    in {
                        Order.PaymentMethod.BANK_TRANSFER,
                        Order.PaymentMethod.VNPAY_SANDBOX,
                    }
                    else Order.PaymentStatus.UNPAID
                ),
                currency="VND",
                subtotal=subtotal,
                discount=discount,
                shipping=shipping,
                total=total,
                address_snapshot=address.validated_data,
            )
            OrderStatusEvent.objects.create(
                order=order,
                from_status=None,
                to_status=Order.Status.PENDING,
                actor=user,
            )

            for qty, variant, balance in locked_inventory:
                assert balance is not None
                before = balance.stock_qty
                balance.stock_qty -= qty
                balance.save(update_fields=["stock_qty", "updated_at"])
                line_subtotal = variant.unit_price * qty
                order_item = OrderItem.objects.create(
                    order=order,
                    variant=variant,
                    product_name_snapshot=variant.product.name,
                    sku_snapshot=variant.sku,
                    size_snapshot=variant.size,
                    color_snapshot=variant.color,
                    unit_price=variant.unit_price,
                    qty=qty,
                    line_subtotal=line_subtotal,
                )
                InventoryMovement.objects.create(
                    variant=variant,
                    kind=InventoryMovement.Kind.CHECKOUT,
                    actor=user,
                    delta=-qty,
                    before_qty=before,
                    after_qty=balance.stock_qty,
                    reason=f"Checkout order {order.number}",
                    operation_key=f"{order.id}:checkout:{order_item.id}",
                )

            if voucher:
                voucher.used_count += 1
                voucher.save(update_fields=["used_count", "updated_at"])

            claim.order = order
            claim.save(update_fields=["order"])
            if cart is not None:
                CartItem.objects.filter(cart=cart).delete()
                cart.revision += 1
                cart.save(update_fields=["revision", "updated_at"])

        return Response(OrderSerializer(order).data, status=201)


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        orders = (
            Order.objects.filter(user=user)
            .prefetch_related(prefetch_order_items(), "status_history")
            .order_by("-created_at", "-pk")
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            orders = orders.filter(status=status_filter.upper())
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(orders, request, view=self)
        return paginator.get_paginated_response(OrderSerializer(page, many=True).data)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, pk: str) -> Response:
        user = request.user
        assert isinstance(user, User)
        import uuid

        try:
            uuid.UUID(str(pk))
            order = (
                Order.objects.filter(id=pk, user=user)
                .prefetch_related(prefetch_order_items(), "status_history")
                .first()
            )
        except ValueError:
            order = (
                Order.objects.filter(number=pk, user=user)
                .prefetch_related(prefetch_order_items(), "status_history")
                .first()
            )
        if order is None:
            return Response(
                {"error": {"code": "not_found", "message": "Không tìm thấy đơn hàng."}},
                status=404,
            )
        return Response(OrderSerializer(order).data)


def check_transition_version(request: Request, order: Order) -> None:
    serializer = OrderTransitionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    expected = serializer.validated_data.get("expected_version")
    if expected is not None and expected != order.version:
        raise CheckoutConflict(
            "version_conflict", "Đơn hàng đã thay đổi. Vui lòng tải lại."
        )


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: str) -> Response:
        user = request.user
        assert isinstance(user, User)
        import uuid

        with transaction.atomic():
            try:
                uuid.UUID(str(pk))
                order = (
                    Order.objects.select_for_update().filter(id=pk, user=user).first()
                )
            except ValueError:
                order = (
                    Order.objects.select_for_update()
                    .filter(number=pk, user=user)
                    .first()
                )
            if order is None:
                return Response(
                    {
                        "error": {
                            "code": "not_found",
                            "message": "Không tìm thấy đơn hàng.",
                        }
                    },
                    status=404,
                )
            check_transition_version(request, order)
            if order.status != Order.Status.PENDING:
                return Response(
                    {
                        "error": {
                            "code": "invalid_transition",
                            "message": "Chỉ hủy đơn khi đang PENDING.",
                        }
                    },
                    status=409,
                )
            if not order.stock_returned:
                for item in OrderItem.objects.filter(order=order).order_by(
                    "variant_id"
                ):
                    variant = ProductVariant.objects.select_for_update().get(
                        id=item.variant_id
                    )
                    balance = InventoryBalance.objects.select_for_update().get(
                        variant=variant
                    )
                    before = balance.stock_qty
                    balance.stock_qty += item.qty
                    balance.save(update_fields=["stock_qty", "updated_at"])
                    InventoryMovement.objects.create(
                        variant=variant,
                        kind=InventoryMovement.Kind.CANCEL_RETURN,
                        actor=user,
                        delta=item.qty,
                        before_qty=before,
                        after_qty=balance.stock_qty,
                        reason=f"Cancel order {order.number}",
                        operation_key=f"{order.id}:cancel_return:{item.id}",
                    )
                order.stock_returned = True
            from_status = order.status
            order.status = Order.Status.CANCELLED
            order.version += 1
            order.save(
                update_fields=["status", "stock_returned", "version", "updated_at"]
            )
            OrderStatusEvent.objects.create(
                order=order,
                from_status=from_status,
                to_status=Order.Status.CANCELLED,
                reason=str(request.data.get("reason", "")),
                actor=user,
            )
        return Response(OrderSerializer(order).data)


class AdminOrderListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        orders = Order.objects.prefetch_related(
            prefetch_order_items(), "status_history"
        ).order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            orders = orders.filter(status=status_filter.upper())
        search = request.query_params.get("search", "").strip()
        if search:
            orders = orders.filter(number__icontains=search)
        return Response(
            {
                "count": orders.count(),
                "results": OrderSerializer(orders, many=True).data,
            }
        )


class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request: Request, pk: str) -> Response:
        import uuid

        try:
            uuid.UUID(str(pk))
            order = (
                Order.objects.filter(id=pk)
                .prefetch_related(prefetch_order_items(), "status_history")
                .first()
            )
        except ValueError:
            order = (
                Order.objects.filter(number=pk)
                .prefetch_related(prefetch_order_items(), "status_history")
                .first()
            )
        if order is None:
            return Response(
                {"error": {"code": "not_found", "message": "Không tìm thấy đơn hàng."}},
                status=404,
            )
        return Response(OrderSerializer(order).data)


class AdminOrderStatusTransitionView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request: Request, pk: str) -> Response:
        user = request.user
        assert isinstance(user, User)
        target_status = str(request.data.get("status", "")).strip().upper()
        reason = str(request.data.get("reason", "")).strip()

        valid_transitions: dict[str, set[str]] = {
            Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED},
            Order.Status.CONFIRMED: {Order.Status.SHIPPING, Order.Status.CANCELLED},
            Order.Status.SHIPPING: {Order.Status.COMPLETED},
            Order.Status.COMPLETED: set(),
            Order.Status.CANCELLED: set(),
        }

        import uuid

        with transaction.atomic():
            try:
                uuid.UUID(str(pk))
                order = Order.objects.select_for_update().filter(id=pk).first()
            except ValueError:
                order = Order.objects.select_for_update().filter(number=pk).first()

            if order is None:
                return Response(
                    {
                        "error": {
                            "code": "not_found",
                            "message": "Không tìm thấy đơn hàng.",
                        }
                    },
                    status=404,
                )

            check_transition_version(request, order)
            allowed = valid_transitions.get(order.status, set())
            if target_status not in allowed:
                return Response(
                    {
                        "error": {
                            "code": "invalid_transition",
                            "message": (
                                f"Không thể chuyển từ {order.status} sang "
                                f"{target_status} theo DEC-008."
                            ),
                        }
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if target_status == Order.Status.CANCELLED and not order.stock_returned:
                for item in OrderItem.objects.filter(order=order).order_by(
                    "variant_id"
                ):
                    variant = ProductVariant.objects.select_for_update().get(
                        id=item.variant_id
                    )
                    balance = InventoryBalance.objects.select_for_update().get(
                        variant=variant
                    )
                    before = balance.stock_qty
                    balance.stock_qty += item.qty
                    balance.save(update_fields=["stock_qty", "updated_at"])
                    InventoryMovement.objects.create(
                        variant=variant,
                        kind=InventoryMovement.Kind.CANCEL_RETURN,
                        actor=user,
                        delta=item.qty,
                        before_qty=before,
                        after_qty=balance.stock_qty,
                        reason=f"Admin cancel order {order.number}: {reason}",
                        operation_key=f"{order.id}:admin_cancel_return:{item.id}",
                    )
                order.stock_returned = True

            from_status = order.status
            order.status = target_status
            order.version += 1
            order.save(
                update_fields=["status", "stock_returned", "version", "updated_at"]
            )

            OrderStatusEvent.objects.create(
                order=order,
                from_status=from_status,
                to_status=target_status,
                reason=reason,
                actor=user,
            )

        return Response(OrderSerializer(order).data, status=200)
