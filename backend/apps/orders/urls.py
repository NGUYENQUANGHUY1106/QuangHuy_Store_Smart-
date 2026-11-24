from django.urls import path

from .views import (
    AdminOrderDetailView,
    AdminOrderListView,
    AdminOrderStatusTransitionView,
    CheckoutQuoteView,
    CheckoutView,
    OrderCancelView,
    OrderDetailView,
    OrderListView,
)

urlpatterns = [
    path("checkout/quote", CheckoutQuoteView.as_view()),
    path("checkout/orders", CheckoutView.as_view()),
    path("orders", OrderListView.as_view()),
    path("orders/<str:pk>", OrderDetailView.as_view()),
    path("orders/<str:pk>/cancel", OrderCancelView.as_view()),
    path("admin/orders", AdminOrderListView.as_view()),
    path("admin/orders/<str:pk>", AdminOrderDetailView.as_view()),
    path("admin/orders/<str:pk>/status", AdminOrderStatusTransitionView.as_view()),
]
