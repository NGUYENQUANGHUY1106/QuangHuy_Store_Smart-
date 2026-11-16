# USE CASES & USER STORIES

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Use Case Catalog

- UC-M01-01 — Authentication & User: luồng khởi tạo/xem — P0
- UC-M02-01 — Catalog & Variants: luồng khởi tạo/xem — P0
- UC-M03-01 — Search & Discovery: luồng khởi tạo/xem — P0
- UC-M04-01 — Cart & Checkout: luồng khởi tạo/xem — P0
- UC-M05-01 — Orders & Inventory: luồng khởi tạo/xem — P0
- UC-M06-01 — Admin & Reporting: luồng khởi tạo/xem — P0
- UC-M07-01 — AI Virtual Try-On: luồng khởi tạo/xem — P1
- UC-M08-01 — OAuth & Payment: luồng khởi tạo/xem — P2
- UC-M09-01 — Promotions & Reviews: luồng khởi tạo/xem — P2
- UC-M10-01 — Async & AI Assistant: luồng khởi tạo/xem — P2

## UC-CHK-01 — Checkout COD

### Preconditions

- Đã xác thực; giỏ hàng có ít nhất một biến thể hợp lệ; địa chỉ hợp lệ

### Main Flow

- User chọn địa chỉ và COD; backend kiểm tra tồn, tính lại giá và phí; tạo đơn và snapshot order items trong transaction; ghi tồn theo chính sách; trả mã đơn

### Alternatives

- Giá thay đổi; voucher không hợp lệ; không đủ tồn; request trùng; lỗi transaction

### Postconditions

- Chỉ 1 đơn cho cùng idempotency key; tồn không âm; tổng tiền do backend tính

## UC-TRY-01 — AI virtual try-on

### Preconditions

- Đã đồng ý xử lý ảnh; model đã xác định hỗ trợ loại sản phẩm; ảnh tuân thủ định dạng

### Main Flow

- Upload ảnh; lựa chọn sản phẩm; hệ thống tạo job; kiểm tra ảnh/quyền; chạy inference; trả hình xem trước; cho phép xóa

### Alternatives

- Ảnh sai định dạng; thiếu GPU/quota; inference fail; sản phẩm không hỗ trợ

### Postconditions

- Kết quả hoặc lỗi minh bạch; ảnh tuân thủ TTL/xóa

## User Stories

- US-M01-01 — Là người dùng/tác nhân liên quan, tôi muốn đăng ký email, đăng nhập, đổi mật khẩu, profile và địa chỉ để đạt mục tiêu nghiệp vụ của Authentication & User. — P0
- US-M02-01 — Là người dùng/tác nhân liên quan, tôi muốn danh mục, thương hiệu, sản phẩm, size/màu, ảnh, sku, giá, tồn kho để đạt mục tiêu nghiệp vụ của Catalog & Variants. — P0
- US-M03-01 — Là người dùng/tác nhân liên quan, tôi muốn tìm kiếm, gợi ý, lọc giá/danh mục/đánh giá, sort, phân trang để đạt mục tiêu nghiệp vụ của Search & Discovery. — P0
- US-M04-01 — Là người dùng/tác nhân liên quan, tôi muốn giỏ hàng, địa chỉ, voucher cơ bản, cod, phí giao hàng mô phỏng để đạt mục tiêu nghiệp vụ của Cart & Checkout. — P0
- US-M05-01 — Là người dùng/tác nhân liên quan, tôi muốn đơn hàng, trạng thái, hủy đơn, trừ/hoàn tồn, bảo vệ concurrency để đạt mục tiêu nghiệp vụ của Orders & Inventory. — P0
- US-M06-01 — Là người dùng/tác nhân liên quan, tôi muốn crud sản phẩm/biến thể, đơn hàng, tồn kho, thống kê cơ bản để đạt mục tiêu nghiệp vụ của Admin & Reporting. — P0
- US-M07-01 — Là người dùng/tác nhân liên quan, tôi muốn upload ảnh, đồng ý xử lý, chọn đồ, inference, hiển thị/xóa kết quả để đạt mục tiêu nghiệp vụ của AI Virtual Try-On. — P1
- US-M08-01 — Là người dùng/tác nhân liên quan, tôi muốn google/facebook oauth, cổng thanh toán sandbox và webhook để đạt mục tiêu nghiệp vụ của OAuth & Payment. — P2
- US-M09-01 — Là người dùng/tác nhân liên quan, tôi muốn voucher nâng cao, đánh giá chỉ sau khi mua thành công để đạt mục tiêu nghiệp vụ của Promotions & Reviews. — P2
- US-M10-01 — Là người dùng/tác nhân liên quan, tôi muốn background email, hủy đơn quá hạn, chatbot hoặc tóm tắt đánh giá để đạt mục tiêu nghiệp vụ của Async & AI Assistant. — P2

## Definition of Ready

- Requirement ID, actor, inputs/outputs, rules, acceptance criteria, dependency, risk rõ ràng
- Không đưa AI feature vào development trước khi spike chứng minh tương thích
