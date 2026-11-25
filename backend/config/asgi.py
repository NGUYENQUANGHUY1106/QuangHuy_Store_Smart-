from __future__ import annotations

import os
from typing import TYPE_CHECKING, cast

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from django.conf import settings
from django.core.asgi import get_asgi_application
from django.urls.resolvers import RoutePattern, URLPattern

if TYPE_CHECKING:
    from channels.routing import _ExtendedURLPattern

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
http = get_asgi_application()

from apps.product_chat.consumers import ProductChatConsumer  # noqa: E402

product_chat_routes: list[_ExtendedURLPattern | URLRouter] = [
    cast(
        "_ExtendedURLPattern",
        URLPattern(
            RoutePattern("ws/product-chat", is_endpoint=True),
            ProductChatConsumer.as_asgi(),
        ),
    ),
    cast(
        "_ExtendedURLPattern",
        URLPattern(
            RoutePattern("ws/admin/product-chat", is_endpoint=True),
            ProductChatConsumer.as_asgi(),
            {"shop": True},
        ),
    ),
]

application = ProtocolTypeRouter(
    {
        "http": http,
        "websocket": OriginValidator(
            URLRouter(product_chat_routes),
            settings.PRODUCT_CHAT_ORIGINS,
        ),
    }
)
