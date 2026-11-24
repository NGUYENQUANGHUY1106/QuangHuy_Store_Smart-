# Kết quả kiểm thử catalog

24/11/2026 · QHS-009.1 / FR-CAT-001, FR-INV-001 / BR-001, BR-003. Windows, PostgreSQL 18.6 `QuangHuy_Store_Smart` local.

| Kiểm tra | Kết quả cuối | Bằng chứng |
|---|---|---|
| Backend `python -m pytest -q` | PASS, exit 0 | 47/47, gồm catalog API và kiểm tra bộ góc màu thứ hai |
| Frontend `npx.cmd vitest run` | PASS, exit 0 | 22/22; assert SKU và tồn sau khi chọn size |
| `npm.cmd run lint` | PASS, exit 0 | 11 cảnh báo React có sẵn, 0 lỗi |
| `npm.cmd run typecheck` | PASS, exit 0 | `tsc -b` |
| `npm.cmd run build` | PASS, exit 0 | `index-BBQVtPfW.js` |
| `python manage.py migrate --check` | PASS, exit 0 | Migration hiện tại đã áp dụng |
| Chrome desktop / mobile | PASS | Trang chủ, 3 danh mục, 4 thương hiệu, trang 2, đổi góc, đổi màu, chọn size và hiển thị SKU/tồn |
| API ảnh thật + giải mã | PASS | 135/135 trả 200, `image/webp`, bytes khớp PostgreSQL, Pillow giải mã được |
| Đối soát dữ liệu | PASS | 0 SKU trùng, 0 công khai thiếu ảnh/mô tả/variant/tồn; 180 SKU demo khớp sổ kho |
| Lặp import 2 SKU model Nike | PASS | ID sản phẩm, ảnh, SKU và giao dịch kho không đổi |

Lần Vitest đầu sau khi hiện thêm SKU thất bại do assertion kiểm chuỗi cũ. Assertion được cập nhật để xác minh đồng thời SKU và tồn kho, sau đó chạy lại toàn bộ suite.

## Cổng nghiệm thu

- Đạt AC-04/05 (Mizuno 10, giày 17) và AC-08/09, AC-11, AC-13–18 theo phạm vi kiểm tra trong bảng.
- AC-10 kiểm quan hệ ảnh–Product/Color trong DB và đối chiếu nhận dạng cho ảnh nhập trong đợt này. Những ảnh lịch sử chưa đủ nguồn đối chiếu vẫn giữ trong các mục mở của gallery audit.
- Chưa đạt AC-01/02/03/06/07 (Nike 7, Adidas 4, Puma 1, quần áo 2, phụ kiện 3) và AC-12 (13/22 gallery đạt). Chưa commit/push vì DoD chưa đạt. Các thay đổi tồn tại trong working tree trên branch hiện tại.

[Audit trước import](PRODUCT_CATALOG_AUDIT.md) · [Import và replay](PRODUCT_IMPORT_REPORT.md) · [Gallery còn thiếu](PRODUCT_GALLERY_AUDIT.md) · [Smoke JSON](PRODUCT_CATALOG_FINAL_SMOKE.json)
