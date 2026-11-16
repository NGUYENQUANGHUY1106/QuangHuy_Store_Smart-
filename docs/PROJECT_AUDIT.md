# PROJECT AUDIT — QuangHuy_Sport

Ngày đánh giá: 16/11/2026. Trạng thái: **báo cáo phân tích, chờ chủ dự án duyệt phạm vi**.

## 1. Kết luận

Mục tiêu portfolio thương mại điện tử trong một tháng có thể theo đuổi nếu khóa phạm vi vào hành trình COD và tính đúng đắn của đơn/tồn kho. Chưa đủ dữ kiện để cam kết tiến độ: chưa biết số người, giờ/tuần, năng lực hiện tại, GPU và môi trường demo. Không khả thi để mặc định hoàn thành toàn bộ 77 màn hình/trạng thái UI, mọi P2 và hai pipeline AI trong cùng thời hạn.

Tất cả tài liệu SDLC là DRAFT/proposal/template; workbook ghi Not Started/Not Run/Not executed. Đây là trạng thái trong tài liệu, không phải kết quả kiểm tra mã ứng dụng. Không có bằng chứng phê duyệt baseline, chạy inference, kiểm thử hoặc release trong bộ hồ sơ đã đọc.

Chỉ dẫn trực tiếp của chủ dự án xác định website bán đồ thể thao/giày bóng đá, định hướng ReactJS + TypeScript + DRF + PostgreSQL, thời gian mục tiêu một tháng, ưu tiên miễn phí, mục đích portfolio. Điều này làm rõ A-002 ở mức **định hướng**, chưa quyết định session/JWT, hosting hay thư viện UI. Mọi lựa chọn khác bên dưới vẫn là đề xuất; xem [OPEN_DECISIONS.md](OPEN_DECISIONS.md).

## 2. Kiểm kê và phương pháp đọc

Có **29 file ban đầu**: 12 Markdown, 13 DOCX nội dung, 2 file khóa Office `~$*.docx`, 1 XLSX, 1 TXT. Đã đọc toàn bộ Markdown, nội dung đoạn văn/bảng trong 13 DOCX và cả 8 sheet XLSX; file khóa chỉ được thống kê, không coi là tài liệu nghiệp vụ. Không render DOCX để kiểm tra bố cục/hình nhúng.

Các cặp MD/DOCX được đối chiếu nội dung văn bản sau khi bỏ định dạng/dấu phân cách. Không phát hiện đoạn văn nghiệp vụ DOCX nằm ngoài MD ở 12 cặp; khác biệt là metadata/header và câu cảnh báo DRAFT. Đây không phải so sánh bố cục hoặc xác nhận mọi ảnh nhúng giống nhau.

| Mã nguồn | Đường dẫn tương đối từ docs/ | Định dạng và kết quả |
|---|---|---|
| S00 | `00_Guide/README_SDLC` | .md + .docx; governance, change control, thứ tự SDLC |
| S01 | `01_Discovery/01_Project_Brief` | .md + .docx; mục tiêu, phạm vi, A-001…012, RK-01…08 |
| S02 | `01_Discovery/02_Risks_Assumptions` | .md + .docx; lặp risk/assumption register |
| S03 | `02_Requirements/01_SRS` | .md + .docx; 5 actor, 10 module, 20 FR, 7 NFR |
| S04 | `02_Requirements/02_Use_Cases_User_Stories` | .md + .docx; 10 UC khung + 2 UC có flow, 10 story khung |
| S05 | `02_Requirements/03_Business_Rules_Acceptance` | .md + .docx; 10 BR, AC lặp từ SRS, 2 Given/When/Then |
| S06 | `03_Design/01_System_Architecture` | .md + .docx; kiến trúc đề xuất, trust boundaries |
| S07 | `03_Design/02_Data_API_UI_Spec` | .md + .docx; 13 entity, API/screen catalog sơ bộ |
| S08 | `03_Design/QuangHuy_Sport_UIUX_Figma_Master_Spec.docx` | DOCX độc lập QHS-UX-001, v1.0 Draft; 77 screen/state, 8 flow, UX-A01…08 |
| S09 | `04_Development/01_Implementation_Plan` | .md + .docx; roadmap W1–W4, DoR/DoD |
| S10 | `05_Testing/01_Test_Plan` | .md + .docx; TC-001…010, chưa thực thi |
| S11 | `06_Deployment/01_Deployment_Release_Plan` | .md + .docx; demo/release/rollback checklist |
| S12 | `07_Maintenance/01_Maintenance_Handover_Plan` | .md + .docx; vận hành, bàn giao, incident severity |
| S13 | `QuangHuy_Sport_Management.xlsx` | Overview, Modules, Backlog, Risks, Assumptions, Roadmap, Test Cases, Decisions |
| S14 | `00_Guide/FILE_MANIFEST.txt` | 26 mục; thiếu S08 và 2 file khóa so với thư mục thực tế; không phải nguồn yêu cầu |
| L01 | `01_Discovery/~$_Project_Brief.docx` | File khóa Office, không phân tích nghiệp vụ |
| L02 | `02_Requirements/~$01_SRS.docx` | File khóa Office, không phân tích nghiệp vụ |

S08 có 42 C-screen, 30 A-screen, 5 S-state; một số là modal/overlay. Không có bằng chứng Figma đã dựng hoặc UI đã được duyệt. Không cần thao tác Figma để audit DOCX này.

## 3. Actors và ranh giới hệ thống

| Actor nguồn S03 | Quyền/mục tiêu | Điểm chưa chốt |
|---|---|---|
| GUEST | Xem catalog, tìm kiếm, chi tiết | Giỏ guest có hỗ trợ không; hiện UC checkout yêu cầu đăng nhập |
| CUSTOMER | Tài khoản, địa chỉ, giỏ, COD, xem/hủy đơn của mình; AI khi triển khai | Điều kiện hủy, quyền tạo/xóa job, reset mật khẩu |
| STAFF | Sản phẩm, kho, xử lý đơn theo quyền | Ma trận quyền cụ thể và giới hạn dữ liệu khách |
| ADMIN | Phân quyền, thống kê | Phân quyền là actor capability nhưng UI Users đang lệch P1/P2; không mặc định mọi staff là admin |
| AI-INFERENCE | Xử lý inference có consent | Là service, chỉ là actor ngoài hệ thống nếu triển khai ngoài boundary backend |

Payment provider/OAuth provider là actor tích hợp P2 suy ra từ FR-PAY/OAUTH, chưa có provider được chọn. Worker cleanup/email/scheduler là thành phần nội bộ, không tự thêm thành vai trò người dùng. Đơn vị vận chuyển chưa có tích hợp được đặc tả.

## 4. Modules và toàn bộ Functional Requirements

Ưu tiên dưới đây là **nhãn trong S03**, không phải phê duyệt mới. Có 11 FR P0, 2 FR P1, 7 FR P2, khớp Overview/Backlog S13.

| Module | FR và chức năng | Ưu tiên nguồn |
|---|---|---|
| M01 Authentication & User | FR-AUTH-001 đăng ký/email login, rate limit, mật khẩu; FR-USER-001 hồ sơ/nhiều địa chỉ, chỉ chủ sở hữu | P0 |
| M02 Catalog & Variants | FR-CAT-001 danh sách/chi tiết, SKU/size/màu/giá/tồn theo biến thể | P0 |
| M03 Search & Discovery | FR-SRCH-001 search/filter/sort/pagination, không lộ sản phẩm ẩn | P0 |
| M04 Cart & Checkout | FR-CART-001 thêm/sửa/xóa SKU, số lượng hợp lệ; FR-CHK-001 COD, snapshot, server tính tổng | P0 |
| M05 Orders & Inventory | FR-ORD-001 tạo đơn một lần, lịch sử; FR-INV-001 chống oversell; FR-INV-002 hoàn tồn đúng một lần | P0 |
| M06 Admin & Reporting | FR-ADM-001 quản lý sản phẩm/biến thể/đơn, quyền và log; FR-DASH-001 doanh thu/đơn/top sản phẩm | P0 |
| M07 AI Virtual Try-On | FR-TRY-001 ảnh người + sản phẩm, consent, kết quả/lỗi; FR-TRY-002 retention/xóa | P1 |
| M08 OAuth & Payment | FR-PAY-001 một gateway sandbox, webhook xác thực/idempotent; FR-OAUTH-001 Google/Facebook, liên kết email an toàn | P2 |
| M09 Promotions & Reviews | FR-VOU-001 voucher có điều kiện; FR-REV-001 đánh giá sau mua đủ điều kiện | P2 |
| M10 Async & AI Assistant | FR-BG-001 email retry/idempotency; FR-BG-002 tự hủy quá hạn, không hủy đã trả tiền; FR-AI-001 chatbot hoặc summary không bịa catalog | P2 |

NFR nguồn: NFR-SEC-001 authorization/server authority; SEC-002 CSRF/CORS/session/token; PRIV-001 consent/retention/private media; PERF-001 đo sau khi chọn hạ tầng; REL-001 transaction/idempotency; OBS-001 log không lộ dữ liệu nhạy cảm; UX-001 responsive và accessibility. Chưa có SLA định lượng được duyệt.

## 5. Business Rules và Use Cases

| BR nguồn S05 | Nội dung | Đánh giá |
|---|---|---|
| BR-001 | SKU duy nhất; server quyết định giá/tồn | Cần unique/constraint và quy tắc size/màu |
| BR-002 | Giỏ không giữ hàng; checkpoint checkout giữ/trừ tồn | Chưa chọn reserve hay deduct |
| BR-003 | Đơn/tồn atomic; không double deduction/refund | Cần transaction, khóa, idempotency cả cancel/adjust |
| BR-004 | Review chỉ sau mua đủ điều kiện | Chưa định nghĩa giao thành công/giới hạn số lần |
| BR-005 | Chỉ staff đổi trạng thái theo state machine | Xung đột customer cancel C36 nếu hiểu tuyệt đối |
| BR-006 | Webhook xác thực/idempotent | Chưa có provider/contract |
| BR-007 | Consent/retention/xóa; không tự dùng ảnh train | Chưa có TTL/processor/policy cụ thể |
| BR-008 | AI không bảo đảm vừa size từ ảnh | Phải giữ ngay cả demo |
| BR-009 | Giá/discount/ship/tổng ở server | Chưa có tiền tệ/làm tròn/công thức |
| BR-010 | Không lộ dữ liệu khách trái quyền | Cần ownership tại query/object và media |

S04 có UC-M01-01…UC-M10-01, mỗi module một dòng “luồng khởi tạo/xem”: đây là danh mục khung, chưa phải 10 use case hoàn chỉnh. US-M01-01…US-M10-01 cũng gộp nhiều mục tiêu trong cùng story và không có actor cụ thể.

Hai UC có mô tả thực tế: **UC-CHK-01** yêu cầu xác thực, giỏ/địa chỉ hợp lệ → backend tính lại, transaction tạo snapshot/đơn/tồn → một đơn cho cùng key; alternative gồm đổi giá, voucher lỗi, hết tồn, retry và transaction lỗi. **UC-TRY-01** yêu cầu consent, model hỗ trợ và ảnh hợp lệ → upload/chọn sản phẩm/job/inference/kết quả/xóa; alternative gồm file lỗi, quota/GPU, model fail, loại hàng không hỗ trợ. Cả hai vẫn thiếu response contract và tiêu chí phục hồi cụ thể.

Các flow S08 bổ sung mục tiêu: FLOW-01 mua COD; 02 auth; 03 hủy đơn; 04 try-on; 05 admin tạo sản phẩm; 06 nhập kho; 07 xử lý đơn; 08 payment extension. Đề xuất dùng flow này để hoàn thiện UC hiện có, không tạo ID đã phê duyệt mới. Coverage thiếu được nêu tại [REQUIREMENTS_GAP_ANALYSIS.md](REQUIREMENTS_GAP_ANALYSIS.md).

## 6. Phạm vi một tháng đề xuất và demo/production

| Mức | Phạm vi đề xuất chờ duyệt | Tính chất demo và giới hạn |
|---|---|---|
| P0 | Giữ 11 FR P0; email auth/profile/address; catalog/variant; search/filter cơ bản; cart; COD; orders/stock/admin/dashboard cơ bản; security, accessibility, tests liên quan | COD tạo đơn thật trong DB mẫu; không hàm ý có giao hàng/thu tiền thực. Không giả thành công checkout |
| P1 | Hai FR-TRY sau spike; chỉ **một loại sản phẩm** đủ bằng chứng. UI P1 như report riêng/user management/support xét sau core | Model thật trên tập input công bố giới hạn; nếu chưa chạy được thì disabled/lỗi minh bạch hoặc video kết quả đã ghi có provenance, không coi là live inference |
| P2 | 7 FR P2; wishlist/banner/notification/quick view và tính năng UI ngoài baseline | Sandbox khác production; không đưa cả backlog W4 thành cam kết |

Đề xuất bỏ voucher khỏi P0, ẩn rating/filter rating khi chưa có review; search suggestions, size guide, gallery và stock movement P0 phải được chốt rõ vì có trong UI. Không tự hạ các màn P0 này thành P2. C39 đổi mật khẩu P1 mâu thuẫn module M01 P0; A18/A19 report riêng P1 có thể cùng tồn tại dashboard cơ bản P0 nếu định nghĩa rõ.

Demo public vẫn bắt buộc authorization, password hashing, chống âm kho, HTTPS, private media và xử lý lỗi. “Portfolio” không miễn trừ bảo mật. Production cần thêm bằng chứng vận hành, restore backup, đối soát COD/payment, giao vận, đổi trả/hoàn tiền, hỗ trợ khách, chính sách dữ liệu và ngân sách ổn định; không coi các hạng mục này là scope một tháng đã được duyệt.

## 7. Kiến trúc và tính khả thi AI

Đề xuất modular monolith DRF/PostgreSQL và React/TypeScript; transaction của order/inventory chung DB. Không cần tách microservice từng module. Dùng cơ chế admin sẵn có hay tự xây React admin là quyết định phạm vi lớn; nếu chọn Django admin thì phải duyệt lại mức đáp ứng giao diện S08. Redis/Celery không cần cho COD lõi; AI dài hạn cần worker/job có giới hạn, timeout và cleanup đáng tin cậy. “Queue riêng” trong S06 nhưng Celery optional nghĩa là chưa có giải pháp vận hành cụ thể.

### Bằng chứng công khai được kiểm tra ngày 16/11/2026

| Hướng | Bằng chứng và yêu cầu đầu vào | Nhận định cho dự án |
|---|---|---|
| Quần áo — CatVTON | Model card chính thức mô tả inference dưới 8 GB VRAM ở 1024×768 và license CC BY-NC-SA 4.0; cần ảnh người, ảnh trang phục và preprocessing/mask theo pipeline | Ứng viên spike, không phải bảo đảm VRAM toàn hệ thống hoặc chất lượng áo thể thao/logo. Không suy ra hỗ trợ giày. [Model card](https://huggingface.co/zhengchong/CatVTON) |
| Quần áo — IDM-VTON | Repository chính thức cung cấp inference và code/checkpoint CC BY-NC-SA 4.0; có các thành phần preprocessing bổ sung | Ứng viên so sánh chất lượng/trải nghiệm setup, chưa đo compute trong dự án. Không chọn chỉ vì có demo online. [Repository](https://github.com/yisol/IDM-VTON) |
| Giày — ARShoe | Nghiên cứu chuyên biệt dùng pose/segmentation bàn chân, mô hình giày 3D, occlusion và stabilization | Chứng minh giày là bài toán riêng; không chứng minh có checkpoint/API miễn phí dùng được hoặc hỗ trợ giày bóng đá của shop. [Bài nghiên cứu](https://arxiv.org/abs/2108.10515) |
| GPU miễn phí | Colab không bảo đảm tài nguyên; có hạn chế free runtime với cách dùng chủ yếu qua web UI thay notebook | Có thể xem xét cho thử nghiệm tương tác đúng điều khoản; không thiết kế backend public luôn bật dựa vào Colab free. [FAQ chính thức](https://research.google.com/colaboratory/faq.html) |

Các nhận định khả thi là suy luận từ nguồn, **chưa chạy thử model**. Giấy phép non-commercial không được tự hiểu là cho phép mọi cách xuất bản portfolio; phải rà riêng code, weights, base model, preprocessing, dữ liệu và quyền ảnh trước khi chọn. Production thương mại cần mô hình/giấy phép phù hợp được xác minh lại.

Giày bóng đá khó ở vùng chân nhỏ, góc nghiêng, che khuất, đôi trái/phải, đinh/đế, dây và logo; ảnh catalog một góc chưa đủ cho pipeline 3D. Nếu dùng image generation cho giày phải tìm model/checkpoint cụ thể và kiểm tra giữ đúng SKU; không đổi nhãn một overlay 2D thành AI try-on. Quần áo có sẵn ứng viên dễ spike hơn nhưng chữ/logo, màu, sọc, dáng người vẫn có thể sai. Cả hai chỉ minh họa ngoại hình, không đo độ vừa, size hay hiệu năng thi đấu.

### Spike đề xuất, chưa phê duyệt

Giới hạn 2–3 ngày đầu W1, thử giày và áo độc lập; mỗi hướng ghi model/version/license, nguồn ảnh, input spec, cách setup, GPU/VRAM, thời gian cold/warm, lỗi và output. Đề xuất ít nhất 10 cặp ảnh mỗi loại (đa dạng góc, ánh sáng, che khuất); chủ dự án duyệt tiêu chí trước khi chấm. Ngưỡng khởi điểm đề xuất: ít nhất 8/10 ảnh hợp lệ được người review chấp nhận về đúng loại/màu/chi tiết sản phẩm và không biến dạng nặng; ghi cả ảnh thất bại, không chỉ chọn ảnh đẹp. Timeout/latency mục tiêu chỉ chốt sau phép đo trên máy thật.

Go khi có model/license/compute khả dụng, dữ liệu hợp lệ, chất lượng được duyệt và quy trình private upload/delete hoạt động. No-go cho từng hướng nếu thiếu một điều kiện; chọn một hướng đạt, hoặc công bố AI chưa khả dụng. Nếu bắt buộc thử giày dù spike thất bại, cần giảm scope khác hoặc tăng thời gian/ngân sách bằng quyết định của chủ dự án.

## 8. Roadmap và điều kiện hoàn thành đề xuất

| Tuần tương đối, không phải ngày cam kết | Kết quả/gate |
|---|---|
| W1 | Chốt các quyết định blocker; spike AI; schema/order rules/permission; auth + catalog dọc chạy được |
| W2 | Catalog/cart/COD/admin lõi; đưa transaction/idempotency/chống âm kho vào ngay checkout, không đợi W3 mới thiết kế |
| W3 | Kiểm thử cạnh tranh/rollback/cancel/ownership; dashboard; tích hợp một hướng AI đã qua gate |
| W4 | QA, responsive, security, release/restore rehearsal, tài liệu và video demo; không tự kéo toàn bộ P2 vào tuần này |

Gate P0: evidence TC-001…007 trên PostgreSQL, end-to-end COD + admin, các test thiếu trong gap analysis, không có lỗi nghiêm trọng chưa xử lý. Gate AI: TC-008/009 + quality evidence + kiểm tra xóa/private access; TC-010 chỉ khi bật sandbox payment. Mọi kết quả hiện tại đều **chưa chạy**.

Đọc tiếp: [quyết định cần duyệt](OPEN_DECISIONS.md), [chi tiết thiếu sót và tiêu chí bổ sung](REQUIREMENTS_GAP_ANALYSIS.md).
