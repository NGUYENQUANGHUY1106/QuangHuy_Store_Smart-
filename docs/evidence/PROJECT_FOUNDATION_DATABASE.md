# Project Foundation Database Evidence

Ngày: 21/11/2026
Task: QHS-004
Requirement: NFR-REL-001, FR-INV-001

## Môi trường thực

- Database vendor: PostgreSQL
- Server: PostgreSQL 18.6
- Database: `QuangHuy_Store_Smart`
- Host: `127.0.0.1`
- Django: 5.2.19

## Migration

Lệnh:

```powershell
python manage.py migrate
python manage.py makemigrations --check --dry-run
python manage.py seed_catalog
```

Kết quả thực:

- Migration `catalog.0001_initial` apply PASS.
- Không còn migration thiếu.
- Seed catalog PASS: 4 categories, 5 brands, 6 products, 34 variants, 34 inventory balances, 159 units.

## Test

Lệnh:

```powershell
python -m pytest -q
npm run build
npm test
npm run lint
```

Kết quả thực:

- Backend: 13 tests passed.
- Frontend build: PASS.
- Frontend test: 1 test passed.
- Frontend lint: PASS với cảnh báo Fast Refresh/set-state hiện có; không có lỗi lint.

## Smoke API

- `GET /health`: 200 `{"status":"ok"}`
- `GET /categories`: 200, 4 records.
- `GET /brands`: 200.
- `GET /products`: 200, 6 records.
- `GET /products/nike-mercurial-vapor-16-elite`: 200, 7 variants.
