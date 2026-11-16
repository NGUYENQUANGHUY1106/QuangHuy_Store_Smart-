# SYSTEM ARCHITECTURE — PROPOSED

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## High-Level Architecture

Browser React/TypeScript → HTTPS → Django REST Framework → PostgreSQL. Redis cache optional; Celery worker optional; AI inference service/worker độc lập qua job queue. Static/media dùng storage có ACL và TTL. Payment integrations sandbox adapter nếu được duyệt.

## Trust Boundaries

- Frontend không quyết định giá, tồn hay trạng thái thanh toán
- Backend xác thực authorization tất cả endpoint
- Media uploads được kiểm tra kích thước/kiểu thực; private storage, signed access
- AI inference worker không có quyền truy cập database quá mức cần thiết

## Domain Modules

- identity, catalog, inventory, cart, orders, payments, promotions, reviews, analytics, ai_tryon, notifications
- Mỗi module có service layer, serializer/API, policy và tests

## Critical Sequence — Checkout

Client gửi idempotency key và checkout → API xác thực → transaction lock inventory rows → kiểm số lượng → snapshot items/tổng → tạo đơn/giữ hoặc trừ tồn → commit → background email sau commit.

## Critical Sequence — Try-on

Client consent/upload → kiểm tra file → job metadata → inference specialized clothing/shoe → output restricted media → TTL cleanup; chưa chốt model/licensing/compute.

## Architecture Decisions Pending

- Session vs JWT cookie/token; lifecycle refresh/revoke
- Cách vận hành Redis/Celery miễn phí cho demo
- Try-on model license và yêu cầu VRAM
- Payment sandbox provider thực tế
- Triển khai public hay local và domain/HTTPS
