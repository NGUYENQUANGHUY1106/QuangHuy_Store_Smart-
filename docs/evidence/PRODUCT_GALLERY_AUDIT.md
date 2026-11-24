# Kiểm chứng ảnh và gallery

24/11/2026 · QHS-009.1 / FR-CAT-001, FR-INV-001 / BR-001, BR-003. PostgreSQL 18.6 local `QuangHuy_Store_Smart`.

13/22 sản phẩm đạt gallery theo màu. 135/135 WebP mở được bằng Pillow, rộng ≥600 px, có SHA-256 khác nhau và trả HTTP 200 với `image/webp` và nội dung trùng bytea. Số URL lỗi và số sản phẩm công khai thiếu ảnh đại diện đều bằng 0. Quan hệ ảnh–variant–sản phẩm đúng ở tất cả các bản ghi. Màu và góc nhập trong đợt đối chiếu bằng ảnh nguồn trước khi import. Việc mở URL chỉ kiểm tra truy cập và dữ liệu ảnh.

Chrome desktop 1366×900 và mobile 390×844 đã bấm từng thumbnail, đổi màu và chọn size trên một mẫu giày, một áo và một túi thực tế. Đã kiểm tra 3 danh mục, 4 bộ lọc thương hiệu và trang 2. [Kết quả chi tiết](PRODUCT_CATALOG_FINAL_SMOKE.json)

## MISSING_VERIFIED_ASSET

- `real-adidas-f50-pro-tf` — Hồng (heel, top)
- `adidas-predator-24-league` — Xanh (chưa có ảnh), Đen (heel, lateral, medial, outsole, top), Trắng (heel, lateral, top)
- `real-adidas-predator-accuracy1-tf` — Đen/Hồng (heel, lateral, medial, outsole, top), Trắng/Vàng chanh (heel, lateral, top)
- `real-ao-khoac-adidas-tiro-24-training` — Đen (thiếu ảnh hoặc chưa đủ số góc), Xanh dương (thiếu ảnh hoặc chưa đủ số góc)
- `real-nike-mercurial-lite` — Đen (thiếu ảnh hoặc chưa đủ số góc), Trắng (thiếu ảnh hoặc chưa đủ số góc)
- `real-nike-mercurial-vapor-15-pro-tf` — Hồng (heel, lateral, medial, outsole, top), Vàng (heel, lateral, top)
- `nike-mercurial-vapor-16-elite` — Đen (heel, lateral, medial, outsole, top), Cam (heel, lateral, top)
- `real-nike-phantom-gx-2-pro-tf` — Đen (heel, lateral, medial, outsole, top), Trắng (heel, lateral, top), Cam (heel, lateral, top)
- `puma-future-7-match` — Xanh (chưa có ảnh)

Quy tắc giày hai màu yêu cầu 5 góc màu mặc định và 3 góc màu thứ hai (má ngoài, mặt trên, gót). F50 màu hồng có ảnh má trong và đế thay vì góc mặt trên và gót, nên vẫn chưa đạt. Puma Future 7 Match đạt bộ 5/3 ở màu cam và đen, còn phối xanh đang bán thiếu ảnh. Không áp dụng ngoại lệ chưa được chủ dự án duyệt.

Nguồn đối chiếu [Puma Future 7 Match cam](https://www.unisportstore.com/football-boots/puma-future-7-match-tt-forever-faster-sunset-glowpuma-blacksun-stream/338129/) · [Puma Future 7 Match đen](https://www.unisportstore.com/football-boots/future-7-match-tt-puma-black-puma-white/335921/) · [Adidas F50 Pro TF trắng](https://www.unisportstore.com/football-boots/adidas-f50-pro-tf-advancement-footwear-whitesolar-redlucid-blue/358789/) · [Adidas F50 Pro TF hồng](https://www.unisportstore.com/football-boots/adidas-f50-pro-tf-vivid-horizon-turboaurora-blackplatin-metallic/359631/)
