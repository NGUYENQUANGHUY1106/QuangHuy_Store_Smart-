# Báo cáo kiểm thử đồng thời (Concurrency Test Report) — QHS-017

- **Ngày thực hiện:** 21/11/2026
- **Database:** PostgreSQL 18.6 trên x86_64-windows (`QuangHuy_Store_Smart`)
- **Môi trường:** Local development (Windows 11, Python 3.13.3, Django 5.2.19, pytest-django 4.14.0)
- **Lệnh thực thi:** `pytest tests/test_concurrency_postgres.py -s -v`
- **Kết quả:** `2 passed in 4.45s` (PASS 100%)

## Chi tiết kịch bản kiểm thử:

### Kịch bản 1: Hai người dùng cùng đặt mua sản phẩm cuối cùng (stock_qty = 1)
- **Test:** `test_concurrency_two_users_race_last_stock_item`
- **Cơ chế đồng bộ:** `threading.Barrier(2)` kích hoạt 2 request `POST /checkout/orders` tại cùng một thời điểm với 2 connection PostgreSQL độc lập.
- **Kết quả thực tế:**
  - Đúng 1 request thành công với status `201 Created`.
  - Đúng 1 request bị từ chối với status `409 Conflict` (`insufficient_stock`).
  - Tồn kho `stock_qty` sau giao dịch là `0` (không bao giờ âm, không xảy ra oversell).
  - Đúng 1 bản ghi `InventoryMovement` loại `checkout` được tạo với `delta = -1, after_qty = 0`.

### Kịch bản 2: Khách hàng checkout đồng thời Admin điều chỉnh giảm tồn kho
- **Test:** `test_concurrency_checkout_races_inventory_adjust`
- **Cơ chế:** Kích hoạt đồng thời 1 checkout (delta = -1) và 1 điều chỉnh giảm kho (delta = -1) khi tồn ban đầu = 1.
- **Kết quả thực tế:**
  - Đúng 1 hành động thành công (201) và 1 hành động bị từ chối (409 insufficient_stock).
  - Tồn kho không âm (`stock_qty >= 0`).
  - Bảo toàn tính toàn vẹn all-or-nothing và tính nhất quán dữ liệu của PostgreSQL row lock `select_for_update()`.
