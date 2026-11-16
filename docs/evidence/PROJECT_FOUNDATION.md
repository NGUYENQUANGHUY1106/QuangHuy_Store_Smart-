# Project Foundation — execution evidence

Ngày báo cáo: 16/11/2026, múi giờ người dùng Asia/Saigon. Branch `feature/QHS-003-project-foundation`. Tasks QHS-003/004, Requirement IDs NFR-UX-001, NFR-SEC-002, NFR-REL-001; FR-INV-001 chỉ là tiền đề PostgreSQL/test runner, **chưa chứng minh chống âm kho**. Trạng thái Review, chưa tự đánh dấu toàn bộ DoD hoàn tất khi chưa có review/CI remote.

## Scope và AC

- QHS-003-AC1: Django/DRF và React/TypeScript strict/Tailwind khởi động; env không commit secret; setup tái lập, không module P2. Local đạt.
- QHS-004-AC1: PostgreSQL thật, health SELECT 1; thiếu config fail rõ không SQLite; runner/check/CI được chuẩn bị. Local đạt; workflow remote NOT RUN tại thời điểm lập báo cáo.
- Mở rộng AC foundation theo chỉ dẫn hiện tại: GET health 200 khi DB tốt/503 khi DB lỗi, không lộ chi tiết; CORS từ chối origin ngoài; migration/schema có swappable User; lint/format/types/tests/build có actual. Local đạt.

User trực tiếp cho phép bắt đầu foundation và cung cấp credentials local. Không phê duyệt thay các chính sách tồn kho, hủy, payment, AI/retention hoặc production. Chủ dự án review thay đổi; không tiếp tục QHS-005 tự động.

## Môi trường và dữ liệu

Windows PowerShell; Python 3.13.3, Node 22.13.0, npm 10.9.2, PostgreSQL service 18 trên loopback 5432. Django 5.2.19, DRF 3.16.1; frontend và các tools cụ thể được pin ở lockfile. `.env` local bị bỏ qua Git; không credentials production hoặc admin account được tạo.

Database local được chủ dự án chỉ định là `QuangHuy_Store_Smart`. Preflight psycopg/Django cursor kiểm tra public tables: **0 bảng** trước migration. Lần migrate đầu đã apply contenttypes/auth/identity/sessions thành công; lần chạy trong log là kiểm tra lặp lại không còn migration. Không đụng database `booking_travel` được nêu làm mẫu.

Pytest dùng PostgreSQL test database riêng do Django tạo/drop. Ngoài ra đã initdb một cluster test PostgreSQL 18 trên loopback 55432, credentials chỉ dùng test local, migrate từ trống thành công (log có đầy đủ). Cluster test, dữ liệu và credentials tạm đã được dừng/xóa sau kiểm chứng. Không đổi cấu hình service PostgreSQL của người dùng.

## File tạo/sửa

- Root: `.gitignore`, `README.md`; cập nhật `AGENTS.md` cho scope mới.
- Backend: `manage.py`, `config/{settings,urls,views,asgi,wsgi}.py`, các `__init__.py`; `apps/identity/models.py`, migration `0001_initial.py`; `tests/test_health.py`, `tests/test_settings.py`; `.env.example`, `requirements.in`, `requirements.txt`, `pyproject.toml`.
- Frontend: Vite React/TS scaffold, package/lockfile, configs TypeScript strict/Oxlint/Prettier/Vitest/Vite; `src/app/{App.tsx,App.test.tsx,styles.css}`, `src/main.tsx`, `src/test/setup.ts`, `.env.example`, `index.html`; đã bỏ assets/demo counter mặc định của Vite.
- CI: `.github/workflows/foundation.yml`, PostgreSQL 18 service test; chưa xác nhận workflow remote chạy.
- Docs: backlog, roadmap và hai file evidence. `.env` local không thuộc commit.

## Lệnh đã thực sự chạy

Từ root: `python --version`, `node --version`, `npm.cmd --version`, `python -m venv .venv`, `npm.cmd create vite@latest frontend -- --template react-ts --no-interactive`; `.venv/Scripts/python.exe -m pip install -r backend/requirements.in`, `pip freeze` xuất requirements pin. Git tạo branch foundation, không triển khai trên branch master.

Trong frontend: `npm.cmd install`, `npm.cmd install -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom prettier`, `npm.cmd run format`, và các lệnh kiểm tra trong bảng dưới. npm install audit báo 0 vulnerabilities, không thay thế security audit toàn dự án.

Trong backend dùng `../.venv/Scripts/python.exe` thay `python` ở bảng. Đã chạy `manage.py makemigrations identity`, `manage.py migrate --noinput`; Ruff `check . --fix` và `format .` để sửa format/import rồi chạy lại. Đã dùng `pg_isready -h 127.0.0.1 -p 5432` (accepting connections), initdb/pg_ctl/createdb cho cluster test tách biệt; không ghi password/secret trong evidence.

| Lệnh/check cuối | Kết quả thực tế |
|---|---|
| python -m ruff check . | PASS, exit 0 |
| python -m ruff format --check . | PASS sau sửa định dạng, exit 0 |
| python -m mypy config apps tests | PASS, 12 source files, exit 0 |
| python manage.py check | PASS, 0 issues |
| python manage.py makemigrations --check --dry-run | PASS, No changes detected |
| python manage.py migrate --noinput | PASS trên DB user chỉ định; PASS initial migration trên cluster test riêng |
| python -m pytest -v | PASS, 6 tests, không skip |
| npm.cmd ci | PASS, exit 0 |
| npm.cmd run lint | PASS, exit 0 |
| npm.cmd run format:check | PASS, exit 0 |
| npm.cmd run typecheck | PASS, exit 0 |
| npm.cmd run test | PASS, 1 test/1 file |
| npm.cmd run build | PASS; JS/CSS/HTML trong dist; CSS có `.bg-slate-950` Tailwind |
| HTTP GET 127.0.0.1:8000/health | PASS 200, body có status ok (DB user local) |
| HTTP GET 127.0.0.1:5173/ | PASS 200, title foundation |
| HTTP GET 127.0.0.1:5173/health | PASS 200 qua Vite proxy tới backend/DB |

Xem [log lệnh/check thực tế](foundation-checks.txt). Các server runserver/Vite phục vụ smoke đã được terminate sau kiểm tra, không để process ngầm; dùng README để chạy lại.

## Lỗi đã gặp và trạng thái

- `npm --version` gọi npm.ps1 bị ExecutionPolicy từ chối → dùng npm.cmd, không đổi policy máy.
- Kiểm tra eslint.config.js không thấy vì scaffold mới dùng Oxlint → giữ Oxlint cấu hình React/hooks/TypeScript, không thêm ESLint song song.
- Ruff lượt đầu FAIL do import/line length; lượt format-check kế tiếp FAIL vì cách chia chuỗi validator. Đã sửa code và rerun toàn bộ backend checks: PASS. Lỗi không bị skip/noqa hoặc tắt rule để vượt kiểm tra; log giữ lại lượt fail trung gian.
- Không có test/build failure cuối đang mở. CI remote/Linux chưa xác minh; UI browser review và production hardening chưa chạy.

## Giới hạn và kiểm tra thủ công

1. Chạy lại backend/frontend theo README, mở trình duyệt kiểm tra mobile/focus/hiển thị và link health. HTTP smoke không thay review bằng mắt.
2. Refresh pgAdmin để xem bảng identity/auth/session và django_migrations trong database đúng; không có dữ liệu kinh doanh/giá/tồn mẫu.
3. Xem GitHub Actions sau push. Workflow được chuẩn bị nhưng local PASS không đồng nghĩa remote PASS.
4. Trước public deployment phải có môi trường/secret/role DB riêng ít quyền, HTTPS/proxy/hosts, CSRF/CORS đã kiểm; chưa chạy production deploy/restore test. Role local do user cung cấp là postgres, không đề xuất dùng tài khoản đó production.
5. Custom User chỉ là UUID AbstractUser scaffold. Email login/uniqueness, auth API, session login timestamp/revoke cần QHS-005/031; không coi settings session hiện tại là full implementation SECURITY_DESIGN.

Bước tiếp theo đề xuất: review foundation + CI, sau đó QHS-005 (auth email theo thiết kế, migration tiếp nối, quyền/CSRF/login tests) khi được giao; các decision nghiệp vụ khác giữ OPEN. Không làm catalog/checkout/AI trong task này.
