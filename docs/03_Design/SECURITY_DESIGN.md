# Security design — V1

Ngày 16/11/2026. TD-02 chốt cơ chế kỹ thuật theo nhiệm vụ hiện tại; không khẳng định DEC-004/011/016 và privacy policy đã được chủ dự án duyệt đầy đủ. Nguồn: FR-AUTH/USER/ADM/TRY/PAY, BR-006/007/010, NFR-SEC-001/002/PRIV-001/OBS-001; QHS-005/023/028/029.

## 1. Authentication và lưu phiên

**Chọn Django DB-backed sessions trong PostgreSQL + DRF SessionAuthentication**, frontend/API cùng origin qua reverse proxy; không JWT/localStorage, không Redis session cache V1. Cookie chỉ chứa session ID ngẫu nhiên, dữ liệu session server-side. Quyết định này đơn giản hóa revoke và CSRF cho web-only portfolio. Nếu cần frontend cross-origin/mobile API sau này phải review lại cookie/CORS/auth, không tự đổi token.

Auth lifecycle: GET /auth/csrf bootstrap; register không tự cấp quyền; login dùng Django authenticate/login và rotate session để chống fixation; logout POST+CSRF flush session/xóa cookie; user inactive bị từ chối. Lỗi login dùng thông điệp chung. Email normalized và unique DB; password dùng Django hasher và validators, không mã hóa đảo ngược hay log password.

Cookie production: `sessionid` HttpOnly, Secure, SameSite=Lax, Path=/, không Domain rộng; CSRF cookie Secure/SameSite=Lax, token cấp qua response bootstrap, frontend gửi X-CSRFToken cho mọi unsafe request. V1 chọn phiên tối đa **12 giờ tuyệt đối** từ login, không sliding và không remember-me. Middleware kiểm login timestamp server-side, kể cả API read; refresh trang không gia hạn. Đây là cấu hình bảo mật kỹ thuật cần kiểm chứng, không SLA. Dọn session hết hạn bằng lịch vận hành.

Đổi mật khẩu dùng current password, Django session auth hash invalidation và logout phiên hiện tại để yêu cầu login lại; không gọi cơ chế giữ lại phiên nếu chọn logout toàn bộ. Nếu khóa tài khoản, kiểm is_active mỗi request. Reset/OAuth chưa bật cho tới DEC-016/004; reset phải single-use, có expiry, neutral email response và throttle riêng.

DRF chỉ enforce CSRF cho authenticated session chưa đủ bảo vệ **login/register anonymous**: dùng CSRF middleware/decorator explicitly cho các auth unsafe endpoints và integration test `enforce_csrf_checks=True`. Mọi unsafe cookie-auth endpoint khác cũng enforce CSRF. Origin/Referer/trusted origins chính xác theo deployment; CORS tắt mặc định, không wildcard+credentials. Local dev dùng proxy frontend tới Django để giữ origin, HTTP localhost cookie exception chỉ trong local settings.

Django hỗ trợ session server-side và rotation; DRF cảnh báo login cần CSRF riêng. Nguồn kiểm tra 16/11/2026: [Django sessions](https://docs.djangoproject.com/en/5.2/topics/http/sessions/), [DRF SessionAuthentication](https://www.django-rest-framework.org/api-guide/authentication/#sessionauthentication). Version package cụ thể pin khi implementation, không suy tài liệu tham khảo là package đã cài.

## 2. Authorization

Server là authority. `is_staff` chỉ cho phép vào admin site, không tự có toàn quyền nghiệp vụ; Django Group/Permission theo action. Customer mặc định không staff/superuser; không writable groups/is_staff/status qua profile. Admin nghiệp vụ không đồng nghĩa DB superuser hay Django is_superuser; superuser chỉ bootstrap/vận hành, không dùng làm account demo công khai.

| Action | Guest | Customer | Staff theo quyền | Admin theo quyền |
|---|---|---|---|---|
| Catalog public | Có | Có | Có | Có |
| Profile/address/cart/order | Không | Chỉ của mình | Chỉ xem dữ liệu khách cần cho xử lý order với view_order | Không bypass owner nếu không có quyền staff tương ứng |
| Checkout/cancel | Không | Checkout của mình; cancel theo DEC-008 | Chuyển/cancel qua staff API có change_order | Như staff + quyền được cấp |
| Product/category/media | Chỉ đọc public | Chỉ đọc public | view/add/change_catalog; stock không writable | Có permission tương ứng |
| Inventory adjust/movements | Không | Không | adjust_inventory / view_inventory_movement | Có permission tương ứng |
| COD collection/report | Không | Không | collect_cod / view_analytics, tách change_order | Có permission tương ứng |
| AI input/output/delete | Không | Chỉ own jobs | view_tryonjob_metadata không cho xem ảnh | Không mặc định xem ảnh; support access cần quyết định riêng |
| Role/user lock/audit | Không | Không | Không nếu thiếu quyền riêng | manage_users/manage_roles/view_audit; UI scope DEC-011 |

Đây là ma trận kỹ thuật tối thiểu đề xuất cho DEC-011; chưa seed nhóm quyền nghiệp vụ được approved. Không self-promote/khóa admin cuối; quyền xem order không tự cấp export PII hoặc sửa snapshots. UI nhận capabilities để render, API luôn authorize lại. Queryset filter owner và object checks cả GET/list/PATCH/DELETE; mass assignment allowlist. UUID không thay ownership.

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

SEC-AC1 / QHS-005/006/031: login fixation/rotation/logout, cookie flags, absolute expiry, đổi password, inactive user, CSRF login anonymous và unsafe API; TC-001.

SEC-AC2 / QHS-023: TC-006 và IDOR list/detail/mutation/media; payload role/paid/stock bị reject; staff permission tách; logs không chứa secret/PII.

SEC-AC3 / QHS-028/029: TC-008/009, quota race, MIME giả/bomb, private cache, expiry/delete trong khi worker chạy và sau restart; không output resurrect.

SEC-AC4 / QHS-032: TC-010, signature/amount/currency sai, replay/out-of-order/paid-late; chỉ khi gateway bật. Không test nào được đánh dấu PASS trước khi chạy trên môi trường đã ghi evidence.
