import pytest
from django.db import IntegrityError, transaction
from django.test import Client

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    Product,
    ProductVariant,
)

CatalogFixture = tuple[Category, Brand, Product, ProductVariant]


@pytest.fixture
def catalog_data(db: None) -> CatalogFixture:
    category = Category.objects.create(name="Giày bóng đá", slug="giay-bong-da")
    brand = Brand.objects.create(name="Nike", slug="nike")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Mercurial Vapor",
        slug="mercurial-vapor",
        description="Giày bóng đá mẫu",
        status=Product.Status.PUBLISHED,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="MV-41-BLACK",
        size="41",
        color="Đen",
        unit_price="3890000",
    )
    InventoryBalance.objects.create(variant=variant, stock_qty=5)
    return category, brand, product, variant


@pytest.mark.django_db
def test_categories_and_brands_are_public(
    client: Client, catalog_data: CatalogFixture
) -> None:
    categories = client.get("/categories")
    brands = client.get("/brands")
    assert categories.status_code == 200
    assert brands.status_code == 200
    assert categories.json()["count"] >= 1
    assert brands.json()["results"][0]["name"] == "Nike"


@pytest.mark.django_db
def test_product_filter_and_detail(
    client: Client, catalog_data: CatalogFixture
) -> None:
    _, _, product, variant = catalog_data
    response = client.get(
        "/products",
        {"category": "giay-bong-da", "brand": "nike", "size": "41", "in_stock": "true"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["slug"] == product.slug

    detail = client.get(f"/products/{product.slug}")
    assert detail.status_code == 200
    assert detail.json()["variants"][0]["sku"] == variant.sku
    assert detail.json()["variants"][0]["stock_qty"] == 5

    suggestions = client.get("/search/suggestions", {"q": "Mercurial"})
    assert suggestions.status_code == 200
    assert [entry["slug"] for entry in suggestions.json()["products"]] == [product.slug]


@pytest.mark.django_db
def test_hidden_product_is_not_public(
    client: Client, catalog_data: CatalogFixture
) -> None:
    _, _, product, _ = catalog_data
    product.status = Product.Status.DRAFT
    product.save(update_fields=["status"])
    assert client.get(f"/products/{product.slug}").status_code == 404
    assert (
        client.get("/search/suggestions", {"q": "Mercurial"}).json()["products"] == []
    )


@pytest.mark.django_db
def test_variant_duplicate_and_negative_stock_are_rejected(
    catalog_data: CatalogFixture,
) -> None:
    _, _, product, variant = catalog_data
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ProductVariant.objects.create(
                product=product,
                sku="MV-41-BLACK",
                size="42",
                color="Trắng",
                unit_price="100",
            )

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            variant.inventory.stock_qty = -1
            variant.inventory.save(update_fields=["stock_qty"])


@pytest.mark.django_db
def test_invalid_product_filter_returns_validation_error(
    client: Client,
    catalog_data: CatalogFixture,
) -> None:
    response = client.get("/products", {"sort": "unknown"})
    assert response.status_code == 400
