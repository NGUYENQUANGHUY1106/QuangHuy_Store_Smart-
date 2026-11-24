from typing import Any

from django.db import transaction
from rest_framework import generics, serializers
from rest_framework.request import Request
from rest_framework.response import Response

from apps.identity.permissions import IsAdminRole

from .models import Voucher
from .serializers import VoucherSerializer


class AdminVoucherSerializer(VoucherSerializer):
    class Meta(VoucherSerializer.Meta):
        read_only_fields = ["id", "used_count"]

    def validate_code(self, value: str) -> str:
        code = value.strip().upper()
        matches = Voucher.objects.filter(code=code)
        if self.instance is not None:
            matches = matches.exclude(pk=self.instance.pk)
        if matches.exists():
            raise serializers.ValidationError("Mã voucher đã tồn tại.")
        return code

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        def field(name: str, default: Any = None) -> Any:
            return attrs.get(name, getattr(self.instance, name, default))

        value, cap = field("value"), field("max_discount")
        if (
            value <= 0
            or (cap is not None and cap <= 0)
            or field("min_order_value", 0) < 0
        ):
            raise serializers.ValidationError("Giá trị voucher không hợp lệ.")
        if field("discount_type") == Voucher.DiscountType.PERCENT and (
            value > 100 or cap is None
        ):
            raise serializers.ValidationError(
                "Voucher phần trăm cần mức trần và tối đa 100%."
            )
        if field("start_date") >= field("end_date"):
            raise serializers.ValidationError("Ngày kết thúc phải sau ngày bắt đầu.")
        if field("usage_limit", 1) < max(1, field("used_count", 0)):
            raise serializers.ValidationError("Giới hạn lượt dùng không hợp lệ.")
        return attrs


class AdminVoucherList(generics.ListCreateAPIView[Voucher]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminVoucherSerializer
    queryset = Voucher.objects.order_by("code", "pk")


class AdminVoucherDetail(generics.RetrieveUpdateDestroyAPIView[Voucher]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminVoucherSerializer
    queryset = Voucher.objects.all()

    @transaction.atomic
    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        self.queryset = Voucher.objects.select_for_update()
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance: Voucher) -> None:
        instance.is_active = False
        instance.save(update_fields=["is_active"])
