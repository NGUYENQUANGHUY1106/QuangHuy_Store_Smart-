# Kiến trúc kỹ thuật V1 — QuangHuy_Sport

Cập nhật 23/11/2026 theo [DEC đã duyệt](../OPEN_DECISIONS.md). Hành vi triển khai và phần đề xuất được đối chiếu tại [API contracts](API_CONTRACTS.md).

## 1. Baseline và trạng thái quyết định

Nguồn: [SRS](../02_Requirements/01_SRS.md), [BR](../02_Requirements/03_Business_Rules_Acceptance.md), [UC](../02_Requirements/02_Use_Cases_User_Stories.md), `QuangHuy_Sport_UIUX_Figma_Master_Spec.docx` (77 screen/state, 8 flow), [audit](../PROJECT_AUDIT.md), [gap analysis](../REQUIREMENTS_GAP_ANALYSIS.md), [backlog](../IMPLEMENTATION_BACKLOG.md), [AGENTS.md](../../AGENTS.md).

| Mã thiết kế | Lựa chọn | Trạng thái/phạm vi |
|---|---|---|
| TD-01 | React + TypeScript + Tailwind; DRF + PostgreSQL; backend modular monolith | Theo chỉ dẫn hiện tại; không cần microservice V1 |
| TD-02 | JWT access/refresh, bcrypt, CUSTOMER và ADMIN | DEC-004 đã duyệt; xem security design về vòng đời token |
| TD-03 | PostgreSQL transaction/row locks + unique key; server là authority cho tiền/kho/quyền | Chốt kỹ thuật để thực hiện BR-001/003/009/010 |
| TD-04 | Một kho, trừ khi tạo đơn, hoàn một lần khi hủy | DEC-003 đã duyệt |
| TD-05 | COD và mô phỏng online; DEC-008 state, DEC-009 VND/ship, DEC-015 voucher | Đã duyệt MVP. DEC-012 còn OPEN |
| TD-06 | AI disabled cho tới khi một pipeline có go evidence; DB job durable; worker riêng process khi bật | Chưa chọn model/GPU/provider; DEC-001/005/013 chặn nhận ảnh thật |
| TD-07 | React admin và REST admin route hiện hữu | DEC-011 đã duyệt; giữ đường dẫn API có consumer |

Không sửa hồi tố các proposal cũ thành approved. Khi duyệt ghi người/ngày/lựa chọn, đồng bộ source và backlog; contract mới ở năm file này là bản thiết kế chi tiết kế tiếp hai spec sơ bộ, không phải code đang chạy.

## 2. Topology và Django apps

Browser React/TS/Tailwind → HTTPS reverse proxy (static SPA + API cùng origin) → Django/DRF → PostgreSQL. Private media đi qua authorization backend; product media public riêng. Nếu AI được bật: cùng source release có worker process chuyên GPU; không chạy inference trong HTTP request. PostgreSQL giữ job/status và nghiệp vụ, Redis chỉ broker nếu dùng Celery, không giữ stock/session làm nguồn chính.

| App | Trách nhiệm, model sở hữu | Requirement / UI |
|---|---|---|
| identity | Custom User email login, Address, auth/session/profile và Django groups/permissions | FR-AUTH-001, FR-USER-001; C13…17/C29…33/C39 |
| catalog | Category, Brand, Product, ProductVariant, ProductImage; search/filter SQL | FR-CAT-001, FR-SRCH-001; C01…08/A03…07/A13…15 |
| cart | Cart/CartItem; owner, revision, không reserve | FR-CART-001; C18/19 |
| inventory | InventoryBalance/Movement; adjustment service, ledger đối soát | FR-INV-001/002, FR-ADM-001; A08/09 |
| orders | CheckoutRequest, Order/OrderItem/OrderStatusEvent; orchestration tiền/tồn/snapshot/cancel | FR-CHK-001, FR-ORD-001; C20…22/C34…36/A10…12 |
| analytics | Read queries có permission, không sở hữu bản sao doanh thu | FR-DASH-001; A02/A18/19 theo scope |
| audit | AuditEvent append-only cho staff/role/config/stock/order | FR-ADM-001, NFR-OBS-001; A26 view riêng chờ scope |
| ai_tryon (P2) | TryOnJob, private objects, consent, inference adapter, cleanup | FR-TRY-001/002; C24…28/A24/25 |
| payments (P2) | PaymentAttempt/Event, provider signature/reconciliation | FR-PAY-001; C23 |
| vouchers | Voucher cơ bản trong MVP; mở rộng theo DEC-015 | FR-VOU-001; C18/A20/21 |
| reviews (P2) | Review/order-item eligibility, moderation | FR-REV-001; C37/38/A22/23 |
| notifications (P2) | Outbox/email/retry; không quyết định order status | FR-BG-001; C42/A30 nếu scope được duyệt |

FR-OAUTH-001 mở rộng identity; FR-BG-002 orchestration orders/payments; FR-AI-001 thuộc ai_tryon hoặc app assistant chỉ khi chọn scope riêng, không trộn pipeline try-on với chatbot. Wishlist/banner/contact/admin-user screens không có FR đầy đủ: chưa tự thêm chức năng ngoài SRS.

Mỗi app có models/serializers/permissions/views/urls/tests và service nghiệp vụ khi cần. FK cross-app trong cùng DB được phép; orders gọi inventory/promotions theo service, không gọi HTTP nội bộ. Chỉ orchestration sở hữu transaction chung; không commit nửa đơn. Analytics đọc models, không sửa tiền. Frontend chia features theo domain, shared components thực sự dùng lại; Tailwind tokens theo palette chốt DEC-014, không dùng CSS framework thứ hai.

## 3. Transaction đặt hàng — FR-CHK-001/ORD-001/INV-001

Thiết kế tham chiếu TD-04: `stock_qty` là **lượng còn bán được**, không phải kiểm kê vật lý. Cart không giữ tồn; đơn pending đã trừ, confirm/pack/ship không trừ lần nữa. Không có auto-expiry P0: pending giữ hàng đến hủy, giới hạn phải công bố khi DEC-003 duyệt.

Web lấy báo giá có chữ ký qua /checkout/quote, gửi lại quote_token cùng snapshot địa chỉ, phương thức thanh toán và voucher. Checkout lấy khóa trong PostgreSQL và so sánh quote với giá và giỏ hiện hành. API duy trì payload cũ cho caller không gửi quote, server vẫn tính toàn bộ tổng tiền.

Sequence mục tiêu cho phần mở rộng quote trong `transaction.atomic()`:

1. Xác thực, giới hạn payload/key, chuẩn hóa payload/hash. Khóa User của buyer; mọi mutation cart/address và checkout cùng user cũng phải khóa User trước để serialize revision/snapshot. Không gọi provider trong transaction.
2. Tìm CheckoutRequest theo `(user_id,key)`. Nếu thành công trước đó: cùng request hash trả đơn đã commit (kể cả quote đã hết hạn), khác hash trả 409. Không tính lại giá và không trừ kho lần nữa. Unique DB vẫn bắt buộc; không chỉ kiểm exists.
3. Với key mới, insert CheckoutRequest trong transaction. Verify quote user/signature/expiry; kiểm cart revision, đọc Address cùng user. Quote cũ, cart/giá/phí đổi trả 409 yêu cầu quote mới, không tự mua giá mới. Toàn bộ lỗi rollback cả claim; idempotency này bảo đảm **đơn thành công** một lần, không cache mọi lỗi validation.
4. Nếu voucher được bật, khóa Voucher trước products. Khóa Product theo ID tăng dần, rồi ProductVariant theo ID tăng dần, rồi InventoryBalance theo variant ID tăng dần. Recheck published/active, đủ số lượng, chính sách giá từ DB, quote và quota voucher. Admin sửa cùng rows phải tuân thứ tự này. Product khóa giúp disable cạnh tranh không lọt recheck.
5. Server tính line totals/discount/ship/total theo policy đã duyệt; tạo Order pending/unpaid COD, OrderItem snapshot người nhận/giá/SKU/size/màu, OrderStatusEvent. Giảm balance, ghi movement `checkout` riêng từng line, ghi redemption nếu áp. Một line fail thì rollback tất cả.
6. Link CheckoutRequest→Order; remove đúng cart lines đã chốt, tăng revision; không xóa giỏ trước commit. Audit thích hợp trong DB transaction. Commit rồi trả 201; replay trả 200 cùng resource. Callback email chỉ sau commit; nếu thêm jobs dùng outbox/reconciler, không dựa callback như bảo đảm giao việc.

Thứ tự khóa chung: User (khi owner mutation) → Order (nếu đã tồn tại) → Voucher → Product → ProductVariant → InventoryBalance; trong mỗi nhóm ID tăng dần. Thao tác chỉ cần subset không được lấy ngược thứ tự; ví dụ adjust chỉ balance, không quay lại lock product. Admin product edit product→variant. Không thêm lock user sau order trong cancel. Network/storage work ở ngoài DB locks. Deadlock/lock timeout rollback toàn bộ, trả lỗi retryable 503; retry cùng key. Không retry mù khi chưa biết commit: trước tiên tra key.

PostgreSQL READ COMMITTED với row locks đủ cho invariant nếu mọi writer theo protocol, check constraints là lớp cuối. `select_for_update` phải nằm trong transaction; test cần connections độc lập. [Django QuerySet documentation](https://docs.djangoproject.com/en/5.2/ref/models/querysets/#select-for-update).

## 4. Cancel, điều chỉnh và thanh toán

DEC-008 đã duyệt PENDING → CONFIRMED → SHIPPING → COMPLETED. Customer chỉ hủy PENDING của mình; admin hủy PENDING hoặc CONFIRMED. Cancel khóa Order, cập nhật trạng thái, hoàn từng balance một lần và ghi lịch sử trong cùng transaction. Gửi hủy lần hai trả 409 trên API hiện tại.

Adjust stock có key và payload hash, delta/reason bắt buộc, khóa balance, chặn kết quả âm, ledger và balance commit cùng nhau; replay không ghi đôi. ProductVariant API không writable stock. Nếu balance/ledger lệch: cảnh báo và đối soát, không tự reset tồn.

COD tạo đơn UNPAID. Xác nhận online chỉ mô phỏng theo DEC-002. Chỉ số COD thực thu chờ DEC-012. Gateway/webhook P2 yêu cầu chữ ký, amount/currency/reference, idempotency và đối soát riêng.

## 5. Hạ tầng và gate kiểm chứng

V1 core không cần Redis/Celery. Khi AI live đạt go: ưu tiên Celery+Redis nếu máy/hosting cho worker thường trực; DB job là durable queue intent, dispatcher quét queued jobs để phục hồi lỗi publish sau commit. Một worker process GPU ban đầu, concurrency/hard timeout phải đo; cleanup command scheduled độc lập có thể chạy khi broker chết. Nếu chỉ spike offline thì không thêm broker vào website. Worker dùng cùng domain code là process isolation, chưa phải microservice; chỉ tách service khi CUDA/dependency/GPU host yêu cầu và contract/job security đã kiểm.

Public demo cần HTTPS, private media, limits, log redaction, PostgreSQL backup/restore; không hứa GPU free/SLA. Versions framework/runtime được pin và kiểm compatibility tại QHS-003, tài liệu tham khảo Django 5.2 không tự buộc chọn phiên bản package.

| AC thiết kế / task | Kiểm chứng bắt buộc sau code, hiện NOT RUN |
|---|---|
| ARCH-AC1 / QHS-002/014/016/017 | SKU tồn 1, hai connections mua: tối đa một order giữ hàng; multi-SKU rollback, key replay/hash conflict, cart/address race |
| ARCH-AC2 / QHS-015/020/021 | Adjust/checkout và cancel/ship tranh chấp; balance=ledger, hoàn đúng một lần |
| ARCH-AC3 / QHS-005/023 | Session rotation/CSRF/ownership/mass-assignment và logout, admin permission |
| ARCH-AC4 / QHS-026…030 | Mỗi hướng AI evidence riêng; delete/expiry không tái xuất ảnh, worker crash/retry/reconcile |

Chi tiết: [database](DATABASE_DESIGN.md), [API](API_CONTRACTS.md), [security](SECURITY_DESIGN.md), [AI feasibility](AI_TRYON_FEASIBILITY.md). Chưa có migration, benchmark, inference hoặc test ứng dụng thực thi.
