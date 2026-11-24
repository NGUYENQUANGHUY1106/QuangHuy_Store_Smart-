from __future__ import annotations

from django.db.models import Prefetch, QuerySet

from .models import Product, ProductImage


def prefetch_thumbnails(path: str = "") -> Prefetch[str, QuerySet[ProductImage], str]:
    return Prefetch(
        f"{path}__images" if path else "images",
        queryset=ProductImage.objects.defer("webp_data").select_related("variant"),
    )


def product_thumbnail(product: Product, color: str | None = None) -> str | None:
    if product.status != Product.Status.PUBLISHED:
        return None
    images = [
        image
        for image in product.images.all()
        if image.storage_key != "/images/product-placeholder.svg"
        and (color is None or image.variant is None or image.variant.color == color)
    ]

    def rank(image: ProductImage) -> tuple[bool, bool]:
        return (
            color is not None and image.variant is None,
            not image.storage_key.startswith("/media/catalog-db/"),
        )

    image = min(images, key=rank, default=None)
    return image.storage_key if image else None
