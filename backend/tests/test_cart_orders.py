from decimal import Decimal

import pytest
from django.test import Client
from django.urls import reverse

from apps.cart.models import Cart, CartItem
from apps.catalog.models import InventoryBalance, InventoryMovement, ProductImage
from apps.identity.models import User
from apps.vouchers.models import Voucher
from tests.auth_headers import auth_headers


@pytest.mark.django_db
def test_cart_rejects_quantity_over_stock(client: Client) -> None:
    user = User.objects.create_user(
        username="cart@example.com",
        email="cart@example.com",
        password="StrongPassword123",
    )
    from apps.catalog.models import Brand, Category, Product, ProductVariant

    category = Category.objects.create(name="Giày", slug="giay")
    brand = Brand.objects.create(name="Nike", slug="nike")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Giày test",
        slug="giay-test",
        status=Product.Status.PUBLISHED,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="TEST-41",
        size="41",
        color="Đen",
        unit_price=Decimal("600000"),
    )
    InventoryBalance.objects.create(variant=variant, stock_qty=2)

    response = client.post(
        "/cart/items",
        {"variant_id": str(variant.id), "qty": 3},
        content_type="application/json",
        **auth_headers(user),
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "insufficient_stock"

    headers = auth_headers(user)
    merge_key = "00000000-0000-4000-8000-000000000001"
    items = {"items": [{"variant_id": str(variant.pk), "qty": 1}]}
    for _ in range(2):
        merge = client.post(
            "/cart/merge",
            items,
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY=merge_key,
            **headers,
        )
        assert merge.status_code == 200
        assert merge.json()["items"][0]["qty"] == 1
    changed = client.post(
        "/cart/merge",
        {"items": [{"variant_id": str(variant.pk), "qty": 2}]},
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY=merge_key,
        **headers,
    )
    assert changed.status_code == 409
    assert changed.json()["error"]["code"] == "idempotency_conflict"
    outsider = User.objects.create_user(username="cart-outsider")
    other_headers = auth_headers(outsider)
    line = merge.json()["items"][0]["id"]
    assert client.get("/cart", **other_headers).json()["items"] == []
    assert (
        client.patch(
            f"/cart/items/{line}",
            {"qty": 2},
            content_type="application/json",
            **other_headers,
        ).status_code
        == 404
    )
    assert client.delete(f"/cart/items/{line}", **other_headers).status_code == 404
    InventoryBalance.objects.filter(variant=variant).update(stock_qty=0)
    checkout = client.post(
        "/checkout/orders",
        {
            "payment_method": "COD",
            "address_snapshot": {
                "receiver": "Sample",
                "phone": "0900000000",
                "street": "1 Sample",
            },
        },
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY="tc002-stock-zero-checkout",
        **auth_headers(user),
    )
    assert checkout.status_code == 409
    assert checkout.json()["error"]["code"] == "insufficient_stock"
    assert not user.orders.exists()
    assert not InventoryMovement.objects.filter(variant=variant).exists()


@pytest.mark.django_db
def test_checkout_deducts_stock_and_cancel_restores_once(client: Client) -> None:
    user = User.objects.create_user(
        username="order@example.com",
        email="order@example.com",
        password="StrongPassword123",
    )
    from apps.catalog.models import Brand, Category, Product, ProductVariant

    category = Category.objects.create(name="Giày", slug="giay")
    brand = Brand.objects.create(name="Adidas", slug="adidas")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Giày order",
        slug="giay-order",
        status=Product.Status.PUBLISHED,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="ORDER-41",
        size="41",
        color="Trắng",
        unit_price=Decimal("600000"),
    )
    balance = InventoryBalance.objects.create(variant=variant, stock_qty=3)
    cart = Cart.objects.create(user=user)
    CartItem.objects.create(cart=cart, variant=variant, qty=2)

    other_color = ProductVariant.objects.create(
        product=product,
        sku="ORDER-RED-41",
        size="41",
        color="Red",
        unit_price=Decimal("600000"),
    )
    ProductImage.objects.create(
        product=product, variant=other_color, storage_key="/red.jpg"
    )
    photo_variant = ProductVariant.objects.create(
        product=product,
        sku="ORDER-PHOTO-42",
        size="42",
        color=variant.color,
        unit_price=Decimal("600000"),
    )
    image = ProductImage(product=product, variant=photo_variant, webp_data=b"test")
    image.storage_key = reverse("catalog-db-image", args=[image.pk])
    image.save()
    assert (
        client.get("/cart", **auth_headers(user)).json()["items"][0]["thumbnail"]
        == image.storage_key
    )

    key = "checkout-test-key-001"
    payload = {
        "payment_method": "COD",
        "address_snapshot": {
            "receiver": "Khách Test",
            "phone": "0900000000",
            "street": "123 Test",
            "area": {"city": "TP HCM"},
        },
    }
    quoted = client.post(
        "/checkout/quote", {}, content_type="application/json", **auth_headers(user)
    )
    assert quoted.status_code == 200
    assert Decimal(quoted.json()["total"]) == Decimal("1200000")
    payload["quote_token"] = quoted.json()["quote_token"]
    variant.unit_price = Decimal("650000")
    variant.save(update_fields=["unit_price"])
    stale = client.post(
        "/checkout/orders",
        payload,
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY=key,
        **auth_headers(user),
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["code"] == "quote_changed"
    balance.refresh_from_db()
    assert balance.stock_qty == 3
    assert not InventoryMovement.objects.exists()
    quoted = client.post(
        "/checkout/quote", {}, content_type="application/json", **auth_headers(user)
    )
    payload["quote_token"] = quoted.json()["quote_token"]
    payload["total"] = "1"
    checkout = client.post(
        "/checkout/orders",
        payload,
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY=key,
        **auth_headers(user),
    )
    assert checkout.status_code == 201
    assert checkout.json()["items"][0]["thumbnail"] == image.storage_key
    number = checkout.json()["number"]
    assert (
        client.get(f"/orders/{number}", **auth_headers(user)).json()["items"][0][
            "thumbnail"
        ]
        == image.storage_key
    )
    admin = User.objects.create_user(username="thumbnail-admin", role=User.Role.ADMIN)
    assert (
        client.get(f"/admin/orders/{number}", **auth_headers(admin)).json()["items"][0][
            "thumbnail"
        ]
        == image.storage_key
    )

    order_id = checkout.json()["id"]
    assert Decimal(checkout.json()["total"]) == Decimal("1300000")
    balance.refresh_from_db()
    assert balance.stock_qty == 1

    replay = client.post(
        "/checkout/orders",
        payload,
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY=key,
        **auth_headers(user),
    )
    assert replay.status_code == 200
    assert replay.json()["id"] == order_id
    balance.refresh_from_db()
    assert balance.stock_qty == 1

    other = User.objects.create_user(
        username="other@example.com", email="other@example.com"
    )
    other_headers = auth_headers(other)
    assert client.get("/orders", **other_headers).json()["results"] == []
    assert client.get(f"/orders/{order_id}", **other_headers).status_code == 404
    assert client.post(f"/orders/{order_id}/cancel", **other_headers).status_code == 404

    product.name = "New catalog name"
    product.save(update_fields=["name"])
    details = client.get(f"/orders/{order_id}", **auth_headers(user)).json()
    assert details["items"][0]["product_name_snapshot"] != product.name
    assert details["address_snapshot"] == payload["address_snapshot"]
    assert [event["to_status"] for event in details["status_history"]] == ["PENDING"]

    cancel = client.post(
        f"/orders/{order_id}/cancel",
        {},
        content_type="application/json",
        **auth_headers(user),
    )
    assert cancel.status_code == 200
    assert {event["to_status"] for event in cancel.json()["status_history"]} == {
        "PENDING",
        "CANCELLED",
    }
    balance.refresh_from_db()
    assert balance.stock_qty == 3
    assert InventoryMovement.objects.filter(kind="cancel_return").count() == 1

    second_cancel = client.post(
        f"/orders/{order_id}/cancel",
        {},
        content_type="application/json",
        **auth_headers(user),
    )
    assert second_cancel.status_code == 409
    balance.refresh_from_db()
    assert balance.stock_qty == 3


@pytest.mark.django_db
def test_shipping_free_at_500k_and_fixed_voucher(client: Client) -> None:
    user = User.objects.create_user(
        username="voucher@example.com",
        email="voucher@example.com",
        password="StrongPassword123",
    )
    from apps.catalog.models import Brand, Category, Product, ProductVariant

    category = Category.objects.create(name="Giày", slug="giay")
    brand = Brand.objects.create(name="Puma", slug="puma")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Giày voucher",
        slug="giay-voucher",
        status=Product.Status.PUBLISHED,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="VOUCHER-42",
        size="42",
        color="Xanh",
        unit_price=Decimal("500000"),
    )
    InventoryBalance.objects.create(variant=variant, stock_qty=2)
    cart = Cart.objects.create(user=user)
    CartItem.objects.create(cart=cart, variant=variant, qty=1)
    Voucher.objects.create(
        code="SAVE30",
        name="Giảm 30k",
        discount_type=Voucher.DiscountType.FIXED,
        value=Decimal("30000"),
        min_order_value=Decimal("500000"),
        start_date="2020-01-01T00:00:00Z",
        end_date="2099-01-01T00:00:00Z",
        usage_limit=10,
    )

    validate = client.post(
        "/vouchers/validate",
        {"code": "SAVE30"},
        content_type="application/json",
        **auth_headers(user),
    )
    assert validate.status_code == 200
    assert validate.json()["discount"] == "30000"

    checkout = client.post(
        "/checkout/orders",
        {
            "payment_method": "COD",
            "voucher_code": "SAVE30",
            "address_snapshot": {"receiver": "Test", "phone": "090", "street": "A"},
        },
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY="voucher-checkout-001",
        **auth_headers(user),
    )
    assert checkout.status_code == 201
    assert checkout.json()["shipping"] == "0.00"
    assert checkout.json()["discount"] == "30000.00"
    assert checkout.json()["total"] == "470000.00"


@pytest.mark.django_db
def test_order_pages_only_include_the_requesting_owner(client: Client) -> None:
    from apps.orders.models import Order

    owner = User.objects.create_user(username="page-owner@example.test")
    other = User.objects.create_user(username="page-other@example.test")
    orders = [
        Order(user=owner, number=f"QHS-PAGE-{i:02}", subtotal=100, total=100)
        for i in range(21)
    ]
    Order.objects.bulk_create(orders)
    Order.objects.create(user=other, number="QHS-OTHER", subtotal=100, total=100)
    headers = auth_headers(owner)
    first = client.get("/orders", **headers).json()
    second = client.get("/orders", {"page": 2}, **headers).json()

    assert first["count"] == second["count"] == 21
    assert first["next"] and second["previous"]
    assert len(first["results"]) == 20
    numbers = {row["number"] for row in first["results"] + second["results"]}
    assert numbers == {order.number for order in orders}
