# Quy trình phát triển QuangHuy_Sport

Áp dụng cho toàn repository. Ngày lập: 16/11/2026. Đây là quy tắc làm việc cho developer/AI agent; không phê duyệt thay các quyết định nghiệp vụ còn OPEN. Chủ dự án đã cho phép triển khai Project Foundation (QHS-003/004); các chức năng kinh doanh khác chỉ thực hiện khi được giao và đủ dependencies.

## Đọc và xác định phạm vi trước khi sửa

Đọc `docs/00_Guide/README_SDLC.md`, SRS/Use Cases/Business Rules trong `docs/02_Requirements/`, thiết kế liên quan trong `docs/03_Design/`, rồi `docs/PROJECT_AUDIT.md`, `docs/REQUIREMENTS_GAP_ANALYSIS.md`, `docs/OPEN_DECISIONS.md`, `docs/IMPLEMENTATION_BACKLOG.md` và `docs/DEVELOPMENT_ROADMAP.md`.

- Ưu tiên chỉ dẫn trực tiếp hiện tại của chủ dự án và quyết định được ghi có người duyệt/ngày/phạm vi. Không coi khuyến nghị audit, screen UI, nhãn P0 hay lịch W4 là approval nghiệp vụ.
- Nếu tài liệu mâu thuẫn ảnh hưởng tiền, kho, quyền, dữ liệu hoặc scope, ghi issue/decision và chặn phần phụ thuộc; tiếp tục phần độc lập. Không tự chọn chính sách hủy, TTL, phí ship, gateway hoặc model AI.
- Mỗi task/PR phải có Task ID, Requirement ID gốc, BR/UC/NFR liên quan, AC có thể kiểm chứng, phạm vi file/module, test cases, dependencies và DoD. ID AC cục bộ dùng `<Task-ID>-AC1`; không đổi nghĩa FR đã tồn tại.
- Yêu cầu mới chưa có FR phải đánh dấu đề xuất và được chốt trước development. Chia task để một PR có một hành vi kiểm chứng được; nếu quá lớn, tách `.1`, `.2` với đầy đủ trường như task gốc.
- Trước bug fix, tìm mọi caller bằng `rg`, đọc luồng liên quan, sửa nguyên nhân chung. Kiểm tra tác động tới API consumers, migration, fixtures, tests và tài liệu.

## Cấu trúc dự kiến và tên file

Foundation đã có mã khởi tạo. Giữ cấu trúc này khi implementation; chỉ tạo thư mục khi cần, không dựng toàn bộ module P2 trước.

```text
frontend/
  src/app/                 # routing, providers, cấu hình UI
  src/features/<domain>/   # components, API calls, types, tests theo chức năng
  src/components/          # component thực sự dùng chung
  src/lib/                 # tiện ích dùng chung đã có nhu cầu
backend/
  config/                  # Django settings, root urls, ASGI/WSGI
  apps/<domain>/           # models, serializers, permissions, views, urls, migrations, tests
docs/                     # SDLC, quyết định, backlog, roadmap, evidence
```

Domain khởi đầu: identity, catalog, cart, inventory, orders, analytics; ai_tryon/payments/promotions/reviews/notifications chỉ khi vào scope. Dùng modular monolith DRF/PostgreSQL; không tự tách microservice. `services.py` cho transaction nghiệp vụ nhiều bước khi cần; không thêm repository/interface/wrapper cho mỗi model.

React component và file component dùng `PascalCase.tsx`; hook dùng `useCamelCase.ts`; utility/API/types dùng `camelCase.ts`; test frontend cùng feature dùng `.test.ts(x)`. Python file/module dùng `snake_case.py`, class `PascalCase`, hàm/biến `snake_case`, hằng `UPPER_SNAKE_CASE`; test backend `test_<behavior>.py`. Migration do Django sinh, tên mô tả thay đổi. Table/column do ORM quản lý, giữ snake_case; không tự trộn schema naming không cần thiết.

## React và TypeScript

- Function component, hook đúng quy tắc; TypeScript strict. Tránh `any`, type assertion để che lỗi; validate dữ liệu ngoài runtime trước khi tin dùng.
- Giữ state tối thiểu, không sao chép derived state; effect chỉ để đồng bộ với hệ thống ngoài, hủy/loại response lỗi thời khi cần. Không tự thêm state library/dependency nếu giải pháp hiện có đủ dùng.
- Tách UI khỏi gọi API trong cùng feature khi giúp tái sử dụng/test; không tạo tầng trừu tượng cho mọi thao tác.
- Form có label, lỗi rõ, keyboard/focus; có loading/empty/error và responsive. Disable submit khi đang gửi chỉ hỗ trợ UX, không thay idempotency phía server.
- Không hardcode secret, giá thanh toán, tồn kho hoặc quyền admin ở frontend. Frontend chỉ hiển thị dữ liệu server và gửi lựa chọn SKU/qty; không quyết định giá cuối, paid, quyền hay stock. UI ẩn nút không thay authorization. Fixture mẫu phải tách khỏi runtime, có nhãn sample và không dùng fallback thành giao dịch thành công.
- Không đưa token/ảnh cá nhân vào log, URL hoặc persistent browser storage tùy tiện. Cookie/token/CSRF theo DEC-004 đã chốt; biến môi trường frontend được coi là public, không chứa secret.

## Django REST Framework

- Dùng Django password hashing/auth/validation, DRF serializers và permissions. Explicit allowlist trường ghi; không cho client sửa role, paid, stock hoặc snapshot qua mass assignment.
- Validate ở trust boundary; object ownership áp dụng cả queryset/list và detail/mutation. Mặc định từ chối nếu chưa có quyền; không dựa vào user ID/role do frontend gửi.
- Giao dịch order/inventory atomic, lock hoặc conditional update theo thiết kế được duyệt. Side effect ngoài DB chỉ sau commit và có retry/idempotency nếu cần; không giả định DB transaction rollback được email/inference/provider.
- Dùng Decimal hoặc đơn vị tiền nguyên theo DEC-009; không float cho tiền. Server tính lại giá/ship/discount/tổng từ nguồn tin cậy; snapshot không đổi theo catalog/địa chỉ mới.
- Upload kiểm kiểu thực, bytes/pixels, file hỏng, path/filename; private media cho ảnh người dùng, kiểm ownership, TTL và cleanup cả khi thất bại. Không tự dùng ảnh train; không gửi sang bên thứ ba chưa được duyệt.
- Error có kiểm soát, không trả stack trace/secret; log có ID đối soát và che dữ liệu nhạy cảm. DEBUG off cho public demo; secret ở môi trường, `.env` không commit, `.env.example` chỉ placeholder.

## PostgreSQL và migration

- PostgreSQL là DB mục tiêu. **Cấm dùng SQLite thay PostgreSQL trong kiểm thử concurrency**; không dùng mock/tuần tự để tuyên bố chứng minh row lock hoặc chống oversell. Unit thuần hàm không cần DB; test ORM/integration dùng PostgreSQL để tránh khác semantics.
- Unique SKU/email/key theo domain được duyệt; foreign key/check constraint cho invariant phù hợp; index theo query thực tế. Giá và số lượng không âm theo rule; qty mua phải nguyên dương. Không chỉ validate ở UI.
- Lock nhiều SKU theo thứ tự ổn định, bảo toàn all-or-nothing, chống double deduction/return. Kiểm thử bằng connection/transaction độc lập và điểm đồng bộ tạo tranh chấp thật.
- Migration version control; đọc SQL/tác động khóa và dữ liệu trước chạy. Không xóa DB/migration/history hoặc chạy reset dữ liệu thật để chữa test. Migration phá dữ liệu cần kế hoạch chuyển đổi/backup/rollback và quyết định cụ thể.

## API conventions

- Baseline tài liệu đang dùng `/products`, `/checkout/orders`, `/tryon/jobs`…; không tự thêm prefix/version hoặc đổi route đã có consumer. Nếu cần `/api/v1`, ghi quyết định và cập nhật contract/caller/test đồng bộ trước triển khai.
- URL danh từ số nhiều, lowercase; path nhiều từ dùng kebab-case, JSON dùng snake_case nhất quán với DRF; frontend mapping chỉ ở boundary khi cần. GET không thay dữ liệu; POST tạo/action có side effect; PATCH sửa một phần; DELETE theo semantics đã đặc tả.
- Status: 200 đọc/cập nhật, 201 tạo, 202 job được nhận, 204 xóa không body, 400 validation, 401/403 theo auth thực tế DRF, 404 không tồn tại/không được lộ, 409 conflict nghiệp vụ, 429 rate limit. Contract phải nói rõ response của từng endpoint.
- Mô tả query filter/sort/pagination, trường bắt buộc, số tiền/đơn vị, timezone, enum và lỗi trong spec. Timestamp ISO-8601 có offset, lưu UTC và hiển thị Asia/Saigon. Dùng pagination DRF nhất quán; không tự viết cơ chế mới.
- Checkout contract phải có idempotency key, scope theo user/operation, hành vi payload trùng/khác và retry. Server xác thực webhook theo provider, kiểm amount/currency/order và xử lý duplicate; redirect client không chứng minh thanh toán.
- Quyền và tổng tiền/tồn không được thay đổi chỉ để UI khớp mockup. Không hardcode secret/payment price/stock/admin ở cả demo runtime; dữ liệu seed thuộc backend và phải có nhãn mẫu.

## Test và bằng chứng bắt buộc

- Mỗi task có test/check phù hợp AC: logic dùng unit, ORM/API dùng integration, flow chính dùng E2E, transaction dùng concurrency PostgreSQL, UI dùng interaction/accessibility check; tài liệu dùng kiểm tra ID/link/dependency/đối chiếu nguồn. Không bắt viết test không có giá trị chỉ để tăng coverage.
- Bug fix cần regression tái hiện lỗi trước khi sửa khi có thể. Money/security/stock cần happy path, boundary, permission và failure/race liên quan. AI mock dùng cho lỗi/job lifecycle, không chứng minh chất lượng model thật.
- Không skip/xfail/xóa assertion hoặc hạ security để làm xanh suite. Nếu skip hợp lệ phải công khai lý do, owner, điều kiện chạy lại; mandatory check bị skip vẫn chưa đạt gate. Không âm thầm bỏ qua test lỗi có sẵn hoặc ngoài scope: ghi rõ và đánh giá ảnh hưởng.
- Báo đúng `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`, `SKIPPED`. **Không tuyên bố test thành công khi chưa chạy**, không biến expected thành actual, không gọi mock inference là model thật.
- Evidence tối thiểu: Task/FR/AC, commit/build, ngày, môi trường và DB/version, lệnh chính xác, exit status/count, actual/expected, log/screenshot đã che dữ liệu. Lệnh kiểm tra chưa tồn tại là việc cần thiết lập, không được bịa đã chạy.

## Luồng task, review và báo cáo

Trạng thái: Backlog → Ready → In Progress → Review → Done; Blocked khi thiếu dependency/quyết định/môi trường. Ready cần owner, FR/AC/test rõ, dependencies kỹ thuật Done và quyết định liên quan có evidence. Không kéo P2 trước P0 DoD trừ khi chủ dự án ghi ngoại lệ cụ thể.

Branch `feature/QHS-###-slug` hoặc `fix/QHS-###-slug`; PR tham chiếu Task/FR/AC. Không tự commit trực tiếp main bỏ review/tests. Giữ diff nhỏ, dùng pattern/dependency sẵn có, không thêm abstraction/tính năng ngoài task.

DoD chung: đáp ứng từng AC; checks bắt buộc đã chạy và đạt có evidence; regression liên quan đạt; permissions/validation/error handling còn nguyên; migration/data impact được review; docs/contracts/callers/fixtures liên quan đồng bộ; không có lỗi nghiêm trọng chưa giải quyết. Task tài liệu áp dụng check tài liệu, không cần test ứng dụng. Blocked/Not Run không phải Done; PR có thể để Draft.

Mỗi báo cáo/PR kết thúc bằng mẫu:

```text
Task / Requirement / AC:
Thay đổi và lý do; file/module:
Kiểm chứng: lệnh, môi trường/DB, kết quả thực tế, evidence:
Lỗi: expected vs actual, cách tái hiện, mức ảnh hưởng, phạm vi:
Chưa giải quyết / quyết định cần chốt: ID, owner, tác động, bước tiếp:
Rủi ro dữ liệu/API/migration và cách rollback nếu có:
Chưa chạy hoặc bỏ qua: lý do cụ thể (ghi 'không' nếu không có):
```

Không gộp lỗi có sẵn vào thành tích sửa lỗi; không ghi tính năng hoàn tất nếu còn AC chưa kiểm chứng. Sau mỗi task cập nhật trạng thái/evidence trong backlog; cập nhật roadmap nếu dependency/scope thay đổi. Thời hạn một tháng là mục tiêu, không được đổi test result hoặc che blocker để đạt lịch.
