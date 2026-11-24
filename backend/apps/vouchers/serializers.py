from rest_framework import serializers

from .models import Voucher


class VoucherSerializer(serializers.ModelSerializer[Voucher]):
    class Meta:
        model = Voucher
        fields = [
            "id",
            "code",
            "name",
            "discount_type",
            "value",
            "max_discount",
            "min_order_value",
            "start_date",
            "end_date",
            "usage_limit",
            "used_count",
            "is_active",
        ]
