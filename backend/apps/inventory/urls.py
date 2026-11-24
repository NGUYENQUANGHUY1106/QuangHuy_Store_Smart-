from django.urls import path

from .views import (
    InventoryAdjustView,
    InventoryBalanceListView,
    InventoryMovementListView,
)

urlpatterns = [
    path("admin/inventory/adjust", InventoryAdjustView.as_view()),
    path("admin/inventory/movements", InventoryMovementListView.as_view()),
    path("admin/inventory/balances", InventoryBalanceListView.as_view()),
]
