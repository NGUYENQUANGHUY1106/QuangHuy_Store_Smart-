# MAINTENANCE & HANDOVER PLAN — TEMPLATE

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Status

Chưa vận hành thực tế. Không có chỉ số uptime, incident hoặc chi phí đã đo.

## Operational Checklist

- Theo dõi error logs, uptime checks, queue lag, failed jobs, DB connections
- Kiểm tra stock mismatch/order reconciliation
- Giám sát chi phí AI inference và hạn mức GPU
- Xóa ảnh thử đồ hết hạn theo policy, kiểm tra hiệu quả xóa
- Review security vulnerabilities / dependency updates và backups

## Incident Severity

- P0: dữ liệu đơn/tồn sai hoặc lộ dữ liệu khách, kể cả ảnh cá nhân → ngừng chức năng liên quan và điều tra ngay
- P1: checkout ngừng hoạt động
- P2: lỗi UI nhỏ, search gợi ý không tối ưu

## Handover Inventory

- Git repositories, architecture diagrams, ERD, API docs, environment sample without secrets
- Runbooks, recovery procedure, test evidence, known limitations, model/license references
- User manual, admin manual, change-request form, backlog phiên bản tiếp

## Vận hành local theo QHS-025

- Bắt đầu tại [README](../../README.md), [API hiện có](../03_Design/API_CONTRACTS.md) và [ma trận quyền](../03_Design/SECURITY_DESIGN.md).
- Customer chọn biến thể còn hàng, thêm giỏ, đăng nhập để đồng bộ giỏ, nhập địa chỉ và chọn COD. Đối chiếu mã và số tiền ở xác nhận đơn.
- Admin xác thực trên `/admin/login`. Vào Orders để chuyển trạng thái/hủy theo DEC-008, vào Kho để ghi điều chỉnh có lý do và đối chiếu lịch sử. Mỗi điều chỉnh thành công có movement và actor; movement lịch sử trước migration 0004 có thể thiếu actor.
- Phần chỉ số tài chính và top sản phẩm chờ DEC-012. Đổi mật khẩu/khôi phục chờ DEC-016. Môi trường public và nguồn lực chờ DEC-006/007.
- Khi kiểm lỗi dùng mã đơn, SKU, movement ID và dấu thời gian để đối soát. Tránh đưa token, mật khẩu và snapshot địa chỉ vào ticket. Runbook [backup/restore](../06_Deployment/01_Deployment_Release_Plan.md) và [evidence](../evidence/AUTO_LOOP_2026-11-23.md) ghi phạm vi đã kiểm.
