# BUSINESS RULES & ACCEPTANCE

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Business Rules

- BR-001 — Một SKU xác định duy nhất biến thể; giá và tồn tính ở server
- BR-002 — Giỏ hàng chỉ kiểm tồn; một kho, trừ khi tạo đơn thành công và hoàn đúng một lần khi hủy (DEC-003).
- BR-003 — Đơn và tồn kho cập nhật atomically; tránh double deduction và double refund
- BR-004 — Chỉ đánh giá khi đã mua và đủ điều kiện; chính sách đánh giá cần chốt
- BR-005 — Admin chuyển PENDING → CONFIRMED → SHIPPING → COMPLETED. Customer chỉ hủy đơn của mình ở PENDING. Admin hủy ở PENDING hoặc CONFIRMED. COMPLETED và CANCELLED là terminal (DEC-008/011).
- BR-006 — Webhook cổng thanh toán phải xác thực và idempotent
- BR-007 — Try-on cần consent, retention, policy xóa ảnh; không sử dụng ảnh để huấn luyện khi chưa cho phép
- BR-008 — AI không được cam kết kích cỡ vừa chân/người chỉ từ ảnh tạo ra
- BR-009 — Server tính VND từ đơn giá và số lượng, trừ giảm giá và cộng phí ship. Phí chuẩn 30.000đ; miễn phí từ tạm tính 500.000đ. Tối đa một voucher, áp điều kiện min/thời gian/quota và trần giảm phần trăm (DEC-009/015).
- BR-010 — Không hiển thị thông tin riêng tư của khách hàng cho người không có quyền

## Acceptance criteria

- FR-AUTH-001 — Email duy nhất, phiên hợp lệ, khách không được truy cập API cần đăng nhập
- FR-USER-001 — Người dùng chỉ sửa dữ liệu của mình
- FR-CAT-001 — Mỗi biến thể có SKU, kích cỡ, màu, giá và tồn kho rõ ràng
- FR-SRCH-001 — Kết quả đúng bộ lọc, không làm lộ sản phẩm ẩn
- FR-CART-001 — Không cho số lượng âm hoặc biến thể không hợp lệ
- FR-CHK-001 — Backend tự tính lại giá, phí, voucher; không tin tổng tiền client
- FR-ORD-001 — Đơn được tạo một lần, có trạng thái và lịch sử
- FR-INV-001 — 2 người mua SKU còn 1 thì tối đa 1 đơn được giữ hàng
- FR-INV-002 — Không hoàn tồn hai lần; trạng thái nhất quán
- FR-ADM-001 — Chỉ staff có quyền thao tác và ghi log thao tác quan trọng
- FR-DASH-001 — Dữ liệu mẫu có định nghĩa thời điểm và trạng thái tính doanh thu
- FR-TRY-001 — Chỉ chấp nhận file hợp lệ và đồng ý xử lý; trả kết quả hoặc lý do thất bại
- FR-TRY-002 — Có chính sách TTL/xóa và không lưu vô hạn mặc định
- FR-PAY-001 — Webhook có xác thực, chống xử lý trùng, không tin redirect client
- FR-OAUTH-001 — Liên kết tài khoản an toàn, xử lý email trùng
- FR-VOU-001 — Không áp nhiều lần trái quy tắc, backend kiểm chứng
- FR-REV-001 — Chỉ đơn đủ điều kiện được đánh giá
- FR-BG-001 — Job có idempotency/retry và không gửi sai trạng thái
- FR-BG-002 — Không hủy đơn đã thanh toán; hoàn tồn đúng một lần
- FR-AI-001 — Không tự bịa tồn kho/giá, có thông báo nội dung AI

## Concurrent inventory Given/When/Then

Given SKU còn đúng 1 đơn vị; when hai người đồng thời đặt mua mỗi người 1; then tối đa một giao dịch thành công, lượng tồn không dưới 0 và không tạo hai lần giữ hàng.

## AI try-on Given/When/Then

Given ảnh người dùng hợp lệ và sản phẩm được hỗ trợ; when chấp thuận xử lý và khởi chạy; then trả kết quả inference thành công hoặc trạng thái lỗi được ghi nhận; không khẳng định độ chân thực khi chưa đánh giá.
