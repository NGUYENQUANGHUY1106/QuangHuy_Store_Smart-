from decimal import Decimal
from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.test.client import encode_multipart
from PIL import Image

from apps.cart.models import Cart, CartItem
from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductImage,
    ProductVariant,
)
from apps.identity.models import User
from apps.orders.models import Order
from apps.reviews.models import Review
from tests.auth_headers import auth_headers


@pytest.fixture
def variants() -> tuple[ProductVariant, ProductVariant]:
    product = Product.objects.create(
        name="Test kit",
        slug="test-kit",
        category=Category.objects.create(name="Clothing", slug="clothing"),
        brand=Brand.objects.create(name="Test brand", slug="test-brand"),
        status=Product.Status.PUBLISHED,
    )
    direct = ProductVariant.objects.create(
        product=product,
        sku="DIRECT-L",
        color="Navy",
        size="L",
        unit_price=Decimal(800000),
    )
    other = ProductVariant.objects.create(
        product=product,
        sku="CART-M",
        color="Black",
        size="M",
        unit_price=Decimal(600000),
    )
    InventoryBalance.objects.bulk_create(
        [
            InventoryBalance(variant=direct, stock_qty=5),
            InventoryBalance(variant=other, stock_qty=5),
        ]
    )
    return direct, other


@pytest.mark.django_db
def test_direct_checkout_reprices_one_variant_and_preserves_cart(
    client: Client, variants: tuple[ProductVariant, ProductVariant]
) -> None:
    direct, other = variants
    buyer = User.objects.create_user(username="checkout-buyer")
    headers = auth_headers(buyer)
    cart = Cart.objects.create(user=buyer)
    cart_line = CartItem.objects.create(cart=cart, variant=other, qty=3)
    selection = {"variant_id": str(direct.pk), "qty": 2}
    quote = client.post(
        "/checkout/quote",
        {"direct_item": selection},
        content_type="application/json",
        **headers,
    )
    assert quote.status_code == 200
    assert Decimal(quote.json()["total"]) == 1600000
    checkout = {
        "direct_item": selection,
        "address_snapshot": {
            "receiver": "Buyer",
            "phone": "0900000000",
            "street": "123 Test",
        },
    }
    for patch, expected in [
        ({}, 400),
        (
            {
                "direct_item": {**selection, "qty": 1},
                "quote_token": quote.json()["quote_token"],
            },
            409,
        ),
        (
            {
                "direct_item": {**selection, "qty": 6},
                "quote_token": quote.json()["quote_token"],
            },
            409,
        ),
    ]:
        response = client.post(
            "/checkout/orders",
            {**checkout, **patch},
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY="test-direct-checkout-key",
            **headers,
        )
        assert response.status_code == expected
    assert not buyer.orders.exists()
    checkout["quote_token"] = quote.json()["quote_token"]
    for expected in (201, 200):
        response = client.post(
            "/checkout/orders",
            checkout,
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY="test-direct-checkout-key",
            **headers,
        )
        assert response.status_code == expected
        items = response.json()["items"]
        assert [(item["sku_snapshot"], item["qty"]) for item in items] == [
            (direct.sku, 2)
        ]
    assert buyer.orders.count() == 1
    assert InventoryBalance.objects.get(variant=direct).stock_qty == 3
    assert InventoryMovement.objects.get(variant=direct).delta == -2
    cart_line.refresh_from_db()
    cart.refresh_from_db()
    assert (cart_line.qty, cart.revision) == (3, 0)


@pytest.mark.django_db
@pytest.mark.parametrize("buyer_role", [User.Role.CUSTOMER, User.Role.ADMIN])
def test_completed_owner_can_review_others_can_reply(
    client: Client, variants: tuple[ProductVariant, ProductVariant], buyer_role: str
) -> None:
    direct, _ = variants
    ProductImage.objects.create(
        product=direct.product, variant=direct, storage_key="/media/test-navy.webp"
    )
    buyer = User.objects.create_user(
        username="review-buyer",
        email="private@example.com",
        role=buyer_role,
        first_name="Nguyễn",
        last_name="Huy",
    )
    outsider = User.objects.create_user(username="review-outsider", first_name="Mai")
    admin = User.objects.create_user(
        username="reply-admin", role=User.Role.ADMIN, first_name="An"
    )
    owner_headers = auth_headers(buyer)
    outsider_headers = auth_headers(outsider)
    admin_headers = auth_headers(admin)
    endpoint = f"/products/{direct.product.slug}/reviews"
    selection = {"variant_id": str(direct.pk), "qty": 1}
    quote = client.post(
        "/checkout/quote",
        {"direct_item": selection},
        content_type="application/json",
        **owner_headers,
    )
    checkout = client.post(
        "/checkout/orders",
        {
            "direct_item": selection,
            "quote_token": quote.json()["quote_token"],
            "address_snapshot": {
                "receiver": "Buyer",
                "phone": "0900000000",
                "street": "123 Test",
            },
        },
        content_type="application/json",
        HTTP_IDEMPOTENCY_KEY="test-reviews-checkout-key",
        **owner_headers,
    )
    assert checkout.status_code == 201
    order = Order.objects.get(pk=checkout.json()["id"])
    item_id = str(order.items.get().pk)
    data = {"order_item_id": item_id, "rating": 5, "body": "<b>Genuine review</b>"}
    for order_status in (
        Order.Status.PENDING,
        Order.Status.SHIPPING,
        Order.Status.CANCELLED,
    ):
        order.status = order_status
        order.save(update_fields=["status"])
        assert (
            client.get(endpoint, **owner_headers).json()["eligible_order_item_id"]
            is None
        )
        assert (
            client.post(
                "/reviews", data, content_type="application/json", **owner_headers
            ).status_code
            == 403
        )
    order.status = Order.Status.COMPLETED
    order.save(update_fields=["status"])
    assert (
        client.get(endpoint, **owner_headers).json()["eligible_order_item_id"]
        == item_id
    )
    for headers in (outsider_headers, admin_headers):
        assert (
            client.get(endpoint, {"order_item": item_id}, **headers).json()[
                "eligible_order_item_id"
            ]
            is None
        )
        assert (
            client.post(
                "/reviews", data, content_type="application/json", **headers
            ).status_code
            == 404
        )
    assert (
        client.post("/reviews", data, content_type="application/json").status_code
        == 401
    )
    assert (
        client.post(
            "/reviews",
            {**data, "rating": 6},
            content_type="application/json",
            **owner_headers,
        ).status_code
        == 400
    )
    review = client.post(
        "/reviews", data, content_type="application/json", **owner_headers
    )
    assert review.status_code == 201
    assert (
        client.post(
            "/reviews", data, content_type="application/json", **owner_headers
        ).status_code
        == 409
    )
    review_id = review.json()["id"]
    reply_url = f"/reviews/{review_id}/replies"
    admin_url = f"/admin/reviews/{review_id}"
    assert (
        client.post(
            reply_url, {"body": "Guest reply"}, content_type="application/json"
        ).status_code
        == 401
    )
    for headers, label in [
        (owner_headers, "Nguyễn Huy"),
        (outsider_headers, "Mai"),
        (admin_headers, "An"),
    ]:
        response = client.post(
            reply_url,
            {"body": "Reply", "rating": 5, "from_shop": True},
            content_type="application/json",
            **headers,
        )
        assert response.status_code == 201
        assert response.json()["author"] == label
        assert response.json()["from_shop"] is False
        assert "rating" not in response.json()
    assert client.get("/admin/reviews", **outsider_headers).status_code == 403
    assert client.delete(admin_url, **outsider_headers).status_code == 403
    admin_reply = f"{admin_url}/replies"
    for headers, code in [(outsider_headers, 403), (admin_headers, 201)]:
        response = client.post(
            admin_reply,
            {"body": "Shop reply"},
            content_type="application/json",
            **headers,
        )
        assert response.status_code == code
    assert response.json()["from_shop"] is True
    assert response.json()["author"] == "Chủ shop"
    listing = client.get(endpoint)
    result = listing.json()["results"][0]
    assert result["rating"] == 5 and result["body"] == data["body"]
    assert result["author"] == "Nguyễn Huy"
    assert (result["size"], result["color"], result["thumbnail"]) == (
        "L",
        "Navy",
        "/media/test-navy.webp",
    )
    assert [reply["from_shop"] for reply in result["replies"]] == [
        False,
        False,
        False,
        True,
    ]
    urls = []
    for color in ("red", "blue"):
        buffer = BytesIO()
        Image.new("RGB", (100, 80), color).save(buffer, "PNG")
        multipart = encode_multipart(
            "test-avatar",
            {"avatar": SimpleUploadedFile("profile.png", buffer.getvalue())},
        )
        upload = client.put(
            "/auth/me/avatar",
            multipart,
            content_type="multipart/form-data; boundary=test-avatar",
            **owner_headers,
        )
        assert upload.status_code == 200
        url = upload.json()["avatar_url"]
        urls.append(url)
        photo = client.get(url)
        assert photo.status_code == 200 and photo["Content-Type"] == "image/webp"
        display = client.get(endpoint).json()["results"][0]
        assert (
            display["avatar_url"] == url and display["replies"][0]["avatar_url"] == url
        )
        assert display["replies"][-1]["avatar_url"] is None
    assert urls[0] != urls[1] and client.get(urls[0]).status_code == 404
    assert client.delete("/auth/me/avatar", **owner_headers).status_code == 200
    assert client.get(endpoint).json()["results"][0]["avatar_url"] is None
    admin_review = client.get("/admin/reviews", **admin_headers).json()["results"][0]
    assert (
        admin_review["customer_email"],
        admin_review["order_number"],
        admin_review["sku"],
    ) == (
        buyer.email,
        order.number,
        direct.sku,
    )
    assert (
        item_id not in listing.content.decode()
        and buyer.email not in listing.content.decode()
    )
    assert (
        client.get(endpoint, **owner_headers).json()["eligible_order_item_id"] is None
    )
    order_item = client.get(f"/orders/{order.pk}", **owner_headers).json()["items"][0]
    assert order_item["product_slug"] == direct.product.slug and order_item["reviewed"]
    assert client.delete(admin_url, **admin_headers).status_code == 204
    assert client.delete(admin_url, **admin_headers).status_code == 204
    assert client.get(endpoint).json()["results"] == []
    assert client.get("/admin/reviews", **admin_headers).json()["results"] == []
    removed = Review.objects.get(pk=review_id)
    assert removed.removed_by == admin and removed.replies.count() == 4
    assert (
        client.post(
            reply_url,
            {"body": "Late reply"},
            content_type="application/json",
            **owner_headers,
        ).status_code
        == 404
    )
