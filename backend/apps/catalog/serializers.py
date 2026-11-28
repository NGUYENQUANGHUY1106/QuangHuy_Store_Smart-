from decimal import Decimal
from typing import Any

from rest_framework import serializers

from .images import product_thumbnail
from .models import Brand, Category, InventoryBalance, Product, ProductVariant


class CategorySerializer(serializers.ModelSerializer[Category]):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent_id"]


class BrandSerializer(serializers.ModelSerializer[Brand]):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug"]


class VariantSerializer(serializers.ModelSerializer[ProductVariant]):
    stock_qty = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "size",
            "color",
            "unit_price",
            "currency",
            "stock_qty",
            "is_active",
            "revision",
        ]

    def get_stock_qty(self, obj: ProductVariant) -> int:
        try:
            return obj.inventory.stock_qty
        except InventoryBalance.DoesNotExist:
            return 0

    def get_currency(self, obj: ProductVariant) -> str:
        return "VND"


class ProductSummarySerializer(serializers.ModelSerializer[Product]):
    thumbnail = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    from_price = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        source="active_min_price",
        read_only=True,
    )
    currency = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "thumbnail",
            "category",
            "brand",
            "from_price",
            "currency",
            "in_stock",
        ]

    def get_thumbnail(self, obj: Product) -> str | None:
        return product_thumbnail(obj)

    def get_currency(self, obj: Product) -> str:
        return "VND"

    def get_in_stock(self, obj: Product) -> bool:
        return any(
            variant.is_active
            and hasattr(variant, "inventory")
            and variant.inventory.stock_qty > 0
            for variant in obj.variants.all()
        )


class ProductDetailSerializer(ProductSummarySerializer):
    images = serializers.SerializerMethodField()
    variants = VariantSerializer(many=True, read_only=True)

    class Meta(ProductSummarySerializer.Meta):
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "brand",
            "thumbnail",
            "from_price",
            "currency",
            "in_stock",
            "images",
            "variants",
        ]

    def get_images(self, obj: Product) -> list[dict[str, object]]:
        images = list(obj.images.all())
        if any(image.storage_key.startswith("/media/catalog-db/") for image in images):
            images = [
                image
                for image in images
                if image.storage_key != "/images/product-placeholder.svg"
            ]
        return [
            {
                "id": str(image.id),
                "url": image.storage_key,
                "alt_text": image.alt_text,
                "variant_id": str(image.variant_id) if image.variant_id else None,
                "sort_order": image.sort_order,
            }
            for image in images
        ]


class AdminCategorySerializer(serializers.ModelSerializer[Category]):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "parent",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        parent = attrs.get("parent")
        instance = self.instance
        if parent and instance:
            if parent.id == instance.id:
                raise serializers.ValidationError(
                    {"parent": "Danh mục không thể là cha của chính nó."}
                )
            curr = parent
            while curr:
                if curr.id == instance.id:
                    raise serializers.ValidationError(
                        {"parent": "Phát hiện vòng lặp danh mục cha con."}
                    )
                curr = curr.parent
        return attrs


class AdminBrandSerializer(serializers.ModelSerializer[Brand]):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminProductVariantSerializer(serializers.ModelSerializer[ProductVariant]):
    stock_qty = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "sku",
            "size",
            "color",
            "unit_price",
            "is_active",
            "revision",
            "stock_qty",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "revision", "stock_qty", "created_at", "updated_at"]

    def get_stock_qty(self, obj: ProductVariant) -> int:
        try:
            return obj.inventory.stock_qty
        except InventoryBalance.DoesNotExist:
            return 0

    def validate_unit_price(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("Giá không được âm.")
        return value

    def validate_product(self, value: Product) -> Product:
        if self.instance is not None and value.pk != self.instance.product_id:
            raise serializers.ValidationError("Không thể đổi sản phẩm của biến thể.")
        return value


class AdminProductSerializer(serializers.ModelSerializer[Product]):
    thumbnail = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    variants = AdminProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "thumbnail",
            "images",
            "category",
            "brand",
            "status",
            "version",
            "variants",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "version", "variants", "created_at", "updated_at"]

    def get_thumbnail(self, obj: Product) -> str | None:
        return product_thumbnail(obj)

    def get_images(self, obj: Product) -> list[dict[str, object]]:
        return [
            {
                "id": str(image.pk),
                "url": image.storage_key,
                "variant_id": str(image.variant_id) if image.variant_id else None,
                "alt_text": image.alt_text,
                "sort_order": image.sort_order,
            }
            for image in obj.images.all()
            if image.storage_key != "/images/product-placeholder.svg"
        ]
