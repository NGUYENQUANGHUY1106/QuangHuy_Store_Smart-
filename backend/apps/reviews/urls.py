from django.urls import path

from .views import (
    AdminReviewDeleteView,
    AdminReviewListView,
    AdminReviewReplyView,
    ProductReviewsView,
    ReviewCreateView,
    ReviewReplyView,
)

urlpatterns = [
    path("products/<slug:slug>/reviews", ProductReviewsView.as_view()),
    path("reviews", ReviewCreateView.as_view()),
    path("reviews/<int:pk>/replies", ReviewReplyView.as_view()),
    path("admin/reviews", AdminReviewListView.as_view()),
    path("admin/reviews/<int:pk>", AdminReviewDeleteView.as_view()),
    path("admin/reviews/<int:pk>/replies", AdminReviewReplyView.as_view()),
]
