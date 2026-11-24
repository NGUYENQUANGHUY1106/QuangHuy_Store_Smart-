# Seed catalog ảnh thật vào PostgreSQL

Chạy từ backend với môi trường ảo đã kích hoạt.

```bash
python manage.py migrate
python manage.py seed_real_catalog
```

Manifest mặc định là [REAL_CATALOG_INCREMENTAL.json](../evidence/REAL_CATALOG_INCREMENTAL.json). Dùng `--manifest <path>` để nhập một danh sách khác. Manifest là mảng JSON có ít nhất một sản phẩm.

```json
{
  "kind": "boots",
  "name": "<tên model cụ thể>",
  "brand": "<hãng>",
  "price": "2500000",
  "colors": [
    {
      "color": "<phối màu chính xác>",
      "style_code": "<mã kiểu và màu của hãng>",
      "product_url": "https://example.com/product-model",
      "image_url": "https://example.com/studio-image.webp",
      "fallback_urls": ["https://example.com/alternate-studio-image.webp"],
      "rights": "<nguồn giấy phép hoặc xác nhận quyền sử dụng>"
    }
  ]
}
```

Sản phẩm mới cần 2–3 phối màu. Thêm `existing_slug` cùng tên hiện có để cập nhật một sản phẩm từ một phối màu đã xác thực. `kind` nhận `boots`, `apparel`, `ball` hoặc `accessory`. Người chuẩn bị manifest đối chiếu product_url/style_code, màu thật, nền studio, độ nét và quyền sử dụng theo DEC-014. Kiểm tra độ phân giải, giải mã, chi tiết cạnh và hash WebP hỗ trợ sàng lọc, còn nhận dạng đúng model/màu và quyền sử dụng cần đối chiếu nguồn. Giá và số dư khởi tạo là dữ liệu demo.

Lệnh gửi User-Agent Chrome và Referer trang sản phẩm, thử các URL dự phòng theo thứ tự, rồi kiểm ảnh rộng tối thiểu 600 px, kích thước và độ nét trước khi mã hóa WebP chất lượng 90 trong RAM. Lệnh commit từng sản phẩm. Dòng lỗi được báo sau khi đã xử lý những dòng còn lại. Dữ liệu lưu ở ProductImage.webp_data (bytea). API giữ /products và thêm /api/catalog/products/. JSON chứa đường dẫn /media/catalog-db/{id}; Django phục vụ binary trực tiếp. Một ảnh tham chiếu variant đại diện mỗi màu, React áp dụng ảnh đó cho các size cùng màu. Danh sách ưu tiên thumbnail WebP. Chi tiết hiển thị ảnh theo màu; màu thiếu ảnh dùng placeholder.

Có thể chạy lại để cập nhật ảnh cùng mẫu/màu. SKU, giá và tồn hiện hữu được giữ khi cập nhật ảnh. SKU thiếu size thuộc màu đã xác thực được bổ sung. Tồn dương khởi tạo có InventoryMovement mở đầu; số dư 0 có tổng movement 0. Rollback schema bằng migrate catalog 0004 sẽ bỏ dữ liệu WebP; sao lưu trước khi rollback và xử lý các bản ghi URL DB đã nhập.

## Kiểm chứng local 23/11/2026

QHS-009.1 / FR-CAT-001 / FR-INV-001 / BR-001, BR-003 / QHS-009.1-AC1. Windows, working tree trên `c6d9af2`, PostgreSQL 18.6 `QuangHuy_Store_Smart`. Migration `catalog.0005_productimage_webp_data` đã áp dụng. `makemigrations --check --dry-run` và `migrate --check` đạt.

[Kết quả kiểm tra nguồn ban đầu](../evidence/REAL_CATALOG_SOURCE_CHECK.json) ghi HTTP status, pixel, độ nét và lý do loại. Manifest mới lưu URL đã kiểm theo mã mẫu/phối màu và xác nhận của Nguyễn Quang Huy về phạm vi demo học thuật (DEC-006/014).

- `python manage.py seed_real_catalog` exit 0. Đã cập nhật/nhập 11 sản phẩm thuộc ba danh mục mục tiêu, có 23 ảnh WebP và 23 SHA-256 khác nhau. Tổng toàn database gồm 5 danh mục, 13 sản phẩm và 114 biến thể. 80 SKU được seed đối soát khớp với InventoryMovement, gồm 9 SKU hết hàng.
- `GET /api/catalog/products/` trả 200. Cả 23 endpoint ảnh trả 200, `Content-Type: image/webp` và bytes trùng PostgreSQL. Chrome xác nhận trang chủ 4/4 thẻ, giày 8/8, phụ kiện 2/2 và quần áo 1/3 tải ảnh từ DB. Hai sản phẩm quần áo cũ chưa có ảnh đúng mẫu. Đối chiếu tên tệp và SHA-256 trong media, static, staticfiles và public trước/sau không phát sinh hay thay đổi tệp. [Kết quả API, SHA-256 và Chrome](../evidence/REAL_CATALOG_LOCAL_SMOKE.json)
- `python -m pytest -q` 46/46, `npx.cmd vitest run` 22/22, `npm.cmd run build`, Ruff và mypy đạt. Regression kiểm manifest dưới 12 dòng, dòng lỗi không chặn dòng hợp lệ, URL dự phòng, chạy lại, độ rộng tối thiểu và ưu tiên thumbnail DB.
- Nike Mercurial Vapor 16 Elite giữ slug và SKU cũ; mô tả được chỉnh thành đế FG để khớp hai mã phối màu đã xác thực. Puma Future 7 Match và Adidas Predator 24 League còn một màu xanh cũ chưa có ảnh trùng mẫu.
- Chưa nhập Manchester United Home 2025/26, áo ĐT Việt Nam và Động Lực UHV 2.07 Galaxy do chưa xác thực phối màu thứ hai đúng mẫu; các nguồn Galaxy đã kiểm chỉ có size 5. Bộ Nike Dri-FIT Strike và tất Foxso chưa có hai nguồn ảnh phối màu đạt chuẩn.

## Gallery nhiều góc chụp

Khai báo `gallery` trong từng phối màu, mỗi mục có `angle`, `image_url` và tùy chọn `fallback_urls`. Màu đầu tiên có 4–5 ảnh. Với giày, thứ tự bắt đầu ở `lateral` và phải có thêm `medial`, `top`, `outsole`; góc thứ năm có thể là `heel` hoặc `detail`. Các màu tiếp theo có 2–3 ảnh. Các góc hàng may mặc và phụ kiện dùng `front`, `side`, `back` hoặc `detail` khi phù hợp. Mục cũ có một ảnh/màu tiếp tục đọc được và không ghi đè gallery nhiều ảnh.

Hai bản ghi mẫu `ao-training-khong-logo` và `quan-short-training` đã chuyển sang `Archived` để loại khỏi web và giữ SKU/lịch sử. Có thể đưa lại về `Published` sau khi bổ sung ảnh đúng mẫu. Dữ liệu công khai sau đợt seed có 20 sản phẩm và 107 ảnh WebP, 11 sản phẩm đã đủ bộ gallery. Chrome kiểm tra đổi 5 thumbnail, sau đó đổi màu cho ra 3 ảnh riêng. Không có sản phẩm công khai thiếu ảnh DB. Mục tiêu chỉnh lại là tối thiểu 10 sản phẩm mỗi nhóm; Mizuno và Giày bóng đá đã đạt. Các nhóm khác và 9 gallery cũ còn thiếu nguồn đạt chuẩn. [Thống kê theo sản phẩm](../evidence/REAL_CATALOG_GALLERY_SMOKE.json)

`python -m pytest -q` 46/46, `npx.cmd vitest run` 22/22 và `npm.cmd run build` đạt.

Đợt 24/11/2026 thêm `--strict-gallery` để chặn manifest thiếu 5/3 góc, bao gồm yêu cầu má ngoài, mặt trên và gót cho màu thứ hai của giày. Manifest hỗ trợ `description` để upsert mô tả theo đúng sản phẩm. [Báo cáo import](../evidence/PRODUCT_IMPORT_REPORT.md)
