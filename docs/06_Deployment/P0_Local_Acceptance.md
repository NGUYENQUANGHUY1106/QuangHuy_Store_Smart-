# Nghiệm thu local sau phê duyệt 23/11/2026

Người duyệt phạm vi Nguyễn Quang Huy. [DEC-006/007/012/014/016](../OPEN_DECISIONS.md) áp dụng cho MVP local. QHS-031 sau P0. Thanh toán qua cổng thật, OAuth và email nền thuộc P2.

## Ma trận TC-001–007

Các ca dưới đây chạy trong suite Django/pytest trên PostgreSQL 18.6, database test riêng. Đây là kết quả theo test case và không tự đóng gate QHS-024.

| TC / AC | Lệnh con có thể tái hiện bằng python -m pytest | Actual |
|---|---|---|
| TC-001 / QHS-005-AC1 | tests/test_auth.py::test_duplicate_email_and_bad_password | Từ chối đăng ký trùng và mật khẩu sai. |
| TC-002 / QHS-016-AC1 | tests/test_cart_orders.py::test_cart_rejects_quantity_over_stock | SKU từ tồn 2 về 0 sau khi có trong giỏ. Checkout 409 insufficient_stock, không có đơn hoặc movement. |
| TC-003 / QHS-017-AC1 | tests/test_concurrency_postgres.py::test_concurrency_two_users_race_last_stock_item | Hai transaction độc lập tranh SKU tồn 1; một checkout thành công; có thêm trường hợp multi-SKU và cùng key. |
| TC-004 / QHS-016-AC1 | tests/test_cart_orders.py::test_checkout_deducts_stock_and_cancel_restores_once | Gửi cùng key trả cùng ID, số dư không bị trừ lần hai. |
| TC-005 / QHS-020-AC1 | tests/test_cart_orders.py::test_checkout_deducts_stock_and_cancel_restores_once | Lần hủy đầu hoàn tồn, lần sau 409; duy nhất một movement hoàn tồn. |
| TC-006 / QHS-023-AC1 | tests/test_admin_catalog.py::test_customer_cannot_access_admin_catalog; tests/test_analytics.py::test_customer_denied_dashboard_analytics | JWT customer nhận 403 trên API admin. |
| TC-007 / QHS-016-AC1 | tests/test_cart_orders.py::test_checkout_deducts_stock_and_cancel_restores_once | Client gửi total = 1; server lưu tổng 1.300.000 VND theo quote và giá server. |

## QHS-025-AC1 — Rehearsal database trên máy local

Windows, PostgreSQL 18.6, base c6d9af2 và working tree hiện tại. Hai lượt thực hiện từ database cấu hình thật QuangHuy_Store_Smart.

1. `pg_dump -h <host> -p <port> -U <user> -w -Fc -f <temp>/archive.dump QuangHuy_Store_Smart`, exit 0.
2. Tạo DB tạm tên qhs_handover_<id>; `pg_restore -h <host> -p <port> -U <user> -w --exit-on-error --no-owner --no-privileges -d <db-tạm> <temp>/archive.dump`, exit 0.
3. Đối chiếu count và hash dữ liệu theo thứ tự ổn định cho django_migrations, orders_order, orders_orderitem, orders_orderstatusevent, catalog_inventorybalance và catalog_inventorymovement. Actual 6/6 khớp.
4. Cutover/rollback trong tiến trình Django riêng, theo thứ tự DB gốc → DB restore → DB gốc qua POSTGRES_DB. Mỗi bước chạy `python manage.py migrate --check` và gọi GET /health qua Django test client, xác nhận 200, đúng database và PostgreSQL 18.6. Cả ba bước PASS.
5. Dọn DB tạm và archive sau test. Không ghi secrets hoặc dữ liệu hồ sơ vào evidence. DB gốc tiếp tục giữ dữ liệu, không dùng thao tác restore đè hoặc chuyển tiến trình đang phục vụ.

Xem setup và các lệnh browser tại [README](../../README.md).

## Migration cart/0002

Sau khi kiểm SQL, `python manage.py migrate --noinput` áp dụng cart.0002 trên DB local thành công. Migration chỉ thêm bảng receipt có unique trên (cart, key) và FK, không backfill. `python manage.py makemigrations --check --dry-run` trả No changes detected. Sau migrate, chạy lại pg_dump/pg_restore rồi `python manage.py migrate cart 0001 --noinput` và `python manage.py migrate cart 0002 --noinput` trên DB tạm. Actual exit 0; bảng receipt biến mất sau reverse, xuất hiện lại sau reapply. Reverse làm mất receipt ở DB bị reverse, vì vậy rehearsal dùng bản sao riêng.

## Kiểm thử phần thay đổi

- Lệnh trong backend: `python -m pytest` đạt 39/39, có 8 ca concurrency PostgreSQL, exit 0. Ruff và mypy PASS (73 tệp nguồn). Django check và migrate check PASS.
- Lệnh trong frontend: `npx.cmd --no-install vitest run` đạt 22/22, exit 0. Build, TypeScript và kiểm format PASS.
- Refresh: token cũ không dùng được sau rotation; logout thu hồi refresh mới. Browser retry một request 401 sau refresh; dashboard báo lỗi khi offline hoặc API 500.
- Khi giả lập lỗi server chứa dữ liệu nhạy cảm, API trả 500 với mã đối soát; log chỉ ghi mã đối soát và loại lỗi. Fixture kiểm log và body không chứa chi tiết exception.
- Lỗi thật tìm thấy trong Chrome: GET /addresses có pagination trong khi UI chỉ nhận mảng. UI đã đọc từng trang qua đúng endpoint nội bộ; tạo/sửa/xóa/đặt mặc định được kiểm lại.
- Sửa lỗi typecheck phát sinh do tham số expected_version của API client JS bị suy luận chỉ là undefined; khai báo lại kiểu tham số tùy chọn và chạy build.

## Kết quả browser và dấu hoàn thành

Chrome 158, Vite trên 5173, Django live server trên 8000 và PostgreSQL 18.6. Lệnh `python -m pytest e2e/test_p0_smoke.py --liveserver=127.0.0.1:8000 -q --tb=short` đạt 1/1, exit 0. Bản dựng cuối index-BkRCI4ed.js. Vitest không vào watch mode. Không có skip trong các lượt PASS.

| Task / FR / AC | Expected và actual |
|---|---|
| QHS-008 / FR-USER-001 / QHS-008-AC1 | Chrome mobile tạo hai địa chỉ, đặt mặc định, sửa và xóa; snapshot địa chỉ của đơn cũ vẫn giữ nguyên. React interaction và IDOR backend PASS. |
| QHS-011 / FR-CAT-001, FR-SRCH-001 / QHS-011-AC1 | Chrome mobile mở ảnh thứ hai bằng Enter, kiểm trạng thái aria và thông báo không có hướng dẫn size. Vitest chọn variant, API catalog search và filter PASS. |
| QHS-013 / FR-CART-001 / QHS-013-AC1 | Vitest xác nhận lỗi cập nhật/xóa giữ item, retry thành công. PostgreSQL replay merge không cộng đôi, key cũ và payload khác trả 409. Chrome merge thật. |
| QHS-018 / FR-CHK-001, FR-ORD-001 / QHS-018-AC1 | Chrome chặn phản hồi đầu sau khi server 201, gửi lại cùng key nhận 200, chỉ có một order. Giá/tồn và quote do backend kiểm. |
| QHS-019 / FR-ORD-001 / QHS-019-AC1 | Backend phân trang 21 đơn owner, tài khoản khác nhận 404. Chrome xem history hủy và snapshot địa chỉ; database đối chiếu snapshot sản phẩm. |
| QHS-020 / FR-ORD-001, FR-INV-002 / QHS-020-AC1 | PostgreSQL tranh chấp hủy/ship và hai admin hủy, chỉ hoàn một lần. expected_version cũ trả 409 và không đổi trạng thái. |
| QHS-021 / FR-ADM-001, FR-ORD-001, FR-INV-002 / QHS-021-AC1 | Chrome admin xác nhận hủy và đối soát tồn. UI customer hiển thị conflict từ API, cập nhật trạng thái khi lần retry thành công. |
| QHS-022 / FR-DASH-001 / QHS-022-AC1 | Admin lọc ngày, xử lý biên 00:00 Asia/Saigon, loại ship và đơn pending/cancelled; net 650.000 VND, top SKU đúng. Role customer nhận 403. UI hiển thị trạng thái rỗng, lỗi offline/500 và COD chưa theo dõi. |

## Known limits

- Dashboard dựa trên event COMPLETED trong ngày được chọn, chỉ tính các đơn hiện ở COMPLETED. Đơn lịch sử thiếu event hoàn tất không có dữ liệu thời điểm để đưa vào báo cáo. COD hiển thị “Chưa theo dõi” vì MVP chưa ghi nhận xác nhận thu riêng.
- DEC-014 cho phép ẩn bảng size khi chưa có nguồn. Dữ liệu hiện hành dùng thông báo “Chưa có hướng dẫn size”.

## Gate cuối — DONE 23/11/2026

MVP local đạt 25/25 task P0. QHS-031 sau P0 theo DEC-016. Build frontend index-DjkNhPNR.js, working tree trên c6d9af2; PostgreSQL 18.6. Các lệnh chạy từ backend hoặc frontend tương ứng.

| Task / Requirement / AC | Evidence |
|---|---|
| QHS-002 / FR-CAT-001, FR-SRCH-001, FR-ADM-001 / QHS-002-AC1 | Đối chiếu routes, serializers, models và catalog tests. Đồng bộ field ghi/đọc, filter, suggestions, từ chối xóa bản ghi được bảo vệ, upload và ranh giới version trong [API contract](../03_Design/API_CONTRACTS.md) và [DB design](../03_Design/DATABASE_DESIGN.md). |
| QHS-023 / NFR-SEC-001/002, NFR-UX-001, NFR-OBS-001 / QHS-023-AC1 | pytest kiểm CORS, secret thiếu/yếu, JWT refresh/revoke, IDOR cart/address/order, role và used_count chỉ đọc, lỗi/log đã làm sạch. Cấu hình local dùng allowlist loopback và JWT key dài ít nhất 50 ký tự; DEBUG=true trong profile local. Chrome kiểm Tab/focus/Enter/Space trên đường đi P0, gồm gallery, đăng nhập, mua hàng, địa chỉ, quản trị đơn/kho/catalog và form user/voucher. |
| QHS-024 / FR-ADM-001, FR-VOU-001 và FR P0 / QHS-024-AC1 | TC-001–007 PASS như ma trận trên. `python -m pytest` 42/42, 0 skip; gồm test admin CRUD user/voucher và 8 ca PG concurrency. `npx.cmd --no-install vitest run` 22/22, build PASS. `python -m pytest e2e/test_p0_smoke.py --liveserver=127.0.0.1:8000 -q --tb=short` 1/1 PASS. Test kiểm quyền và vô hiệu hóa, giữ lịch sử user/voucher. |
| QHS-025 / NFR-REL-001, NFR-OBS-001, NFR-SEC-002 / QHS-025-AC1 | Smoke local cuối PASS. Django check và migrate check PASS. Đối chiếu restore 6/6 bảng và rollback/reapply cart.0002 trên bản sao đã PASS như rehearsal trên. Đóng gate bàn giao local sau QHS-024. |

Lỗi khi kiểm: lần chạy bàn phím đầu nhấn Enter trên nút đặt hàng trước lúc báo giá tải xong; chờ nút enabled rồi chạy lại PASS. Bản giao giữ lịch sử bằng vô hiệu hóa user/voucher. Admin tạo Customer, không cấp role admin hoặc đổi email đăng nhập qua màn quản lý này. CI remote và triển khai công khai ngoài phạm vi gate local.
