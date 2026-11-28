import json
from decimal import Decimal
from io import BytesIO
from pathlib import Path

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, override_settings
from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart
from PIL import Image

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductVariant,
)
from apps.identity.models import User
from apps.orders.models import Order, OrderItem
from tests.auth_headers import auth_headers


@pytest.mark.django_db
def test_create_product_and_append_colors_with_images_and_initial_stock(
    client: Client,
) -> None:
    admin = User.objects.create_user(username="color-admin", role=User.Role.ADMIN)
    customer = User.objects.create_user(username="color-customer")
    category = Category.objects.create(name="Giày", slug="giay")
    brand = Brand.objects.create(name="Nike", slug="nike")

    def picture(color: str) -> SimpleUploadedFile:
        buffer = BytesIO()
        Image.new("RGB", (20, 20), color).save(buffer, "PNG")
        return SimpleUploadedFile("shoe.png", buffer.getvalue(), "image/png")

    def colors(*names: str) -> str:
        return json.dumps(
            [
                {
                    "color": name,
                    "sizes": [
                        {"size": "40", "unit_price": "100000", "stock_qty": 7},
                        {"size": "41", "unit_price": "120000", "stock_qty": 0},
                    ],
                }
                for name in names
            ]
        )

    product = {
        "name": "Vapor",
        "slug": "vapor",
        "status": "published",
        "category": str(category.pk),
        "brand": str(brand.pk),
    }
    invalid = client.post(
        "/admin/products",
        {
            **product,
            "colors": colors("Đỏ", "Xanh"),
            "main_0": picture("red"),
            "main_1": SimpleUploadedFile("bad.png", b"bad", "image/png"),
        },
        **auth_headers(admin),
    )
    assert invalid.status_code == 400
    assert not Product.objects.exists()
    assert not InventoryMovement.objects.exists()

    created = client.post(
        "/admin/products",
        {
            **product,
            "colors": colors("Đỏ", "Xanh"),
            "main_0": picture("red"),
            "extras_0": [picture("orange"), picture("pink")],
            "main_1": picture("blue"),
        },
        **auth_headers(admin),
    )
    assert created.status_code == 201, created.json()
    body = created.json()
    variants = body["variants"]
    assert len({row["sku"] for row in variants}) == 4
    assert [(row["size"], row["stock_qty"]) for row in variants] == [
        ("40", 7),
        ("40", 7),
        ("41", 0),
        ("41", 0),
    ]
    assert (
        InventoryMovement.objects.filter(actor=admin, delta=7, after_qty=7).count() == 2
    )
    media = body["images"]
    assert [entry["sort_order"] for entry in media] == [0, 1, 2, 3]
    assert body["thumbnail"] == media[0]["url"]
    detail = client.get("/products/vapor").json()
    assert len(detail["images"]) == 4
    response = client.get(detail["images"][0]["url"])
    assert response.status_code == 200 and response["Content-Type"] == "image/webp"

    url = f"/admin/products/{body['id']}/colors"
    denied = client.post(url, {"colors": colors("Vàng")}, **auth_headers(customer))
    assert denied.status_code == 403
    added = client.post(
        url,
        {
            "colors": colors("Vàng"),
            "main_0": picture("yellow"),
        },
        **auth_headers(admin),
    )
    assert added.status_code == 201
    assert len(added.json()["variants"]) == 6
    duplicate = client.post(
        url,
        {
            "colors": colors("vàng"),
            "main_0": picture("yellow"),
        },
        **auth_headers(admin),
    )
    assert duplicate.status_code == 400
    assert ProductVariant.objects.count() == 6
    assert InventoryMovement.objects.count() == 3


@pytest.mark.django_db
def test_customer_cannot_access_admin_catalog(client: Client) -> None:
    customer = User.objects.create_user(
        username="cust@example.com",
        email="cust@example.com",
        password="Password123",
        role=User.Role.CUSTOMER,
    )
    res = client.get("/admin/categories", **auth_headers(customer))
    assert res.status_code == 403


@pytest.mark.django_db
def test_admin_category_cycle_prevented(client: Client) -> None:
    admin = User.objects.create_user(
        username="admin@example.com",
        email="admin@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    cat_a = Category.objects.create(name="Cat A", slug="cat-a")
    cat_b = Category.objects.create(name="Cat B", slug="cat-b", parent=cat_a)

    # Setting cat_a's parent to cat_b creates cycle
    res = client.patch(
        f"/admin/categories/{cat_a.id}",
        {"parent": str(cat_b.id)},
        content_type="application/json",
        **auth_headers(admin),
    )
    assert res.status_code == 400
    assert "parent" in res.json()


@pytest.mark.django_db
def test_admin_cannot_delete_variant_with_orders(client: Client) -> None:
    admin = User.objects.create_user(
        username="admin2@example.com",
        email="admin2@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    customer = User.objects.create_user(
        username="cust2@example.com",
        email="cust2@example.com",
        password="Password123",
        role=User.Role.CUSTOMER,
    )
    category = Category.objects.create(name="Giày", slug="giay-admin")
    brand = Brand.objects.create(name="Nike", slug="nike-admin")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Giày Admin Test",
        slug="giay-admin-test",
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="ADMIN-SKU-1",
        size="42",
        color="Đen",
        unit_price=Decimal("1000000"),
    )
    InventoryBalance.objects.create(variant=variant, stock_qty=5)
    order = Order.objects.create(
        number="QHS-ADM-001",
        user=customer,
        subtotal=Decimal("1000000"),
        total=Decimal("1000000"),
        address_snapshot={},
    )
    OrderItem.objects.create(
        order=order,
        variant=variant,
        product_name_snapshot="Giày Admin Test",
        sku_snapshot="ADMIN-SKU-1",
        size_snapshot="42",
        color_snapshot="Đen",
        unit_price=Decimal("1000000"),
        qty=1,
        line_subtotal=Decimal("1000000"),
    )

    delete_res = client.delete(
        f"/admin/variants/{variant.id}",
        **auth_headers(admin),
    )
    assert delete_res.status_code == 400
    assert "Không thể xóa biến thể đã phát sinh đơn hàng" in str(delete_res.json())


@pytest.mark.django_db
def test_admin_media_upload_validation(client: Client, tmp_path: Path) -> None:
    admin = User.objects.create_user(
        username="admin3@example.com",
        email="admin3@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    bad_file = SimpleUploadedFile(
        "script.exe", b"malicious content", content_type="application/octet-stream"
    )
    res_bad = client.post(
        "/admin/media/upload", {"file": bad_file}, **auth_headers(admin)
    )
    assert res_bad.status_code == 400

    fake_file = SimpleUploadedFile(
        "shoe.png", b"fake image bytes", content_type="image/png"
    )
    response = client.post(
        "/admin/media/upload", {"file": fake_file}, **auth_headers(admin)
    )
    assert response.status_code == 400

    oversized = SimpleUploadedFile("shoe.png", b"x" * (5 * 1024 * 1024 + 1))
    response = client.post(
        "/admin/media/upload", {"file": oversized}, **auth_headers(admin)
    )
    assert response.status_code == 400
    assert "5 MB" in response.json()["file"]

    image = BytesIO()
    Image.new("RGB", (2, 2)).save(image, format="PNG")
    good_file = SimpleUploadedFile(
        "shoe.png", image.getvalue(), content_type="image/png"
    )
    with override_settings(MEDIA_ROOT=tmp_path):
        response = client.post(
            "/admin/media/upload", {"file": good_file}, **auth_headers(admin)
        )
    assert response.status_code == 201
    key = response.json()["storage_key"]
    assert key.startswith("/media/catalog/")
    with Image.open(tmp_path / key.removeprefix("/media/")) as stored:
        assert stored.size == (2, 2)


@pytest.mark.django_db
def test_product_editor_renames_color_and_replaces_db_image(client: Client) -> None:
    admin = User.objects.create_user(username="product-editor", role=User.Role.ADMIN)
    customer = User.objects.create_user(username="product-viewer")
    category = Category.objects.create(name="Boots", slug="editor-boots")
    brand = Brand.objects.create(name="Editor brand", slug="editor-brand")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Boot",
        slug="editor-boot",
        status=Product.Status.PUBLISHED,
    )
    variants = [
        ProductVariant.objects.create(
            product=product,
            sku=f"EDITOR-{size}",
            size=size,
            color="Blue",
            unit_price=100,
        )
        for size in ("41", "42")
    ]
    red = ProductVariant.objects.create(
        product=product, sku="EDITOR-RED", size="41", color="Red", unit_price=200
    )
    headers = auth_headers(admin)
    color_url = f"/admin/products/{product.pk}/colors"
    data = {"color": "Blue", "new_color": "Navy"}
    assert (
        client.patch(
            color_url, data, content_type="application/json", **auth_headers(customer)
        ).status_code
        == 403
    )
    assert (
        client.patch(
            color_url,
            {**data, "new_color": "Red"},
            content_type="application/json",
            **headers,
        ).status_code
        == 400
    )
    assert (
        client.patch(
            color_url, data, content_type="application/json", **headers
        ).status_code
        == 200
    )
    assert product.variants.filter(color="Navy").count() == 2
    price_url = f"/admin/variants/{variants[0].pk}"
    assert (
        client.patch(
            price_url, {"unit_price": "125"}, content_type="application/json", **headers
        ).status_code
        == 200
    )
    assert product.variants.get(pk=red.pk).unit_price == 200

    def file(color: str) -> SimpleUploadedFile:
        payload = BytesIO()
        Image.new("RGB", (4, 4), color).save(payload, format="PNG")
        return SimpleUploadedFile(
            "boot.png", payload.getvalue(), content_type="image/png"
        )

    created = client.post(
        "/admin/media/upload",
        {
            "product_id": str(product.pk),
            "variant_id": str(variants[0].pk),
            "alt_text": "Outer side",
            "file": file("navy"),
        },
        **headers,
    )
    assert created.status_code == 201
    original = created.json()["storage_key"]
    item = product.images.get()
    payload = encode_multipart(
        BOUNDARY, {"alt_text": "Heel", "sort_order": "2", "file": file("blue")}
    )
    updated = client.patch(
        f"/admin/media/{item.pk}", payload, content_type=MULTIPART_CONTENT, **headers
    )
    assert updated.status_code == 200
    url = updated.json()["storage_key"]
    assert url != original
    response = client.get(url)
    assert response["Content-Type"] == "image/webp"
    with Image.open(BytesIO(response.content)) as rendered:
        assert rendered.size == (4, 4)
    assert product.images.count() == 1
    assert product.images.get().variant_id == variants[0].pk
    detail = client.get(f"/admin/products/{product.pk}", **headers).json()
    assert detail["images"][0]["alt_text"] == "Heel"
    assert detail["images"][0]["sort_order"] == 2
