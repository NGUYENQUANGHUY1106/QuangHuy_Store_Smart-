from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import patch

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
def test_dashboard_internal_error_does_not_log_payload(
    client: Client, caplog: pytest.LogCaptureFixture
) -> None:
    admin = User.objects.create_user(username="error-admin", role=User.Role.ADMIN)
    headers = auth_headers(admin)
    with patch(
        "apps.analytics.views.timezone.now", side_effect=RuntimeError("private-fixture")
    ):
        response = client.get("/admin/analytics/dashboard", **headers)

    assert response.status_code == 500
    error = response.json()["error"]
    assert error["code"] == "internal_error"
    assert error["reference"] in caplog.text
    assert "private-fixture" not in caplog.text
    assert b"private-fixture" not in response.content


@pytest.mark.django_db
def test_customer_denied_dashboard_analytics(client: Client) -> None:
    customer = User.objects.create_user(
        username="cust_dash@example.com",
        email="cust_dash@example.com",
        password="Password123",
        role=User.Role.CUSTOMER,
    )
    res = client.get("/admin/analytics/dashboard", **auth_headers(customer))
    assert res.status_code == 403


@pytest.mark.django_db
def test_dashboard_uses_saigon_completion_day_and_excludes_shipping(
    client: Client,
) -> None:
    admin = User.objects.create_user(
        username="admin_dash@example.com",
        email="admin_dash@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    customer = User.objects.create_user(
        username="user_dash@example.com",
        email="user_dash@example.com",
        password="Password123",
    )

    category = Category.objects.create(name="Giày Dash", slug="giay-dash")
    brand = Brand.objects.create(name="Nike Dash", slug="nike-dash")
    product = Product.objects.create(
        category=category, brand=brand, name="Giày Dash", slug="giay-dash"
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="DASH-41",
        size="41",
        color="Đen",
        unit_price=Decimal("500000"),
    )
    InventoryBalance.objects.create(variant=variant, stock_qty=3)

    # 1. PENDING order (should NOT count as revenue per DEC-012)
    Order.objects.create(
        number="QHS-DASH-PENDING",
        user=customer,
        status=Order.Status.PENDING,
        subtotal=Decimal("1000000"),
        discount=Decimal("0"),
        shipping=Decimal("30000"),
        total=Decimal("1030000"),
        payment_method=Order.PaymentMethod.COD,
        address_snapshot={},
    )

    # 2. CANCELLED order (should NOT count as revenue per DEC-012)
    Order.objects.create(
        number="QHS-DASH-CANCEL",
        user=customer,
        status=Order.Status.CANCELLED,
        subtotal=Decimal("500000"),
        discount=Decimal("50000"),
        shipping=Decimal("30000"),
        total=Decimal("480000"),
        payment_method=Order.PaymentMethod.COD,
        address_snapshot={},
    )

    # Completed COD still cannot prove that money was collected.
    order_completed = Order.objects.create(
        number="QHS-DASH-COMPLETED",
        user=customer,
        status=Order.Status.COMPLETED,
        subtotal=Decimal("700000"),
        discount=Decimal("50000"),
        shipping=Decimal("30000"),
        total=Decimal("680000"),
        payment_method=Order.PaymentMethod.COD,
        address_snapshot={},
    )
    OrderItem.objects.create(
        order=order_completed,
        variant=variant,
        product_name_snapshot="Giày Dash",
        sku_snapshot="DASH-41",
        size_snapshot="41",
        color_snapshot="Đen",
        unit_price=Decimal("500000"),
        qty=1,
        line_subtotal=Decimal("500000"),
    )

    event = OrderStatusEvent.objects.create(
        order=order_completed, to_status=Order.Status.COMPLETED
    )
    OrderStatusEvent.objects.filter(pk=event.pk).update(
        created_at=datetime(2026, 11, 22, 17, 0, tzinfo=UTC)
    )
    headers = auth_headers(admin)
    endpoint = "/admin/analytics/dashboard"
    before = client.get(endpoint, {"date": "2026-11-22"}, **headers).json()
    assert before["revenue_delivered"] == "0.00"
    assert before["top_products"] == []
    assert client.get(endpoint, {"date": "invalid"}, **headers).status_code == 400

    res = client.get(endpoint, {"date": "2026-11-23"}, **headers)
    assert res.status_code == 200
    data = res.json()

    assert data["timezone"] == "Asia/Saigon"
    assert data["revenue_delivered"] == "650000.00"
    assert data["cod_collected"] is None
    assert data["orders"]["pending"] == 1
    assert data["orders"]["cancelled"] == 1
    assert data["orders"]["completed"] == 1
    assert data["inventory"]["low_stock_count"] == 1
    assert data["top_products"] == [{"sku_snapshot": "DASH-41", "quantity": 1}]
    assert data["metrics_policy"] == "dec_012"
