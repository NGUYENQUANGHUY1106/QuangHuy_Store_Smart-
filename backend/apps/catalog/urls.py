from django.urls import path

from .image_views import catalog_image
from .views import (
    AdminBrandDetailView,
    AdminBrandListCreateView,
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminMediaDetailView,
    AdminMediaUploadView,
    AdminProductColorView,
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminVariantDetailView,
    AdminVariantListCreateView,
    BrandListView,
    CategoryListView,
    ProductDetailView,
    ProductListView,
    SearchSuggestionsView,
)

urlpatterns = [
    path("media/catalog-db/<uuid:pk>", catalog_image, name="catalog-db-image"),
    path("api/catalog/products/", ProductListView.as_view()),
    path("api/catalog/products/<slug:slug>/", ProductDetailView.as_view()),
    path("categories", CategoryListView.as_view()),
    path("brands", BrandListView.as_view()),
    path("products", ProductListView.as_view()),
    path("products/<slug:slug>", ProductDetailView.as_view()),
    path("search/suggestions", SearchSuggestionsView.as_view()),
    path("admin/categories", AdminCategoryListCreateView.as_view()),
    path("admin/categories/<uuid:pk>", AdminCategoryDetailView.as_view()),
    path("admin/brands", AdminBrandListCreateView.as_view()),
    path("admin/brands/<uuid:pk>", AdminBrandDetailView.as_view()),
    path("admin/products", AdminProductListCreateView.as_view()),
    path("admin/products/<uuid:pk>", AdminProductDetailView.as_view()),
    path("admin/products/<uuid:pk>/colors", AdminProductColorView.as_view()),
    path("admin/variants", AdminVariantListCreateView.as_view()),
    path("admin/variants/<uuid:pk>", AdminVariantDetailView.as_view()),
    path("admin/media/upload", AdminMediaUploadView.as_view()),
    path("admin/media/<uuid:pk>", AdminMediaDetailView.as_view()),
]
