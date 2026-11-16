# API contracts — V1

Ngày 16/11/2026. Contract thiết kế, chưa có endpoint chạy. Truy vết QHS-002/005…024 và FR theo từng bảng; [architecture](ARCHITECTURE_FINAL.md) / [schema](DATABASE_DESIGN.md) / [security](SECURITY_DESIGN.md). Policy conditional không được tự biến thành approved.

## 1. Quy ước chung

Giữ routes root theo spec hiện hữu, **không tự thêm /api/v1**. Reverse proxy route API chính xác trước SPA fallback; Django admin HTML nếu dùng là `/backoffice/`, không collision REST `/admin/*`. Không trailing slash trong contract; không redirect unsafe request chỉ để thêm slash. OpenAPI khi triển khai phải bám file này và ghi revision khi đổi consumer contract.

JSON snake_case; ID UUID string, timestamp ISO-8601 UTC, display Asia/Saigon; tiền decimal string + currency, qty integer. Không nhận field không khai báo ghi (400 unknown_field); read-only field gửi trong write bị từ chối, không âm thầm nhận price/paid/role/stock. Các body dưới đây liệt kê toàn bộ writable fields, `?` là optional. Success response là resource, list theo DRF `{count,next,previous,results}`. Query `page>=1`, `page_size` 1…100, mặc định 20; sort allowlist và thêm ID làm tie-breaker; invalid filter/sort trả 400.

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

| Method/path | Quyền; request | Success response | Lỗi đặc thù |
|---|---|---|---|
| GET /auth/csrf | G | 200 `{csrf_token}` + CSRF cookie, Cache-Control no-store | 503 |
| POST /auth/register | G + CSRF; `{email,password,display_name?}` | 201 UserPublic; tạo customer, không tự cấp staff | 400 invalid/duplicate; 429 |
| POST /auth/login | G + CSRF; `{email,password}` | 200 UserPublic + Set-Cookie rotated session | 400 invalid_credentials (thông điệp chung); 429 |
| POST /auth/logout | U + CSRF; `{}` | 204, xóa phiên hiện tại | 403 |
| GET /auth/me | U | 200 UserPublic | 403 |
| PATCH /auth/me | U; `{display_name?,phone?}` | 200 UserPublic | 400; email không writable V1 |
| POST /auth/password/change | U; `{current_password,new_password}` | 204, invalidate sessions theo security design, yêu cầu login lại | 400; 429; scope DEC-016 |
| GET/POST /addresses | U; POST AddressWrite | 200 page Address / 201 Address | 400 |
| GET/PATCH/DELETE /addresses/{id} | U owner; PATCH AddressWrite partial | 200 Address / 204 | 404, 400 |

UserPublic `{id,email,display_name,phone,capabilities:[permission_code]}` không password/session key; capabilities giúp UI, server vẫn kiểm lại. AddressWrite `{receiver,phone,street,area,is_default?}`; area theo schema dữ liệu địa chỉ chốt DEC-014; Address thêm id/is_default. Set default trong cùng transaction khóa owner; xóa default không tự chọn địa chỉ khác nếu chưa có policy, có thể không có default. Đơn cũ không bị sửa theo Address.

Reset email/verify/OAuth chưa thuộc các endpoint trên. P2 OAuth dùng `/auth/oauth/{provider}/start` và `/auth/oauth/{provider}/callback`, server giữ state/nonce/allowlist redirect; provider mapping và account linking phải qua DEC-004/015. Không nhận email do browser tự khai để link tài khoản. Reset nếu chọn cần token một lần/hết hạn, neutral response, không trả secret reset trong API công khai; bổ sung contract sau DEC-016.

## 3. Catalog/search — FR-CAT-001/SRCH-001; M02/M03

| Method/path | Quyền/query | Response |
|---|---|---|
| GET /categories | G; `parent_id?` | page `{id,name,slug,parent_id}` active |
| GET /brands | G | page `{id,name,slug}` active |
| GET /products | G; `q,category,brand,size,color,min_price,max_price,in_stock,sort,page,page_size` | page ProductSummary |
| GET /products/{slug} | G | ProductDetail; 404 draft/archived |
| GET /search/suggestions | G; `q` 2…100 ký tự, limit 1…10 default 5 | `{products:[{id,name,slug,thumbnail,from_price,currency}],categories:[]}`; không match trả [] |

ProductSummary `{id,name,slug,thumbnail,from_price,currency,in_stock}`; ProductDetail thêm description/category/brand, images `{id,url,alt_text,variant_id,sort_order}`, variants `{id,sku,size,color,unit_price,currency,stock_qty,is_active,revision}`. Chỉ public active variants; size/color/in_stock phải match **cùng variant**, không kết hợp size từ một SKU và stock từ SKU khác. Price range trên variant đủ điều kiện, không phải giá parent hardcode. Sort allowlist `price,-price,newest,name`; rating/review filter chỉ bổ sung khi FR-REV được bật và contract revision duyệt. Size chart nếu DEC-014 duyệt là nội dung có nguồn gắn product/brand, không dự đoán fit từ ảnh AI.

## 4. Cart — FR-CART-001; M04

| Method/path | Request U owner | Response |
|---|---|---|
| GET /cart/items | Không body | 200 `{cart_revision,items:[CartLine]}` (không page vì giỏ nhỏ có giới hạn số lines được cấu hình) |
| POST /cart/items | `{variant_id,qty}`; add qty vào line có sẵn | 201 CartLine mới, hoặc 200 line đã tăng; kèm cart_revision |
| PATCH /cart/items/{id} | `{qty,expected_cart_revision}`; qty là giá trị tuyệt đối | 200 `{cart_revision,item:CartLine}`; stale revision 409 |
| DELETE /cart/items/{id} | `If-Match: <cart_revision>` | 204; stale 409, không thuộc owner 404 |

CartLine `{id,variant_id,sku,product_name,size,color,qty,unit_price,currency,stock_qty,is_available}`. Stock/price chỉ informative, không reservation. POST add là non-idempotent: UI không tự retry khi mất response, phải GET để reconcile intent; PATCH absolute có revision tránh cộng lặp. qty nguyên dương, line stale/ngừng bán giữ để user thấy và xóa, nhưng không được checkout. Mọi cart mutation khóa User trước, tăng revision. Nếu guest cart được chọn sau DEC-004 phải có contract merge riêng, không tự thêm localStorage cart thành nguồn thật.

## 5. Quote/checkout/orders — FR-CHK-001, FR-ORD-001, FR-INV-001, FR-INV-002

| Method/path | Request/quyền | Response |
|---|---|---|
| POST /checkout/quote | U; `{address_id,payment_method:"cod",cart_revision,voucher_code?}` | 200 `{quote_token,expires_at,cart_revision,items,subtotal,discount,shipping,total,currency,address_snapshot,policy_version}` |
| POST /checkout/orders | U; header `Idempotency-Key` 16…128 chars; `{quote_token}` | 201 OrderDetail lần đầu; 200 cùng OrderDetail khi replay, header `Idempotency-Replayed:true` |
| GET /orders | U; `status?,from?,to?,page,page_size` | page OrderSummary |
| GET /orders/{id} | U owner | OrderDetail |
| POST /orders/{id}/cancel | U eligible; `{expected_version,reason?}` | 200 OrderDetail; nếu đã canceled cùng owner trả hiện tại no-op |

Quote bổ sung để xử lý giá thay đổi trong UC-CHK-01, không service tách riêng. Expiry quote là cấu hình kỹ thuật cần đo (đề xuất 5 phút); có signature/owner, không có stock reservation. Server không nhận client subtotal/paid/stock. Hash idempotency dựa body quote_token canonical, không dựa giá DB lần retry. Cùng key body khác 409 ngay cả cùng cart; key mới thể hiện intent mua mới. Replay thành công phải chạy trước validate quote hết hạn/cart đã clear. Backend lưu key theo user và order lifetime, không chỉ ở Redis.

OrderSummary `{id,number,status,payment_status,payment_method,total,currency,created_at,version}`. OrderDetail thêm address_snapshot, items `{id,variant_id,sku_snapshot,product_name_snapshot,size_snapshot,color_snapshot,qty,unit_price,line_subtotal,allocated_discount}`, subtotal/discount/shipping, status_history `{from_status,to_status,at}`, `allowed_actions`. History customer không lộ thông tin nhân viên không cần thiết. `allowed_actions` tính server, không chỉ ẩn nút UI. Không ghi paid khi COD order success.

DEC-003/008/009/010 quyết định chính sách trong endpoints này; nếu policy chưa chốt thì không nhận checkout thật, trả 503 `checkout_not_configured`, không chọn phí/stock/cancel ngầm. Nếu voucher chưa bật mà client gửi voucher_code trả 400 `feature_not_enabled`.

## 6. Staff/admin — FR-ADM-001/DASH-001

Tất cả là S + permission cụ thể trong security design. Write trả resource 201/200, soft disable bằng PATCH; không có hard DELETE sản phẩm đã dùng. Validation 400, duplicate/version/state/stock 409, denied 403.

| Routes | Writable request / read response |
|---|---|
| GET/POST /admin/products; GET/PATCH /admin/products/{id} | ProductWrite `{name,slug,description,category_id,brand_id,status,expected_version?}`; Product admin resource gồm version; PATCH bắt buộc expected_version |
| GET/POST /admin/variants; GET/PATCH /admin/variants/{id} | `{product_id,sku,size,color,unit_price,is_active,expected_version?}`; PATCH không đổi product_id; trả stock_qty read-only. Tạo variant tạo balance 0; opening stock qua adjustment |
| GET/POST /admin/categories; GET/PATCH /admin/categories/{id} | `{name,slug,parent_id?,is_active,expected_version?}`; cycle/slug conflict bị chặn |
| GET/POST /admin/brands; GET/PATCH /admin/brands/{id} | `{name,slug,is_active,expected_version?}`; scope màn A15 theo DEC-010 |
| POST /admin/products/{id}/images | multipart `{file,variant_id?,alt_text,sort_order}`; 201 validated image; 413/415/400 khi lỗi |
| PATCH/DELETE /admin/products/{id}/images/{image_id} | PATCH `{alt_text?,sort_order?}`; 200 hoặc DELETE 204; không xóa asset đang pin cho job mà chưa xử lý reference |
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

## 8. P2 modules và phạm vi chưa chốt

| Module / FR | Contract thiết kế có điều kiện |
|---|---|
| Payment / FR-PAY-001 | POST /payments/sandbox/create U `{order_id}` + Idempotency-Key → 201/200 `{attempt_id,provider,status,redirect_url,expires_at}`; GET /payments/attempts/{id} owner → safe status; POST /payments/webhooks/{provider} provider-auth → ack theo provider sau durable receipt; raw request/signature xử lý đúng SDK/docs khi provider được chọn. Duplicate event không xử lý hai lần |
| Promotions / FR-VOU-001 | POST /vouchers/validate U `{code,cart_revision}` → `{eligible,reason_code}` không giữ quota; áp chính thức tại checkout transaction. Admin GET/POST /admin/vouchers; GET/PATCH /admin/vouchers/{id} với code/type/value/cap/min/dates/limits/is_active/version theo schema; limit usage read-only |
| Reviews / FR-REV-001 | GET /products/{slug}/reviews G page visible; POST /reviews U `{order_item_id,rating,body}` →201 Review; PATCH /reviews/{id} owner `{rating?,body?}` nếu policy cho →200; admin POST /admin/reviews/{id}/moderation `{status,reason,expected_version}` →200. Duplicate item409, ineligible403, XSS validation/sanitization |
| OAuth / FR-OAUTH-001 | identity routes §2; linking contract chỉ hoàn thiện provider-specific sau quyết định; không bật placeholder |
| Email/expiry / FR-BG-001/002 | Job nội bộ, không public endpoint kích hoạt arbitrary; staff retry nếu có endpoint phải có permission/audit, không gửi trùng |
| Assistant / FR-AI-001 | Chưa chọn chatbot hay summary: không giả định một API dùng cả hai. Task QHS-038 phải chốt hành vi, input/output, limits, data access và contract riêng trước Ready |

Các provider callbacks và OAuth details còn TBD là blocker thực, không phải sandbox integration đã hoàn tất. API user management/settings/banner/wishlist/support chỉ thêm sau FR/scope được duyệt.

## 9. AC và kiểm chứng contract

API-AC1: từng route có auth/request/response/errors, unknown/read-only fields bị chặn; OpenAPI và integration test sau code đối chiếu file này. API-AC2: checkout replay/hash/snapshot và 409 có regression PostgreSQL; TC-002…007. API-AC3: CSRF, IDOR/media, upload, quota/deletion theo TC-001/006/008/009. API-AC4: provider signature/amount/replay/out-of-order theo TC-010 nếu P2 bật. **Tất cả test ứng dụng NOT RUN**; ví dụ JSON là shape, không evidence thành công.
