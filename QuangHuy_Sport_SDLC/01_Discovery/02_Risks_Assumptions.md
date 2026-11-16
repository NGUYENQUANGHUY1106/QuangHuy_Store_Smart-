# RISK & ASSUMPTION REGISTER

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Risk Register

- RK-01 — Phạm vi quá lớn trong 1 tháng — Cao — Khóa P0, thử AI ngay tuần 1, P2 để backlog
- RK-02 — Mô hình thử giày không phù hợp với VTON quần áo — Cao — Spike kiểm tra model/dữ liệu và license trước cam kết
- RK-03 — Không có GPU hoặc quota inference miễn phí — Cao — Demo dự phòng, giới hạn job, không cam kết realtime
- RK-04 — Lỗi race condition bán vượt tồn — Cao — Test PostgreSQL transaction concurrent
- RK-05 — Chi phí OAuth/email/payment sandbox — Trung bình — Đọc điều kiện/hạn mức, giữ phạm vi sandbox
- RK-06 — Ảnh người dùng nhạy cảm và lưu dữ liệu — Cao — Consent, định dạng, size, retention, xóa tệp
- RK-07 — AI tóm tắt/recommend sai — Trung bình — Ground theo catalog và gắn nhãn AI
- RK-08 — AI agent code lệch đặc tả — Cao — DoR/DoD, task nhỏ, review/test trước merge

## Assumption Register

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

## Quy trình xử lý

Owner cập nhật trạng thái hàng tuần; mọi thay đổi scope có impact về thời gian/cost/quality; khi rủi ro AI thành hiện thực, chuyển sang demo có giới hạn thay vì khẳng định tính năng đã hoàn thành.
