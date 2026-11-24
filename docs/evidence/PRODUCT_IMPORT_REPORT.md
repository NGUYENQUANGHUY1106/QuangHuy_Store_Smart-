# Import catalog local

24/11/2026 · QHS-009.1 / FR-CAT-001, FR-INV-001 / BR-001, BR-003. PostgreSQL 18.6 local `QuangHuy_Store_Smart`.

| Chỉ tiêu | Trước | Sau |
|---|---:|---:|
| Sản phẩm tổng | 22 | 24 |
| Sản phẩm công khai | 20 | 22 |
| Nike | 5 | 7 |
| Adidas | 4 | 4 |
| Puma | 1 | 1 |
| Mizuno | 10 | 10 |
| Giày bóng đá | 17 | 17 |
| Quần áo thể thao | 1 | 2 |
| Phụ kiện bóng đá | 2 | 3 |
| Ảnh WebP | 107 | 135 |
| SKU tổng | 204 | 214 |

Mẫu mới gồm **Áo tập Nike Dri-FIT Strike** (FN2399) và **Túi trống Nike Academy 40L** (IO0919). Mã chính hãng ghi tại manifest. Giá và tồn mở đầu dùng cho demo, SKU `REAL-…` là mã nội bộ. [Nguồn áo Strike](https://www.nike.com/t/strike-mens-dri-fit-short-sleeve-soccer-top-jLS4TEI9/FN2399-451) · [Nguồn túi Academy](https://www.nike.com/gb/t/academy-football-duffel-bag-small-40l-rlSdz9sx/IO0919-410)

Đã cập nhật mô tả cho toàn bộ 20 sản phẩm công khai có từ trước. Cập nhật gallery cho 10 mẫu giày Mizuno, Puma Future 7 Match và Adidas F50 Pro TF. Ghi 52 ảnh mới và thay 24 bản ghi góc cũ trong transaction của sản phẩm. Danh sách từng ảnh (URL, màu, alt và SHA-256) nằm trong `new_images` của [JSON kiểm chứng](PRODUCT_CATALOG_FINAL_SMOKE.json).

## SKU mới

- `REAL-0157B072C059ED293BF531FD`
- `REAL-1DBFCF3EE671C92D67B2531D`
- `REAL-2AA5A65A29C11BF35F9F43DF`
- `REAL-4C2FB351BE7FA94B524C256F`
- `REAL-626FD741AFBE90E1D084924F`
- `REAL-75F15D53292B1E0DF85E22F1`
- `REAL-76EDF6AC39214B98D3AE31FC`
- `REAL-8F7B0495D0C64A0F6AB407D6`
- `REAL-9F1ABCF32307138AD4E97FB5`
- `REAL-B737329EE160FB1EB02FCC9E`

## Kiểm chứng ghi và chạy lại

- Các batch dùng `python manage.py seed_real_catalog --manifest <file>`; thêm `--strict-gallery` cho batch đúng bộ góc. Tất cả batch được ghi qua Django ORM và commit theo sản phẩm. Không phát sinh migration.
- `pg_dump --format=custom` được lập trước khi ghi. Đối chiếu dump và DB xác nhận giữ nguyên 204 cặp ID/SKU cũ và 147 ID giao dịch kho cũ. Database local có 0 đơn và 0 dòng đơn cả trước lẫn sau.
- Chạy lại batch hai sản phẩm Nike và so sánh tập ID của Product, ProductVariant, ProductImage, InventoryMovement trước/sau. Kết quả trùng hoàn toàn.
- Không lưu dump hoặc ảnh nhị phân vào Git. [Manifest nguồn và quyền sử dụng local](REAL_CATALOG_INCREMENTAL.json)
