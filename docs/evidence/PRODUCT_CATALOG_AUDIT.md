# Audit trước khi cập nhật catalog

24/11/2026 · QHS-009.1 / FR-CAT-001, FR-INV-001 / BR-001, BR-003

Django kết nối bằng ORM tới PostgreSQL 18.6 `QuangHuy_Store_Smart` tại loopback `127.0.0.1`, trong phạm vi local demo DEC-006/014. `manage.py migrate --check` đạt. Schema hiện có Brand/Category → Product → ProductVariant → InventoryBalance/InventoryMovement và ProductImage → Product/Variant. WebP lưu trong `catalog_productimage.webp_data` (`bytea`). URL ảnh được Django phục vụ từ `/media/catalog-db/{uuid}`.

| Chỉ tiêu | Trước import |
|---|---:|
| Sản phẩm tổng / công khai | 22 / 20 |
| Nike / Adidas / Puma / Mizuno | 5 / 4 / 1 / 10 |
| Giày / Quần áo / Phụ kiện | 17 / 1 / 2 |
| Ảnh WebP DB | 107 |
| Sản phẩm công khai thiếu ảnh DB | 0 |
| Sản phẩm công khai thiếu biến thể | 0 |
| SKU trùng | 0 |
| Sản phẩm công khai có biến thể thiếu tồn kho | 0 |
| Sản phẩm công khai thiếu mô tả | 16 |

Chín mẫu thiếu số lượng góc chụp: Adidas F50 Pro TF, Adidas Predator 24 League, Adidas Predator Accuracy.1 TF, Adidas Tiro 24 Training, Nike Mercurial Lite, Nike Vapor 15 Pro TF, Nike Vapor 16 Elite, Nike Phantom GX 2 Pro TF và Puma Future 7 Match. Mười mẫu giày Mizuno có 5/3 ảnh theo số đếm. Bộ 3 góc màu thứ hai đang dùng má ngoài, má trong và đế. Cần đổi sang má ngoài, mặt trên và gót theo yêu cầu ngày 24/11. Balo Nike Academy Team có 5/3 ảnh.

Bản sao lưu PostgreSQL định dạng custom đã tạo ngoài repository trước mọi thao tác ghi. `pg_restore --list` đọc được TOC gồm catalog và orders. Kích thước 14.604.569 byte. Không phục hồi lên database đang chạy.

Nguồn kiểm tra: ORM trên database đích, migrations catalog, API contract và [evidence lịch sử](REAL_CATALOG_GALLERY_SMOKE.json).
