import threading
import time
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from django.db import connection, connections, transaction
from django.test import Client

from apps.cart.models import Cart, CartItem
from apps.catalog.models import (
    Brand,
    Category,
    InventoryBalance,
    InventoryMovement,
    Product,
    ProductVariant,
)
from apps.identity.models import User
from apps.orders.models import Order, OrderItem, OrderStatusEvent
from tests.auth_headers import auth_headers


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize(
    "same_intent, overlap", [(False, False), (False, True), (True, False)]
)
def test_concurrency_two_users_race_last_stock_item(
    same_intent: bool, overlap: bool
) -> None:
    """TC-003: Two independent threads compete for the last stock item (stock_qty = 1).

    Must prove on PostgreSQL that:
    1. Exactly one user creates order (201).
    2. Exactly one user is rejected with insufficient_stock (409).
    3. Final stock_qty is exactly 0 (no oversell, never negative).
    4. Exactly 1 checkout movement is created.
    """
    assert connection.vendor == "postgresql", "Concurrency test MUST run on PostgreSQL!"

    user_a = User.objects.create_user(
        username="race_a@example.com",
        email="race_a@example.com",
        password="Password123",
    )
    user_b = User.objects.create_user(
        username="race_b@example.com",
        email="race_b@example.com",
        password="Password123",
    )

    category = Category.objects.create(name="Giày Race", slug="giay-race")
    brand = Brand.objects.create(name="Nike Race", slug="nike-race")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Giày Race Concurrency",
        slug="giay-race-concurrency",
        status=Product.Status.PUBLISHED,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="RACE-SKU-41",
        size="41",
        color="Đỏ",
        unit_price=Decimal("600000"),
    )
    balance = InventoryBalance.objects.create(variant=variant, stock_qty=1)

    cart_a = Cart.objects.create(user=user_a)
    CartItem.objects.create(cart=cart_a, variant=variant, qty=1)

    cart_b = Cart.objects.create(user=user_b)
    CartItem.objects.create(cart=cart_b, variant=variant, qty=1)

    extra_balance = None
    if overlap:
        extra = ProductVariant.objects.create(
            product=product,
            sku="RACE-OTHER",
            size="42",
            color="Red",
            unit_price=Decimal("100000"),
        )
        extra_balance = InventoryBalance.objects.create(variant=extra, stock_qty=2)
        CartItem.objects.create(cart=cart_a, variant=extra, qty=1)
        CartItem.objects.create(cart=cart_b, variant=extra, qty=1)

    barrier = threading.Barrier(3, timeout=10)
    pids: list[int] = []
    results: list[tuple[int, dict[str, str]]] = []
    lock = threading.Lock()

    def do_checkout(user: User, key: str) -> None:
        # Close connection to ensure each thread gets its own PostgreSQL connection
        connections.close_all()
        client = Client()
        headers = auth_headers(user)
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_backend_pid()")
            pids.append(cursor.fetchone()[0])
        barrier.wait()
        res = client.post(
            "/checkout/orders",
            {
                "payment_method": "COD",
                "address_snapshot": {
                    "receiver": user.email,
                    "phone": "0900000000",
                    "street": "HCM",
                },
            },
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY=key,
            **headers,
        )
        with lock:
            results.append(
                (res.status_code, res.json() if res.status_code != 204 else {})
            )
        connections.close_all()

    threads = [
        threading.Thread(target=do_checkout, args=(user_a, "race-key-user-a-001")),
        threading.Thread(
            target=do_checkout,
            args=(user_a, "race-key-user-a-001")
            if same_intent
            else (user_b, "race-key-user-b-001"),
        ),
    ]

    with transaction.atomic():
        ProductVariant.objects.select_for_update().get(pk=variant.pk)
        for t in threads:
            t.start()
        barrier.wait()
        assert len(set(pids)) == 2
        deadline = time.monotonic() + 10
        observed_waiters = 0
        with connection.cursor() as cursor:
            while time.monotonic() < deadline:
                cursor.execute("SELECT pg_stat_clear_snapshot()")
                cursor.execute(
                    "SELECT count(*) FROM pg_stat_activity "
                    "WHERE pid = ANY(%s) AND wait_event_type = 'Lock'",
                    [pids],
                )
                observed_waiters = cursor.fetchone()[0]
                if observed_waiters == 2:
                    break
                time.sleep(0.025)
    for t in threads:
        t.join(timeout=10)
        assert not t.is_alive()
    assert observed_waiters == 2

    status_codes = [r[0] for r in results]
    expected = [200, 201] if same_intent else [201, 409]
    assert sorted(status_codes) == expected
    assert Order.objects.count() == 1
    if same_intent:
        assert results[0][1]["id"] == results[1][1]["id"]
    if overlap:
        assert extra_balance is not None
        extra_balance.refresh_from_db()
        assert extra_balance.stock_qty == 1
        winner = Order.objects.get()
        assert winner.items.count() == 2
        assert (
            InventoryMovement.objects.filter(
                kind=InventoryMovement.Kind.CHECKOUT
            ).count()
            == 2
        )
        assert CartItem.objects.exclude(cart__user=winner.user).count() == 2

    balance.refresh_from_db()
    assert balance.stock_qty == 0, f"Expected final stock 0, got {balance.stock_qty}"

    movements = InventoryMovement.objects.filter(
        variant=variant, kind=InventoryMovement.Kind.CHECKOUT
    )
    assert movements.count() == 1, (
        f"Expected 1 checkout movement, got {movements.count()}"
    )
    assert movements[0].delta == -1
    assert movements[0].after_qty == 0


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("action", ["checkout", "adjust", "replay"])
def test_concurrency_checkout_races_inventory_adjust(action: str) -> None:
    """Test race condition between customer checkout and admin inventory adjustment."""
    assert connection.vendor == "postgresql", "Concurrency test MUST run on PostgreSQL!"

    customer = User.objects.create_user(
        username="cust_race@example.com",
        email="cust_race@example.com",
        password="Password123",
    )
    admin = User.objects.create_user(
        username="admin_race@example.com",
        email="admin_race@example.com",
        password="Password123",
        role=User.Role.ADMIN,
    )
    category = Category.objects.create(name="Áo Race", slug="ao-race")
    brand = Brand.objects.create(name="Adidas Race", slug="adidas-race")
    product = Product.objects.create(
        category=category,
        brand=brand,
        name="Áo Race Concurrency",
        slug="ao-race-concurrency",
        status=Product.Status.PUBLISHED,
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="RACE-SHIRT-M",
        size="M",
        color="Trắng",
        unit_price=Decimal("400000"),
    )
    balance = InventoryBalance.objects.create(variant=variant, stock_qty=1)

    cart = Cart.objects.create(user=customer)
    CartItem.objects.create(cart=cart, variant=variant, qty=1)

    barrier = threading.Barrier(2, timeout=10)
    results: list[tuple[str, int]] = []
    lock = threading.Lock()

    def do_checkout() -> None:
        connections.close_all()
        client = Client()
        barrier.wait()
        res = client.post(
            "/checkout/orders",
            {
                "payment_method": "COD",
                "address_snapshot": {
                    "receiver": "Race Customer",
                    "phone": "0900000000",
                    "street": "HCM",
                },
            },
            content_type="application/json",
            HTTP_IDEMPOTENCY_KEY="race-checkout-key-999",
            **auth_headers(customer),
        )
        with lock:
            results.append(("checkout", res.status_code))
        connections.close_all()

    def do_adjust(key: str) -> None:
        connections.close_all()
        client = Client()
        barrier.wait()
        res = client.post(
            "/admin/inventory/adjust",
            {
                "variant_id": str(variant.id),
                "delta": -1,
                "reason": "Điều chỉnh giảm 1 tồn",
                "operation_key": key,
            },
            content_type="application/json",
            **auth_headers(admin),
        )
        with lock:
            results.append(("adjust", res.status_code))
        connections.close_all()

    key = "race-adjust-key-999"
    t1 = (
        threading.Thread(target=do_checkout)
        if action == "checkout"
        else threading.Thread(
            target=do_adjust, args=(key if action == "replay" else "race-adjust-2",)
        )
    )
    t2 = threading.Thread(target=do_adjust, args=(key,))
    t1.start()
    t2.start()
    t1.join(timeout=10)
    t2.join(timeout=10)
    assert not t1.is_alive() and not t2.is_alive()

    balance.refresh_from_db()
    assert balance.stock_qty == 0
    assert InventoryMovement.objects.filter(variant=variant).count() == 1
    assert sorted(status for _, status in results) == (
        [200, 201] if action == "replay" else [201, 409]
    )


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize("second_status", ["SHIPPING", "CANCELLED"])
def test_conflicting_admin_transitions(second_status: str) -> None:
    assert connection.vendor == "postgresql"
    cust = User.objects.create_user(username="order-race@example.test")
    admins = [
        User.objects.create_user(
            username=f"admin-{i}@example.test", role=User.Role.ADMIN
        )
        for i in range(2)
    ]
    product = Product.objects.create(
        name="Race Product",
        slug="order-race-product",
        category=Category.objects.create(name="Race", slug="order-race"),
        brand=Brand.objects.create(name="Race", slug="order-race"),
    )
    variant = ProductVariant.objects.create(
        product=product,
        sku="RACE-TRANSITION-1",
        size="42",
        color="Black",
        unit_price=Decimal("100000"),
    )
    balance = InventoryBalance.objects.create(variant=variant, stock_qty=0)
    order = Order.objects.create(
        number="RACE-CONFIRMED",
        user=cust,
        status=Order.Status.CONFIRMED,
        subtotal=Decimal("100000"),
        total=Decimal("100000"),
    )
    OrderItem.objects.create(
        order=order,
        variant=variant,
        qty=1,
        unit_price=Decimal("100000"),
        line_subtotal=Decimal("100000"),
        product_name_snapshot=product.name,
        sku_snapshot=variant.sku,
        color_snapshot=variant.color,
        size_snapshot=variant.size,
    )
    headers = [auth_headers(admin) for admin in admins]
    barrier = threading.Barrier(3, timeout=10)
    pids: list[int] = []

    def transition(index: int, target: str) -> int:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_backend_pid()")
                row = cursor.fetchone()
                assert row is not None
                pids.append(row[0])
            barrier.wait()
            return (
                Client()
                .post(
                    f"/admin/orders/{order.id}/status",
                    {"status": target},
                    content_type="application/json",
                    **headers[index],
                )
                .status_code
            )
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=2) as pool:
        with transaction.atomic():
            Order.objects.select_for_update().get(pk=order.pk)
            attempts = [
                pool.submit(transition, 0, "CANCELLED"),
                pool.submit(transition, 1, second_status),
            ]
            barrier.wait()
            deadline = time.monotonic() + 10
            waiters = 0
            with connection.cursor() as cursor:
                while time.monotonic() < deadline:
                    cursor.execute("SELECT pg_stat_clear_snapshot()")
                    cursor.execute(
                        "SELECT count(*) FROM pg_stat_activity "
                        "WHERE pid = ANY(%s) AND wait_event_type = 'Lock'",
                        [pids],
                    )
                    row = cursor.fetchone()
                    assert row is not None
                    waiters = row[0]
                    if waiters == 2:
                        break
                    time.sleep(0.025)
        assert len(set(pids)) == 2 and waiters == 2
        assert sorted(attempt.result(timeout=10) for attempt in attempts) == [200, 409]

    order.refresh_from_db()
    balance.refresh_from_db()
    cancelled = order.status == Order.Status.CANCELLED
    assert order.status in {Order.Status.CANCELLED, Order.Status.SHIPPING}
    assert order.stock_returned is cancelled
    assert balance.stock_qty == int(cancelled)
    assert InventoryMovement.objects.filter(kind="cancel_return").count() == int(
        cancelled
    )
    assert OrderStatusEvent.objects.get(order=order).to_status == order.status
