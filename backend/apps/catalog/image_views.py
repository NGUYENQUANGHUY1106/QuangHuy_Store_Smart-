from uuid import UUID

from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_safe

from .models import Product, ProductImage


@require_safe
def catalog_image(request: HttpRequest, pk: UUID) -> HttpResponse:
    image = get_object_or_404(
        ProductImage.objects.only("webp_data"),
        pk=pk,
        product__status=Product.Status.PUBLISHED,
        webp_data__isnull=False,
    )
    response = HttpResponse(
        b"" if request.method == "HEAD" else bytes(image.webp_data or b""),
        content_type="image/webp",
    )
    response["Cache-Control"] = "public, max-age=3600"
    response["X-Content-Type-Options"] = "nosniff"
    return response
