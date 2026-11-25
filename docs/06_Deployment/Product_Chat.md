# Product Chat local và avatar tài khoản

FR-CHAT-001/QHS-039 · FR-REV-001/QHS-035.3 · FR-USER-001/QHS-008.1.

## Khởi chạy

Với Python trong virtualenv, chạy tại `backend/`.

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Daphne cũng có thể chạy trực tiếp bằng `daphne -b 127.0.0.1 -p 8000 config.asgi:application`. Chạy một tiến trình backend. Trong `frontend/`, dùng `npm ci` và `npm run dev`. Truy cập sản phẩm qua `http://127.0.0.1:5173`, hộp thư Admin tại `/admin/messages`.

| Biến | Cấu hình local |
|---|---|
| `DJANGO_CORS_ALLOWED_ORIGINS` | `http://127.0.0.1:5173` |
| `PRODUCT_CHAT_ORIGINS` | Danh sách origin WebSocket cụ thể, phân cách dấu phẩy. Mặc định dùng danh sách CORS |
| `PRODUCT_CHAT_TTL_SECONDS` | Thời hạn từng tin nhắn, mặc định 86400 giây |
| `VITE_API_ORIGIN` | `http://127.0.0.1:8000` mặc định. Frontend quy đổi HTTPS sang WSS |

## Giao thức và lưu trữ

- **WebSocket** tại `/ws/product-chat` cho phiên mua hàng và `/ws/admin/product-chat` cho phiên quản trị. Sau khi upgrade, gửi `auth` với JWT access trong frame đầu. Origin sai bị từ chối. Server lấy người dùng từ JWT và kiểm vai trò ADMIN ở endpoint quản trị.
- **Client → server** gồm `conversation.join` (Admin), `message.send` (ID hội thoại, UUID client, nội dung tối đa 2.000 ký tự hoặc lựa chọn sản phẩm), `message.delivered`, `message.read`, `typing.start`, `typing.stop`. Server kiểm owner/hội thoại hiện tại và lấy giá, màu, size và ảnh sản phẩm từ PostgreSQL.
- **Server → client** gồm `snapshot` (tin nhắn đang xem, presence cửa hàng, và danh sách/unread Admin), `message.ack`, `typing.update`, `error`. «Đã nhận» yêu cầu client nhận nội dung trong thread và gửi xác nhận. «Đã xem» yêu cầu thread mở và tab hiển thị. Inbox xem trước chưa tạo xác nhận đã xem.
- Bộ nhớ tiến trình giữ nội dung tới TTL. Khởi động lại backend xóa bộ nhớ. Tối đa 300 tin mỗi hội thoại, 10.000 tin còn hiệu lực toàn tiến trình, 8 lần gửi trong mỗi cửa sổ 10 giây trên mỗi tài khoản. Dữ liệu tạm không hỗ trợ chạy nhiều backend. Bản local không cần Redis. Nếu triển khai nhiều tiến trình, cần bộ nhớ chia sẻ và channel layer Redis chuyên dụng với `save ""` và `appendonly no`, phục vụ qua WSS sau reverse proxy. [Tài liệu channel layer](https://channels.readthedocs.io/en/stable/topics/channel_layers.html).
- Avatar lưu WebP 256 × 256 trong PostgreSQL. `PUT /auth/me/avatar` nhận multipart `avatar` JPEG/PNG/WebP tối đa 5 MB, `DELETE /auth/me/avatar` gỡ ảnh. URL công khai ngẫu nhiên được thay mỗi lần cập nhật. API đánh giá đọc avatar hồ sơ hiện tại, còn tin nhắn tạm lưu URL tại thời điểm gửi. Màn hình dùng chữ cái đầu khi ảnh thiếu hoặc hết hiệu lực. Phản hồi gửi từ Admin hiển thị **Chủ shop** và avatar thương hiệu.

## Kiểm thử

Chạy `python -m pytest -q` trong backend. Chạy `npx vitest run` và `npm run build` trong frontend. Kiểm tra trình duyệt với Vite, Daphne và PostgreSQL có ít nhất hai sản phẩm công khai có ảnh và tồn kho. Script tạo tài khoản tạm, dùng browser context độc lập và dọn tài khoản khi kết thúc. Chạy trên **tiến trình ASGI mới** dành riêng cho smoke để badge không bị lẫn với dữ liệu chat local đang có. Cần Playwright Python và Chrome.

```powershell
python -m pip install playwright
python manage.py shell -c 'from e2e.product_chat_smoke import run; run()'
```

Đặt `QHS_CHAT_SMOKE_ORIGIN` nếu Vite dùng cổng khác. Hai ảnh smoke lưu ở thư mục tạm khởi tạo bởi hệ điều hành.
