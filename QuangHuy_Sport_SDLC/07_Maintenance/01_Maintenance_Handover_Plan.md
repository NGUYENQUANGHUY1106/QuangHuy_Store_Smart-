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

- P0: dữ liệu đơn/tồn sai hoặc lộ dữ liệu khách → ngừng chức năng, điều tra ngay
- P1: checkout ngừng hoạt động, AI gây rò rỉ hình ảnh
- P2: lỗi UI nhỏ, search gợi ý không tối ưu

## Handover Inventory

- Git repositories, architecture diagrams, ERD, API docs, environment sample without secrets
- Runbooks, recovery procedure, test evidence, known limitations, model/license references
- User manual, admin manual, change-request form, backlog phiên bản tiếp
