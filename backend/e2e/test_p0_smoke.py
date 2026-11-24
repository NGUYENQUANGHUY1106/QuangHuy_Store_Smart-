"""Run with pytest --liveserver=127.0.0.1:8000 and Vite on port 5173."""

import re
from decimal import Decimal

import pytest
from django.db import connection
from playwright.sync_api import expect, sync_playwright

from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductImage,
    ProductVariant,
)
from apps.identity.models import User
from apps.orders.models import Order

BASE = "http://127.0.0.1:5173"
PASSWORD = "OnlyForIsolatedTest2026!"


@pytest.mark.django_db(transaction=True)
def test_customer_cod_and_admin_cancel(live_server):
    assert connection.vendor == "postgresql"
    assert live_server.url == "http://127.0.0.1:8000"
    customer_email = "smoke-customer@example.test"
    admin_email = "smoke-admin@example.test"
    User.objects.create_user(
        username=customer_email, email=customer_email, password=PASSWORD
    )
    admin = User.objects.create_user(
        username=admin_email, email=admin_email, password=PASSWORD, role=User.Role.ADMIN
    )
    product = Product.objects.create(
        name="E2E Product",
        slug="e2e-product",
        category=Category.objects.create(name="E2E Category", slug="e2e-category"),
        brand=Brand.objects.create(name="E2E Brand", slug="e2e-brand"),
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="E2E-41",
        size="41",
        color="Black",
        unit_price=Decimal("450000"),
    )
    balance = InventoryBalance.objects.create(variant=variant, stock_qty=1)
    ProductImage.objects.create(
        product=product,
        storage_key="/images/product-placeholder.svg",
        alt_text="Sample front",
        sort_order=0,
    )
    ProductImage.objects.create(
        product=product,
        storage_key="/images/product-placeholder.svg?view=back",
        alt_text="Sample back",
        sort_order=1,
    )

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome")
        customer = browser.new_page(viewport={"width": 390, "height": 844})
        customer.goto(f"{BASE}/products/{product.slug}")
        back = customer.get_by_role("button", name="Sample back")
        back.focus()
        back.press("Enter")
        expect(back).to_have_attribute("aria-pressed", "true")
        expect(customer.get_by_role("img", name="Sample back")).to_be_visible()
        expect(customer.get_by_text("Chưa có hướng dẫn size")).to_be_visible()
        customer.get_by_role("button", name="41").press("Enter")
        customer.get_by_role("button", name="Thêm vào giỏ").press("Enter")
        expect(customer.get_by_text("Đã thêm 1 sản phẩm vào giỏ hàng.")).to_be_visible()

        customer.goto(f"{BASE}/login")
        customer.get_by_role("textbox", name="Email").fill(customer_email)
        customer.locator('input[type="password"]').fill(PASSWORD)
        customer.get_by_role("button", name="Đăng nhập").press("Enter")
        expect(customer).to_have_url(re.compile("/account$"))
        customer.goto(f"{BASE}/cart")
        expect(customer.get_by_role("heading", name="E2E Product")).to_be_visible()
        customer.get_by_role("button", name="Tiến hành thanh toán").click()
        customer.get_by_label("Họ và tên").fill("Sample Receiver")
        customer.get_by_label("Số điện thoại").fill("0900000000")
        customer.get_by_label("Địa chỉ nhận hàng").fill("1 Example Street")
        checkout_keys = []

        def lose_first_checkout_response(route):
            if route.request.method != "POST":
                route.continue_()
                return
            checkout_keys.append(route.request.headers.get("idempotency-key"))
            response = route.fetch()
            if len(checkout_keys) == 1:
                assert response.status == 201
                route.abort()
            else:
                assert response.status == 200
                route.fulfill(response=response)

        customer.route("**/checkout/orders", lose_first_checkout_response)
        submit_order = customer.get_by_role("button", name="Đặt hàng ngay")
        expect(submit_order).to_be_enabled()
        submit_order.press("Enter")
        expect(customer.get_by_role("alert")).to_be_visible()
        expect(submit_order).to_be_enabled()
        submit_order.press("Enter")
        expect(customer.get_by_test_id("order-number")).to_be_visible()
        assert len(checkout_keys) == 2 and checkout_keys[0] == checkout_keys[1]

        order_number = customer.get_by_test_id("order-number").inner_text()

        customer.goto(f"{BASE}/account/addresses")
        for receiver in ("First sample", "Second sample"):
            customer.get_by_role("button", name="Thêm địa chỉ").press("Enter")
            dialog = customer.get_by_role("dialog")
            dialog.get_by_label("Người nhận").fill(receiver)
            dialog.get_by_label("Số điện thoại").fill("0900000000")
            dialog.get_by_label("Địa chỉ", exact=True).fill("2 Sample Street")
            dialog.get_by_role("button", name="Lưu địa chỉ").press("Enter")
            expect(customer.get_by_text(receiver, exact=True)).to_be_visible()

        second = customer.get_by_role("article").filter(has_text="Second sample")
        second.get_by_role("button", name="Đặt mặc định").click()
        expect(second.get_by_text("Mặc định", exact=True)).to_be_visible()
        second.get_by_role("button", name="Sửa").click()
        dialog = customer.get_by_role("dialog")
        dialog.get_by_label("Địa chỉ", exact=True).fill("3 Updated Street")
        dialog.get_by_role("button", name="Lưu địa chỉ").press("Enter")
        expect(second.get_by_text("3 Updated Street")).to_be_visible()
        customer.once("dialog", lambda prompt: prompt.accept())
        second.get_by_role("button", name="Xóa", exact=True).click()
        expect(second).to_have_count(0)

        staff = browser.new_page()
        staff.goto(f"{BASE}/admin/login")
        staff.get_by_label("Email").fill(admin_email)
        staff.get_by_label("Mật khẩu").fill(PASSWORD)
        staff.get_by_role("button", name="Đăng nhập").press("Enter")
        expect(staff).to_have_url(re.compile("/admin$"))
        expect(
            staff.get_by_role("heading", name="Giá trị hàng đã giao sau giảm")
        ).to_be_visible()
        expect(staff.get_by_text("Chưa theo dõi", exact=True)).to_be_visible()
        staff.get_by_role("link", name="Đơn hàng").click()
        row = staff.get_by_role("row").filter(has_text=order_number)
        row.get_by_role("combobox").select_option("cancelled")
        staff.get_by_role("button", name="Xác nhận hủy và hoàn tồn").press("Enter")
        expect(row.get_by_role("combobox")).to_have_value("cancelled")
        customer.goto(f"{BASE}/account/orders/{order_number}")
        expect(customer.get_by_role("heading", name=order_number)).to_be_visible()
        history = customer.get_by_role("region", name="Lịch sử đơn hàng")
        expect(history.get_by_text("Đã hủy", exact=False)).to_be_visible()
        expect(customer.get_by_text("1 Example Street", exact=False)).to_be_visible()

        staff.get_by_role("link", name="Kho hàng").click()
        staff.get_by_label("SKU").select_option(str(variant.id))
        staff.get_by_label("Số lượng điều chỉnh").fill("2")
        staff.get_by_label("Lý do").fill("E2E restock")
        staff.get_by_role("button", name="Ghi biến động kho").press("Enter")
        expect(staff.get_by_text("Đã ghi nhận điều chỉnh kho.")).to_be_visible()
        staff.get_by_role("link", name="Lịch sử kho").click()
        expect(staff.get_by_role("row").filter(has_text="E2E restock")).to_be_visible()

        staff.get_by_role("link", name="Sản phẩm", exact=True).click()
        staff.get_by_role("row").filter(has_text="E2E Product").get_by_role(
            "link", name="Sửa"
        ).click()
        staff.get_by_label("Tên sản phẩm").fill("E2E Product Updated")
        staff.get_by_role("button", name="Lưu sản phẩm").press("Enter")
        expect(
            staff.get_by_role("row").filter(has_text="E2E Product Updated")
        ).to_be_visible()

        staff.goto(f"{BASE}/admin/users")
        email = staff.get_by_label("Email", exact=True)
        email.focus()
        email.fill("keyboard-user@example.test")
        email.press("Tab")
        password = staff.get_by_label("Mật khẩu", exact=True)
        expect(password).to_be_focused()
        password.fill(PASSWORD)
        save = staff.get_by_role("button", name="Lưu", exact=True)
        save.focus()
        save.press("Enter")
        expect(
            staff.get_by_role("button", name="Sửa keyboard-user@example.test")
        ).to_be_visible()
        staff.get_by_role("button", name="Sửa keyboard-user@example.test").press(
            "Enter"
        )
        staff.get_by_label("Hoạt động", exact=True).press("Space")
        save.press("Enter")
        expect(
            staff.get_by_role("listitem").filter(has_text="keyboard-user@example.test")
        ).to_contain_text("Đã ngừng")

        staff.goto(f"{BASE}/admin/vouchers")
        staff.get_by_label("Mã voucher").fill("KEYBOARD10")
        staff.get_by_label("Tên voucher").fill("Keyboard voucher")
        staff.get_by_label("Giá trị giảm").fill("10000")
        staff.get_by_label("Bắt đầu (Asia/Saigon)").fill("2026-11-23T00:00")
        staff.get_by_label("Kết thúc (Asia/Saigon)").fill("2026-12-01T00:00")
        staff.get_by_role("button", name="Lưu", exact=True).press("Enter")
        expect(staff.get_by_role("button", name="Sửa KEYBOARD10")).to_be_visible()
        browser.close()

    order = Order.objects.get(number=order_number)
    assert Order.objects.count() == 1
    assert order.payment_status == Order.PaymentStatus.UNPAID
    assert order.total == Decimal("480000")
    balance.refresh_from_db()
    assert order.status == Order.Status.CANCELLED
    assert balance.stock_qty == 3
    assert InventoryMovement.objects.get(kind="checkout").after_qty == 0
    assert InventoryMovement.objects.get(kind="cancel_return").actor_id == admin.pk
    assert InventoryMovement.objects.get(kind="cancel_return").after_qty == 1
    assert InventoryMovement.objects.get(kind="adjust").after_qty == 3
    assert order.items.get().product_name_snapshot == "E2E Product"
    assert order.address_snapshot["street"] == "1 Example Street"
