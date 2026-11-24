# QuangHuy_Sport

React + TypeScript + Tailwind CSS, Django REST Framework và PostgreSQL 18. Workspace có API và UI cho các phần của MVP. Phạm vi nghiệm thu và tình trạng từng task xem [backlog](docs/IMPLEMENTATION_BACKLOG.md) và [evidence Auto-Loop](docs/evidence/AUTO_LOOP_2026-11-23.md).

## Yêu cầu và cấu trúc

Python 3.13, Node.js 22.12+ (khuyến nghị Node 22 LTS bản mới), PostgreSQL 18. Các phiên bản dependency đã cài được pin trong `backend/requirements.txt` và `frontend/package-lock.json`.

```text
backend/config/          settings, URLs, ASGI/WSGI, database health check
backend/apps/identity/  custom User tối thiểu và migration đầu tiên
backend/tests/          health/config tests
frontend/src/app/       foundation shell và styles Tailwind
frontend/src/test/      Vitest setup
docs/03_Design/         architecture, database, API, security, AI design
docs/evidence/          lệnh và kết quả kiểm chứng thực tế
```

## Backend — PowerShell, từ thư mục gốc

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
# Sinh khóa CHỈ cho development local, không copy sang production:
.venv/Scripts/python.exe -c "from pathlib import Path; import secrets; p=Path('backend/.env'); s=p.read_text(); p.write_text(s.replace('DJANGO_SECRET_KEY=\n', 'DJANGO_SECRET_KEY='+secrets.token_urlsafe(64)+'\n'))"
```

Điền `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, host/port trong `backend/.env` bằng database local đã tạo. Không gửi mật khẩu vào chat hoặc commit `.env`. Ứng dụng dùng các biến `POSTGRES_*`, không dùng DATABASE_URL hay tham số `?schema=public`. Schema mặc định PostgreSQL là public. Không tự tạo DB hoặc role production. Role local cần quyền migrations; pytest cần quyền tạo/drop **test database**, không dùng tài khoản production để chạy test.

Shell environment được ưu tiên hơn `.env`. Thiếu biến bắt buộc sẽ dừng cấu hình, **không fallback SQLite**. Nếu `.env` đã có, không chạy lại Copy-Item ghi đè credentials. Đọc thông số trước khi migrate vào database có dữ liệu; không dùng reset/drop để chữa lỗi.

```powershell
cd backend
../.venv/Scripts/python.exe manage.py check
../.venv/Scripts/python.exe manage.py migrate --noinput
../.venv/Scripts/python.exe manage.py runserver 127.0.0.1:8000
```

Mở `http://127.0.0.1:8000/health`: kết nối PostgreSQL + SELECT 1 thành công trả HTTP 200 `{"status":"ok"}`; DB lỗi trả 503 `{"status":"unavailable"}`, không lộ lỗi kết nối. Endpoint không chứng nhận migration đầy đủ, không kiểm tra GPU và không thể thay test nghiệp vụ. Health chỉ cho GET/HEAD/OPTIONS.

## Frontend — terminal khác

```powershell
cd frontend
npm.cmd ci
# Tùy chọn: copy .env.example sang .env nếu đổi origin backend.
npm.cmd run dev
```

Mở `http://127.0.0.1:5173`. Vite proxy `/health`. Các API ứng dụng dùng `VITE_API_ORIGIN` (mặc định `http://127.0.0.1:8000`). Trong `backend/.env` local, thêm đúng origin frontend vào `DJANGO_CORS_ALLOWED_ORIGINS`, ví dụ `http://127.0.0.1:5173`. Restart Django sau khi cập nhật biến. `VITE_API_ORIGIN` là public. Với React admin, tạo tài khoản local và gán role ADMIN qua quy trình quản trị database/shell được phép; server API kiểm role.

### Browser smoke với database test PostgreSQL

1. Khởi động Vite ở `127.0.0.1:5173` bằng `npm.cmd run dev`. Giữ port 8000 trống cho Django fixture.
2. Cài Playwright trong venv và dùng Chrome đã cài. Chạy từ `backend/` với origin CORS local ở trên.

```powershell
../.venv/Scripts/python.exe -m pip install playwright==1.65.2
$env:DJANGO_DEBUG = 'true'
../.venv/Scripts/python.exe -m pytest e2e/test_p0_smoke.py --liveserver=127.0.0.1:8000 -q
```

Fixture pytest-django tạo database test riêng. Dữ liệu và mã mật khẩu trong bài smoke chỉ dùng cho fixture.

## Lint, format, typecheck, tests

Trong `backend/`:

```powershell
../.venv/Scripts/python.exe -m ruff check .
../.venv/Scripts/python.exe -m ruff format --check .
../.venv/Scripts/python.exe -m mypy config apps tests
../.venv/Scripts/python.exe manage.py makemigrations --check --dry-run
../.venv/Scripts/python.exe -m pytest -v
```

Sửa formatting bằng `python -m ruff format .`, import bằng `ruff check . --fix`, sau đó chạy lại checks. Django-generated migrations giữ format generator, Ruff exclude migrations có chủ ý.

Trong `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run format:check
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Formatting: `npm.cmd run format`. Oxlint theo template Vite, Prettier, TypeScript strict, Vitest/Testing Library/jsdom. Backend dùng pytest-django, Ruff, mypy/django-stubs. PostgreSQL test bắt buộc cho integration/concurrency; mock chỉ kiểm lỗi health không lộ thông tin, không chứng minh connection thật. Các ca concurrency nghiệp vụ nằm trong `backend/tests/test_concurrency_postgres.py`.

GitHub Actions cấu hình service PostgreSQL 18 tạm thời và checks riêng frontend/backend. Kết quả local không chứng minh workflow remote đã PASS; phải mở Actions sau push. Thông tin đăng nhập service CI chỉ dành container tạm, không dùng deployment.

## Bảo mật và giới hạn foundation

Mặc định DEBUG=false nếu không cấu hình; `.env.example` chỉ bật debug cho localhost. Public phải có secret riêng, hosts cụ thể, HTTPS, DEBUG=false và kiểm tra deployment trước chạy. Secure cookies/SSL redirect/HSTS bật khi non-debug; chưa cấu hình proxy-trust tự động. Không dùng runserver production. API dùng JWT bearer và bcrypt theo DEC-004. Xem security design để biết giới hạn vòng đời phiên browser và phần kiểm thử còn mở.

Không tạo account admin, secret production, dữ liệu giá/tồn hoặc provider AI. Redis/Celery chưa cần. Tham khảo [quy trình](AGENTS.md), [backlog](docs/IMPLEMENTATION_BACKLOG.md), [roadmap](docs/DEVELOPMENT_ROADMAP.md), [evidence](docs/evidence/PROJECT_FOUNDATION.md).

Nguồn đối chiếu cấu hình: [Django custom user](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/#substituting-a-custom-user-model), [Vite](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite). Code/lockfile là phiên bản thực tế đã chọn, không tự nâng dependency theo docs web.
