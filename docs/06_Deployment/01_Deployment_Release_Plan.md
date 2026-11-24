# DEPLOYMENT & RELEASE PLAN — TEMPLATE

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Status

Chưa triển khai. Đây là kế hoạch và checklist, không phải biên bản release thành công.

## Environment Strategy

- Local development: PostgreSQL + services in local containers if needed
- Staging/demo: HTTPS, environment secrets, storage access control, sandbox payment only
- Production real customers: yêu cầu đánh giá security/privacy/backup/monitoring trước khi dùng

## Release Checklist

- Unit/integration/E2E pass with evidence
- DB migration backup plan and rollback reviewed
- ENV secrets managed, debug off, allowed hosts/CORS/CSRF configured
- File upload validation and retention cleanup validated
- AI model license, weights, media privacy and resource costs checked
- Order concurrency test on same DB engine as deployment
- Error monitoring, backups, domain and TLS tested

## Rollback Plan

Giữ migration rollback strategy, version release trước; rollback code nếu lỗi, tránh rollback dữ liệu một cách mù quáng; đối soát order/stock sau sự cố.

## Release Notes Template

Version | Date | Features | Known Issues | Migration | Evidence Links | Approved By; chưa điền trạng thái production.

## QHS-025 — Bàn giao local 23/11/2026

Phiên bản local là working tree trên c6d9af2. DEC-006/007 được Nguyễn Quang Huy duyệt ngày 23/11/2026 cho demo 100% local dùng dữ liệu mẫu. Chạy Django 127.0.0.1:8000 và Vite 127.0.0.1:5173 theo README. Cổng thanh toán thật, OAuth và email nền nằm ở P2. Điều kiện cấp release gồm QHS-024, smoke trên môi trường đích, HTTPS và host/origin chính xác, DEBUG=false, kiểm cấu hình secrets, đối soát DB sau restore. Chọn đúng artefact build được kiểm và lưu bản trước để rollback code.

### PostgreSQL backup và restore

1. Nếu môi trường có dữ liệu nghiệp vụ, lấy backup trước migration bằng quyền hạn tối thiểu, dùng file credential bảo vệ hoặc secret store. Lưu archive ở nơi có quyền truy cập và dung lượng phù hợp.
2. Dùng `pg_dump -Fc -f <backup.dump> <source-db>`. Tạo database restore riêng, chạy `pg_restore --exit-on-error --no-owner --no-privileges -d <restore-db> <backup.dump>`, rồi kiểm migration state và smoke bằng cấu hình trỏ database restore.
3. So sánh số đơn theo trạng thái, snapshot, balance và movement theo SKU giữa nguồn và bản restore. Đối chiếu nguồn dữ liệu tồn đầu kỳ khi kiểm tổng delta vì các row lịch sử có thể thiếu opening ledger.
4. Migration catalog 0004 thêm actor nullable và index. Triển khai trong cửa sổ phù hợp vì ALTER/CREATE INDEX có khóa. Rollback code trước để giữ dữ liệu actor và dùng lại schema tương thích. Chỉ reverse migration sau khi đánh giá mất actor ở các movement đã ghi.
5. Trong sự cố, dừng ghi trước cutover, đối soát với backup, xác định khoảng giao dịch cần khôi phục; việc chuyển traffic sang bản restore phải được chủ môi trường xác nhận.

Xem [lệnh local và smoke](../../README.md) và [kết quả thực tế](../evidence/AUTO_LOOP_2026-11-23.md).

Kết quả sau duyệt phạm vi tại [nghiệm thu local](P0_Local_Acceptance.md).
