from __future__ import annotations

import asyncio
from typing import Any
from uuid import UUID, uuid4

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from apps.catalog.images import prefetch_thumbnails, product_thumbnail
from apps.catalog.models import Product, ProductVariant
from apps.identity.models import User
from apps.identity.presentation import avatar_url, public_name

from .store import Conversation, allow_send, conversations, online, rate

SHOP = "chat.shop"


@database_sync_to_async
def authenticate(token: str) -> tuple[User, float, str] | None:
    auth = JWTAuthentication()
    try:
        validated = auth.get_validated_token(token.encode())
        user = auth.get_user(validated)
    except (AuthenticationFailed, InvalidToken, TokenError):
        return None
    if not isinstance(user, User):
        return None
    return (
        user,
        float(validated["exp"] - timezone.now().timestamp()),
        avatar_url(user) or "",
    )


@database_sync_to_async
def product_attachment(value: object) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError
    try:
        product_id = UUID(str(value.get("product_id")))
        variant_id = UUID(str(value["variant_id"])) if value.get("variant_id") else None
    except ValueError:
        raise ValueError from None
    product = (
        Product.objects.filter(pk=product_id, status=Product.Status.PUBLISHED)
        .prefetch_related(prefetch_thumbnails())
        .first()
    )
    if product is None:
        raise ValueError
    variants = ProductVariant.objects.filter(product=product, is_active=True)
    color = value.get("color")
    if color is not None and (not isinstance(color, str) or len(color) > 32):
        raise ValueError
    if variant_id is not None:
        variant = variants.filter(pk=variant_id).first()
        if variant is None or (color and color != variant.color):
            raise ValueError
        color, size = variant.color, variant.size
    else:
        variant = (
            (variants.filter(color=color) if color else variants)
            .order_by("unit_price", "pk")
            .first()
        )
        if variant is None:
            raise ValueError
        size = None
    return {
        "id": str(product.pk),
        "slug": product.slug,
        "name": product.name,
        "thumbnail": product_thumbnail(product, color),
        "price": str(variant.unit_price),
        "color": color,
        "size": size,
    }


class ProductChatConsumer(AsyncJsonWebsocketConsumer):
    shop = False
    user_id = ""
    selected = ""
    profile: dict[str, str]
    deadline: asyncio.TimerHandle
    typing_timer: asyncio.TimerHandle | None = None
    connected_group = ""

    @staticmethod
    def later(seconds: float, action: Any, *args: Any) -> asyncio.TimerHandle:
        def invoke() -> None:
            asyncio.create_task(action(*args))

        return asyncio.get_running_loop().call_later(seconds, invoke)

    async def connect(self) -> None:
        self.shop = bool(self.scope["url_route"]["kwargs"].get("shop"))
        await self.accept()
        self.deadline = self.later(5, self.close, 4401)

    async def disconnect(self, code: int) -> None:
        self.deadline.cancel()
        if not self.connected_group:
            return
        await self.stop_typing()
        await self.channel_layer.group_discard(self.connected_group, self.channel_name)
        online[self.connected_group] -= 1
        if not online[self.connected_group]:
            del online[self.connected_group]
            await self.changed("" if self.shop else self.user_id)
        if self.user_id and f"chat.{self.user_id}" not in online:
            asyncio.get_running_loop().call_later(11, self.expire_rate, self.user_id)

    @staticmethod
    def expire_rate(user_id: str) -> None:
        from time import monotonic

        if user_id in rate and monotonic() - rate[user_id][0] >= 10:
            rate.pop(user_id, None)

    async def receive(
        self,
        text_data: str | None = None,
        bytes_data: bytes | None = None,
        **kwargs: Any,
    ) -> None:
        if not text_data or len(text_data) > 10000:
            await self.close(4400)
            return
        try:
            await super().receive(text_data=text_data, **kwargs)
        except ValueError:
            await self.error("Sự kiện chat không hợp lệ.")

    async def receive_json(self, content: Any, **kwargs: Any) -> None:
        if not isinstance(content, dict):
            await self.error("Sự kiện chat không hợp lệ.")
            return
        event = content.get("event")
        if not self.user_id:
            token = content.get("token")
            if event != "auth" or not isinstance(token, str):
                await self.close(4401)
                return
            result = await authenticate(token)
            if result is None:
                await self.close(4401)
                return
            user, seconds, avatar = result
            if self.shop and user.role != User.Role.ADMIN:
                await self.close(4403)
                return
            self.deadline.cancel()
            self.deadline = self.later(max(0, seconds), self.close, 4401)
            self.user_id = str(user.pk)
            self.profile = {
                "id": self.user_id,
                "name": public_name(user),
                "email": user.email,
                "phone": user.phone,
                "avatar_url": avatar,
            }
            self.selected = "" if self.shop else self.user_id
            self.connected_group = SHOP if self.shop else f"chat.{self.user_id}"
            await self.channel_layer.group_add(self.connected_group, self.channel_name)
            online[self.connected_group] = online.get(self.connected_group, 0) + 1
            await self.snapshot()
            await self.changed("" if self.shop else self.user_id)
            return
        if event == "conversation.join" and self.shop:
            target = content.get("conversation")
            if not isinstance(target, str) or target not in conversations:
                await self.error("Cuộc trò chuyện không còn khả dụng.")
                return
            await self.stop_typing()
            self.selected = target
            await self.snapshot()
            return
        if not self.selected or content.get("conversation") != self.selected:
            await self.error(
                "Cuộc trò chuyện không khả dụng.", content.get("client_id")
            )
            return
        if event == "message.send":
            await self.message_send(content)
        elif event in ("message.delivered", "message.read"):
            await self.receipt(content, read=event == "message.read")
        elif event == "typing.start" and self.selected in conversations:
            if self.typing_timer:
                self.typing_timer.cancel()
            else:
                await self.typing(True)
            self.typing_timer = self.later(4, self.stop_typing)
        elif event == "typing.stop":
            await self.stop_typing()

    async def error(self, detail: str, client_id: object = None) -> None:
        await self.send_json(
            {
                "event": "error",
                "detail": detail,
                "client_id": client_id if isinstance(client_id, str) else None,
            }
        )

    async def message_send(self, content: dict[str, Any]) -> None:
        client_id = content.get("client_id")
        body, attachment = content.get("body"), content.get("product")
        try:
            client_id = str(UUID(str(client_id)))
        except ValueError:
            await self.error("Mã tin nhắn không hợp lệ.")
            return
        if (
            not isinstance(body, str)
            or len(body) > 2000
            or not (body.strip() or attachment is not None)
        ):
            await self.error(
                "Tin nhắn phải có nội dung hoặc sản phẩm, tối đa 2.000 ký tự.",
                client_id,
            )
            return
        key = f"{self.user_id}:{self.shop}:{client_id}"
        thread = conversations.get(self.selected)
        if thread and key in thread.messages:
            await self.send_json(
                {"event": "message.ack", "message": thread.messages[key]}
            )
            return
        if not allow_send(self.user_id):
            await self.error("Bạn gửi quá nhanh. Vui lòng thử lại sau.", client_id)
            return
        product = None
        if attachment is not None:
            try:
                product = await product_attachment(attachment)
            except ValueError:
                await self.error(
                    "Sản phẩm hoặc biến thể đã chọn không khả dụng.", client_id
                )
                return
        thread = conversations.get(self.selected)
        if thread and key in thread.messages:
            await self.send_json(
                {"event": "message.ack", "message": thread.messages[key]}
            )
            return
        if self.shop and thread is None:
            await self.error("Cuộc trò chuyện đã hết hạn.", client_id)
            return
        if (thread and len(thread.messages) >= 300) or sum(
            len(t.messages) for t in conversations.values()
        ) >= 10000:
            await self.error(
                "Bộ nhớ chat tạm thời đã đầy. Vui lòng thử lại sau.", client_id
            )
            return
        if thread is None:
            thread = conversations[self.selected] = Conversation(customer=self.profile)
        message = {
            "id": str(uuid4()),
            "client_id": client_id,
            "conversation": self.selected,
            "author": "Chủ shop" if self.shop else self.profile["name"],
            "avatar_url": None if self.shop else self.profile["avatar_url"],
            "shop": self.shop,
            "body": body.strip(),
            "product": product,
            "at": timezone.now().isoformat(),
            "status": "sent",
        }
        thread.messages[key] = message
        self.later(
            settings.PRODUCT_CHAT_TTL_SECONDS,
            self.expire_message,
            self.selected,
            key,
            message["id"],
        )
        await self.send_json({"event": "message.ack", "message": message})
        await self.stop_typing()
        await self.changed(self.selected)

    async def expire_message(
        self, conversation: str, key: str, message_id: str
    ) -> None:
        thread = conversations.get(conversation)
        if thread and thread.messages.get(key, {}).get("id") == message_id:
            del thread.messages[key]
            if not thread.messages:
                del conversations[conversation]
            await self.changed(conversation)

    async def receipt(self, content: dict[str, Any], *, read: bool) -> None:
        thread = conversations.get(self.selected)
        ids = content.get("ids")
        if (
            not thread
            or not isinstance(ids, list)
            or len(ids) > 300
            or not all(isinstance(value, str) for value in ids)
        ):
            return
        changed = False
        received = set(ids)
        for message in thread.messages.values():
            if (
                message["shop"] != self.shop
                and message["id"] in received
                and (
                    message["status"] == "sent"
                    or (read and message["status"] == "delivered")
                )
            ):
                message["status"] = "read" if read else "delivered"
                changed = True
        if changed:
            await self.changed(self.selected)

    async def stop_typing(self) -> None:
        if self.typing_timer:
            self.typing_timer.cancel()
            self.typing_timer = None
            await self.typing(False)

    async def typing(self, active: bool) -> None:
        group = f"chat.{self.selected}" if self.shop else SHOP
        await self.channel_layer.group_send(
            group,
            {
                "type": "chat.typing",
                "conversation": self.selected,
                "active": active,
            },
        )

    async def changed(self, target: str) -> None:
        groups = [SHOP]
        if target:
            groups.append(f"chat.{target}")
        else:
            groups.extend(group for group in online if group != SHOP)
        for group in groups:
            await self.channel_layer.group_send(group, {"type": "chat.changed"})

    async def chat_changed(self, event: dict[str, Any]) -> None:
        await self.snapshot()

    async def chat_typing(self, event: dict[str, Any]) -> None:
        if event["conversation"] == self.selected:
            await self.send_json({**event, "event": "typing.update"})

    async def snapshot(self) -> None:
        thread = conversations.get(self.selected)
        inbox = []
        if self.shop:
            for conversation, entry in conversations.items():
                last = next(reversed(entry.messages.values()))
                inbox.append(
                    {
                        "customer": entry.customer,
                        "preview": last["body"] or last["product"]["name"],
                        "at": last["at"],
                        "online": bool(online.get(f"chat.{conversation}")),
                        "unread": sum(
                            not item["shop"] and item["status"] != "read"
                            for item in entry.messages.values()
                        ),
                    }
                )
            inbox.sort(key=lambda item: item["at"], reverse=True)
        await self.send_json(
            {
                "event": "snapshot",
                "conversation": self.selected,
                "messages": list(thread.messages.values()) if thread else [],
                "inbox": inbox,
                "shop_online": bool(online.get(SHOP)),
            }
        )
