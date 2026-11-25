# OPEN DECISIONS — QuangHuy_Sport

Ngày: 16/11/2026. Cập nhật approval: 23/11/2026. Các quyết định có trạng thái APPROVED dưới đây đã được chủ dự án chốt; các mục còn lại vẫn OPEN. Không tự phê duyệt mục chưa ghi APPROVED.

Có 13 quyết định APPROVED. DEC-001/005/013 còn OPEN cho AI ngoài phạm vi demo P0 local.

## Cần chốt trước baseline/checkout/AI

| ID / nguồn | Câu hỏi cần quyết định | Khuyến nghị chờ duyệt | Người quyết định; thời điểm / tác động nếu để mở |
|---|---|---|---|
| DEC-001 / A-005,006,007,008; UX-A02 | Ưu tiên thử giày hay áo? Có bắt buộc AI live trong demo? Máy/GPU nào, ảnh có quyền ở đâu? | Spike riêng 2–3 ngày W1; tích hợp một hướng đạt gate. Nếu chưa có bằng chứng cho giày, không quảng cáo thử giày hoạt động | Chủ dự án duyệt mục tiêu; Tech Lead đưa evidence; W1. Chặn cam kết FR-TRY |
| DEC-002 — **APPROVED** | COD và thanh toán online sandbox? | Chốt COD và chuyển khoản/VNPay Sandbox làm hai phương thức demo. COD = chưa thu tiền, chỉ xác nhận thanh toán theo policy; online chỉ giả lập xác nhận thành công trong MVP, không xử lý giao dịch thật. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: MVP. Không nhận redirect làm bằng chứng thanh toán. |
| DEC-003 — **APPROVED** | Trừ/giữ hàng lúc tạo đơn hay xác nhận? Một kho? | P0 một kho. Kiểm tra tồn khi thêm giỏ; checkout trong DB transaction khóa/sửa balance; trừ tồn khi tạo đơn thành công. Hủy đơn hoàn tồn tương ứng đúng một lần. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: một kho MVP. Không dùng reservation TTL. |
| DEC-004 — **APPROVED** | Session hay JWT, cùng origin hay cross-site? | Dùng JWT Access Token + Refresh Token; phân quyền role `CUSTOMER` và `ADMIN`; mật khẩu hash bằng bcrypt. Guest cart lưu localStorage và đồng bộ database khi đăng nhập. OAuth P2 chưa kích hoạt. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: auth/cart MVP. |
| DEC-005 / A-010; UX-A03,08; BR-007 | Ai được upload/xem ảnh? TTL, xóa ngay, bên xử lý ngoài và backup? | Chỉ user đăng nhập; private media; TTL đề xuất 24 giờ, xóa theo yêu cầu, không train; ảnh mẫu có quyền cho spike. TTL/SLA xóa cần bạn duyệt, không phải policy đã ban hành | Chủ dự án; trước nhận ảnh thật. Chặn public upload và chọn provider |
| DEC-006 — **APPROVED** | Demo local, video hay website public? Có phục vụ khách thật không? | Demo 100% local trên PostgreSQL 18, dùng tài khoản và dữ liệu mẫu. Bàn giao hướng dẫn, build và evidence; smoke/rollback trên local. Thanh toán thật, OAuth và gửi email nền giữ ở P2. | Người duyệt: Nguyễn Quang Huy; ngày 23/11/2026; scope: MVP local.  Bổ sung 23/11/2026 (Nguyễn Quang Huy): cho phép dùng nguồn ảnh sản phẩm thể thao công khai/mở cho demo học thuật trên máy cá nhân. |
| DEC-007 — **APPROVED** | Bao nhiêu người, giờ/tuần, ngày bắt đầu/kết thúc và mức chi tối đa? | Một người thực hiện, một chủ dự án duyệt; ngân sách hạ tầng 0 đồng; 5 ngày làm việc × 4 giờ từ ngày duyệt, kế hoạch 23–27/11/2026. Phạm vi bàn giao P0 local. | Người duyệt: Nguyễn Quang Huy; ngày 23/11/2026; scope: MVP local. |
| DEC-008 — **APPROVED** | Quy trình và hủy đơn; ai được đổi trạng thái? | Đơn có state `PENDING -> CONFIRMED -> SHIPPING -> COMPLETED` hoặc `CANCELLED`. Customer chỉ hủy khi `PENDING`; Admin hủy khi `PENDING` hoặc `CONFIRMED`, không hủy khi `SHIPPING`/`COMPLETED`. Chuyển trạng thái atomic và hoàn tồn đúng một lần khi CANCELLED. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: MVP. |
| DEC-009 — **APPROVED** | Tiền tệ, giá, ship, địa chỉ và làm tròn? | Tiền tệ VND, dùng Decimal/số nguyên đồng, phí ship tiêu chuẩn 30.000đ toàn quốc, miễn phí ship 0đ cho tạm tính từ 500.000đ trở lên. Snapshot địa chỉ và line item khi đặt hàng. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: MVP. |
| DEC-010 — **APPROVED** | Scope tài liệu/UI và module P0/P2? | Giữ 20 FR làm baseline truy vết; P0 gồm auth, catalog, cart, COD/checkout, orders, inventory, voucher, admin cơ bản và dashboard. Review/rating và AI vẫn P2. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: MVP. |
| DEC-011 — **APPROVED** | React admin hay Django admin; phân quyền? | Dùng React Admin portal làm UI admin MVP. Server role `ADMIN` được CRUD catalog/inventory/order/voucher/user cơ bản; `CUSTOMER` không truy cập `/admin/*`. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: React admin MVP. |

## Cần chốt trước nghiệm thu module hoặc bật mở rộng

| ID / nguồn | Câu hỏi | Khuyến nghị chờ duyệt | Gate |
|---|---|---|---|
| DEC-012 — **APPROVED** | Doanh thu là giá trị đơn, đã giao hay COD đã thu? Ship/discount/hoàn trả tính thế nào? | “Giá trị hàng đã giao sau giảm” = tạm tính tiền hàng trừ giảm giá, loại phí ship, chỉ đơn COMPLETED theo thời điểm hoàn tất và ngày Asia/Saigon. Top SKU theo số lượng trong các đơn đó. COD đã thu chỉ tính từ xác nhận thu riêng; khi chưa có nguồn này hiển thị “Chưa theo dõi”. | Người duyệt: Nguyễn Quang Huy; ngày 23/11/2026; scope: MVP local. |
| DEC-013 / S06, FR-TRY | Worker/queue/storage nào? Timeout, quota/user, số job song song, model version, ngưỡng chất lượng? | Chọn theo spike và máy có thật, không ép Redis/Celery trước khi cần; một job/GPU làm cấu hình khởi đầu để đo, không cam kết SLA chưa thử | Chủ dự án duyệt hạn mức/budget; Tech Lead triển khai; trước AI integration |
| DEC-014 — **APPROVED** | Palette/font/ảnh/size chart, avatar và dữ liệu địa giới lấy đâu? | Giữ palette/font hiện tại. Địa chỉ nhập tay có validation và snapshot khi đặt đơn. Ảnh và bảng size dùng nguồn theo sản phẩm/hãng có quyền sử dụng; SKU thiếu nguồn thì ẩn bảng hoặc ghi “Chưa có hướng dẫn size”. | Người duyệt: Nguyễn Quang Huy; ngày 23/11/2026; scope: MVP local.  Bổ sung 23/11/2026 (Nguyễn Quang Huy): cho phép dùng nguồn ảnh sản phẩm thể thao công khai/mở cho demo học thuật trên máy cá nhân. |
| DEC-015 — **APPROVED** | Voucher, đổi trả/hoàn tiền, review, order expiry và paid-late? | Voucher P0 hỗ trợ PERCENT có trần giảm tối đa và FIXED; kiểm min_order_value, start_date/end_date, usage_limit; tối đa 1 voucher/đơn. Review P2. Không tự thêm policy đổi trả/hoàn tiền ngoài hủy đơn; paid-late chưa kích hoạt. | Người duyệt: Chủ dự án; ngày 21/11/2026; scope: voucher/checkout MVP. |
| DEC-016 — **APPROVED** | Đổi mật khẩu khác reset thế nào? Email sender, session revoke, verify email có cần? | Đưa QHS-031 sau P0. Khi triển khai đổi mật khẩu, yêu cầu mật khẩu hiện tại, kiểm chính sách mật khẩu và thu hồi phiên cũ. Reset email và xác minh email có phạm vi riêng. | Người duyệt: Nguyễn Quang Huy; ngày 23/11/2026; scope: MVP local. |

## Truy vết approval và phần chờ nghiệm thu

| Quyết định | Các task chịu tác động |
|---|---|
| DEC-002, DEC-009 | QHS-002/014/016/018/024; QHS-032 chỉ khi triển khai gateway |
| DEC-003, DEC-008 | QHS-002/012/014/015/016/017/020/021/024 |
| DEC-004 | QHS-002/003/005/006/007/012/013/023; OAuth QHS-033 theo policy riêng |
| DEC-010, DEC-011 | QHS-002/010/011/015/021/022/024; React admin cho MVP |
| DEC-015 | QHS-016/018/024, QHS-034 phần voucher MVP |
| DEC-012 APPROVED | QHS-022, QHS-023/024 |
| DEC-014 APPROVED | QHS-007/008/009/011 và demo dùng dữ liệu mẫu có nguồn |
| DEC-016 APPROVED | QHS-031 sau P0 |
| DEC-006/007 APPROVED | QHS-025 nghiệm thu trên máy local |
| DEC-001/005/013 OPEN | AI còn ngoài nghiệm thu P0 theo DEC-010; chặn chọn pipeline, ảnh thật, quota và retention |

## Phạm vi được giao sau P0

- Ngày 25/11/2026, chủ dự án giao FR-CHAT-001 cho chat người thật giữa cửa hàng và khách hàng, có WebSocket và lịch sử tạm TTL 24 giờ mặc định. Avatar tải trong hồ sơ là ảnh người dùng chọn để hiển thị trên đánh giá và tin nhắn. Phạm vi dùng một tiến trình ASGI cho bản local.

- Phạm vi bổ sung theo chỉ đạo trực tiếp của chủ dự án ngày 25/11/2026, sau P0. QHS-035.1 cho phép khách chấm sao và viết nhận xét cho sản phẩm đã mua trong đơn hoàn thành. Chủ shop và khách đăng nhập được phản hồi đánh giá hiện có, gồm khách chưa có đơn hoàn thành. QHS-018.1 bổ sung Mua ngay vào luồng thanh toán hiện tại.

## Cách ghi nhận phê duyệt

Mỗi mục ghi lựa chọn cụ thể, người duyệt, ngày duyệt, phạm vi và evidence liên quan. Chủ dự án có thể trả lời theo ID. Ví dụ “DEC-003: chọn giảm tồn khi tạo đơn, một kho” mới là đầu vào phê duyệt; việc báo cáo khuyến nghị phương án đó không phải approval.

Sau khi bạn chốt, cần đồng bộ SRS/BR/UC, schema/API, UI screen priority, workbook Backlog/Decisions/Roadmap và test plan trong một revision có truy vết. Audit này chỉ tạo ba báo cáo, chưa sửa các nguồn đó.
