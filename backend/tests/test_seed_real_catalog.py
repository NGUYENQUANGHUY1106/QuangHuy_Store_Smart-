import io
import json
from pathlib import Path
from typing import NotRequired, TypedDict
from unittest.mock import patch

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db.models import Sum
from django.test import Client
from django.urls import reverse
from PIL import Image, ImageDraw

from apps.catalog.models import InventoryBalance, Product, ProductImage


class GalleryFixture(TypedDict):
    angle: str
    image_url: str


class ColorFixture(TypedDict):
    color: str
    style_code: str
    product_url: str
    image_url: str
    rights: str
    gallery: NotRequired[list[GalleryFixture]]
    fallback_urls: NotRequired[list[str]]


class ProductFixture(TypedDict):
    kind: str
    name: str
    brand: str
    price: str
    colors: list[ColorFixture]


@pytest.mark.django_db
def test_seed_real_catalog_stores_images_and_balanced_stock(
    client: Client, tmp_path: Path
) -> None:
    products: list[ProductFixture] = [
        {
            "kind": ("boots", "apparel", "ball", "accessory")[i % 4],
            "name": f"Import fixture {i}",
            "brand": "Fixture",
            "price": "250000",
            "colors": [
                {
                    "color": color,
                    "style_code": f"fixture-{i}-{color}",
                    "product_url": "https://example.test/product",
                    "image_url": f"https://example.test/{i}/{color}.webp",
                    "rights": "Test fixture created for this test.",
                }
                for color in ("Black", "Red")
            ],
        }
        for i in range(4)
    ]
    manifest = tmp_path / "catalog.json"
    products[0]["colors"][0]["fallback_urls"] = [products[0]["colors"][0]["image_url"]]
    products[0]["colors"][0]["image_url"] = "https://example.test/unavailable"
    for index, source in enumerate(products[1]["colors"]):
        angles = (
            ("lateral", "medial", "top", "outsole", "heel")
            if not index
            else (
                "lateral",
                "detail",
            )
        )
        source["gallery"] = [
            {
                "angle": angle,
                "image_url": source["image_url"].replace(".webp", f"-{i}.webp"),
            }
            for i, angle in enumerate(angles)
        ]
    manifest.write_text(json.dumps([{"kind": "bad"}, *products]), encoding="utf-8")

    def fixture_webp(url: str, referer: str) -> bytes:
        assert referer == "https://example.test/product"
        if url.endswith("/unavailable"):
            raise CommandError("primary image unavailable")
        index, filename = url.split("/")[-2:]
        output = io.BytesIO()
        color = (
            int(index) * 18,
            180 if filename.startswith("Red") else 0,
            sum(filename.encode()) % 256,
        )
        Image.new("RGB", (800, 100), color).save(output, "WEBP", lossless=True)
        return output.getvalue()

    with patch(
        "apps.catalog.management.commands.seed_real_catalog.download_webp", fixture_webp
    ):
        with pytest.raises(CommandError, match="Some products"):
            call_command("seed_real_catalog", manifest=manifest)
        assert Product.objects.count() == 4
        manifest.write_text(json.dumps(products), encoding="utf-8")
        call_command("seed_real_catalog", manifest=manifest)

    assert Product.objects.count() == 4
    assert ProductImage.objects.filter(webp_data__isnull=False).count() == 13
    assert ProductImage.objects.filter(variant__isnull=True).count() == 0
    for balance in InventoryBalance.objects.select_related("variant"):
        total = balance.variant.movements.aggregate(total=Sum("delta"))["total"] or 0
        assert total == balance.stock_qty
    gallery = client.get("/api/catalog/products/real-import-fixture-1/").json()
    assert len(gallery["images"]) == 7
    assert [image["sort_order"] for image in gallery["images"]] == list(range(7))
    assert len({image["url"] for image in gallery["images"]}) == 7
    response = client.get("/api/catalog/products/")
    assert response.status_code == 200
    thumbnail = response.json()["results"][0]["thumbnail"]
    image = client.get(thumbnail)
    assert image.status_code == 200
    assert image["Content-Type"] == "image/webp"
    with Image.open(io.BytesIO(image.content)) as stored:
        assert stored.width == 800

    record = ProductImage.objects.get(pk=thumbnail.rsplit("/", 1)[-1])
    ProductImage.objects.create(
        product_id=record.product_id,
        storage_key="/images/product-placeholder.svg",
        sort_order=0,
    )
    record.product.images.filter(webp_data__isnull=False).update(sort_order=2)
    updated = client.get("/api/catalog/products/").json()
    replacement = next(
        item["thumbnail"]
        for item in updated["results"]
        if item["id"] == str(record.product_id)
    )
    assert replacement.startswith("/media/catalog-db/")
    Product.objects.filter(pk=record.product_id).update(status=Product.Status.DRAFT)
    assert client.get(reverse("catalog-db-image", args=[record.pk])).status_code == 404
    assert list(tmp_path.iterdir()) == [manifest]


@pytest.mark.parametrize("width, detail", [(599, True), (800, False), (800, True)])
def test_image_preprocessing_checks_width_and_edge_detail(
    width: int, detail: bool
) -> None:
    from apps.catalog.management.commands.seed_real_catalog import download_webp

    source = Image.new("RGB", (width, 200), "white")
    if detail:
        drawing = ImageDraw.Draw(source)
        for x in range(10, width - 10, 20):
            drawing.rectangle((x, 30, x + 5, 170), fill="black")
    encoded = io.BytesIO()
    source.save(encoded, "PNG")
    with patch(
        "apps.catalog.management.commands.seed_real_catalog.requests.get"
    ) as open_url:
        response = open_url.return_value.__enter__.return_value
        response.url = "https://example.test/image.png"
        response.iter_content.return_value = [encoded.getvalue()]
        if width < 600 or not detail:
            with pytest.raises(CommandError):
                download_webp("https://example.test/image.png")
        else:
            result = download_webp("https://example.test/image.png")
            with Image.open(io.BytesIO(result)) as webp:
                assert webp.format == "WEBP"
                assert webp.size == (800, 200)


def test_strict_boot_gallery_checks_secondary_view_labels() -> None:
    from apps.catalog.management.commands.seed_real_catalog import Command

    row: dict[str, object] = {
        "kind": "boots",
        "colors": [
            {"gallery": [{"angle": angle} for angle in angles]}
            for angles in (
                ("lateral", "medial", "top", "outsole", "heel"),
                ("lateral", "medial", "outsole"),
            )
        ],
    }
    with pytest.raises(CommandError, match="incorrect boot angles"):
        Command.validate_strict_gallery(row)
    row["colors"] = [
        {
            "gallery": [
                {"angle": a} for a in ("lateral", "medial", "top", "outsole", "heel")
            ]
        },
        {"gallery": [{"angle": angle} for angle in ("lateral", "top", "heel")]},
    ]
    Command.validate_strict_gallery(row)
