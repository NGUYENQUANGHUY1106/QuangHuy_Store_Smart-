from decimal import Decimal

import pytest
from django.test import Client

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    Product,
    ProductVariant,
)
from apps.identity.models import User
from apps.orders.models import Order, OrderItem, OrderStatusEvent
from tests.auth_headers import auth_headers


@pytest.mark.django_db
def test_order_state_transitions_dec008(client: Client) -> None:
    admin = User.objects.create_user(
        username="admin_trans@example.com",
        email="admin_trans@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    customer = User.objects.create_user(
        username="cust_trans@example.com",
        email="cust_trans@example.com",
        password="Password123",
        role=User.Role.CUSTOMER,
    )

    category = Category.objects.create(name="Giày Trans", slug="giay-trans")
    brand = Brand.objects.create(name="Puma Trans", slug="puma-trans")
    product = Product.objects.create(
        category=category, brand=brand, name="Giày Trans", slug="giay-trans"
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="TRANS-42",
        size="42",
        color="Đen",
        unit_price=Decimal("800000"),
    )
    InventoryBalance.objects.create(variant=variant, stock_qty=10)

    order = Order.objects.create(
        number="QHS-TRANS-001",
        user=customer,
        status=Order.Status.PENDING,
        subtotal=Decimal("800000"),
        total=Decimal("800000"),
        address_snapshot={},
    )
    OrderItem.objects.create(
        order=order,
        variant=variant,
        product_name_snapshot="Giày Trans",
        sku_snapshot="TRANS-42",
        size_snapshot="42",
        color_snapshot="Đen",
        unit_price=Decimal("800000"),
        qty=2,
        line_subtotal=Decimal("1600000"),
    )

    # 1. Admin confirms order (PENDING -> CONFIRMED)
    res_confirm = client.post(
        f"/admin/orders/{order.id}/status",
        {"status": "CONFIRMED", "reason": "Xác nhận có hàng"},
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res_confirm.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.CONFIRMED

    # 2. Customer attempts to cancel CONFIRMED order -> Forbidden/Conflict by DEC-008
    res_cust_cancel = client.post(
        f"/orders/{order.id}/cancel",
        {},
        content_type="application/json",
        **auth_headers(customer),
    )
    assert res_cust_cancel.status_code == 409
    assert res_cust_cancel.json()["error"]["code"] == "invalid_transition"

    stale = client.post(
        f"/admin/orders/{order.id}/status",
        {"status": "SHIPPING", "expected_version": order.version - 1},
        content_type="application/json",
        **auth_headers(admin),
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "version_conflict"
    order.refresh_from_db()
    assert order.status == Order.Status.CONFIRMED

    # 3. Admin transitions CONFIRMED -> SHIPPING
    res_ship = client.post(
        f"/admin/orders/{order.id}/status",
        {
            "status": "SHIPPING",
            "reason": "Đã bàn giao đơn vị vận chuyển",
            "expected_version": order.version,
        },
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res_ship.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.SHIPPING

    # 4. Admin attempts to cancel SHIPPING order -> Disallowed by DEC-008
    res_cancel_shipping = client.post(
        f"/admin/orders/{order.id}/status",
        {"status": "CANCELLED", "reason": "Hủy khi đang giao"},
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res_cancel_shipping.status_code == 409
    assert "invalid_transition" in res_cancel_shipping.json()["error"]["code"]

    # 5. Admin transitions SHIPPING -> COMPLETED
    res_complete = client.post(
        f"/admin/orders/{order.id}/status",
        {"status": "COMPLETED", "reason": "Khách đã nhận hàng thành công"},
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res_complete.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.COMPLETED

    # 6. Verify event history
    events = OrderStatusEvent.objects.filter(order=order).order_by("created_at")
    assert events.count() >= 3
    event_statuses = [(e.from_status, e.to_status) for e in events]
    assert ("PENDING", "CONFIRMED") in event_statuses
    assert ("CONFIRMED", "SHIPPING") in event_statuses
    assert ("SHIPPING", "COMPLETED") in event_statuses
