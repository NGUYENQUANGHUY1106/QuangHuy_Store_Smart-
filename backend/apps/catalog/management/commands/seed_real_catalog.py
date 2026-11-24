import hashlib
import io
import json
import random
from pathlib import Path
from typing import Any

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, connection, transaction
from django.db.models import Count, Exists, OuterRef
from django.urls import reverse
from django.utils.text import slugify
from PIL import Image, ImageFilter, ImageStat
from rest_framework import serializers

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductImage,
    ProductVariant,
)

SIZES = {
    "boots": ("39", "40", "41", "42", "43"),
    "apparel": ("S", "M", "L", "XL"),
    "accessory": ("FreeSize",),
    "ball": ("Size 4", "Size 5"),
}
CATEGORIES = {
    "boots": ("giay-bong-da", "Giày bóng đá"),
    "apparel": ("quan-ao-the-thao", "Quần áo thể thao"),
    "accessory": ("phu-kien-bong-da", "Phụ kiện bóng đá"),
    "ball": ("phu-kien-bong-da", "Phụ kiện bóng đá"),
}
MAX_BYTES = 12 * 1024 * 1024


ANGLES = (
    "lateral",
    "medial",
    "top",
    "outsole",
    "heel",
    "detail",
    "logo",
    "front",
    "back",
    "side",
)
ANGLE_LABELS = {
    "lateral": "Má ngoài",
    "medial": "Má trong",
    "top": "Mặt trên",
    "outsole": "Mặt đế",
    "heel": "Gót",
    "logo": "Chi tiết logo",
    "front": "Mặt trước",
    "back": "Mặt sau",
    "side": "Mặt bên",
    "detail": "Chi tiết",
}


class AngleSource(serializers.Serializer[dict[str, Any]]):
    angle = serializers.ChoiceField(choices=ANGLES)
    image_url = serializers.URLField(max_length=1000)
    fallback_urls = serializers.ListField(child=serializers.URLField(), required=False)


class ColorSource(serializers.Serializer[dict[str, Any]]):
    color = serializers.CharField(max_length=32)
    style_code = serializers.CharField(max_length=80)
    product_url = serializers.URLField(max_length=1000)
    image_url = serializers.URLField(max_length=1000, required=False)
    gallery = AngleSource(many=True, required=False)
    rights = serializers.CharField(max_length=1000)
    fallback_urls = serializers.ListField(child=serializers.URLField(), required=False)


class ProductSource(serializers.Serializer[dict[str, Any]]):
    kind = serializers.ChoiceField(choices=tuple(SIZES))
    name = serializers.CharField(max_length=200)
    brand = serializers.CharField(max_length=100)
    price = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=1)
    colors = ColorSource(many=True)
    description = serializers.CharField(max_length=2000, required=False)
    existing_slug = serializers.SlugField(required=False, max_length=200)

    def validate_colors(self, value: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not 1 <= len(value) <= 3:
            raise serializers.ValidationError("Supply 1–3 distinct color sources.")
        if any("gallery" in source for source in value):
            if len(value) < 2 or not all("gallery" in source for source in value):
                raise serializers.ValidationError("Supply galleries for 2–3 colors.")
            for index, source in enumerate(value):
                angles = [entry["angle"] for entry in source["gallery"]]
                minimum, maximum = (4, 5) if index == 0 else (2, 3)
                if (
                    len(set(angles)) != len(angles)
                    or not minimum <= len(angles) <= maximum
                ):
                    raise serializers.ValidationError(
                        "Invalid count or repeated gallery angle."
                    )
        elif any("image_url" not in source for source in value):
            raise serializers.ValidationError("Each color requires an image source.")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        first = attrs["colors"][0]
        if attrs["kind"] == "boots" and "gallery" in first:
            angles = [entry["angle"] for entry in first["gallery"]]
            if angles[0] != "lateral" or not set(ANGLES[:4]).issubset(angles):
                raise serializers.ValidationError(
                    "Default boot gallery lacks required angles."
                )
        return attrs


def download_webp(
    url: str,
    referer: str = "",
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36",
) -> bytes:
    if not url.startswith("https://"):
        raise CommandError("Image URL must use HTTPS.")
    data = io.BytesIO()
    with requests.get(
        url,
        headers={"User-Agent": user_agent, "Referer": referer},
        timeout=(7, 20),
        stream=True,
    ) as response:
        response.raise_for_status()
        if not response.url.startswith("https://"):
            raise CommandError("Image redirect must use HTTPS.")
        for chunk in response.iter_content(chunk_size=64 * 1024):
            if data.tell() + len(chunk) > MAX_BYTES:
                raise CommandError("Image exceeds 12 MiB.")
            data.write(chunk)
    data.seek(0)
    with Image.open(data) as opened:
        if opened.width < 600 or opened.width * opened.height > 20_000_000:
            raise CommandError("Image must be at least 600 px wide and at most 20 MP.")
        if getattr(opened, "is_animated", False):
            raise CommandError("Image must be a still photo.")
        rgba = opened.convert("RGBA")
        photo = Image.new("RGB", rgba.size, "white")
        photo.paste(rgba, mask=rgba.getchannel("A"))
        preview = photo.convert("L")
        preview.thumbnail((800, 800))
        edges = preview.filter(ImageFilter.FIND_EDGES)
        interior = edges.crop((2, 2, edges.width - 2, edges.height - 2))
        if (
            interior.width <= 0
            or interior.height <= 0
            or ImageStat.Stat(interior).stddev[0] < 4
        ):
            raise CommandError("Image fails the edge-detail check.")
        output = io.BytesIO()
        photo.save(output, "WEBP", quality=90)
        return output.getvalue()


class Command(BaseCommand):
    help = "Import verified catalog photos incrementally into PostgreSQL."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--manifest",
            type=Path,
            default=Path(settings.BASE_DIR).parent
            / "docs/evidence/REAL_CATALOG_INCREMENTAL.json",
        )
        parser.add_argument("--user-agent")
        parser.add_argument(
            "--strict-gallery",
            action="store_true",
            help="Require the verified 5/3 gallery for every product in this manifest.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        try:
            rows = json.loads(options["manifest"].read_text(encoding="utf-8-sig"))
        except (OSError, ValueError) as error:
            raise CommandError(f"Cannot read manifest: {error}") from error
        if not isinstance(rows, list) or not rows:
            raise CommandError("Provide a non-empty list of products.")

        written = 0
        failed = 0
        partial = 0
        for raw in rows:
            serializer = ProductSource(data=raw)
            if not serializer.is_valid():
                self.stderr.write(f"Skipped invalid product: {serializer.errors}")
                failed += 1
                continue
            row = serializer.validated_data
            try:
                if options["strict_gallery"]:
                    self.validate_strict_gallery(row)
                counts = self.import_product(row, options["user_agent"])
            except (CommandError, IntegrityError) as error:
                self.stderr.write(f"Skipped {row['name']}: {error}")
                failed += 1
                continue
            gallery_counts = "/".join(str(count) for count in counts)
            self.stdout.write(
                f"{row['name']}: {sum(counts)} DB images ({gallery_counts} per color)."
            )
            if len(counts) < len(row["colors"]):
                self.stderr.write(f"{row['name']}: some requested colors were skipped.")
                partial += 1
            written += 1
        self.stdout.write(
            f"Imported {written} products ({partial} partial), skipped {failed}."
        )
        photos = ProductImage.objects.exclude(webp_data__isnull=True)
        published = Product.objects.filter(status=Product.Status.PUBLISHED)
        photographed = published.filter(
            Exists(photos.filter(product_id=OuterRef("pk")))
        )
        for field in ("brand__name", "category__name"):
            totals = (
                photographed.values(field).annotate(total=Count("id")).order_by(field)
            )
            self.stdout.write(
                f"{field}: "
                + ", ".join(f"{row[field]}={row['total']}" for row in totals)
            )
        self.stdout.write(
            f"WebP rows: {photos.count()}; published products without WebP: "
            f"{published.count() - photographed.count()}."
        )
        if failed or partial:
            raise CommandError("Some products or photos could not be imported.")

    @staticmethod
    def validate_strict_gallery(row: dict[str, Any]) -> None:
        for index, source in enumerate(row["colors"]):
            angles = {entry["angle"] for entry in source.get("gallery", [])}
            if len(angles) != (5 if index == 0 else 3):
                raise CommandError(
                    "MISSING_VERIFIED_ASSET: required gallery is 5/3 angles."
                )
            if row["kind"] == "boots":
                required = (
                    {"lateral", "medial", "top", "heel", "outsole"}
                    if index == 0
                    else {"lateral", "top", "heel"}
                )
                if angles != required:
                    raise CommandError("MISSING_VERIFIED_ASSET: incorrect boot angles.")

    def import_product(self, row: dict[str, Any], user_agent: str | None) -> list[int]:
        slug = row.get("existing_slug") or f"real-{slugify(row['name'])}"
        if not slugify(row["name"]):
            raise CommandError("Product name must generate a slug.")
        existing = Product.objects.filter(slug=slug).first()
        if row.get("existing_slug") and existing is None:
            raise CommandError("Existing product slug was not found.")
        if existing and existing.name != row["name"]:
            raise CommandError("Existing product name differs from the manifest.")
        colors = [source["color"] for source in row["colors"]]
        if len({color.casefold() for color in colors}) != len(colors):
            raise CommandError("Duplicate color.")
        if not row.get("existing_slug") and len(colors) < 2:
            raise CommandError("New products require at least two colors.")
        verified: dict[str, list[tuple[str, bytes]]] = {}
        fingerprints: set[bytes] = set()
        for source in row["colors"]:
            color = source["color"]
            gallery = source.get("gallery", [source])
            photos = []
            for entry in gallery:
                angle = entry.get("angle", "")
                for url in [entry["image_url"], *entry.get("fallback_urls", [])]:
                    try:
                        headers = {"user_agent": user_agent} if user_agent else {}
                        content = download_webp(url, source["product_url"], **headers)
                    except (
                        requests.RequestException,
                        OSError,
                        ValueError,
                        CommandError,
                        Image.DecompressionBombError,
                    ) as error:
                        self.stderr.write(
                            f"{row['name']} / {color}: {type(error).__name__}"
                        )
                        continue
                    fingerprint = hashlib.sha256(content).digest()
                    if fingerprint not in fingerprints:
                        fingerprints.add(fingerprint)
                        photos.append((angle, content))
                        break
            if "gallery" in source and len(photos) != len(gallery):
                raise CommandError(f"Could not verify every gallery angle for {color}.")
            if photos:
                verified[color] = photos
        if len(verified) < (1 if row.get("existing_slug") else 2):
            raise CommandError("Insufficient valid distinct photos.")

        with transaction.atomic():
            # Serialize seed writers so the global byte comparison stays valid.
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_xact_lock(48130211)")
            owners = {
                hashlib.sha256(bytes(blob)).digest(): (product_id, color)
                for product_id, color, blob in ProductImage.objects.exclude(
                    webp_data__isnull=True
                ).values_list("product_id", "variant__color", "webp_data")
                if blob is not None
            }
            for color, photos in verified.items():
                for _, content in photos:
                    owner = owners.get(hashlib.sha256(content).digest())
                    if owner and (existing is None or owner != (existing.pk, color)):
                        raise CommandError(
                            f"Duplicate photo outside this product/color: {color}."
                        )

            if existing is None:
                category_slug, category_name = CATEGORIES[row["kind"]]
                category, _ = Category.objects.get_or_create(
                    slug=category_slug, defaults={"name": category_name}
                )
                brand, _ = Brand.objects.get_or_create(
                    slug=slugify(row["brand"]), defaults={"name": row["brand"]}
                )
                product = Product.objects.create(
                    slug=slug,
                    name=row["name"],
                    brand=brand,
                    category=category,
                    status=Product.Status.PUBLISHED,
                )
            else:
                product = Product.objects.select_for_update().get(pk=existing.pk)
            if "description" in row and product.description != row["description"]:
                product.description = row["description"]
                product.save(update_fields=("description", "updated_at"))
            if row.get("existing_slug"):
                existing_colors = set(product.variants.values_list("color", flat=True))
                if len(existing_colors | verified.keys()) > 3:
                    raise CommandError(
                        "Import would exceed three colors for the existing product."
                    )
            sizes = SIZES[row["kind"]]
            empty = (
                set(
                    random.sample(
                        [(color, size) for color in verified for size in sizes],
                        random.randint(1, 2),
                    )
                )
                if row["kind"] == "boots"
                else set()
            )
            counts = []
            for color_index, (color, photos) in enumerate(verified.items()):
                variants = product.variants.filter(color=color).order_by("size", "pk")
                for size in sizes:
                    code = hashlib.sha256(
                        f"{slug}:{color}:{size}".encode()
                    ).hexdigest()[:24]
                    variant, created = ProductVariant.objects.get_or_create(
                        product=product,
                        color=color,
                        size=size,
                        defaults={
                            "sku": f"REAL-{code.upper()}",
                            "unit_price": row["price"],
                        },
                    )
                    if created:
                        stock = 0 if (color, size) in empty else random.randint(5, 25)
                        InventoryBalance.objects.create(
                            variant=variant, stock_qty=stock
                        )
                        if stock:
                            InventoryMovement.objects.create(
                                variant=variant,
                                kind=InventoryMovement.Kind.ADJUST,
                                delta=stock,
                                before_qty=0,
                                after_qty=stock,
                                reason="Opening demo stock",
                                operation_key=f"seed-real:{variant.sku}",
                            )
                current = list(
                    product.images.filter(variant__color=color, webp_data__isnull=False)
                )
                if not photos[0][0] and len(current) > 1:
                    counts.append(len(current))
                    continue
                representative = variants.first()
                unused = current.copy()
                for angle_index, (angle, content) in enumerate(photos):
                    image = next(
                        (
                            item
                            for item in unused
                            if bytes(item.webp_data or b"") == content
                        ),
                        None,
                    )
                    if image is None:
                        image = ProductImage(product=product, variant=representative)
                    else:
                        unused.remove(image)
                    image.webp_data = content
                    image.alt_text = f"{row['name']} - {color}"
                    if angle:
                        image.alt_text += f" - {ANGLE_LABELS[angle]}"
                    image.sort_order = color_index * 5 + angle_index
                    image.storage_key = reverse("catalog-db-image", args=[image.pk])
                    image.save()
                product.images.filter(pk__in=[image.pk for image in unused]).delete()
                counts.append(len(photos))
            return counts
