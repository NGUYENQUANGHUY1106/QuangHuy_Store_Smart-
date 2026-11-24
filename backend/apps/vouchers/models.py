from django.db import models
from django.db.models import CheckConstraint, Q


class Voucher(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "PERCENT", "Percent"
        FIXED = "FIXED", "Fixed"

    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=100)
    discount_type = models.CharField(max_length=16, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=14, decimal_places=2)
    max_discount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
    )
    min_order_value = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(value__gt=0),
                name="voucher_value_gt_0",
            ),
            CheckConstraint(
                condition=Q(used_count__lte=models.F("usage_limit")),
                name="voucher_used_lte_limit",
            ),
        ]
