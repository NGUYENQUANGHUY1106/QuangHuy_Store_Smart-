from django.conf import settings
from django.db import models

from apps.orders.models import OrderItem


class Review(models.Model):
    order_item = models.OneToOneField(
        OrderItem, on_delete=models.PROTECT, related_name="review"
    )
    rating = models.PositiveSmallIntegerField()
    body = models.CharField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    removed_at = models.DateTimeField(null=True, blank=True)
    removed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT
    )

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=1, rating__lte=5),
                name="reviews_rating_between_1_and_5",
            )
        ]


class ReviewReply(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="replies")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    body = models.CharField(max_length=2000)
    from_shop = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
