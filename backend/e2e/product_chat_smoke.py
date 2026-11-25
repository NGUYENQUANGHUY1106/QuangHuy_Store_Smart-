"""Run against the local ASGI and Vite servers, with disposable accounts."""

import asyncio
import os
import re
import sys
from io import BytesIO
from pathlib import Path
from tempfile import gettempdir
from uuid import uuid4

from PIL import Image
from playwright.sync_api import expect, sync_playwright
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

from apps.catalog.models import Product
from apps.identity.models import User


def run() -> None:
    if sys.platform == "win32":
        # Daphne's Twisted reactor uses a selector; Playwright launches a subprocess.
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    origin = os.environ.get("QHS_CHAT_SMOKE_ORIGIN", "http://127.0.0.1:5173")
    password = f"Smoke-{uuid4()}!"
    accounts = []
    try:
        for name, role in [
            ("Chat Smoke Buyer", User.Role.CUSTOMER),
            ("Chat Smoke Shop", User.Role.ADMIN),
            ("Chat Smoke Second", User.Role.CUSTOMER),
        ]:
            email = f"chat-smoke-{uuid4()}@example.test"
            accounts.append(
                User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=name,
                    role=role,
                )
            )
        products = list(
            Product.objects.filter(
                status=Product.Status.PUBLISHED,
                variants__is_active=True,
                variants__inventory__stock_qty__gt=0,
            )
            .filter(images__storage_key__startswith="/media/catalog-db/")
            .distinct()
            .order_by("slug")[:2]
        )
        assert len(products) == 2, (
            "Seed at least two catalog products with images and stock"
        )
        urls = [f"{origin}/products/{product.slug}" for product in products]

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="chrome")
            buyer = browser.new_context(
                viewport={"width": 390, "height": 844}
            ).new_page()
            shop = browser.new_context(
                viewport={"width": 1440, "height": 900}
            ).new_page()
            other = browser.new_context().new_page()
            buyer.context.add_init_script("""
              const BrowserSocket = window.WebSocket;
              window.WebSocket = class extends BrowserSocket {
                constructor(...args) {
                  super(...args);
                  if (String(args[0]).endsWith('/ws/product-chat')) {
                    window.chatSmokeSocket = this;
                  }
                }
              };
            """)
            page_errors: list[str] = []
            for page in (buyer, shop, other):
                page.set_default_timeout(12000)
                page.on("pageerror", lambda error: page_errors.append(str(error)))

            def login(page, user) -> None:
                page.get_by_role("textbox", name="Email", exact=True).fill(user.email)
                page.get_by_label("Mật khẩu", exact=True).fill(password)
                page.get_by_role("button", name="Đăng nhập", exact=True).click()

            buyer.goto(urls[0])
            buyer.get_by_role("link", name="Chat về sản phẩm").click()
            buyer.wait_for_url("**/login")
            login(buyer, accounts[0])
            dialog = buyer.get_by_role("dialog", name="Trò chuyện với cửa hàng")
            expect(dialog).to_be_visible()
            expect(dialog.get_by_text("Ngoại tuyến", exact=True)).to_be_visible()
            expect(dialog.locator(".chat-composer-product img")).to_have_attribute(
                "src", re.compile("/media/catalog-db/")
            )
            expect(dialog.locator(".chat-composer-product strong")).to_have_text(
                products[0].name
            )
            composer = dialog.get_by_label("Nội dung tin nhắn")
            composer.fill("Do you have stock?")
            dialog.get_by_role("button", name="Thu nhỏ chat").click()
            buyer.get_by_role("button", name="Mở chat").click()
            expect(composer).to_have_value("Do you have stock?")
            composer.press("Enter")
            expect(dialog.get_by_text("Đã gửi", exact=False)).to_be_visible()
            buyer.goto(urls[1])
            buyer.locator(".size-options button:enabled").first.click()
            buyer.get_by_role("button", name="Chat về sản phẩm").click()
            expect(dialog.locator(".chat-composer-product")).to_contain_text("Size ")
            composer.fill("Also this product.")
            dialog.get_by_role("button", name="Gửi", exact=True).click()
            expect(dialog.locator(".chat-messages .chat-product")).to_have_count(2)

            other.goto(urls[0])
            other.get_by_role("link", name="Chat về sản phẩm").click()
            login(other, accounts[2])
            other.get_by_label("Nội dung tin nhắn").fill("Different thread")
            other.get_by_role("button", name="Gửi", exact=True).click()
            expect(other.get_by_text("Different thread", exact=True)).to_be_visible()
            other.goto(f"{origin}/admin/messages")
            other.wait_for_url("**/admin/login")

            shop.goto(f"{origin}/admin/login")
            login(shop, accounts[1])
            shop.wait_for_url("**/admin")
            expect(
                shop.locator('.admin-sidebar a[href="/admin/messages"] .chat-badge')
            ).to_have_text("3")
            expect(dialog.get_by_text("Đang hoạt động", exact=True)).to_be_visible()
            shop.locator('.admin-sidebar a[href="/admin/messages"]').click()
            shop.locator(".admin-chat-list button").filter(
                has_text="Chat Smoke Buyer"
            ).click()
            expect(shop.locator(".admin-chat-main .chat-product")).to_have_count(2)
            expect(shop.locator(".admin-chat-main")).not_to_contain_text(
                "Different thread"
            )
            expect(dialog.get_by_text("Đã xem", exact=False)).to_have_count(2)
            reply = shop.locator(".admin-chat-main").get_by_label("Nội dung tin nhắn")
            reply.fill("In stock.")
            expect(
                dialog.get_by_text("Đang nhập tin nhắn", exact=False)
            ).to_be_visible()
            reply.press("Enter")
            expect(dialog.get_by_text("In stock.", exact=True)).to_be_visible()
            expect(
                shop.locator(".chat-messages").get_by_text("Đã xem", exact=False)
            ).to_be_visible()
            expect(
                shop.locator('.admin-sidebar a[href="/admin/messages"] .chat-badge')
            ).to_have_text("1")
            dialog.get_by_role("button", name="Thu nhỏ chat").click()
            reply.fill("Open to read.")
            reply.press("Enter")
            delivery = shop.locator(".chat-bubble").filter(has_text="Open to read.")
            expect(delivery).to_contain_text("Đã nhận")
            buyer.get_by_role("button", name="Mở chat").click()
            expect(delivery).to_contain_text("Đã xem")
            expect(shop.locator(".admin-chat-customer")).to_contain_text(
                accounts[0].email
            )
            buyer.context.set_offline(True)
            buyer.evaluate("window.chatSmokeSocket.close()")
            expect(
                dialog.get_by_text("Mất kết nối. Đang thử kết nối lại…")
            ).to_be_visible()
            composer.fill("Retry this once.")
            composer.press("Enter")
            retry = dialog.get_by_role("button", name="Gửi lại")
            expect(retry).to_be_disabled()
            buyer.context.set_offline(False)
            expect(retry).to_be_enabled(timeout=15000)
            retry.click()
            expect(
                shop.locator(".chat-messages").get_by_text(
                    "Retry this once.", exact=True
                )
            ).to_have_count(1)
            buyer.screenshot(path=Path(gettempdir()) / "qhs-product-chat-mobile.png")
            shop.screenshot(path=Path(gettempdir()) / "qhs-product-chat-admin.png")
            shop.set_viewport_size({"width": 390, "height": 844})
            assert shop.evaluate("document.documentElement.scrollWidth === innerWidth")
            shop.context.close()
            expect(dialog.get_by_text("Ngoại tuyến", exact=True)).to_be_visible()
            buyer.reload()
            buyer.get_by_role("button", name="Chat về sản phẩm").click()
            expect(dialog.get_by_text("In stock.", exact=True)).to_have_count(1)
            assert buyer.evaluate("document.documentElement.scrollWidth === innerWidth")
            buyer.goto(f"{origin}/account")
            picture = BytesIO()
            Image.new("RGB", (64, 64), "orange").save(picture, "PNG")
            buyer.locator(".profile-avatar-form input").set_input_files(
                {
                    "name": "avatar.png",
                    "mimeType": "image/png",
                    "buffer": picture.getvalue(),
                }
            )
            buyer.get_by_role("button", name="Cập nhật ảnh").click()
            expect(buyer.locator(".account-header .user-avatar img")).to_have_attribute(
                "src", re.compile("/media/profile-avatars/")
            )
            assert not page_errors, page_errors
            browser.close()
    finally:
        ids = [user.pk for user in accounts]
        OutstandingToken.objects.filter(user_id__in=ids).delete()
        User.objects.filter(pk__in=ids).delete()
