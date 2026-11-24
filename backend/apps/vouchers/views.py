from decimal import Decimal

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart, CartItem
from apps.identity.models import User

from .models import Voucher
from .serializers import VoucherSerializer


class VoucherValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user = request.user
        assert isinstance(user, User)
        code = str(request.data.get("code", "")).strip().upper()
        if not code:
            return Response(
                {"error": {"code": "validation_error", "message": "Thiếu mã voucher."}},
                status=400,
            )
        voucher = Voucher.objects.filter(code=code, is_active=True).first()
        if not voucher:
            return Response(
                {
                    "error": {
                        "code": "voucher_not_found",
                        "message": "Mã voucher không hợp lệ.",
                    }
                },
                status=404,
            )
        now = timezone.now()
        if now < voucher.start_date or now > voucher.end_date:
            return Response(
                {
                    "error": {
                        "code": "voucher_expired",
                        "message": "Mã voucher không còn hiệu lực.",
                    }
                },
                status=409,
            )
        if voucher.used_count >= voucher.usage_limit:
            return Response(
                {
                    "error": {
                        "code": "voucher_usage_limit",
                        "message": "Mã voucher đã hết lượt sử dụng.",
                    }
                },
                status=409,
            )
        cart = Cart.objects.filter(user=user).first()
        subtotal = (
            sum(
                (
                    item.qty * item.variant.unit_price
                    for item in CartItem.objects.filter(cart=cart).select_related(
                        "variant"
                    )
                ),
                Decimal("0"),
            )
            if cart
            else Decimal("0")
        )
        if subtotal < voucher.min_order_value:
            return Response(
                {
                    "error": {
                        "code": "voucher_min_order",
                        "message": "Chưa đạt giá trị đơn tối thiểu.",
                    }
                },
                status=409,
            )
        if voucher.discount_type == Voucher.DiscountType.PERCENT:
            discount = subtotal * voucher.value / 100
            if voucher.max_discount is not None:
                discount = min(discount, voucher.max_discount)
        else:
            discount = min(voucher.value, subtotal)
        discount = max(discount, Decimal("0"))
        return Response(
            {
                "eligible": True,
                "voucher": VoucherSerializer(voucher).data,
                "discount": str(
                    discount.quantize(0)
                    if hasattr(discount, "quantize")
                    else int(discount)
                ),
            }
        )
