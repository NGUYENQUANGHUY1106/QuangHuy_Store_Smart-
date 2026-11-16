# DEVELOPMENT PLAN & AI CODING RULES

**Dự án:** QuangHuy_Sport  |  **Ngày:** 16/11/2026  |  **Trạng thái:** DRAFT

> Tài liệu đề xuất. Chưa có kết quả triển khai hoặc kiểm thử thực tế.

## Four-Week Roadmap

- W1 — Discovery, SRS baseline, architecture, UX low fidelity, DB; spike AI; Auth/Catalog
- W2 — Catalog complete; Search, Cart, Checkout COD; Admin CRUD
- W3 — Orders/Inventory concurrency, admin dashboard, E2E; AI inference prototype
- W4 — Try-on integration if feasible, QA, security, responsive polish, documentation and demo

## Dependency Order

- Discovery/SRS scope freeze → Architecture/ERD → Auth/Admin foundation → Catalog/Variants → Search/Cart → COD Checkout/Order/Inventory → Try-on prototype → QA/Release

## Sprint Quality Gates

- DoR: FR/UC/AC/test/owner/dependencies rõ
- DoD: code review, unit/integration, concurrency regression, no severe vulnerabilities, docs updated
- AI tasks scoped to one module/story, require diff summary/tests and no secret data

## Git Workflow

- main protected; develop optional; feature/QHS-###-slug; PR with requirement IDs
- No direct commit to main without review/tests
- Conventional commits preferred; migration changes reviewed

## AI Agent Rules

- Read docs/02_Requirements and docs/03_Design before edits
- Ask for ambiguity if it changes business rules; do not invent payment semantics
- Do not weaken auth, stock, privacy rules for speed
- Never call feature complete without tests and demo evidence
