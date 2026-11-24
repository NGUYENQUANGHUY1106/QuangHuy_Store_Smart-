# Typography Customer và Admin

24/11/2026 · QHS-008, QHS-011 và QHS-022 · NFR-UX-001, FR-CAT-001.

## Hướng thiết kế

- Sản phẩm. Cửa hàng đồ bóng đá và công cụ quản lý catalog, kho và đơn hàng.
- Tính cách. Nhanh, rõ nhịp, thực dụng.
- Bối cảnh. Sân cỏ, vạch sân và màu cam sẵn có của cửa hàng.
- Điểm nhấn. Hero và banner dùng Barlow Condensed, dữ liệu Admin dùng Be Vietnam Pro.
- Chi tiết nhận diện. Chữ nén ở banner thể thao và chữ số đều chiều rộng cho giá/tổng/KPI.

## Audit và thay đổi

| Vị trí | Trước | Sau |
|---|---|---|
| Toàn site | DM Sans và Syne tải từ Google Fonts khi mở trang | Be Vietnam Pro 400/500/600 và Barlow Condensed 600 tự phục vụ bằng WOFF2, `font-display: swap` |
| Hero | Desktop 88 px, mobile 46 px, tracking âm 5%, chữ hoa | 48–72 px desktop, 40–48 px mobile, chữ thường theo câu, line-height 1.15 |
| Sản phẩm | H1 dùng Syne và chữ hoa, giá/tên có ít độ tách | Be Vietnam Pro, H1 desktop 36–48 px, tên thẻ 14–16 px, giá thẻ 18 px, mô tả line-height 1.7 |
| Menu, form và checkout | Trọng lượng 700–800 dùng rộng, một số chữ nhỏ 10–11 px | Điều hướng và nút 14–16 px, nhãn 13–14 px, chú thích 12–13 px, weight 400–600 |
| Admin | Tiêu đề dùng Syne 32–48 px, KPI 18 px, đầu bảng/trạng thái 10–11 px | Tiêu đề 24–30 px, KPI 26–36 px, sidebar 14 px, bảng 14 px, đầu bảng 13 px, trạng thái 12 px |

Be Vietnam Pro có chữ số theo tỷ lệ. Dùng riêng glyph 0–9 từ Barlow Condensed cho giá, tổng và KPI, giữ phần chữ và ký hiệu tiền theo Be Vietnam Pro. Chữ nội dung chính trên trắng đạt 18.43:1; chữ phụ trên nền trang 5.74:1; chữ tối trên cam 5.59:1; cam đậm trên trắng 6.35:1. Đây là các cặp màu chữ được thay đổi trong lượt này.

Font có SIL Open Font License 1.1. Giấy phép nằm trong `frontend/public/font-licenses` và được Vite chép vào bản build. [Be Vietnam Pro](https://github.com/google/fonts/blob/main/ofl/bevietnampro/OFL.txt) · [Barlow Condensed](https://github.com/google/fonts/blob/main/ofl/barlowcondensed/OFL.txt)

## Kiểm chứng

- Chrome với Playwright tại 320, 390, 768, 1024 và 1440 px. Kiểm tra trang chủ, chi tiết sản phẩm, danh mục, đăng nhập, giỏ, checkout và Admin Login. Đo bounding box của dòng tiêu đề để kiểm tra tràn chữ.
- Checkout có sản phẩm kiểm thử ở cả 5 chiều rộng. Admin Dashboard và bảng sản phẩm dùng fixture trình duyệt ở desktop/mobile vì database local không có phiên Admin. Không gửi dữ liệu fixture vào PostgreSQL.
- Chrome DevTools xác nhận glyph tiếng Việt trong mẫu thử dùng WOFF2. Khi font display thiếu một ký tự, Be Vietnam Pro hiển thị ký tự đó. Khi chặn tất cả WOFF2, trạng thái fallback trên trang chủ 320 px vẫn trong viewport.
- Ảnh trước/sau và ảnh Admin Dashboard/bảng kiểm thử nằm trong thư mục local `QuangHuySport/typography`. Ảnh trước của Admin chỉ có trang đăng nhập.
- `npm.cmd run lint` đạt với 11 cảnh báo React có sẵn. `npm.cmd run typecheck`, `npx.cmd vitest run` (22 test), `npm.cmd run build` đạt.
- Chưa commit/push. Branch hiện tại chứa thay đổi chưa commit từ các đợt trước. Riêng `styles.css` ở HEAD chỉ có dòng import Tailwind, nên đưa cả tệp lên sẽ kèm phần UI ngoài typography.

Quy trình tham chiếu [unslop của Damir Sokolovsky](https://heydamir.design/unslop), CC BY 4.0.
