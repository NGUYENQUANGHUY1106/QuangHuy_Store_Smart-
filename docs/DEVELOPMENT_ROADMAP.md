# DEVELOPMENT ROADMAP — QuangHuy_Sport

Ngày: 16/11/2026. Kế hoạch mục tiêu bốn tuần, không phải lịch đã cam kết hoặc báo cáo thực thi. Chưa xác nhận số người/giờ mỗi tuần/ngày bắt đầu, ngân sách tối đa và môi trường demo (DEC-006/007). Mọi task chưa bắt đầu; chưa có test pass hoặc release evidence.

## Nguồn và cách vận hành

Tuân thủ [AGENTS.md](../AGENTS.md); task/FR/AC/test/dependencies/DoD tại [IMPLEMENTATION_BACKLOG.md](IMPLEMENTATION_BACKLOG.md). Đối chiếu SRS/BR/UC, UIUX DOCX, audit và [OPEN_DECISIONS.md](OPEN_DECISIONS.md). Chưa thấy phê duyệt mới cho 16 DEC; chỉ dẫn hiện tại cho phép chuẩn bị tài liệu, không tự đóng approval nghiệp vụ.

Quy trình task: Backlog → Ready → In Progress → Review → Done, hoặc Blocked khi thiếu quyết định/dependency/môi trường. Ready cần owner và AC/test rõ, quyết định liên quan có evidence. Không bắt đầu code của phần đang bị chặn; có thể tiếp tục nghiên cứu/contract độc lập. Không tuyên bố Done khi mandatory test chưa chạy hoặc lỗi.

## Lịch tương đối và gates

| Giai đoạn | Task/kết quả mục tiêu | Entry gate | Exit gate và evidence |
|---|---|---|---|
| W1 — Baseline, nền tảng và vertical slice | QHS-001…005, QHS-009; khởi QHS-006/010/011 khi dependencies cho phép. Spike QHS-026/027 timebox đầu tuần nếu scope/data/compute được duyệt | Có người chốt decisions; phần phụ thuộc chưa duyệt giữ Blocked. QHS-001 có thể làm ngay để đối chiếu | Contract QHS-002, stack/PG/test environment tái lập; auth/catalog API có evidence. Mỗi hướng AI có kết luận riêng hoặc blocker, không tự nhận go |
| W2 — Catalog/cart/COD | Hoàn QHS-006…014; QHS-015/016; QHS-018 nếu sẵn sàng | Auth/catalog/API contract đạt checks; DEC-002/003/008/009/010/011 chốt phần liên quan | COD API atomic/idempotent và snapshot chạy được; UI cart/checkout dùng API. Test cơ bản và rollback chạy ngay, không trì hoãn correctness đến W3 |
| W3 — Orders/inventory/admin và acceptance | QHS-017…024; QHS-031 nếu chốt P0; QHS-028/029 chỉ sau AI go và đủ nguồn lực | Checkout/core data có evidence; quyết định dashboard/password đầy đủ. Không tích hợp AI thiếu model/license/privacy/compute | TC-001…007 và tests race/ownership bổ sung đạt trên PostgreSQL; E2E P0/admin/dashboard có evidence; vấn đề nghiêm trọng được xử lý |
| W4 — Stabilize và demo | QHS-025; QHS-030 chỉ khi QHS-029 xong và không ảnh hưởng P0. Rerun checks bị ảnh hưởng | Gate P0 đạt; AI integration chỉ nếu quality/privacy/cleanup được kiểm | Release smoke, restore/rollback rehearsal, tài liệu setup/test/known limits, video/demo đúng tính năng thực. Không nhận production-ready |

Đây là mục tiêu phân bổ, không bảo đảm mọi task vừa trong một tuần. Nếu workload vượt năng lực, cập nhật scope/lịch với chủ dự án; không bỏ validation, security, concurrency hoặc test để giữ ngày. W4 không phải chỗ mặc định đưa tất cả P2 vào.

## Dependencies trọng yếu

1. QHS-001 → QHS-002 → QHS-003 → QHS-004: quyết định/contract trước scaffold, DB và CI.
2. QHS-005 + QHS-009 → identity/catalog/cart; QHS-014 trước checkout/inventory service.
3. QHS-016 → QHS-017 (cần thêm QHS-015) → QHS-020 (cần QHS-019) → QHS-021/022 → QHS-023/024 → QHS-025. Đây là đường nghiệp vụ phải bảo vệ; frontend tasks chạy khi API tương ứng sẵn sàng.
4. QHS-026 và QHS-027 là hai nghiên cứu độc lập; cả hai cần kết luận, ít nhất một go trước QHS-028 → QHS-029 → QHS-030. No-go của một hướng không phủ định kết quả hướng kia. Spike hoàn thành không đồng nghĩa FR-TRY hoàn thành.
5. QHS-031 chặn QHS-024 nếu change password được chốt P0. QHS-030 chặn QHS-025 chỉ khi release bật AI; nếu không bật, demo phải nói rõ AI unavailable hoặc trình bày evidence ghi hình được gắn nhãn.
6. QHS-032…038 P2 chưa lên lịch. Mỗi ứng viên cần scope approval và chia task con nhỏ trước Ready; xem các điều kiện bổ sung trong backlog, đặc biệt payment/expiry và review summary.

Không đồng nghĩa các nhánh độc lập phải được làm bởi nhiều agent hoặc nhiều người; thứ tự phụ thuộc hỗ trợ một developer làm tuần tự. Không tự thêm nhân sự vào kế hoạch.

## Quyết định cần đúng thời điểm

| Gate | Quyết định cần chốt | Khi chưa chốt |
|---|---|---|
| Baseline/core contract | DEC-002/003/004/007/008/009/010/011 | Chỉ đối chiếu/soạn contract phần độc lập; không tự chọn COD/stock/auth/cancel/fee/admin scope |
| Dữ liệu/UI | DEC-014; DEC-016 cho change password/reset | Không lấy bảng size/ảnh không có quyền; không giả reset email hoặc bỏ change password âm thầm |
| Dashboard | DEC-012 | Không gọi tổng đơn tạo mới là doanh thu đã thu |
| AI spike/integration | DEC-001/005/013, scope/timebox từ DEC-007 | Chỉ nghiên cứu bằng nguồn công khai/ảnh có quyền; không mở upload thật, không cam kết giày và áo cùng model |
| Demo release | DEC-006/007 và gate theo tính năng bật | Không tự deploy giao dịch production; không giả SLA miễn phí |
| P2 | DEC-015 và provider/budget/policy liên quan | Giữ backlog ngoài lịch, không bỏ validation khi được chọn |

## Kiểm chứng và quản lý lỗi

P0 gate cần kiểm PostgreSQL transaction/connection độc lập, multi-SKU rollback, idempotency sau timeout, cancel đua ship/adjust, IDOR, client total tampering và E2E. SQLite/mock chỉ rõ phạm vi được kiểm, tuyệt đối không dùng làm bằng chứng concurrency PostgreSQL. Unit thuần hàm có thể không cần DB.

AI gate gồm model/license/input/hardware version, quality evaluation trên dữ liệu có quyền, latency/compute đo thực, failure/quota/timeout, owner-only media và xóa khi đang inference/TTL. Mock chỉ kiểm lifecycle, không chứng minh model chạy hoặc chất lượng. Ngưỡng chất lượng/timeout/TTL phải chốt trước nghiệm thu, không chọn sau để hợp thức hóa kết quả.

Mỗi failure ghi Task/FR/AC, expected/actual, cách tái hiện, môi trường, mức ảnh hưởng, owner và bước tiếp. Không âm thầm skip/xfail/xóa test; bắt buộc báo mọi Not Run/Blocked/Skipped và lý do. Mandatory check chưa đạt thì gate chưa đạt. Dữ liệu test/evidence không chứa secret hoặc ảnh cá nhân chưa được phép.

## Kiểm soát thay đổi và bàn giao

Chốt trạng thái ngắn mỗi ngày có làm việc: Done có evidence, In Progress, Blocked và quyết định cần giải quyết. Cuối mỗi tuần đối chiếu P0 AC/dependencies/risks, cập nhật lịch theo năng lực thực. Thay đổi FR/BR/priority phải ghi tác động thời gian/chi phí/test/data/API, người duyệt và ngày; đồng bộ SRS/UC/UI/workbook, không chỉ sửa roadmap.

Khi AI no-go hoặc GPU free unavailable, ưu tiên hoàn tất P0, ghi rõ giới hạn và evidence spike; nếu chủ dự án bắt buộc AI live thì phải chốt giảm scope khác hoặc tăng thời gian/compute. Không thay kết quả bằng ảnh dựng rồi gọi inference thật.

Bàn giao cần setup guide, lệnh test thực tế, DB/schema/migrations, API contract, ma trận quyền, evidence, model/license khi có AI, backup/restore/rollback runbook, known issues và decision log. Chỉ ghi tính năng được kiểm chứng; demo public vẫn phải bảo vệ auth, dữ liệu, kho, media và secrets.
