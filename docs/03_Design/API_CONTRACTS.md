# API contracts — V1

Ngày 16/11/2026. Contract thiết kế, chưa có endpoint chạy. Truy vết QHS-002/005…024 và FR theo từng bảng; [architecture](ARCHITECTURE_FINAL.md) / [schema](DATABASE_DESIGN.md) / [security](SECURITY_DESIGN.md). Policy conditional không được tự biến thành approved.

## API MVP đang có trong workspace 23/11/2026

Các bảng thiết kế ở phần dưới ghi cả endpoint mục tiêu. Dùng các route đã triển khai trong bảng này khi nối UI. Kiểm chứng và các phần thiếu ở [evidence Auto-Loop](../evidence/AUTO_LOOP_2026-11-23.md). G là public, U cần Bearer access JWT, A cần JWT và role ADMIN. API giữ route gốc và snake_case. Lỗi DRF validation có tên field hoặc detail; lỗi nghiệp vụ hiện có thể trả `error.code/message`.

| Domain | Route đã có | Request / response chính |
|---|---|---|
| Auth | POST /auth/register, /auth/login, /auth/refresh, /auth/logout | Email/password và display_name tùy chọn khi tạo, hoặc refresh token khi rotate/logout. Register 201, login/refresh 200, logout 204; invalid credential/token 400/401 tùy endpoint. Role chỉ đọc. |
| Hồ sơ và địa chỉ | GET/PATCH /auth/me; GET/POST /addresses; GET/PATCH/DELETE /addresses/{id} | U owner, address `receiver,phone,street,area,is_default`. Address list phân trang DRF, frontend lấy mọi trang từ API cùng origin. Owner khác nhận 404. MVP nhập địa chỉ tay theo DEC-014. |
| Catalog | GET /categories, /brands, /products, /products/{slug}, /search/suggestions | G. Danh sách theo DRF page; filter q/category/brand/size/color/min_price/max_price/in_stock/sort; chi tiết chỉ published và variants active. |
| Cart | GET /cart; POST /cart/items; PATCH/DELETE /cart/items/{id}; POST /cart/merge | U owner. Add `variant_id,qty`, PATCH `qty`, merge `items:[{variant_id,qty}]`. GET/add/merge trả cart_revision và items; PATCH trả item; DELETE 204. Tồn thiếu 409. Merge có thể gửi Idempotency-Key dạng UUID. Cùng key và payload trả giỏ hiện tại, không cộng lại; cùng key khác payload trả 409. |
| Voucher | POST /vouchers/validate | U. `code` → eligible/voucher/discount khi hợp lệ, dùng giỏ người gọi. Checkout kiểm lại thời gian, min, cap và quota. |
| Báo giá | POST /checkout/quote | U. `voucher_code?`; 200 trả subtotal/discount/shipping/total/currency và quote_token ký bởi server. 409 khi giỏ, tồn, voucher không hợp lệ. Token chứa ID người dùng và dòng giỏ, không chứa địa chỉ; so sánh với giỏ/giá hiện hành lúc tạo đơn. |
| Checkout | POST /checkout/orders | U. `Idempotency-Key` 16–128 ký tự, body `payment_method,address_snapshot,voucher_code?,quote_token?`. Trình duyệt gửi quote_token; các caller API cũ dùng body hiện hữu. Báo giá thay đổi trả 409. Key scope user + checkout. Cùng key/cùng payload 200 kèm header replay, khác payload 409; tạo mới 201. Server khóa kho trong PostgreSQL và tính tổng VND. COD UNPAID; online chỉ mô phỏng. |
| Đơn cá nhân | GET /orders, /orders/{id}; POST /orders/{id}/cancel | U owner. List phân trang DRF {count,next,previous,results}, lọc status; detail nhận UUID hoặc mã đơn và trả snapshot/lịch sử. Customer hủy PENDING, trạng thái không phù hợp 409. UI gửi expected_version cho mutation; nếu version cũ trả 409 version_conflict. Caller cũ vẫn có thể bỏ trường này. |
| Admin catalog | /admin/products, /admin/variants, /admin/categories, /admin/brands và resource /{id}; POST /admin/media/upload | A. CRUD theo serializer; stock variant chỉ đọc, archive sản phẩm qua PATCH. Upload multipart file, tối đa 5 MB và 12 triệu pixel; backend giải mã, lưu PNG đã chuẩn hóa. Có thể đính kèm `product_id,alt_text` để gắn ảnh vào gallery. |
| Admin kho | GET /admin/inventory/balances, /admin/inventory/movements; POST /admin/inventory/adjust | A. `variant_id,delta,reason,operation_key`; 201 ghi mới, 200 replay, 409 khác payload hoặc tồn thiếu. Movement mới ghi actor; lịch sử cũ có thể null. |
| Admin đơn | GET /admin/orders, /admin/orders/{id}; POST /admin/orders/{id}/status | A. `status,reason?`; 200 cập nhật, 409 nếu không đúng DEC-008. UI gửi expected_version cho mutation; nếu version cũ trả 409 version_conflict. Caller cũ vẫn có thể bỏ trường này. |
| Dashboard | GET /admin/analytics/dashboard | A. Query `date=YYYY-MM-DD`, mặc định hôm nay theo Asia/Saigon, ngày sai trả 400. `revenue_delivered` là chuỗi Decimal VND của subtotal trừ discount cho đơn COMPLETED có event hoàn tất trong ngày, loại phí ship. `top_products` tối đa 10 SKU snapshot theo qty giảm dần, hòa thì SKU tăng dần, mỗi dòng có sku_snapshot và quantity. `cod_collected` null vì MVP chưa theo dõi sự kiện thu riêng. Counts đơn/kho là số hiện tại; `metrics_policy: dec_012`. 401 thiếu JWT; 403 role khác ADMIN. |

Catalog admin trả 201 khi tạo, 200 khi đọc/sửa, 204 khi xóa, 400 khi payload lỗi hoặc bản ghi được bảo vệ, 401/403 khi thiếu quyền. Admin UI ưu tiên archive/tắt. Bản ghi không còn tham chiếu có thể xóa; SKU có đơn hoặc tồn được bảo vệ.

Admin local có GET/POST /admin/users và GET/PATCH/DELETE /admin/users/{uuid}; tài khoản Customer có mật khẩu băm khi tạo, email giữ cố định sau tạo, role chỉ đọc. DELETE vô hiệu hóa và giữ lịch sử. Admin được bảo vệ khỏi chỉnh sửa/xóa qua API này. Voucher có GET/POST /admin/vouchers và GET/PATCH/DELETE /admin/vouchers/{id}; used_count chỉ đọc, DELETE vô hiệu hóa.

Kho MVP một kho, trừ tại checkout và hoàn một lần khi hủy (DEC-003/008). Phí 30.000đ, miễn phí từ tạm tính 500.000đ; một voucher PERCENT có trần hoặc FIXED; tổng = tạm tính − giảm + phí (DEC-009/015). DEC-004/011 duyệt JWT + React admin. Catalog local dùng serializer validation và khóa khi kiểm vòng danh mục. expected_version áp dụng cho mutation đơn; catalog trả version/revision chỉ đọc.

## 1. Quy ước chung

Giữ routes root theo spec hiện hữu, **không tự thêm /api/v1**. Reverse proxy route API chính xác trước SPA fallback; Django admin HTML nếu dùng là `/backoffice/`, không collision REST `/admin/*`. Không trailing slash trong contract; không redirect unsafe request chỉ để thêm slash. OpenAPI khi triển khai phải bám file này và ghi revision khi đổi consumer contract.

JSON snake_case; ID UUID string, timestamp ISO-8601 UTC, display Asia/Saigon; tiền decimal string + currency, qty integer. Trường ghi do serializer hoặc endpoint allowlist; DRF bỏ qua trường chỉ đọc và trường ngoài serializer ở các endpoint hiện hành. Giá/paid/role/stock phía client không ghi đè nguồn server. Các body dưới đây liệt kê toàn bộ writable fields, `?` là optional. Success response là resource, list theo DRF `{count,next,previous,results}`. Query `page>=1`, `page_size` 1…100, mặc định 20; sort allowlist và thêm ID làm tie-breaker; invalid filter/sort trả 400.

Auth: cookie Django session + CSRF; G=public guest, U=authenticated owner, S=staff có permission hành động, A=admin có quyền quản trị tương ứng. Unknown object hoặc object user khác trả 404, staff thiếu quyền trả 403. DRF SessionAuthentication trả 403 cho unauthenticated permission failure; contract V1 dùng 403 `authentication_required`, không hứa JWT-style 401.

| HTTP | Ý nghĩa/error code |
|---|---|
| 200/201/202/204 | Đọc/cập nhật/replay; tạo; job đã nhận; xóa không body |
| 400 | validation_error, unknown_field, invalid_filter, invalid_quote |
| 403/404 | authentication_required, permission_denied, csrf_failed / not_found |
| 409 | insufficient_stock, quote_changed, cart_changed, invalid_transition, version_conflict, idempotency_conflict |
| 413/415/429 | upload_too_large / unsupported_media_type / rate_limited (Retry-After) |
| 503 | service_unavailable, database_busy (retryable; retry giữ idempotency key) |

Error JSON thống nhất (gồm adapter cho DRF/CSRF/proxy):

```json
{"error":{"code":"insufficient_stock","message":"Sản phẩm không còn đủ số lượng.","fields":{},"details":{"variant_id":"<uuid>"},"request_id":"<id>","retryable":false}}
```

Không trả trace/SQL/PII; 409 giá đổi chứa mã yêu cầu quote mới, không tự tạo đơn. Client hiển thị message nhưng xử lý theo code. GET không side effect nghiệp vụ; cookie CSRF/session bootstrapping là ngoại lệ kỹ thuật, không thay order/stock.

## 2. Identity — FR-AUTH-001/USER-001; M01

JWT, bcrypt, CUSTOMER/ADMIN theo DEC-004. Dùng route MVP ở trên. Đổi mật khẩu/reset chờ DEC-016; OAuth chờ scope provider P2. Chi tiết auth ở [security design](SECURITY_DESIGN.md). Snapshot đơn tách khỏi địa chỉ đang chỉnh sửa.

## 3. Catalog/search — FR-CAT-001/SRCH-001; M02/M03

| Method/path | Quyền/query | Response |
|---|---|---|
| GET /categories | G; `parent_id?` | page `{id,name,slug,parent_id}` active |
| GET /brands | G | page `{id,name,slug}` active |
| GET /products | G; `q,category,brand,size,color,min_price,max_price,in_stock,sort,page` | page ProductSummary (20 mục) |
| GET /products/{slug} | G | ProductDetail; 404 draft/archived |
| GET /search/suggestions | G; `q` sau trim: dưới 2 trả hai mảng rỗng; trên 100 trả 400 | `{products: ProductSummary[], categories: Category[]}`; tối đa 5 mỗi nhóm |

ProductSummary `{id,name,slug,thumbnail,from_price,currency,in_stock}`; ProductDetail thêm description/category/brand, images `{id,url,alt_text,variant_id,sort_order}`, variants `{id,sku,size,color,unit_price,currency,stock_qty,is_active,revision}`. Chỉ public active variants; size/color/in_stock phải match **cùng variant**, không kết hợp size từ một SKU và stock từ SKU khác. Price range trên variant đủ điều kiện, không phải giá parent hardcode. Sort allowlist `price,-price,newest,name,-name`; rating/review filter chỉ bổ sung khi FR-REV được bật và contract revision duyệt. Size chart nếu DEC-014 duyệt là nội dung có nguồn gắn product/brand, không dự đoán fit từ ảnh AI.

## 4. Cart — FR-CART-001; M04

| Method/path | Request U owner | Response |
|---|---|---|
| GET /cart/items | Không body | 200 `{cart_revision,items:[CartLine]}` (không page vì giỏ nhỏ có giới hạn số lines được cấu hình) |
| POST /cart/items | `{variant_id,qty}`; add qty vào line có sẵn | 201 CartLine mới, hoặc 200 line đã tăng; kèm cart_revision |
| PATCH /cart/items/{id} | `{qty,expected_cart_revision}`; qty là giá trị tuyệt đối | 200 `{cart_revision,item:CartLine}`; stale revision 409 |
| DELETE /cart/items/{id} | `If-Match: <cart_revision>` | 204; stale 409, không thuộc owner 404 |

CartLine `{id,variant_id,sku,product_name,size,color,qty,unit_price,currency,stock_qty,is_available}`. Stock/price chỉ informative, không reservation. POST add là non-idempotent: UI không tự retry khi mất response, phải GET để reconcile intent; PATCH absolute có revision tránh cộng lặp. qty nguyên dương, line stale/ngừng bán giữ để user thấy và xóa, nhưng không được checkout. Mọi cart mutation khóa User trước, tăng revision. Nếu guest cart được chọn sau DEC-004 phải có contract merge riêng, không tự thêm localStorage cart thành nguồn thật.

## 5. Contract mục tiêu cho quote/checkout/orders — FR-CHK-001, FR-ORD-001, FR-INV-001, FR-INV-002

| Method/path | Request/quyền | Response |
|---|---|---|
| POST /checkout/quote | U; `{address_id,payment_method:"cod",cart_revision,voucher_code?}` | 200 `{quote_token,expires_at,cart_revision,items,subtotal,discount,shipping,total,currency,address_snapshot,policy_version}` |
| POST /checkout/orders | U; header `Idempotency-Key` 16…128 chars; `{quote_token}` | 201 OrderDetail lần đầu; 200 cùng OrderDetail khi replay, header `Idempotency-Replayed:true` |
| GET /orders | U; `status?,from?,to?,page,page_size` | page OrderSummary |
| GET /orders/{id} | U owner | OrderDetail |
| POST /orders/{id}/cancel | U eligible; `{expected_version,reason?}` | 200 OrderDetail; nếu đã canceled cùng owner trả hiện tại no-op |

Quote bổ sung để xử lý giá thay đổi trong UC-CHK-01, không service tách riêng. Expiry quote là cấu hình kỹ thuật cần đo (đề xuất 5 phút); có signature/owner, không có stock reservation. Server không nhận client subtotal/paid/stock. Hash idempotency dựa body quote_token canonical, không dựa giá DB lần retry. Cùng key body khác 409 ngay cả cùng cart; key mới thể hiện intent mua mới. Replay thành công phải chạy trước validate quote hết hạn/cart đã clear. Backend lưu key theo user và order lifetime, không chỉ ở Redis.

OrderSummary `{id,number,status,payment_status,payment_method,total,currency,created_at,version}`. OrderDetail thêm address_snapshot, items `{id,variant_id,sku_snapshot,product_name_snapshot,size_snapshot,color_snapshot,qty,unit_price,line_subtotal,allocated_discount}`, subtotal/discount/shipping, status_history `{from_status,to_status,at}`, `allowed_actions`. History customer không lộ thông tin nhân viên không cần thiết. `allowed_actions` tính server, không chỉ ẩn nút UI. Không ghi paid khi COD order success.

CartLine, OrderItem và admin product có trường chỉ đọc `thumbnail` (URL hoặc `null`). Giỏ và đơn chọn ảnh catalog theo màu biến thể hoặc màu snapshot tương ứng, có thể dùng ảnh chung của mẫu. Ảnh chỉ có khi sản phẩm đang được công khai.

Mua ngay (QHS-018.1) dùng hai endpoint checkout hiện tại với `direct_item: {variant_id, qty}`. Mua ngay bắt buộc gửi lại `quote_token` được ký riêng cho cùng khách và lựa chọn. Server kiểm tra lại giá/tồn và trừ tồn của đúng một SKU. Tạo đơn và replay giữ nguyên giỏ. OrderItem có thêm `product_slug` khi sản phẩm được công khai và `reviewed` chỉ đọc.

Đánh giá sau mua (QHS-035.1) gồm `GET /products/{slug}/reviews?page=&order_item=` (công khai, 10 lượt đánh giá/trang, `eligible_order_item_id` chỉ của phiên hiện tại), `POST /reviews` với `{order_item_id,rating,body}` và `POST /reviews/{id}/replies` với `{body}`. POST thành công trả 201. Chủ sở hữu dòng đơn `COMPLETED` của sản phẩm công khai được chấm 1–5 sao, một lượt mỗi dòng đơn. Dòng đơn người khác trả 404, chưa đủ điều kiện 403, trùng 409. Phản hồi yêu cầu đăng nhập. Nội dung là văn bản thuần tối đa 2.000 ký tự.

QHS-035.2 bổ sung tên hiển thị, ảnh theo màu, tên sản phẩm, màu và size mua trong danh sách công khai. Email, mã đơn và SKU chỉ có trong `GET /admin/reviews?page=` (ADMIN, 10 đánh giá/trang). `POST /admin/reviews/{id}/replies` (ADMIN, `{body}`, 201) gắn phản hồi với chính đánh giá đó. Server đặt `from_shop=true` cho endpoint Admin. `DELETE /admin/reviews/{id}` (ADMIN, 204) ghi người gỡ và thời điểm, ẩn đánh giá cùng phản hồi. Gỡ lại cùng ID trả 204. Đánh giá đã gỡ trả 404 khi phản hồi, vẫn giữ ràng buộc một đánh giá mỗi dòng đơn.

DEC-003/008/009/010 quyết định chính sách trong endpoints này; nếu policy chưa chốt thì không nhận checkout thật, trả 503 `checkout_not_configured`, không chọn phí/stock/cancel ngầm. Nếu voucher chưa bật mà client gửi voucher_code trả 400 `feature_not_enabled`.

## 6. Contract mục tiêu cho admin — FR-ADM-001/DASH-001

Theo DEC-011, thao tác admin MVP yêu cầu role ADMIN ở server. Write trả resource 201/200, soft disable bằng PATCH; không có hard DELETE sản phẩm đã dùng. Validation 400, duplicate/version/state/stock 409, denied 403.

| Routes | Writable request / read response |
|---|---|
| GET/POST /admin/products; GET/PUT/PATCH/DELETE /admin/products/{id} | Ghi name, slug, description, category, brand, status; version và variants chỉ đọc. |
| GET/POST /admin/variants; GET/PUT/PATCH/DELETE /admin/variants/{id} | Lọc product_id; ghi product, sku, size, color, unit_price, is_active. PATCH không đổi product. revision, stock_qty chỉ đọc. Tạo bản ghi balance 0. |
| GET/POST /admin/categories; GET/PUT/PATCH/DELETE /admin/categories/{id} | Ghi name, slug, parent, is_active; phát hiện vòng cha con khi cập nhật. |
| GET/POST /admin/brands; GET/PUT/PATCH/DELETE /admin/brands/{id} | Ghi name, slug, is_active. |
| POST /admin/media/upload | Multipart file bắt buộc, product_id và alt_text tùy chọn. 201 storage_key/filename. 400 ảnh lỗi/quá 5 MB hoặc 12 triệu pixel; 404 product_id không tồn tại. Backend chuẩn hóa PNG trước khi lưu. |
| POST /admin/inventory/adjustments | Header Idempotency-Key, `{variant_id,delta,reason}`; 201 Movement / replay 200; payload khác 409 |
| GET /admin/inventory/movements | `variant_id?,from?,to?,kind?,page`; page `{id,variant_id,delta,before_qty,after_qty,reason,actor_id,order_item_id,created_at}` |
| GET /admin/orders; GET /admin/orders/{id} | Filter status/date/order number; page admin summary / admin detail có address theo permission |
| POST /admin/orders/{id}/transitions | `{to_status,expected_version,reason?}`; 200 updated Order, duplicate đã đạt target trả hiện tại nếu policy cho; không arbitrary PATCH status |
| POST /admin/orders/{id}/cod-collection | `{expected_version,reference}`; 200 Order đã ghi thu COD một lần; chỉ khi DEC-002/012 có policy |
| GET /admin/dashboard | `from,to` ISO date; `{currency,metric_definition,timezone,orders_count,order_value,cod_collected,top_products}`; fields không có policy không được giả 0 như đã tính |
| GET /admin/audit-events | Filter actor/action/date/object; page redacted AuditEvent; permission riêng, UI riêng chưa chắc thuộc P0 |

Model mutable dùng expected_version phải có `version` DB tăng dưới lock (ngoài ProductVariant dùng revision ánh xạ expected_version). Audit/read-only không nhận version. Admin UI lựa chọn DEC-011 không ảnh hưởng server invariants; nếu dùng Django admin, custom action/form cũng gọi cùng service/validation và test.

## 7. Try-on — FR-TRY-001/002; M07

| Method/path | Request/quyền | Response/error |
|---|---|---|
| GET /tryon/capabilities | G | `{available,supported_categories,model_version?,input_rules?,policy_version?,reason_code?}`; chưa go trả available=false, không bịa category |
| POST /tryon/jobs | U; multipart `{file,variant_id,consent:true,consent_version}` | 202 Job; 400 consent/category/file; 413/415/429; 503 unavailable |
| GET /tryon/jobs/{id} | U owner | Job; không owner 404 |
| GET /tryon/jobs/{id}/media/{kind} | U owner; kind input/output | 200 private streamed image + no-store; 404 missing/deleted, 410 expired; không public redirect |
| DELETE /tryon/jobs/{id} | U owner | 202 `{id,status:"deleted",purge_status:"pending"}` hoặc 204 khi đã purge; thu hồi truy cập ngay, physical deletion async |
| GET /admin/ai/jobs | S view metadata | Page job metadata đã che, không tự có quyền xem ảnh |

Job `{id,variant_id,status,created_at,expires_at,error_code?,model_version?,input_url?,output_url?,purge_status}`; URLs là owner-auth endpoints, không public keys. Status và leases ở schema/AI feasibility. Không % nếu worker không đo được. Poll khoảng 2–5s khi active và backoff, không websocket bắt buộc. POST job không tự retry multipart khi network timeout; UI reconcile qua lịch sử nếu thêm endpoint history sau scope, hoặc báo rõ có thể đã nhận; quota chặn nhân bản lạm dụng. Retry inference nội bộ không tạo job mới hay resurrect media đã xóa.

## 8. Mở rộng và phạm vi chưa chốt

| Module / FR | Contract thiết kế có điều kiện |
|---|---|
| Payment / FR-PAY-001 | POST /payments/sandbox/create U `{order_id}` + Idempotency-Key → 201/200 `{attempt_id,provider,status,redirect_url,expires_at}`; GET /payments/attempts/{id} owner → safe status; POST /payments/webhooks/{provider} provider-auth → ack theo provider sau durable receipt; raw request/signature xử lý đúng SDK/docs khi provider được chọn. Duplicate event không xử lý hai lần |
| Promotions mở rộng / FR-VOU-001 | POST /vouchers/validate U `{code,cart_revision}` → `{eligible,reason_code}` không giữ quota; áp chính thức tại checkout transaction. Admin GET/POST /admin/vouchers; GET/PATCH /admin/vouchers/{id} với code/type/value/cap/min/dates/limits/is_active/version theo schema; limit usage read-only |
| Reviews / FR-REV-001 | GET /products/{slug}/reviews G page visible; POST /reviews U `{order_item_id,rating,body}` →201 Review; PATCH /reviews/{id} owner `{rating?,body?}` nếu policy cho →200; admin POST /admin/reviews/{id}/moderation `{status,reason,expected_version}` →200. Duplicate item409, ineligible403, XSS validation/sanitization |
| OAuth / FR-OAUTH-001 | identity routes §2; linking contract chỉ hoàn thiện provider-specific sau quyết định; không bật placeholder |
| Email/expiry / FR-BG-001/002 | Job nội bộ, không public endpoint kích hoạt arbitrary; staff retry nếu có endpoint phải có permission/audit, không gửi trùng |
| Assistant / FR-AI-001 | Chưa chọn chatbot hay summary: không giả định một API dùng cả hai. Task QHS-038 phải chốt hành vi, input/output, limits, data access và contract riêng trước Ready |

Các provider callbacks và OAuth details còn TBD là blocker thực, không phải sandbox integration đã hoàn tất. API user management/settings/banner/wishlist/support chỉ thêm sau FR/scope được duyệt.

## 9. AC và kiểm chứng contract

API-AC1: từng route có auth/request/response/errors, unknown/read-only fields bị chặn; OpenAPI và integration test sau code đối chiếu file này. API-AC2: checkout replay/hash/snapshot và 409 có regression PostgreSQL; TC-002…007. API-AC3: CSRF, IDOR/media, upload, quota/deletion theo TC-001/006/008/009. API-AC4: provider signature/amount/replay/out-of-order theo TC-010 nếu P2 bật. Kết quả thực tế theo từng AC xem evidence Auto-Loop; các payload mục tiêu chưa triển khai vẫn cần integration test.

Admin detail trả `images` gồm `id,url,variant_id,alt_text,sort_order`. `POST /admin/media/upload` nhận multipart `file,product_id,variant_id?,alt_text?` và lưu WebP vào PostgreSQL khi gắn sản phẩm. `PATCH /admin/media/{id}` nhận multipart `file?,variant_id?,alt_text?,sort_order?`; thay tệp trả URL mới. `PATCH /admin/products/{id}/colors` nhận `color,new_color`, đổi tên cả nhóm SKU cùng màu của sản phẩm; giá từng size cập nhật qua `PATCH /admin/variants/{id}`. Tất cả yêu cầu role Admin.
