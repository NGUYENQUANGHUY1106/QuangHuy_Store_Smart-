from django.urls import path

from .views import CartItemDetailView, CartItemListView, CartMergeView, CartView

urlpatterns = [
    path("cart", CartView.as_view()),
    path("cart/items", CartItemListView.as_view()),
    path("cart/items/<uuid:pk>", CartItemDetailView.as_view()),
    path("cart/merge", CartMergeView.as_view()),
]
