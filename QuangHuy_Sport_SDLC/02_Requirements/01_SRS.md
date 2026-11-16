# SRS — QUANGHUY_SPORT V0.1

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Purpose & Scope

Đặc tả chức năng Web User/Admin cho website bán đồ thể thao có trải nghiệm AI thử đồ ảnh tải lên; phạm vi có nhãn P0/P1/P2.

## Actors

- GUEST — xem catalog, tìm kiếm, xem chi tiết
- CUSTOMER — quản lý tài khoản, giỏ, checkout, đơn, đánh giá nếu đủ điều kiện
- STAFF — xử lý sản phẩm/đơn/tồn theo quyền
- ADMIN — phân quyền và thống kê
- AI-INFERENCE — service xử lý ảnh với consent; không phải human actor

## Modules

- M01 — Authentication & User — P0 — Đăng ký email, đăng nhập, đổi mật khẩu, profile và địa chỉ
- M02 — Catalog & Variants — P0 — Danh mục, thương hiệu, sản phẩm, size/màu, ảnh, SKU, giá, tồn kho
- M03 — Search & Discovery — P0 — Tìm kiếm, gợi ý, lọc giá/danh mục/đánh giá, sort, phân trang
- M04 — Cart & Checkout — P0 — Giỏ hàng, địa chỉ, voucher cơ bản, COD, phí giao hàng mô phỏng
- M05 — Orders & Inventory — P0 — Đơn hàng, trạng thái, hủy đơn, trừ/hoàn tồn, bảo vệ concurrency
- M06 — Admin & Reporting — P0 — CRUD sản phẩm/biến thể, đơn hàng, tồn kho, thống kê cơ bản
- M07 — AI Virtual Try-On — P1 — Upload ảnh, đồng ý xử lý, chọn đồ, inference, hiển thị/xóa kết quả
- M08 — OAuth & Payment — P2 — Google/Facebook OAuth, cổng thanh toán sandbox và webhook
- M09 — Promotions & Reviews — P2 — Voucher nâng cao, đánh giá chỉ sau khi mua thành công
- M10 — Async & AI Assistant — P2 — Background email, hủy đơn quá hạn, chatbot hoặc tóm tắt đánh giá

## Functional requirements

- FR-AUTH-001 — M01 — P0 — Đăng ký email và đăng nhập; giới hạn yêu cầu và bảo vệ mật khẩu — Email duy nhất, phiên hợp lệ, khách không được truy cập API cần đăng nhập
- FR-USER-001 — M01 — P0 — Cập nhật hồ sơ và nhiều địa chỉ giao hàng — Người dùng chỉ sửa dữ liệu của mình
- FR-CAT-001 — M02 — P0 — Hiển thị danh sách và chi tiết sản phẩm có nhiều biến thể — Mỗi biến thể có SKU, kích cỡ, màu, giá và tồn kho rõ ràng
- FR-SRCH-001 — M03 — P0 — Tìm kiếm, lọc kết hợp, sắp xếp và phân trang — Kết quả đúng bộ lọc, không làm lộ sản phẩm ẩn
- FR-CART-001 — M04 — P0 — Thêm/sửa/xóa giỏ hàng theo SKU/biến thể — Không cho số lượng âm hoặc biến thể không hợp lệ
- FR-CHK-001 — M04 — P0 — Checkout COD với snapshot giá, địa chỉ và tổng tiền — Backend tự tính lại giá, phí, voucher; không tin tổng tiền client
- FR-ORD-001 — M05 — P0 — Tạo đơn từ giỏ hàng và quản lý trạng thái — Đơn được tạo một lần, có trạng thái và lịch sử
- FR-INV-001 — M05 — P0 — Chống bán vượt tồn trong các giao dịch đồng thời — 2 người mua SKU còn 1 thì tối đa 1 đơn được giữ hàng
- FR-INV-002 — M05 — P0 — Hoàn tồn khi hủy đơn hợp lệ — Không hoàn tồn hai lần; trạng thái nhất quán
- FR-ADM-001 — M06 — P0 — Admin quản lý sản phẩm/biến thể và đơn hàng — Chỉ staff có quyền thao tác và ghi log thao tác quan trọng
- FR-DASH-001 — M06 — P0 — Dashboard doanh thu/đơn hàng/top sản phẩm — Dữ liệu mẫu có định nghĩa thời điểm và trạng thái tính doanh thu
- FR-TRY-001 — M07 — P1 — Tạo yêu cầu thử đồ bằng ảnh người dùng và ảnh sản phẩm — Chỉ chấp nhận file hợp lệ và đồng ý xử lý; trả kết quả hoặc lý do thất bại
- FR-TRY-002 — M07 — P1 — Quản lý lưu/xóa ảnh thử đồ — Có chính sách TTL/xóa và không lưu vô hạn mặc định
- FR-PAY-001 — M08 — P2 — Thanh toán sandbox qua một cổng online — Webhook có xác thực, chống xử lý trùng, không tin redirect client
- FR-OAUTH-001 — M08 — P2 — Đăng nhập OAuth Google/Facebook — Liên kết tài khoản an toàn, xử lý email trùng
- FR-VOU-001 — M09 — P2 — Áp voucher theo điều kiện — Không áp nhiều lần trái quy tắc, backend kiểm chứng
- FR-REV-001 — M09 — P2 — Đánh giá sản phẩm sau mua thành công — Chỉ đơn đủ điều kiện được đánh giá
- FR-BG-001 — M10 — P2 — Gửi email đơn hàng bằng background job — Job có idempotency/retry và không gửi sai trạng thái
- FR-BG-002 — M10 — P2 — Tự hủy đơn quá hạn thanh toán — Không hủy đơn đã thanh toán; hoàn tồn đúng một lần
- FR-AI-001 — M10 — P2 — Chatbot tư vấn hoặc tóm tắt đánh giá — Không tự bịa tồn kho/giá, có thông báo nội dung AI

## Non-functional requirements

- NFR-SEC-001 — Bảo vệ API bằng authorization server-side; không tin giá/tồn từ client
- NFR-SEC-002 — Bảo vệ CSRF/CORS/session/token theo kiến trúc đã chọn
- NFR-PRIV-001 — Ảnh cá nhân có đồng ý, hạn lưu rõ ràng, xóa tệp và hạn chế quyền truy cập
- NFR-PERF-001 — Định lượng hiệu năng sau khi xác định hạ tầng/test load; không bịa SLA
- NFR-REL-001 — Đặt hàng idempotent, bền vững; xử lý transaction
- NFR-OBS-001 — Log lỗi và biến cố nghiệp vụ không ghi thông tin thanh toán/ảnh nhạy cảm
- NFR-UX-001 — Responsive desktop/mobile; loading/error/empty/accessibility cơ bản

## Out of Scope phiên bản demo

- Hệ thống marketplace nhiều người bán
- Giao dịch cổng thanh toán production nếu không có merchant credentials
- Thử đồ real-time livestream trực tiếp từ webcam trước khi chứng minh khả thi
- AI tự huấn luyện toàn bộ từ đầu
- Cam kết 100% chính xác kích cỡ thật từ mô hình thử đồ

## Acceptance baseline

- Từng yêu cầu có test và trạng thái; ưu tiên P0
- Đơn hàng không âm kho khi chạy test concurrent trên PostgreSQL
- Try-on phải có báo lỗi rõ nếu model/time quota unavailable
- OAuth/payment chỉ được ghi hoàn thành khi sandbox integration được test

## Open Decisions

- A-001 — Một developer chính, có AI hỗ trợ — Chưa xác nhận
- A-002 — Backend Django + DRF, frontend React + TypeScript — Đề xuất
- A-003 — Ưu tiên COD làm checkout thực đầu tiên — Đề xuất
- A-004 — Payment online chỉ triển khai sandbox nếu còn thời gian — Đề xuất
- A-005 — Try-on sử dụng ảnh tải lên, không bắt buộc webcam livestream — Đề xuất
- A-006 — Thử giày và quần áo là hai pipeline cần đánh giá riêng — Cần đánh giá
- A-007 — Có ảnh sản phẩm đủ điều kiện cấp phép làm inference — Chưa xác nhận
- A-008 — Có thể dùng GPU miễn phí hoặc máy phù hợp demo — Chưa xác nhận
- A-009 — Không deploy production có giao dịch thật trong 1 tháng — Đề xuất
- A-010 — Dữ liệu khách hàng/sản phẩm lúc demo là mẫu hoặc có quyền sử dụng — Chưa xác nhận
- A-011 — 1 tháng = 4 tuần thực hiện, số giờ/tuần chưa xác định — Chưa xác nhận
- A-012 — Phí ship/mã giảm giá dùng quy tắc nội bộ đơn giản ở V1 — Đề xuất
