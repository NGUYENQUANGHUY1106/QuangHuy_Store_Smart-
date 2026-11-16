# QuangHuy_Sport

Project Foundation — QHS-003/004. React + TypeScript + Tailwind CSS, Django REST Framework, PostgreSQL. Hiện chỉ có trang nền tảng và `GET /health`; chưa có catalog, login, cart, checkout hoặc AI.

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

Chỉ tạo app/feature khi có task, không thêm thư mục rỗng cho mọi module P2. `identity.User` hiện kế thừa AbstractUser với UUID PK để cố định AUTH_USER_MODEL từ migration đầu; **chưa triển khai email login/manager/profile**. QHS-005 phải hoàn thiện email uniqueness/normalization và migration tiếp theo trước auth API; không xóa DB/migration để thay user.

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

Mở `http://127.0.0.1:5173`, nhấn link health để kiểm chứng proxy tới backend. `npm.cmd` tránh lỗi ExecutionPolicy của npm.ps1 trên Windows, không cần sửa policy. Linux/macOS dùng `npm` và Python trong `.venv/bin/python` thay cho đường dẫn Windows.

Vite chỉ proxy `/health` hiện có; task API mới bổ sung routes proxy tương ứng. Browser gọi cùng origin, CORS mặc định không cho origin ngoài. Khi chủ động dùng cross-origin local, đặt danh sách chính xác trong `DJANGO_CORS_ALLOWED_ORIGINS` và `DJANGO_CSRF_TRUSTED_ORIGINS`, không wildcard. CORS không thay CSRF. Vite preview/static build không tự proxy backend: deployment phải reverse proxy API cùng origin.

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

Formatting: `npm.cmd run format`. Oxlint theo template Vite, Prettier, TypeScript strict, Vitest/Testing Library/jsdom. Backend dùng pytest-django, Ruff, mypy/django-stubs. PostgreSQL test bắt buộc cho integration/concurrency; mock chỉ kiểm lỗi health không lộ thông tin, không chứng minh connection thật. Chưa có concurrency nghiệp vụ trong task này.

GitHub Actions cấu hình service PostgreSQL 18 tạm thời và checks riêng frontend/backend. Kết quả local không chứng minh workflow remote đã PASS; phải mở Actions sau push. Thông tin đăng nhập service CI chỉ dành container tạm, không dùng deployment.

## Bảo mật và giới hạn foundation

Mặc định DEBUG=false nếu không cấu hình; `.env.example` chỉ bật debug cho localhost. Public phải có secret riêng, hosts cụ thể, HTTPS, DEBUG=false và kiểm tra deployment trước chạy. Secure cookies/SSL redirect/HSTS bật khi non-debug; chưa cấu hình proxy-trust tự động. Không dùng runserver production. Session backend PostgreSQL/cookie HttpOnly/SameSite=Lax; chưa có auth endpoints hoặc toàn bộ middleware absolute-login-expiry của thiết kế.

Không tạo account admin, secret production, dữ liệu giá/tồn hoặc provider AI. Redis/Celery chưa cần. Tham khảo [quy trình](AGENTS.md), [backlog](docs/IMPLEMENTATION_BACKLOG.md), [roadmap](docs/DEVELOPMENT_ROADMAP.md), [evidence](docs/evidence/PROJECT_FOUNDATION.md).

Nguồn đối chiếu cấu hình: [Django custom user](https://docs.djangoproject.com/en/5.2/topics/auth/customizing/#substituting-a-custom-user-model), [Vite](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite). Code/lockfile là phiên bản thực tế đã chọn, không tự nâng dependency theo docs web.
