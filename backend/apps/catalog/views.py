import uuid
from decimal import Decimal, InvalidOperation
from io import BytesIO
from typing import Any

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import IntegrityError, transaction
from django.db.models import Max, Min, Prefetch, Q, QuerySet
from django.db.models.deletion import ProtectedError
from django.urls import reverse
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, RetrieveAPIView, get_object_or_404
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.identity.permissions import IsAdminRole

from .images import prefetch_thumbnails
from .models import (
    Brand,
    Category,
    InventoryBalance,
    Product,
    ProductImage,
    ProductVariant,
)
from .serializers import (
    AdminBrandSerializer,
    AdminCategorySerializer,
    AdminProductSerializer,
    AdminProductVariantSerializer,
    BrandSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductSummarySerializer,
)


class CategoryListView(ListAPIView[Category]):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self) -> QuerySet[Category]:
        queryset = Category.objects.filter(is_active=True)
        parent_id = self.request.query_params.get("parent_id")
        if parent_id:
            try:
                parent = uuid.UUID(parent_id)
            except ValueError as exc:
                raise ValidationError({"parent_id": "Invalid UUID."}) from exc
            queryset = queryset.filter(parent_id=parent)
        return queryset


class BrandListView(ListAPIView[Brand]):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = BrandSerializer

    def get_queryset(self) -> QuerySet[Brand]:
        return Brand.objects.filter(is_active=True)


class ProductListView(ListAPIView[Product]):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProductSummarySerializer

    def get_queryset(self) -> QuerySet[Product]:
        variants = ProductVariant.objects.filter(is_active=True).select_related(
            "inventory"
        )
        queryset = (
            Product.objects.filter(status=Product.Status.PUBLISHED)
            .select_related("category", "brand")
            .prefetch_related(
                Prefetch("images", queryset=ProductImage.objects.defer("webp_data")),
                Prefetch("variants", queryset=variants),
            )
        )

        params = self.request.query_params
        query = params.get("q", "").strip()
        category = params.get("category")
        brand = params.get("brand")
        size = params.get("size")
        color = params.get("color")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        in_stock = params.get("in_stock")

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(brand__name__icontains=query)
            )
        if category:
            queryset = queryset.filter(
                Q(category__slug=category) | Q(category__name=category)
            )
        if brand:
            queryset = queryset.filter(
                Q(brand__slug=brand) | Q(brand__name__iexact=brand)
            )

        variant_filter = Q(variants__is_active=True)
        if size:
            variant_filter &= Q(variants__size=size)
        if color:
            variant_filter &= Q(variants__color=color)
        if min_price:
            try:
                amount = Decimal(min_price)
                if not amount.is_finite() or amount < 0:
                    raise ValueError
                variant_filter &= Q(variants__unit_price__gte=amount)
            except (InvalidOperation, ValueError):
                from rest_framework.exceptions import ValidationError

                raise ValidationError({"min_price": ["Giá tối thiểu không hợp lệ"]})
        if max_price:
            try:
                amount = Decimal(max_price)
                if not amount.is_finite() or amount < 0:
                    raise ValueError
                variant_filter &= Q(variants__unit_price__lte=amount)
            except (InvalidOperation, ValueError):
                from rest_framework.exceptions import ValidationError

                raise ValidationError({"max_price": ["Giá tối đa không hợp lệ"]})
        if in_stock == "true":
            variant_filter &= Q(variants__inventory__stock_qty__gt=0)

        queryset = queryset.annotate(
            active_min_price=Min(
                "variants__unit_price",
                filter=variant_filter,
            )
        ).filter(active_min_price__isnull=False)
        sort = params.get("sort", "newest")
        sort_map = {
            "price": "active_min_price",
            "-price": "-active_min_price",
            "name": "name",
            "-name": "-name",
            "newest": "-created_at",
        }
        if sort not in sort_map:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"sort": ["Giá trị sắp xếp không hợp lệ"]})
        return queryset.order_by(sort_map[sort], "id")


class ProductDetailView(RetrieveAPIView[Product]):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self) -> QuerySet[Product]:
        variants = ProductVariant.objects.filter(is_active=True).select_related(
            "inventory"
        )
        return (
            Product.objects.filter(status=Product.Status.PUBLISHED)
            .select_related("category", "brand")
            .prefetch_related(
                Prefetch("images", queryset=ProductImage.objects.defer("webp_data")),
                Prefetch("variants", queryset=variants),
            )
        )


class SearchSuggestionsView(ProductListView):
    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"products": [], "categories": []})
        if len(query) > 100:
            raise ValidationError({"q": "Giới hạn 100 ký tự."})
        products = self.get_queryset()[:5]
        categories = Category.objects.filter(
            name__icontains=query, is_active=True
        ).order_by("name", "pk")[:5]
        return Response(
            {
                "products": ProductSummarySerializer(products, many=True).data,
                "categories": CategorySerializer(categories, many=True).data,
            }
        )


class CatalogDeleteView:
    def perform_destroy(
        self, instance: Category | Brand | Product | ProductVariant
    ) -> None:
        try:
            instance.delete()
        except ProtectedError as exc:
            raise ValidationError(
                {"detail": "Bản ghi đang được sử dụng. Hãy ngừng hoạt động."}
            ) from exc


class AdminCategoryListCreateView(generics.ListCreateAPIView[Category]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all().order_by("name")


class AdminCategoryDetailView(
    CatalogDeleteView, generics.RetrieveUpdateDestroyAPIView[Category]
):
    permission_classes = [IsAdminRole]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.all()

    @transaction.atomic
    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        list(
            Category.objects.select_for_update()
            .order_by("pk")
            .values_list("pk", flat=True)
        )
        return super().update(request, *args, **kwargs)


class AdminBrandListCreateView(generics.ListCreateAPIView[Brand]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminBrandSerializer
    queryset = Brand.objects.all().order_by("name")


class AdminBrandDetailView(
    CatalogDeleteView, generics.RetrieveUpdateDestroyAPIView[Brand]
):
    permission_classes = [IsAdminRole]
    serializer_class = AdminBrandSerializer
    queryset = Brand.objects.all()


class AdminProductListCreateView(generics.ListCreateAPIView[Product]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminProductSerializer
    queryset = Product.objects.prefetch_related(
        prefetch_thumbnails(), "variants__inventory"
    ).order_by("-created_at")


class AdminProductDetailView(
    CatalogDeleteView, generics.RetrieveUpdateDestroyAPIView[Product]
):
    permission_classes = [IsAdminRole]
    serializer_class = AdminProductSerializer
    queryset = Product.objects.prefetch_related(
        prefetch_thumbnails(), "variants__inventory"
    )


class AdminProductColorView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        current = request.data.get("color")
        new = request.data.get("new_color")
        if (
            not isinstance(current, str)
            or not isinstance(new, str)
            or not 1 <= len(new.strip()) <= 32
        ):
            raise ValidationError({"detail": "Tên màu mới cần từ 1 đến 32 ký tự."})
        new = new.strip()
        try:
            with transaction.atomic():
                product = get_object_or_404(Product.objects.select_for_update(), pk=pk)
                variants = product.variants.filter(color=current)
                if not variants.exists():
                    raise ValidationError({"detail": "Màu hiện tại không còn tồn tại."})
                if (
                    product.variants.filter(color__iexact=new)
                    .exclude(color=current)
                    .exists()
                ):
                    raise ValidationError({"detail": "Tên màu này đã được sử dụng."})
                variants.update(color=new)
        except IntegrityError as exc:
            raise ValidationError(
                {"detail": "Tên màu xung đột với biến thể hiện có."}
            ) from exc
        return Response({"color": new})


class AdminVariantListCreateView(generics.ListCreateAPIView[ProductVariant]):
    permission_classes = [IsAdminRole]
    serializer_class = AdminProductVariantSerializer

    @transaction.atomic
    def perform_create(self, serializer: Any) -> None:
        variant = serializer.save()
        InventoryBalance.objects.create(variant=variant)

    def get_queryset(self) -> QuerySet[ProductVariant]:
        queryset = ProductVariant.objects.all().order_by("sku")
        product_id = self.request.query_params.get("product_id")
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


class AdminVariantDetailView(
    CatalogDeleteView, generics.RetrieveUpdateDestroyAPIView[ProductVariant]
):
    permission_classes = [IsAdminRole]
    serializer_class = AdminProductVariantSerializer
    queryset = ProductVariant.objects.all()

    @transaction.atomic
    def perform_destroy(
        self, instance: Category | Brand | Product | ProductVariant
    ) -> None:
        from apps.orders.models import OrderItem

        instance = ProductVariant.objects.select_for_update().get(pk=instance.pk)
        if OrderItem.objects.filter(variant=instance).exists():
            raise ValidationError(
                {
                    "detail": (
                        "Không thể xóa biến thể đã phát sinh đơn hàng. "
                        "Hãy chuyển is_active=False."
                    )
                }
            )
        InventoryBalance.objects.filter(variant=instance, stock_qty=0).delete()
        super().perform_destroy(instance)


class AdminMediaUploadView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser]

    def post(self, request: Request) -> Response:
        file_obj = request.FILES.get("file")
        if not file_obj:
            raise ValidationError({"file": "Thiếu file upload."})
        product_id = request.data.get("product_id")
        if product_id:
            normalized = normalize_catalog_image(file_obj)
            with transaction.atomic():
                product = get_object_or_404(
                    Product.objects.select_for_update(), pk=media_uuid(product_id)
                )
                item = ProductImage(product=product)
                last = product.images.aggregate(last=Max("sort_order"))["last"]
                item.sort_order = 0 if last is None else last + 1
                set_image_fields(item, request)
                item.webp_data = normalized
                item.storage_key = reverse("catalog-db-image", args=[item.pk])
                item.save()
            return Response({"storage_key": item.storage_key}, status=201)
        if request.data.get("variant_id"):
            raise ValidationError({"product_id": "Cần chọn sản phẩm."})
        normalized = normalize_catalog_image(file_obj, format_name="PNG")
        key = default_storage.save(
            f"catalog/{uuid.uuid4()}.png", ContentFile(normalized)
        )
        return Response(
            {"storage_key": default_storage.url(key), "filename": file_obj.name},
            status=status.HTTP_201_CREATED,
        )


class AdminMediaDetailView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser]

    def patch(self, request: Request, pk: uuid.UUID) -> Response:
        upload = request.FILES.get("file")
        normalized = normalize_catalog_image(upload) if upload is not None else None
        with transaction.atomic():
            item = get_object_or_404(ProductImage.objects.select_for_update(), pk=pk)
            set_image_fields(item, request)
            if normalized is not None:
                replacement = ProductImage(
                    product_id=item.product_id,
                    variant_id=item.variant_id,
                    alt_text=item.alt_text,
                    sort_order=item.sort_order,
                    webp_data=normalized,
                )
                replacement.storage_key = reverse(
                    "catalog-db-image", args=[replacement.pk]
                )
                replacement.save()
                item.delete()
                item = replacement
            else:
                item.save(update_fields=("variant", "alt_text", "sort_order"))
        return Response({"storage_key": item.storage_key})


def set_image_fields(item: ProductImage, request: Request) -> None:
    if "variant_id" in request.data:
        variant_id = request.data["variant_id"]
        item.variant = (
            get_object_or_404(
                ProductVariant, product_id=item.product_id, pk=media_uuid(variant_id)
            )
            if variant_id
            else None
        )
    if "alt_text" in request.data:
        alt = str(request.data["alt_text"]).strip()
        if len(alt) > 200:
            raise ValidationError({"alt_text": "Giới hạn 200 ký tự."})
        item.alt_text = alt
    if "sort_order" in request.data:
        try:
            order = int(request.data["sort_order"])
            if not 0 <= order <= 2_147_483_647:
                raise ValueError()
        except (TypeError, ValueError) as exc:
            raise ValidationError(
                {"sort_order": "Thứ tự phải là số nguyên không âm."}
            ) from exc
        item.sort_order = order


def media_uuid(value: object) -> uuid.UUID:
    try:
        return uuid.UUID(str(value))
    except ValueError as exc:
        raise ValidationError(
            {"detail": "Mã sản phẩm hoặc biến thể không hợp lệ."}
        ) from exc


def normalize_catalog_image(file_obj: Any, *, format_name: str = "WEBP") -> bytes:
    if file_obj.size > 5 * 1024 * 1024:
        raise ValidationError({"file": "Dung lượng file vượt quá 5 MB."})
    formats = ["JPEG", "PNG", "WEBP"]
    try:
        with Image.open(file_obj, formats=formats) as source:
            if source.width * source.height > 12_000_000 or getattr(
                source, "is_animated", False
            ):
                raise ValidationError(
                    {"file": "Chỉ hỗ trợ ảnh tĩnh tối đa 12 triệu pixel."}
                )
            source.verify()
        file_obj.seek(0)
        with Image.open(file_obj, formats=formats) as source:
            image = ImageOps.exif_transpose(source).convert("RGBA")
            image.info.clear()
            output = BytesIO()
            image.save(output, format=format_name, quality=90)
        return output.getvalue()
    except (
        UnidentifiedImageError,
        OSError,
        Image.DecompressionBombError,
        SyntaxError,
        ValueError,
    ) as exc:
        raise ValidationError({"file": "Tệp ảnh không hợp lệ."}) from exc
