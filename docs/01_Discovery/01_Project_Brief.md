# PROJECT BRIEF — QUANGHUY_SPORT

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Tổng quan

Website thương mại điện tử đồ thể thao, tập trung giày bóng đá, có AI virtual try-on từ ảnh người dùng. Mục tiêu Portfolio cho developer fullstack, deadline mục tiêu 1 tháng, nền tảng Web responsive.

## Mục tiêu kinh doanh và sản phẩm

- Khách hàng tìm và mua sản phẩm có biến thể chính xác
- Admin quản lý danh mục, tồn kho, đơn hàng và doanh thu
- Tạo khác biệt bằng thử giày/quần áo trực tuyến; tính khả thi từng loại cần xác minh
- Bản demo có thể trình bày hành trình mua hàng end-to-end và bài test chống âm kho

## Stack và lựa chọn đề xuất

- Đã chọn: ReactJS, PostgreSQL, website
- Đề xuất: Django REST Framework, React+TypeScript, Tailwind, Redis/Celery nếu triển khai phần mở rộng
- AI: mô hình pretrained inference Python; quyết định lựa chọn theo thử nghiệm/giấy phép
- Không xác nhận JWT thay session trước System Design

## Phạm vi phát hành

### P0 — MVP 1 tháng

- Auth email, profile/địa chỉ, catalog+variant, search/filter, cart, COD checkout, orders, admin sản phẩm/kho/đơn, concurrency tests

### P1 — Differentiator

- Try-on có consent/ảnh upload, pipeline thử giày hoặc đồ đã được kiểm chứng, xử lý lỗi, chính sách xóa ảnh

### P2 — Extension

- OAuth Google/Facebook, payment sandbox, voucher nâng cao, review, email jobs, order expiry, Redis cache, chatbot/tóm tắt review

## Tiêu chí demo thành công

- 2 người mua cùng SKU còn 1 → tối đa 1 đơn giữ hàng thành công
- Người dùng hoàn tất hành trình product → variant → cart → COD order
- Admin cập nhật sản phẩm và trạng thái đơn với quyền hợp lệ
- AI demo chỉ được công bố hoạt động khi chạy mô hình thật, có ảnh mẫu hợp lệ và kết quả kiểm chứng

## Giả định và chờ xác nhận

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

## Rủi ro chính

- RK-01 — Phạm vi quá lớn trong 1 tháng — Cao — Khóa P0, thử AI ngay tuần 1, P2 để backlog
- RK-02 — Mô hình thử giày không phù hợp với VTON quần áo — Cao — Spike kiểm tra model/dữ liệu và license trước cam kết
- RK-03 — Không có GPU hoặc quota inference miễn phí — Cao — Demo dự phòng, giới hạn job, không cam kết realtime
- RK-04 — Lỗi race condition bán vượt tồn — Cao — Test PostgreSQL transaction concurrent
- RK-05 — Chi phí OAuth/email/payment sandbox — Trung bình — Đọc điều kiện/hạn mức, giữ phạm vi sandbox
- RK-06 — Ảnh người dùng nhạy cảm và lưu dữ liệu — Cao — Consent, định dạng, size, retention, xóa tệp
- RK-07 — AI tóm tắt/recommend sai — Trung bình — Ground theo catalog và gắn nhãn AI
- RK-08 — AI agent code lệch đặc tả — Cao — DoR/DoD, task nhỏ, review/test trước merge

## Điều kiện đóng Discovery

Phạm vi P0/P1/P2 được chốt; năng lực chạy AI kiểm chứng; giới hạn 1 tháng khả thi; quy định upload và giữ ảnh được đồng ý. Phần còn mở được quản lý trong Assumption Register.
