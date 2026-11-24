# Security design — V1

Cập nhật 23/11/2026 theo DEC-004/011. Kết quả local và các mục chờ nghiệm thu được ghi tại [evidence](../evidence/AUTO_LOOP_2026-11-23.md).

## 1. Xác thực MVP

- Django dùng bcrypt SHA-256 cho mật khẩu và Django validators. API dùng JWT ở header `Authorization: Bearer <access>`, access 15 phút, refresh 7 ngày, refresh rotation và blacklist. Logout thu hồi refresh của chính tài khoản; access đã cấp hết hạn theo cấu hình.
- Login/register trả JWT trong JSON. Browser dùng sessionStorage cho phiên từng tab và xóa ba key xác thực cũ trong localStorage. Tự refresh trên browser và kiểm XSS còn ở QHS-023; endpoint refresh server có rotation. API chỉ bật JWTAuthentication. Kiểm CSRF bắt buộc nếu bổ sung cookie làm thông tin xác thực; hiện cookie không cấp quyền API. CORS chỉ cho origin cấu hình.
- Đổi mật khẩu và reset chờ DEC-016. OAuth nằm ngoài MVP.

## 2. Phân quyền

| Hành động | Guest | CUSTOMER | ADMIN |
|---|---|---|---|
| Catalog public | Có | Có | Có |
| Profile/address/cart/đơn cá nhân | — | Chỉ dữ liệu mình | Chỉ dữ liệu mình trên route customer |
| Checkout/customer cancel | — | Theo quyền sở hữu và DEC-008 | Cùng hành vi trên route customer |
| Catalog admin, kho, quản trị đơn | — | 403 | Có qua API kiểm role |
| Dashboard, users, voucher admin | — | 403 | Phạm vi DEC-011; endpoint và UI theo backlog |
| Media AI, gateway thật | — | Ngoài MVP | Ngoài MVP |

Server lấy role từ tài khoản xác thực, UUID không thay kiểm tra ownership. Stock và trạng thái đơn phải qua API nghiệp vụ, còn lịch sử admin chỉ hiển thị theo quyền. Capabilities trên UI không cấp quyền.

## 3. Trust boundaries và dữ liệu

- Browser không quyết định price/discount/shipping/stock/paid/admin. Quote ký server và revalidate DB; mọi mutation kho/order chỉ qua service transaction trong architecture. Không cấp DB connection frontend.
- Provider webhook là input không tin cậy: signature theo provider trên payload chính xác, amount/currency/merchant/order, durable event dedupe. Không tin query redirect. Sandbox credentials vẫn là secret.
- AI worker nhận job IDs/asset references, không session cookie hoặc quyền quản lý user/orders. Credentials scope storage/job cần thiết; nếu DB worker role giới hạn không phù hợp ORM thì cấp riêng schema/tables tối thiểu hoặc dùng API nội bộ xác thực, không cấp superuser. Không expose Redis/PostgreSQL internet.
- Product media public tách khỏi input/output cá nhân. Nhận JPEG/PNG được decoder xác minh, re-encode/loại EXIF; byte/pixel limits và max dimensions cấu hình từ spike, reject file hỏng/bomb/polyglot. Không SVG/HTML/executable upload, không nhận URL download tùy ý gây SSRF.
- Object key ngẫu nhiên không chứa email/tên thật, không cho filename path traversal. Private read qua authenticated proxy no-store, Content-Type chuẩn, nosniff; không để CDN cache ảnh private. Storage phải hỗ trợ deletion, không coi unguessable URL là access control.
- Consent purpose/version/time và processor/retention phải chốt DEC-005 trước upload thật; không train hoặc chia sẻ ảnh. Raw input/temp/output/cache trong lifecycle xóa; server không thể thu hồi bản user đã tải về, phải giải thích giới hạn.

## 4. Hardening và vận hành

Secret từ environment/secret store, `.env` gitignored, `.env.example` placeholder; frontend build env public. Debug off, allowed hosts cụ thể, HTTPS redirect, secure proxy headers chỉ tin proxy quản lý, TLS/certificate kiểm trên demo. CSP theo assets thực, tránh dangerouslySetInnerHTML; sanitize nếu có rich text. Không tiết lộ stack/SQL; request_id cho đối soát.

Rate limit auth/upload/job creation và giới hạn concurrent jobs/bytes/storage theo user và global. Reverse proxy chặn body quá lớn trước decoder; app limit sau giải mã; Redis không bắt buộc cho auth nhưng nếu dùng DRF memory throttle nhiều workers phải công bố không bảo đảm hard cap. Public deployment cần shared throttle store hoặc reverse proxy limit; quota AI cứng phải kiểm/đếm dưới DB transaction owner lock, không chỉ throttle best effort.

Audit staff action trong transaction, redact password/token/ảnh/địa chỉ; logs chỉ ID, code, duration. Không dump request body chứa quote/address/file. Backup mã hóa/access hạn chế, restore rehearsal; ảnh private nên tách khỏi backup dài hạn, policy backup purge phải được chốt trước cam kết TTL. Xóa logic không đồng nghĩa mọi bản backup đã xóa.

Security incident lộ ảnh/PII xử lý mức nghiêm trọng cao nhất: tắt upload/read liên quan, revoke access và điều tra; không gọi nhẹ hơn chỉ vì module AI là P1. Scope incident/legal obligations cần đánh giá trước production thật, không tuyên bố compliance dựa vào tài liệu.

## 5. AC/checks bắt buộc, hiện NOT RUN

SEC-AC1 / QHS-005/006/031: JWT access/refresh, rotation/logout, inactive user, kiểm CORS và ranh giới CSRF; đổi mật khẩu sau DEC-016; TC-001.

SEC-AC2 / QHS-023: TC-006 và IDOR list/detail/mutation/media; payload role/paid/stock bị reject; staff permission tách; logs không chứa secret/PII.

SEC-AC3 / QHS-028/029: TC-008/009, quota race, MIME giả/bomb, private cache, expiry/delete trong khi worker chạy và sau restart; không output resurrect.

SEC-AC4 / QHS-032: TC-010, signature/amount/currency sai, replay/out-of-order/paid-late; chỉ khi gateway bật. Không test nào được đánh dấu PASS trước khi chạy trên môi trường đã ghi evidence.
