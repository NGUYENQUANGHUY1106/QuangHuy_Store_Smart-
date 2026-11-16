# TEST PLAN — PLANNED, NOT EXECUTED

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Status

Chỉ là kế hoạch kiểm thử. Chưa có test execution hoặc pass/fail thực tế.

## Levels

- Unit: discount, price snapshot, inventory rules, auth validation
- Integration: PostgreSQL transactions, order creation, REST permissions
- E2E: user browsing → variant → cart → COD order → admin update
- Security: IDOR, upload validation, admin policy, CSRF/XSS, rate limits
- AI Evaluation: ảnh có consent, loại hàng hỗ trợ, latency/cost, failure handling

## Priority Scenarios

- TC-001 — Email đăng ký trùng → reject
- TC-002 — SKU 0 stock không được checkout
- TC-003 — 2 simultaneous checkout on 1 stock → max 1 succeeds
- TC-004 — Retry checkout same key → no duplicate order
- TC-005 — Cancel order → stock returned once
- TC-006 — Admin-only endpoint denied for customer
- TC-007 — Total modified on client → server recompute
- TC-008 — Malicious/large try-on upload → reject
- TC-009 — Try-on failure → no fabricated output, cleanup
- TC-010 — Webhook replay → only once processed

## Evidence Template

- Date, build/commit, environment, actor, inputs, steps, expected, actual, status, screenshot/log reference
- Chưa tạo giá trị actual hoặc pass giả
