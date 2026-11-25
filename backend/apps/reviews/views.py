from typing import Any

from django.db import transaction
from django.db.models import Prefetch, QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.images import prefetch_thumbnails, product_thumbnail
from apps.catalog.models import Product
from apps.identity.models import User
from apps.identity.permissions import IsAdminRole
from apps.identity.presentation import avatar_url, public_name
from apps.orders.models import Order, OrderItem

from .models import Review, ReviewReply


class ReviewTextSerializer(serializers.Serializer[dict[str, Any]]):
    body = serializers.CharField(max_length=2000, allow_blank=False)


class ReviewCreateSerializer(ReviewTextSerializer):
    order_item_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)


def reply_data(reply: ReviewReply) -> dict[str, object]:
    return {
        "id": reply.pk,
        "author": "Chủ shop" if reply.from_shop else public_name(reply.author),
        "from_shop": reply.from_shop,
        "avatar_url": None if reply.from_shop else avatar_url(reply.author),
        "body": reply.body,
        "created_at": reply.created_at.isoformat(),
    }


def review_list() -> QuerySet[Review]:
    return (
        Review.objects.filter(removed_at__isnull=True)
        .select_related(
            "order_item__order__user__avatar", "order_item__variant__product"
        )
        .defer("order_item__order__user__avatar__webp")
        .order_by("-created_at", "-pk")
        .prefetch_related(
            prefetch_thumbnails("order_item__variant__product"),
            Prefetch(
                "replies",
                queryset=ReviewReply.objects.select_related("author__avatar")
                .defer("author__avatar__webp")
                .order_by("created_at", "pk"),
            ),
        )
    )


def review_data(review: Review, *, admin: bool = False) -> dict[str, object]:
    item = review.order_item
    product = item.variant.product
    customer = item.order.user
    data: dict[str, object] = {
        "id": review.pk,
        "author": public_name(customer),
        "avatar_url": avatar_url(customer),
        "rating": review.rating,
        "body": review.body,
        "created_at": review.created_at.isoformat(),
        "product_name": item.product_name_snapshot,
        "thumbnail": product_thumbnail(product, item.color_snapshot),
        "size": item.size_snapshot,
        "color": item.color_snapshot,
        "replies": [reply_data(reply) for reply in review.replies.all()],
    }
    if admin:
        data.update(
            customer_email=customer.email,
            product_slug=product.slug
            if product.status == Product.Status.PUBLISHED
            else None,
            sku=item.sku_snapshot,
            order_number=item.order.number,
        )
    return data


def paginated_reviews(
    request: Request, reviews: QuerySet[Review], *, admin: bool = False
) -> Response:
    pagination = PageNumberPagination()
    pagination.page_size = 10
    page = pagination.paginate_queryset(reviews, request)
    assert page is not None
    return pagination.get_paginated_response(
        [review_data(review, admin=admin) for review in page]
    )


def eligible_items(user: User) -> QuerySet[OrderItem]:
    return OrderItem.objects.filter(
        order__user=user,
        order__status=Order.Status.COMPLETED,
        variant__product__status=Product.Status.PUBLISHED,
    )


class ProductReviewsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, slug: str) -> Response:
        product = get_object_or_404(Product, slug=slug, status=Product.Status.PUBLISHED)
        reviews = review_list().filter(order_item__variant__product=product)
        user = request.user
        item_id = None
        if isinstance(user, User):
            eligible = eligible_items(user).filter(
                variant__product=product, review__isnull=True
            )
            requested_item = request.query_params.get("order_item")
            if requested_item:
                eligible = eligible.filter(
                    pk=serializers.UUIDField().run_validation(requested_item)
                )
            item_id = (
                eligible.order_by("-order__created_at", "pk")
                .values_list("pk", flat=True)
                .first()
            )
        response = paginated_reviews(request, reviews)
        response.data["eligible_order_item_id"] = item_id
        response["Cache-Control"] = "private, no-store"
        return response


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        assert isinstance(user, User)
        data = serializer.validated_data
        item = get_object_or_404(
            OrderItem.objects.filter(order__user=user)
            .select_related("order", "variant__product")
            .select_for_update(of=("self",)),
            pk=data["order_item_id"],
        )
        if (
            item.order.status != Order.Status.COMPLETED
            or item.variant.product.status != Product.Status.PUBLISHED
        ):
            raise PermissionDenied("Chỉ đánh giá sản phẩm trong đơn đã hoàn thành.")
        if Review.objects.filter(order_item=item).exists():
            return Response(
                {"detail": "Sản phẩm trong đơn này đã được đánh giá."}, status=409
            )
        review = Review.objects.create(
            order_item=item, rating=data["rating"], body=data["body"]
        )
        return Response({"id": review.pk}, status=201)


class ReviewReplyView(APIView):
    permission_classes = [IsAuthenticated]
    from_shop = False

    @transaction.atomic
    def post(self, request: Request, pk: int) -> Response:
        serializer = ReviewTextSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        assert isinstance(user, User)
        reviews = Review.objects.select_for_update(of=("self",)).filter(
            removed_at__isnull=True
        )
        if not self.from_shop:
            reviews = reviews.filter(
                order_item__variant__product__status=Product.Status.PUBLISHED
            )
        review = get_object_or_404(reviews, pk=pk)
        reply = ReviewReply.objects.create(
            review=review,
            author=user,
            body=serializer.validated_data["body"],
            from_shop=self.from_shop,
        )
        return Response(reply_data(reply), status=201)


class AdminReviewReplyView(ReviewReplyView):
    permission_classes = [IsAdminRole]
    from_shop = True


class AdminReviewListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request: Request) -> Response:
        response = paginated_reviews(request, review_list(), admin=True)
        response["Cache-Control"] = "private, no-store"
        return response


class AdminReviewDeleteView(APIView):
    permission_classes = [IsAdminRole]

    def delete(self, request: Request, pk: int) -> Response:
        removed = Review.objects.filter(pk=pk, removed_at__isnull=True).update(
            removed_at=timezone.now(), removed_by=request.user
        )
        if not removed:
            get_object_or_404(Review.objects.only("pk"), pk=pk)
        return Response(status=204)
