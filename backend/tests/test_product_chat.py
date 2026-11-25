import asyncio
from typing import Any
from uuid import uuid4

import pytest
from channels.routing import URLRouter
from channels.security.websocket import OriginValidator
from channels.testing import WebsocketCommunicator
from django.apps import apps
from rest_framework_simplejwt.tokens import AccessToken

from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.identity.models import User
from apps.identity.presentation import public_name
from apps.product_chat.store import conversations, online, rate
from config.asgi import product_chat_routes

ORIGIN = "http://127.0.0.1:5173"


async def wait_event(
    socket: WebsocketCommunicator, event: str, predicate: Any = lambda _: True
) -> dict[str, Any]:
    for _ in range(40):
        message = await socket.receive_json_from(timeout=3)
        assert isinstance(message, dict)
        if message["event"] == event and predicate(message):
            return message
    raise AssertionError(f"Missing {event}")


@pytest.mark.django_db(transaction=True)
def test_product_chat_asgi_and_temporary_storage(settings: Any) -> None:
    settings.PRODUCT_CHAT_TTL_SECONDS = 3
    customer = User.objects.create_user(
        username="test-chat@example.test", first_name="Mai"
    )
    other = User.objects.create_user(username="other-chat")
    admin = User.objects.create_user(username="shop-chat", role=User.Role.ADMIN)
    assert public_name(other) == "other-chat"
    product = Product.objects.create(
        name="Test boots",
        slug="ws-test-boots",
        status=Product.Status.PUBLISHED,
        brand=Brand.objects.create(name="Chat test", slug="chat-test"),
        category=Category.objects.create(name="Chat test", slug="chat-test"),
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="CHAT-40",
        size="40",
        color="Blue",
        unit_price=900000,
    )
    assert not any(
        model._meta.app_label == "product_chat" for model in apps.get_models()
    )
    application = OriginValidator(URLRouter(product_chat_routes), [ORIGIN])
    customer_id = str(customer.pk)
    other_id = str(other.pk)

    async def connect(user: User, shop: bool = False) -> WebsocketCommunicator:
        url = "/ws/admin/product-chat" if shop else "/ws/product-chat"
        ws = WebsocketCommunicator(
            application, url, headers=[(b"origin", ORIGIN.encode())]
        )
        assert (await ws.connect())[0]
        await ws.send_json_to(
            {"event": "auth", "token": str(AccessToken.for_user(user))}
        )
        return ws

    async def scenario() -> None:
        invalid = WebsocketCommunicator(
            application, "/ws/product-chat", headers=[(b"origin", b"http://wrong.test")]
        )
        assert not (await invalid.connect())[0]
        denied = await connect(customer, shop=True)
        assert (await denied.receive_output(timeout=3))["code"] == 4403
        await denied.disconnect()
        buyer = await connect(customer)
        stranger = await connect(other)
        await wait_event(buyer, "snapshot")
        await wait_event(stranger, "snapshot")
        outgoing = {
            "event": "message.send",
            "conversation": customer_id,
            "client_id": str(uuid4()),
            "body": "Can I order this?",
            "sender": "Ignored",
            "product": {
                "product_id": str(product.pk),
                "variant_id": str(variant.pk),
                "price": "1",
            },
        }
        await buyer.send_json_to(outgoing)
        original = (await wait_event(buyer, "message.ack"))["message"]
        assert original["status"] == "sent" and original["author"] == "Mai"
        assert (
            original["product"]["size"] == "40"
            and float(original["product"]["price"]) == 900000
        )
        await buyer.send_json_to(outgoing)
        assert (await wait_event(buyer, "message.ack"))["message"]["id"] == original[
            "id"
        ]
        await stranger.send_json_to(outgoing)
        await wait_event(stranger, "error")
        await stranger.send_json_to(
            {**outgoing, "conversation": other_id, "client_id": str(uuid4())}
        )
        await wait_event(stranger, "message.ack")
        shop = await connect(admin, shop=True)
        inbox = await wait_event(shop, "snapshot", lambda m: len(m["inbox"]) == 2)
        assert sum(row["unread"] for row in inbox["inbox"]) == 2
        await shop.send_json_to(
            {"event": "conversation.join", "conversation": customer_id}
        )
        viewed = await wait_event(
            shop, "snapshot", lambda m: m["conversation"] == customer_id
        )
        assert [row["id"] for row in viewed["messages"]] == [original["id"]]
        for event, status in [
            ("message.delivered", "delivered"),
            ("message.read", "read"),
        ]:
            await shop.send_json_to(
                {"event": event, "conversation": customer_id, "ids": [original["id"]]}
            )
            await wait_event(
                buyer,
                "snapshot",
                lambda m: m["messages"] and m["messages"][0]["status"] == status,
            )
        await shop.send_json_to({"event": "typing.start", "conversation": customer_id})
        assert (await wait_event(buyer, "typing.update"))["active"]
        await shop.send_json_to(
            {
                **outgoing,
                "body": "Yes",
                "product": None,
                "conversation": customer_id,
                "client_id": str(uuid4()),
            }
        )
        await wait_event(buyer, "snapshot", lambda m: len(m["messages"]) == 2)
        await buyer.disconnect()
        buyer = await connect(customer)
        restored = await wait_event(buyer, "snapshot")
        assert len(restored["messages"]) == 2 and restored["shop_online"]
        await shop.disconnect()
        await wait_event(buyer, "snapshot", lambda m: not m["shop_online"])
        await asyncio.sleep(3.1)
        assert customer_id not in conversations
        await buyer.disconnect()
        await stranger.disconnect()

    try:
        asyncio.run(scenario())
    finally:
        conversations.clear()
        online.clear()
        rate.clear()
