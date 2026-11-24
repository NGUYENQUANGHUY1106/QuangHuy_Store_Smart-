from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path

from config.views import health

urlpatterns = [
    path("health", health, name="health"),
    path("", include("apps.identity.urls")),
    path("", include("apps.cart.urls")),
    path("", include("apps.vouchers.urls")),
    path("", include("apps.orders.urls")),
    path("", include("apps.catalog.urls")),
    path("", include("apps.inventory.urls")),
    path("", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
