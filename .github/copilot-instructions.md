# QUANGHUY_SPORT — Autonomous SDLC Execution Rules

1. **Nguồn chân lý duy nhất (Single Source of Truth):**
   - Mọi task thực thi phải lấy theo thứ tự từ `docs/IMPLEMENTATION_BACKLOG.md` và `docs/DEVELOPMENT_ROADMAP.md`.
   - Mọi quyết định công nghệ, database, auth và API phải tuân thủ tuyệt đối `docs/OPEN_DECISIONS.md` và các tài liệu thiết kế trong `docs/03_Design/` và `docs/04_Development/`.
   - Database sử dụng PostgreSQL 18, tên database: `QuangHuy_Store_Smart` (kiểm tra chuỗi kết nối trong `.env`).

2. **Vòng lặp thực thi tự động cho TỪNG TASK (Không bỏ bước):**
   - **Bước 1 (Read & Plan):** Đọc task chưa hoàn thành tiếp theo trong `docs/IMPLEMENTATION_BACKLOG.md`.
   - **Bước 2 (Implement Backend):** Tạo/cập nhật Schema/Migration (nếu cần), Model, Service, Controller/API Route và Validation.
   - **Bước 3 (Connect Frontend):** Thay thế hàm tương ứng trong tầng service Frontend (`src/services/mockApi.js` hoặc API client) bằng API thật vừa tạo, giữ nguyên giao diện UI đã hoàn thiện.
   - **Bước 4 (Test & Verify):** Tự động viết và chạy unit/integration test (hoặc gọi test script/curl kiểm tra API + kiểm tra build Frontend không lỗi). Nếu test fail, tự sửa lỗi đến khi PASS 100%.
   - **Bước 5 (Update Progress & Loop):** Đánh dấu `[x]` hoàn thành task vào `docs/IMPLEMENTATION_BACKLOG.md`, ghi log ngắn gọn vào `docs/05_Testing/` (nếu có) và **tự động chuyển ngay sang task tiếp theo** mà không dừng lại chờ xác nhận (trừ khi hết backlog hoặc gặp lỗi môi trường cần user cấp quyền).