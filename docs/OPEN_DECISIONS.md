# OPEN DECISIONS — QuangHuy_Sport

Ngày: 16/11/2026. **Tất cả quyết định bên dưới đang OPEN — chờ chủ dự án xác nhận.** Không có quyết định đã approved do audit này tạo ra. Đề xuất kỹ thuật không thay thế phê duyệt nghiệp vụ.

Chỉ dẫn hiện tại xác nhận mục tiêu portfolio, một tháng, ưu tiên miễn phí và định hướng ReactJS/TypeScript/DRF/PostgreSQL. A-002 được làm rõ ở mức định hướng; A-001, A-003…012 và UX-A01…08 chưa tự đóng. Các mã DEC-001…006 giữ liên kết với sheet Decisions; mã mới chỉ là mục theo dõi đề xuất.

## Cần chốt trước baseline/checkout/AI

| ID / nguồn | Câu hỏi cần quyết định | Khuyến nghị chờ duyệt | Người quyết định; thời điểm / tác động nếu để mở |
|---|---|---|---|
| DEC-001 / A-005,006,007,008; UX-A02 | Ưu tiên thử giày hay áo? Có bắt buộc AI live trong demo? Máy/GPU nào, ảnh có quyền ở đâu? | Spike riêng 2–3 ngày W1; tích hợp một hướng đạt gate. Nếu chưa có bằng chứng cho giày, không quảng cáo thử giày hoạt động | Chủ dự án duyệt mục tiêu; Tech Lead đưa evidence; W1. Chặn cam kết FR-TRY |
| DEC-002 / A-003,004; UX-A04 | COD là phương thức P0? Có giao dịch thật không; cổng sandbox nào nếu làm P2? | Demo dữ liệu mẫu/COD, không thu tiền/giao hàng thực; một provider sandbox sau P0, không tự chọn VNPay/MoMo/Stripe | Chủ dự án; trước khóa scope. Chặn semantics payment và nội dung demo |
| DEC-003 / BR-002,003; A08/A09 | Trừ/giữ hàng lúc tạo đơn hay xác nhận? Một kho? Đơn pending giữ vô hạn? | P0 một kho, giảm lượng bán được trong transaction tạo đơn; không trừ lại khi confirm/ship; cancel hợp lệ trả đúng một lần. Chưa dùng reservation TTL nếu chưa duyệt thêm quy tắc | Chủ dự án duyệt rule, Tech Lead chốt thiết kế; trước schema/checkout. Chọn lúc confirm phải có reserve sớm hoặc cơ chế chống oversell tương đương |
| DEC-004 / A-002; S06; UX-A05 | Session hay JWT, cùng origin hay cross-site? OAuth/guest cart cần V1? | Email login, checkout authenticated; ưu tiên session cookie HttpOnly/Secure nếu frontend/API cùng site; CSRF theo kiến trúc, OAuth P2 | Chủ dự án duyệt phạm vi, Tech Lead chọn cơ chế có lý do; W1. Chặn auth/API/deploy |
| DEC-005 / A-010; UX-A03,08; BR-007 | Ai được upload/xem ảnh? TTL, xóa ngay, bên xử lý ngoài và backup? | Chỉ user đăng nhập; private media; TTL đề xuất 24 giờ, xóa theo yêu cầu, không train; ảnh mẫu có quyền cho spike. TTL/SLA xóa cần bạn duyệt, không phải policy đã ban hành | Chủ dự án; trước nhận ảnh thật. Chặn public upload và chọn provider |
| DEC-006 / A-009 | Demo local, video hay website public? Có phục vụ khách thật không? | Demo/portfolio với nhãn rõ; chỉ public khi HTTPS, secrets, ownership, cleanup và resource limit được kiểm tra | Chủ dự án; W1 để chọn hạ tầng. Chưa phê duyệt production |
| DEC-007 / A-001,011 | Bao nhiêu người, giờ/tuần, ngày bắt đầu/kết thúc và mức chi tối đa? | Xác nhận năng lực trước ước lượng; khóa P0, P1 theo gate, P2 ngoài cam kết. Miễn phí là ưu tiên, chưa phải ngân sách cứng 0 đồng | Chủ dự án; trước baseline. Không đủ dữ liệu để cam kết một tháng |
| DEC-008 / BR-005; C36/A11/A12 | Customer được hủy ở trạng thái nào? Ai có quyền confirm/pack/ship/deliver/cancel? | Đề xuất pending→confirmed→packing→shipping→delivered; pending/confirmed→canceled; customer chỉ tự hủy pending, staff hủy trước shipping theo quyền; terminal không mở lại | Chủ dự án duyệt, Tech Lead đặc tả chuyển trạng thái atomic; trước orders. Chưa có policy đổi trả/đơn giao thất bại |
| DEC-009 / A-012; UX-A06 | Tiền tệ, giá/ship, khu vực giao, địa chỉ, thuế và làm tròn? | Đề xuất VND số nguyên, phí ship demo cố định do bạn chọn, không voucher P0; snapshot người nhận/địa chỉ/phí; không tự gán mức phí hay thuế | Chủ dự án; trước checkout. Chặn công thức tổng và AC |
| DEC-010 / S03/S08/S13 | Nguồn ưu tiên khi tài liệu lệch? Voucher, rating, đổi mật khẩu, users/reports là mức nào? | Duyệt 20 FR làm baseline truy vết; bỏ voucher/rating khỏi P0; xác nhận change password, gallery/size guide/suggestions, nhập kho. Dashboard cơ bản P0; reports riêng/users quản trị sau core | Chủ dự án; W1. Không coi nhãn UI hoặc backlog W4 là approval |
| DEC-011 / S08 A01…A30 | Làm React admin riêng hay dùng Django admin? STAFF và ADMIN tách quyền thế nào? | Tận dụng admin sẵn có cho CRUD nếu đáp ứng demo; duyệt lại UI nếu chọn. Lập ma trận xem/sửa sản phẩm, adjust stock, chuyển đơn, users, ảnh AI, logs | Chủ dự án duyệt trải nghiệm, Tech Lead quyền; W1. Admin tùy biến toàn bộ làm tăng đáng kể scope |

## Cần chốt trước nghiệm thu module hoặc bật mở rộng

| ID / nguồn | Câu hỏi | Khuyến nghị chờ duyệt | Gate |
|---|---|---|---|
| DEC-012 / FR-DASH-001, A02/A18/A19 | Doanh thu là giá trị đơn, đã giao hay COD đã thu? Ship/discount/hoàn trả tính thế nào? | Tách giá trị đơn đã giao khỏi tiền đã thu; demo có thể dùng giá trị hàng sau giảm của delivered, không ship, gắn nhãn rõ; không dùng created orders như doanh thu | Chủ dự án; trước dashboard AC |
| DEC-013 / S06, FR-TRY | Worker/queue/storage nào? Timeout, quota/user, số job song song, model version, ngưỡng chất lượng? | Chọn theo spike và máy có thật, không ép Redis/Celery trước khi cần; một job/GPU làm cấu hình khởi đầu để đo, không cam kết SLA chưa thử | Chủ dự án duyệt hạn mức/budget; Tech Lead triển khai; trước AI integration |
| DEC-014 / UX-A01, C08/C30/C32 | Palette/font/ảnh/size chart, avatar và dữ liệu địa giới lấy đâu? | Dùng asset có quyền, bảng size theo sản phẩm/brand có nguồn, dữ liệu địa chỉ được chọn rõ. Palette S08 chỉ là proposal | Chủ dự án; trước duyệt UI và seed data |
| DEC-015 / UX-A07; FR-REV/VOU/BG | Đổi trả/hoàn tiền, review, voucher, order expiry và xử lý paid-late? | Giữ P2 ngoài bản một tháng; nếu bật phải duyệt eligibility, hạn mức/concurrency, payment state và quy tắc đối soát trước | Chủ dự án; trước kích hoạt P2; không hứa hỗ trợ quy trình thực chưa có |
| DEC-016 / M01, C15/C17/C39 | Đổi mật khẩu khác reset thế nào? Email sender, session revoke, verify email có cần? | Đặc tả đổi mật khẩu xác thực hiện tại; reset một lần/hết hạn nếu thêm; không trả link reset nhạy cảm trong API public để tránh chi phí mail | Chủ dự án duyệt phạm vi; Tech Lead bảo mật; trước auth acceptance |

## Cách ghi nhận phê duyệt

Mỗi mục ghi lựa chọn cụ thể, người duyệt, ngày duyệt, phạm vi và evidence liên quan. Chủ dự án có thể trả lời theo ID. Ví dụ “DEC-003: chọn giảm tồn khi tạo đơn, một kho” mới là đầu vào phê duyệt; việc báo cáo khuyến nghị phương án đó không phải approval.

Sau khi bạn chốt, cần đồng bộ SRS/BR/UC, schema/API, UI screen priority, workbook Backlog/Decisions/Roadmap và test plan trong một revision có truy vết. Audit này chỉ tạo ba báo cáo, chưa sửa các nguồn đó.
