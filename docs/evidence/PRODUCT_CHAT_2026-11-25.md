# Product Chat và avatar hồ sơ — 25/11/2026

Task QHS-008.1, QHS-035.3 và QHS-039. Windows, Chrome, Vite, Daphne/Django Channels và PostgreSQL 18.6 local. Commit `cd5ad51` cho tài khoản, đánh giá và checkout phụ thuộc; commit `819f95b` cho chat. Trạng thái Review, chờ review nhánh.

| Kiểm tra | Kết quả |
|---|---|
| Django/Ruff/mypy/migration | `ruff check .`, `ruff format --check .`, `mypy config apps tests` (95 tệp), `manage.py check`, `makemigrations --check --dry-run` PASS. Đã xem SQL và áp dụng `identity.0003_profile_avatar` trên PostgreSQL local. |
| Backend regression | `python -m pytest -q` PASS 53/53. |
| Frontend regression | `npx vitest run --maxWorkers=4` PASS 27/27; `npm run format:check`, `npm run lint`, typecheck và `npm run build` exit 0. Lint báo 11 cảnh báo React. |
| Browser | `python manage.py shell -c 'from e2e.product_chat_smoke import run; run()'` PASS với Vite 5174/Daphne 8019 và ba context Chrome độc lập. 390/1440 px, dùng WebSocket thật và catalog PostgreSQL thật. Không có lỗi JavaScript trên các trang kiểm thử. |

## Ma trận kịch bản

| ID | Kết quả thực tế |
|---|---|
| TC-01–03 | PASS. API hiển thị tên hồ sơ và kiểm fallback username, phản hồi quản trị chỉ hiển thị Chủ shop. Thay và gỡ avatar cập nhật review/reply đã có trên test DB. Chrome xác nhận upload và hiển thị ảnh trong hồ sơ. |
| TC-04–08 | PASS. Chrome chuyển khách vãng lai qua đăng nhập, quay về sản phẩm và mở chat. Có ảnh thật, tên, giá, màu, size khi chọn và gửi thẻ cùng nội dung trong một message. ASGI dùng giá/biến thể server. |
| TC-09–14 | PASS. Admin nhận inbox và trả lời qua socket. Tin khách gửi khi shop offline hiển thị Đã gửi. Tin tới cửa sổ khách thu nhỏ hiển thị Đã nhận; mở lại mới Đã xem. |
| TC-15–17 | PASS. Chrome thấy đối phương đang nhập, trạng thái shop thay đổi theo kết nối và badge unread cập nhật khi mở thread. |
| TC-18–19 | PASS. Hai khách tạo hai thread độc lập; Admin mở đúng thread, không thấy tin nhắn của thread khác trong vùng soạn. |
| TC-20–22 | PASS. Chrome ngắt socket, offline, nối lại, gửi lại một lần. API kiểm gửi lại cùng UUID trả cùng message ID. |
| TC-23–24 | PASS. ASGI từ chối origin ngoài allowlist, user thường không mở socket Admin, không gửi được sẵn vào ID hội thoại của người khác. Chrome kiểm redirect Admin. |
| TC-25–26 | PASS. Không có model/migration chat. TTL 3 giây trong kiểm thử ASGI làm mất thread sau khi các tin hết hạn. |
| TC-27–30 | PASS. Hai sản phẩm mang vào cùng thread. Chrome kiểm trải nghiệm mobile, resize Admin và shop offline vẫn nhận được tin khi trở lại. Suite cart/checkout/order PASS. |

## Phạm vi mã

- Mới: `apps/product_chat/{consumers,store}.py`, `tests/test_product_chat.py`, `e2e/product_chat_smoke.py`, React hook `useProductChat.ts`, `ChatThread.tsx`, `CustomerProductChat.tsx`, `AdminMessagesPage.tsx`, avatar endpoint `avatar_views.py`, `identity/migrations/0003_profile_avatar.py` và helper `presentation.py`.
- Sửa: Django ASGI/settings/dependencies, identity/reviews/order và test hồi quy, React app routing/Admin layout/hồ sơ/trang sản phẩm/đánh giá, service client và CSS. Danh sách theo commit có thể xem bằng `git show --stat cd5ad51` và `git show --stat 819f95b`.
- Phạm vi còn lại: triển khai WSS/Redis đa tiến trình ngoài demo local. Bản local giữ chat trong bộ nhớ tới TTL hoặc khi dừng tiến trình. Avatar là phần duy nhất của đợt này có migration mới. [Cấu hình, endpoint và event](../06_Deployment/Product_Chat.md).
