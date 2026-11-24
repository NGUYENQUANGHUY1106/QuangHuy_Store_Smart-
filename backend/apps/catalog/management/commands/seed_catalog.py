from datetime import timedelta
from decimal import Decimal
from typing import TypedDict

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    Product,
    ProductImage,
    ProductVariant,
)
from apps.vouchers.models import Voucher


class SeedProduct(TypedDict):
    name: str
    slug: str
    brand: str
    category: str
    description: str
    original: str
    price: str
    variants: list[tuple[str, str, str, str, int]]


PRODUCTS: list[SeedProduct] = [
    {
        "name": "Nike Mercurial Vapor 16 Elite",
        "slug": "nike-mercurial-vapor-16-elite",
        "brand": "Nike",
        "category": "Giày bóng đá",
        "description": (
            "Giày đinh FG cho sân cỏ tự nhiên nền cứng, thiết kế nhẹ và ôm chân."
        ),
        "original": "4590000",
        "price": "3890000",
        "variants": [
            ("NV16-390-BK", "39", "Đen", "3890000", 4),
            ("NV16-400-BK", "40", "Đen", "3890000", 6),
            ("NV16-410-BK", "41", "Đen", "3890000", 8),
            ("NV16-420-OR", "42", "Cam", "3890000", 3),
            ("NV16-430-OR", "43", "Cam", "3890000", 5),
            ("NV16-440-OR", "44", "Cam", "3890000", 2),
            ("NV16-390-OR", "39", "Cam", "3890000", 0),
        ],
    },
    {
        "name": "Adidas Predator 24 League",
        "slug": "adidas-predator-24-league",
        "brand": "Adidas",
        "category": "Giày bóng đá",
        "description": "Mẫu giày kiểm soát bóng dành cho sân cỏ nhân tạo.",
        "original": "2490000",
        "price": "2190000",
        "variants": [
            ("AP24-390-BK", "39", "Đen", "2190000", 5),
            ("AP24-400-BK", "40", "Đen", "2190000", 7),
            ("AP24-410-WH", "41", "Trắng", "2190000", 3),
            ("AP24-420-WH", "42", "Trắng", "2190000", 4),
            ("AP24-430-BL", "43", "Xanh", "2190000", 2),
            ("AP24-440-BL", "44", "Xanh", "2190000", 1),
        ],
    },
    {
        "name": "Mizuno Morelia Neo IV",
        "slug": "mizuno-morelia-neo-iv",
        "brand": "Mizuno",
        "category": "Giày bóng đá",
        "description": (
            "Cảm giác chạm bóng tự nhiên với lớp da mềm và khung đế ổn định."
        ),
        "original": "5290000",
        "price": "5290000",
        "variants": [
            ("MN4-390-WH", "39", "Trắng", "5290000", 2),
            ("MN4-400-WH", "40", "Trắng", "5290000", 3),
            ("MN4-410-BK", "41", "Đen", "5290000", 5),
            ("MN4-420-BK", "42", "Đen", "5290000", 6),
            ("MN4-430-BK", "43", "Đen", "5290000", 2),
            ("MN4-440-BK", "44", "Đen", "5290000", 1),
        ],
    },
    {
        "name": "Puma Future 7 Match",
        "slug": "puma-future-7-match",
        "brand": "Puma",
        "category": "Giày bóng đá",
        "description": "Khả năng linh hoạt và độ bám bóng cho cầu thủ tốc độ.",
        "original": "3290000",
        "price": "2790000",
        "variants": [
            ("PF7-390-OR", "39", "Cam", "2790000", 3),
            ("PF7-400-OR", "40", "Cam", "2790000", 5),
            ("PF7-410-BL", "41", "Xanh", "2790000", 4),
            ("PF7-420-BL", "42", "Xanh", "2790000", 6),
            ("PF7-430-BL", "43", "Xanh", "2790000", 2),
            ("PF7-440-BL", "44", "Xanh", "2790000", 1),
        ],
    },
    {
        "name": "Áo training không logo",
        "slug": "ao-training-khong-logo",
        "brand": "QuangHuy Sport",
        "category": "Quần áo thể thao",
        "description": "Áo thun thể thao thoáng khí, co giãn nhẹ và thấm hút tốt.",
        "original": "590000",
        "price": "490000",
        "variants": [
            ("QH-TS-S-BK", "S", "Đen", "490000", 8),
            ("QH-TS-M-BK", "M", "Đen", "490000", 12),
            ("QH-TS-L-BK", "L", "Đen", "490000", 9),
            ("QH-TS-XL-BK", "XL", "Đen", "490000", 5),
            ("QH-TS-M-WH", "M", "Trắng", "490000", 7),
        ],
    },
    {
        "name": "Quần short training",
        "slug": "quan-short-training",
        "brand": "QuangHuy Sport",
        "category": "Quần áo thể thao",
        "description": "Quần short tập luyện có túi khóa kéo và độ linh hoạt cao.",
        "original": "490000",
        "price": "490000",
        "variants": [
            ("QH-SH-S-BK", "S", "Đen", "490000", 6),
            ("QH-SH-M-BK", "M", "Đen", "490000", 10),
            ("QH-SH-L-BK", "L", "Đen", "490000", 8),
            ("QH-SH-XL-BK", "XL", "Đen", "490000", 4),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed catalog categories, brands, products, variants and inventory"

    @transaction.atomic
    def handle(self, *args: object, **options: object) -> None:
        categories = {}
        for name, slug in [
            ("Giày bóng đá", "giay-bong-da"),
            ("Quần áo thể thao", "quan-ao-the-thao"),
            ("Phụ kiện", "phu-kien"),
            ("Bóng & dụng cụ", "bong-dung-cu"),
        ]:
            category, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_active": True},
            )
            categories[name] = category

        brands = {}
        for name, slug in [
            ("Nike", "nike"),
            ("Adidas", "adidas"),
            ("Mizuno", "mizuno"),
            ("Puma", "puma"),
            ("QuangHuy Sport", "quanghuy-sport"),
        ]:
            brand, _ = Brand.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_active": True},
            )
            brands[name] = brand

        for item in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "category": categories[item["category"]],
                    "brand": brands[item["brand"]],
                    "name": item["name"],
                    "description": item["description"],
                    "status": Product.Status.PUBLISHED,
                },
            )
            ProductImage.objects.update_or_create(
                product=product,
                storage_key="/images/product-placeholder.svg",
                defaults={"alt_text": item["name"], "sort_order": 0},
            )
            for sku, size, color, price, stock in item["variants"]:
                variant, _ = ProductVariant.objects.update_or_create(
                    sku=sku,
                    defaults={
                        "product": product,
                        "size": size,
                        "color": color,
                        "unit_price": Decimal(price),
                        "is_active": True,
                    },
                )
                InventoryBalance.objects.update_or_create(
                    variant=variant,
                    defaults={"stock_qty": stock},
                )

        now = timezone.now()
        Voucher.objects.update_or_create(
            code="QHSNEW",
            defaults={
                "name": "Giảm 10%",
                "discount_type": Voucher.DiscountType.PERCENT,
                "value": Decimal("10"),
                "max_discount": Decimal("200000"),
                "min_order_value": Decimal("500000"),
                "start_date": now,
                "end_date": now + timedelta(days=365),
                "usage_limit": 1000,
                "is_active": True,
            },
        )
        Voucher.objects.update_or_create(
            code="FREESHIP",
            defaults={
                "name": "Giảm phí ship",
                "discount_type": Voucher.DiscountType.FIXED,
                "value": Decimal("30000"),
                "max_discount": None,
                "min_order_value": Decimal("1000000"),
                "start_date": now,
                "end_date": now + timedelta(days=365),
                "usage_limit": 1000,
                "is_active": True,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(PRODUCTS)} products, "
                f"{sum(len(item['variants']) for item in PRODUCTS)} variants"
            )
        )
