from decimal import Decimal

import pytest
from django.test import Client

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductVariant,
)
from apps.identity.models import User
from tests.auth_headers import auth_headers


@pytest.mark.django_db
def test_customer_cannot_adjust_inventory(client: Client) -> None:
    customer = User.objects.create_user(
        username="cust_inv@example.com",
        email="cust_inv@example.com",
        password="Password123",
        role=User.Role.CUSTOMER,
    )
    res = client.post(
        "/admin/inventory/adjust",
        {"variant_id": "none", "delta": 5},
        **auth_headers(customer),
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_admin_inventory_adjust_atomic_and_idempotent(client: Client) -> None:
    admin = User.objects.create_user(
        username="admin_inv@example.com",
        email="admin_inv@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    category = Category.objects.create(name="Giày Inv", slug="giay-inv")
    brand = Brand.objects.create(name="Nike Inv", slug="nike-inv")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Giày Inv Test",
        slug="giay-inv-test",
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="INV-SKU-1",
        size="41",
        color="Đen",
        unit_price=Decimal("500000"),
    )
    balance = InventoryBalance.objects.create(variant=variant, stock_qty=5)

    # 1. Adjust +10
    op_key = "op-adjust-001"
    res1 = client.post(
        "/admin/inventory/adjust",
        {
            "variant_id": str(variant.id),
            "delta": 10,
            "reason": "Nhập thêm hàng",
            "operation_key": op_key,
        },
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res1.status_code == 201
    assert res1.json()["before_qty"] == 5
    assert res1.json()["after_qty"] == 15
    balance.refresh_from_db()
    assert balance.stock_qty == 15

    # 2. Replay with same operation_key -> must be idempotent
    res_replay = client.post(
        "/admin/inventory/adjust",
        {
            "variant_id": str(variant.id),
            "delta": 10,
            "reason": "Nhập thêm hàng",
            "operation_key": op_key,
        },
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res_replay.status_code == 200
    assert res_replay.json()["replayed"] is True
    balance.refresh_from_db()
    assert balance.stock_qty == 15
    assert InventoryMovement.objects.filter(operation_key=op_key).count() == 1

    mismatch = client.post(
        "/admin/inventory/adjust",
        {
            "variant_id": str(variant.id),
            "delta": 1,
            "reason": "Khác",
            "operation_key": op_key,
        },
        content_type="application/json",
        **auth_headers(admin),
    )
    assert mismatch.status_code == 409
    assert mismatch.json()["error"]["code"] == "idempotency_conflict"
    assert InventoryMovement.objects.get(operation_key=op_key).actor_id == admin.pk

    # 3. Adjust -20 when stock is 15 -> should reject with 409
    res_neg = client.post(
        "/admin/inventory/adjust",
        {
            "variant_id": str(variant.id),
            "delta": -20,
            "reason": "Xuất hủy quá số lượng",
            "operation_key": "op-adjust-002",
        },
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res_neg.status_code == 409
    assert res_neg.json()["error"]["code"] == "insufficient_stock"
    balance.refresh_from_db()
    assert balance.stock_qty == 15
