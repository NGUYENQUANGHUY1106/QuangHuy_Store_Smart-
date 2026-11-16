# REQUIREMENTS GAP ANALYSIS — QuangHuy_Sport

Ngày: 16/11/2026. Trạng thái: **phát hiện và đề xuất, chưa phê duyệt/triển khai**. Mã nguồn S00…S14 theo [PROJECT_AUDIT.md](PROJECT_AUDIT.md). Mức nghiêm trọng dưới đây là mức rủi ro audit, khác nhãn ưu tiên tính năng P0/P1/P2.

## 1. Trùng lặp, mâu thuẫn và phụ thuộc sai mức

| Gap | Mức | Bằng chứng nguồn | Ảnh hưởng và xử lý đề xuất | Quyết định |
|---|---|---|---|---|
| G01 | Cao | S03 M04/US-M04 P0 có voucher cơ bản, FR-VOU P2; S08 C18 ghi voucher P2 | Không biết có phải viết voucher trong checkout P0; đề xuất bỏ toàn bộ voucher P0 và giữ discount=0 cho demo nếu duyệt | DEC-009/010 |
| G02 | Vừa | S03 M03/US-M03, S08 C01/C03/C06 dùng rating/review; FR-REV P2 | P0 phụ thuộc dữ liệu review chưa có; ẩn rating/filter hoặc ghi sample rõ, không giả verified purchase | DEC-010 |
| G03 | Cao | S05 BR-005 chỉ staff đổi trạng thái; S08 C36/FLOW-03 customer hủy | API không thể chọn quyền hủy nhất quán; cần ngoại lệ customer cancellation theo state/policy và test race | DEC-008 |
| G04 | Cao | S00/S01/S06 để mở giữ/trừ; S04 postcondition giữ hàng; S07 chỉ stock_qty | Nếu trừ lúc xác nhận mà không reserve ở checkout vẫn oversell; chọn mô hình tồn trước schema | DEC-003 |
| G05 | Vừa | S03 M01 P0 đổi mật khẩu; S08 C39 P1, C15/C17 P1; S07 thiếu API | Đổi mật khẩu không phải quên/reset; cần tách phạm vi/AC và cập nhật nhãn | DEC-016 |
| G06 | Vừa | S07 Users P2; S08 A16/A17 P1; S08 §1.1 profile/report P1 nhưng C29…33/A02 P0 | Ưu tiên UI tự mâu thuẫn. Dashboard cơ bản và báo cáo riêng có thể khác scope nhưng chưa định nghĩa | DEC-010/011/012 |
| G07 | Cao | S13 Backlog xếp mọi P2 vào W4; S09 W4 là QA/AI nếu khả thi; S00 cấm P2 trước P0 DoD nếu chưa quyết định | Roadmap có thể bị đọc thành cam kết quá tải; dùng backlog unscheduled P2, gate AI ở W1 | DEC-007/010 |
| G08 | Vừa | S06 sequence checkout gửi email sau commit; FR-BG-001 P2 | COD không nên phụ thuộc worker email chưa có; tách side effect optional, lỗi email không rollback đơn đã commit | DEC-010/013 |
| G09 | Vừa | S06 queue AI độc lập nhưng Celery optional; S08 C26 trạng thái job | Chưa biết job chạy/timeout/cleanup bằng gì; optional công nghệ không có nghĩa được bỏ semantics job | DEC-013 |
| G10 | Vừa | A-001…012 lặp S01/S02/S03/S13; FR/AC lặp S03/S05/S13; MD/DOCX song song | Chưa thấy drift nội dung ở 12 cặp văn bản nhưng nguy cơ nhiều nguồn chân lý. Giữ ID, chỉ định canonical source và revision đồng bộ | DEC-010 |
| G11 | Vừa | S14 thiếu UIUX DOCX; S08 v1.0, S03 v0.1, metadata DOCX v0.1 | Người đọc manifest bỏ sót nguồn lớn; bổ sung manifest/version governance sau duyệt | DEC-010 |
| G12 | Cao | S08 nói đủ 77 screen để handoff; checklist yêu cầu inventory hoặc lý do loại, prototype 8 flow | Độ chi tiết UI không chứng minh FR/backend đầy đủ hay duyệt design. 77 screen/state không đồng nghĩa 77 route và không mặc định phải code hết | DEC-007/010/011 |
| G13 | Vừa | S12 gọi rò ảnh AI là incident P1, lộ dữ liệu khách là P0 | Hai định nghĩa có thể áp dụng cùng sự cố; đề xuất dữ liệu nhạy cảm bị lộ xử lý mức nghiêm trọng nhất. Tách severity vận hành khỏi priority backlog | DEC-006 |

## 2. Coverage UI → requirement → dữ liệu/API

| Nhóm UI S08 | Liên kết hiện có | Thiếu cần làm rõ trước development |
|---|---|---|
| C01…08 | FR-CAT/SRCH, Product/Variant/Image | Gợi ý search có API nhưng FR/AC không cụ thể; gallery, size chart và nội dung bảng size không có model/nguồn; sale price/brand/rating thiếu contract |
| C13…17, C29…33, C39 | FR-AUTH/USER; User/Address; API register/login/logout | Thiếu profile/address CRUD/default, change/reset password, session lifecycle; avatar upload/phone/name chưa có trong entity User; verify email P2 phải không chặn P0 |
| C18…23, C34…36 | FR-CART/CHK/ORD/INV/PAY | Thiếu cancel endpoint và quyền; schema snapshot địa chỉ/lịch sử; payment riêng, response status, key retry và conflict |
| C24…28, A24/A25 | FR-TRY-001/002, TryOnJob/API job | Job monitor/config/quota/model version/failure code, consent version, cancel và cleanup chưa đặc tả |
| A01…14 | FR-ADM/INV, InventoryMovement, admin product/order API | Category CRUD, product media API, stock adjustment/movements, reason/actor/before-after, quyền và optimistic conflict thiếu; không cho sửa stock trực tiếp bỏ movement |
| A02, A18/A19 | FR-DASH | Chưa có reporting API/formula/timezone/paid vs delivered; chart mẫu không phải evidence số liệu thật |
| A15…17, A26/A27 | Actor ADMIN, BR-010, log trong FR-ADM | Brand entity/API, user lock/unlock, bảo vệ admin cuối, audit log storage/API, versioned store config chưa có FR/UC đủ cụ thể |
| C09…12, C37/38, C40…42, A20…23, A28…30 | Review/Voucher và một phần M10 | Wishlist/banner/notification/contact/support là scope UI mới chưa có FR/entity/API đầy đủ. Contact submit không được báo gửi thành công nếu chưa có nơi tiếp nhận |
| S01…05 | NFR-UX/SEC/REL | Cần lỗi API thống nhất, retry an toàn, focus/keyboard, responsive và ownership; offline không đồng nghĩa hỗ trợ checkout offline |

Không tự tạo các entity/endpoint trên như yêu cầu đã approved. Khi một UI feature được duyệt mới bổ sung contract tương ứng. Không cần xây API riêng cho mỗi modal.

## 3. Tồn kho, checkout và đơn hàng — blocker kỹ thuật/nghiệp vụ

Các tiêu chí sau là **đề xuất bổ sung để kiểm chứng BR/FR hiện có**, chưa phải test đã chạy.

| Gap | Nguồn và thiếu sót | Hướng đặc tả/tiêu chí cần bổ sung |
|---|---|---|
| I01 | FR-INV/BR-002; một stock_qty không diễn tả available/on-hand/reserved | Chọn giảm lượng bán được ngay hoặc reservation rõ. Chốt một/nhiều kho, backorder không hỗ trợ hay có; không suy ra từ tên stock_qty |
| I02 | S06 có lock rows, TC-003 chỉ một SKU | Transaction atomic cho tất cả line; lock SKU theo thứ tự nhất quán để giảm deadlock; constraint quantity/price hợp lệ. Test hai order nhiều SKU giao nhau, không giữ một phần nếu line sau fail |
| I03 | UC-CHK có key; S07 chỉ trường idempotency_key | Chốt key scoped theo user/operation, uniqueness DB, cùng key+cùng payload trả cùng order, key+payload khác trả conflict, retry sau timeout vẫn tìm đơn; không rò đơn giữa users |
| I04 | BR-003, FR-INV-002; chưa có cancel state machine | Cancel và status update khóa/kiểm tra trạng thái atomic; retry cancel không hoàn lần hai; test customer cancel đua admin ship, hai admin cùng cập nhật |
| I05 | S08 A08/A09; S07 movement chỉ delta/reference/reason | Chốt ai được nhập/adjust, reason bắt buộc, trước/sau/actor/time/reference; adjustment atomic và retry-safe, không âm kho. Test admin adjust đua checkout, movement khớp balance |
| I06 | FR-CHK snapshot địa chỉ; Order schema không có address snapshot; OrderItem mới sku/price/qty | Chốt snapshot người nhận/điện thoại/địa chỉ, tên/size/màu sản phẩm và tiền từng dòng; sửa/xóa address hoặc ngừng bán SKU không đổi đơn cũ; tránh cascade xóa lịch sử |
| I07 | BR-009 chưa có formula/currency/rounding | Chốt Decimal hoặc đơn vị tiền nhỏ nhất, VND và precision, ship/tax/discount, min/max quantity, giá 0/âm. Tổng server tính và không âm; thay giá cần báo xác nhận trước khi đặt |
| I08 | FR-CART/UC-CHK chưa nói cart lifecycle | Gộp duplicate SKU trước kiểm kho; reject qty 0/âm/non-integer/quá lớn, variant ẩn/ngừng bán. Quy định lúc xóa các item đã đặt, giữ item khác nếu cart thay đổi đồng thời |
| I09 | S08 status badges và transitions chưa thành rules | Chốt states/transitions/actor, điều kiện cancel và refund, delivered có terminal không; không dùng nhãn UI như bằng chứng state machine đã approved |
| I10 | FR-DASH và COD chưa có trạng thái thu tiền | Tách order fulfillment và payment/collection state; delivered không tự chứng minh đã thu COD. Chốt metric tiền, ngày tính, múi giờ Asia/Saigon và ship/discount/returns |

Nếu chọn giảm tồn khi tạo đơn, pending bị bỏ quên sẽ chiếm hàng đến lúc hủy; đây là giới hạn phải công bố, không tự thêm expiry P0. Nếu chọn reserve cần thêm reservation/release/expiry và mô hình available nhất quán; không chỉ đổi tên một field.

## 4. Thanh toán

P0 hiện là COD theo proposal, không yêu cầu gateway thật. Phải hiển thị đơn COD chưa thanh toán khi tạo đơn, không tự gắn paid ở order success. Chưa có quy trình xác nhận thu tiền COD, giao thất bại, hoàn hàng hay đối soát.

P2 FR-PAY-001/BR-006 và TC-010 chỉ mô tả xác thực/replay, chưa đủ cho tích hợp: thiếu PaymentAttempt/transaction reference, expected amount/currency, chữ ký và raw payload theo provider, merchant/order mapping, event uniqueness, retry/out-of-order, trạng thái pending/paid/failed/expired, reconcile khi webhook mất, paid sau expiry/cancel và refund. Cần đặc tả các tình huống đó với provider được duyệt; redirect client không quyết định paid. Không lưu dữ liệu thẻ nhạy cảm; dùng flow của provider. Test sandbox không chứng nhận production.

Nếu P2 có expiry, race payment-success với scheduler cancel phải có thứ tự xử lý và chính sách late payment; không trả tồn ra bán rồi vẫn xác nhận đơn cũ mù quáng. Voucher nếu bật cần atomic usage limits, một user/quota, điều kiện eligible, validity timezone, rounding/cap/stacking và hoàn lượt dùng khi hủy nếu policy yêu cầu.

## 5. Bảo mật và dữ liệu ảnh

| Gap | Yêu cầu nguồn | Chi tiết còn thiếu / bằng chứng cần có |
|---|---|---|
| S01 | NFR-SEC-001/BR-010 | Ma trận GUEST/CUSTOMER/STAFF/ADMIN theo action; owner filtering cho cart/address/order/job; không cho client set role/status/price; test IDOR cả list/detail/mutation/media |
| S02 | FR-AUTH/NFR-SEC-002 | Password hashing chuẩn framework, password policy, rate limit login/register/reset, email normalization/uniqueness, token/session expiry/revoke; CSRF/CORS/cookie theo deployment. Rate limit không thay authorization |
| S03 | NFR-PRIV/FR-TRY | MIME thực/decoder, allowlist, max bytes/dimensions/pixels, decompression bomb/corrupt file, filename/path an toàn, bỏ metadata EXIF khi phù hợp, cấm URL tùy ý gây SSRF. Quy tắc upload cũng áp dụng product/avatar/review nếu có |
| S04 | BR-007, TryOnJob | Consent purpose/version/time, owner, processor bên ngoài, TTL input/output/temp/cache, quyền xóa; backup/retention ngoại lệ phải minh bạch. Không cho admin xem ảnh chỉ vì được xem job metadata |
| S05 | FR-TRY-002/S08 C26/C27 | Cleanup chạy khi success/fail/timeout/retry và sau restart; delete trong lúc inference phải ngăn worker ghi ảnh trở lại; URL hết hạn không thay thế xóa vật lý; test ảnh không truy cập sau delete/expiry |
| S06 | NFR-OBS, S11 | Log request/job/order ID và lỗi có kiểm soát, không ghi ảnh/token/credentials/địa chỉ đầy đủ; secrets ngoài repo, DEBUG off, HTTPS, cấu hình allowed hosts/CORS/CSRF; audit log không sửa tùy tiện |
| S07 | S08 A16/A17 và actor ADMIN | Không self-promote, không khóa/xóa admin cuối, account disabled có revoke phiên nếu policy chọn; staff chỉ xem dữ liệu cần thiết |
| S08 | S11/S12 | Backup/restore có evidence, migration/rollback không phá dữ liệu, đối soát order/movement sau lỗi; giới hạn upload/jobs/storage tránh cạn tài nguyên public demo |

Đây là đánh giá kỹ thuật, không phải kết luận tuân thủ pháp lý. Chưa có chính sách dữ liệu được phê duyệt; không được mở thu thập ảnh thật chỉ vì UI có checkbox consent.

## 6. Use case, test và tiêu chí còn thiếu

S04 mới có hai UC chi tiết. Cần bổ sung actor, trigger, quyền, input/output, pre/postcondition, alternative và AC cho: đăng ký/login/logout/đổi mật khẩu; sửa địa chỉ; lọc/chọn variant; cập nhật cart; xem/hủy đơn; admin product/variant/media/category; stock adjustment; order transitions; dashboard. P1 cần upload/job status/delete/timeout; P2 hoàn thiện khi chọn vào scope. Dùng UC/flow hiện hữu làm gốc, tránh tạo bộ trùng lặp.

| Coverage test nguồn | Bổ sung nhỏ nhưng cần thiết trước nghiệm thu |
|---|---|
| TC-001,006 auth/quyền | Customer truy cập order/address/job người khác; staff vượt quyền; thay role qua payload; CSRF/session theo phương án chọn |
| TC-002…005,007 order/stock | Multi-SKU rollback; retry sau commit mất response; key collision khác payload/user; cancel/ship race; adjust/checkout race; snapshot không đổi; số lượng/tiền biên |
| TC-008/009 AI | MIME giả/decompression bomb; unsupported category; timeout/restart; xóa khi processing; expired URL/file; test input có consent và kiểm tra chất lượng với thất bại được lưu trong evidence |
| TC-010 payment | Sai signature/amount/currency/order, duplicate và out-of-order, webhook trễ sau cancel/expiry, redirect giả; chỉ khi triển khai P2 |
| S10 E2E/UX | Mobile/keyboard/focus và thông báo conflict; COD end-to-end + admin update; 403/404/500/offline retry không tạo đơn trùng |
| NFR-PERF/OBS, S11/S12 | Chọn môi trường/load rồi mới đặt ngưỡng latency/concurrency/job timeout; đo restore/cleanup/resource usage, không tự ghi SLA hoặc test pass |

Test concurrent phải dùng PostgreSQL thật với các connection/transaction độc lập và đồng bộ thời điểm tranh chấp, không dùng SQLite hoặc request tuần tự để tuyên bố đạt TC-003. Kết quả mong đợi: tối đa một đơn giữ hàng với SKU tồn 1, không âm tồn, không movement thừa; rollback trả về trạng thái nhất quán. Không yêu cầu mọi request thành công khi tồn không đủ.

## 7. Thứ tự đóng gap

1. Chủ dự án chốt DEC-001…011 và DEC-016 ở phần liên quan P0; ghi owner/giờ/tuần/phạm vi demo.
2. Tech Lead cập nhật BR/state machine/schema/API/permission và AC cho checkout, tồn, cancel; chủ dự án duyệt nghiệp vụ. Chốt DEC-012 trước dashboard, DEC-014 trước duyệt UI.
3. Spike AI độc lập; ghi bằng chứng và chốt DEC-005/013 trước public upload hoặc gọi provider.
4. Đồng bộ MD/DOCX/workbook/UI priorities/manifest theo revision; P2 không tự lên W4. Chỉ đóng gap khi có quyết định hoặc tài liệu/evidence liên quan.
5. Thực thi test và release gates sau triển khai. Audit hiện không đánh dấu FR hoàn thành, không đánh dấu test pass và không xác nhận production-ready.
