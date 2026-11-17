# Foundation QA — Prompt 01

Ngày: 17/11/2026, Asia/Saigon. Task checkpoint thuộc **QHS-003/004**, không đổi ID backlog. Baseline code `618a95b`; branch sửa lỗi/review `fix/QHS-004-foundation-qa`. Người thực hiện: Codex; chủ dự án review. Truy vết NFR-UX-001, NFR-SEC-002, NFR-REL-001; FR-INV-001 chỉ liên quan tiền đề PostgreSQL, chưa kiểm chứng nghiệp vụ tồn kho.

## 1. Phạm vi và cách hiểu yêu cầu

Yêu cầu trực tiếp hiện tại: thực hiện task 1, xong commit/push. DOCX `QuangHuy_Sport_Huong_Dan_Vibe_Coding_Codex.docx` là prompt library, bản thân tài liệu nói không xem ví dụ là task approved; Prompt 01 yêu cầu kiểm tra Foundation và tạo báo cáo này. Nội dung dán Autonomous Development được đọc như hướng dẫn tham khảo; lượt này không kích hoạt toàn bộ module, không chuyển sang Authentication, không tạo lại Foundation.

Đã đối chiếu AGENTS, backlog/roadmap, SRS/BR/AC, Use Cases, ARCHITECTURE_FINAL, DATABASE_DESIGN, API_CONTRACTS, README, evidence Foundation trước và mã liên quan. UI/UX DOCX và audit là nguồn tham chiếu đã rà ở các checkpoint thiết kế trước. Không sửa palette/UI, business rules, schema hoặc auth API trong checkpoint này.

## 2. Kết luận

**Các kiểm tra kỹ thuật Foundation thực thi trong lượt này: PASS sau sửa lỗi HEAD.** Không còn test/lint/type/build failure cuối trên local. CI baseline `618a95b` đã hoàn tất success cho cả backend và frontend trên Ubuntu/PostgreSQL service. CI của commit sửa HEAD chỉ có thể xác nhận sau push; không sử dụng kết quả baseline để tuyên bố commit mới đã PASS remote.

QHS-003/004 giữ **REVIEW**, không tự chuyển Done toàn bộ: kiểm tra browser thủ công/mobile/focus chưa thực thi, chưa có owner acceptance. Điều kiện kỹ thuật để bắt đầu backend Authentication đã sẵn sàng; việc cho triển khai QHS-005 và ghi nhận quyết định liên quan vẫn cần theo task/decision gate hiện hành. DEC-004 còn OPEN trong decision log dù kiến trúc TD-02 đã chọn sessions ở mức kỹ thuật. Frontend auth còn thiếu Figma mapping/frame được duyệt. Báo cáo không phê duyệt thay các quyết định này.

## 3. Ma trận kiểm tra thực tế

| Mục / AC checkpoint | Trạng thái | Actual và giới hạn |
|---|---|---|
| Repository/Git status | PASS | Bắt đầu trên feature/QHS-003-project-foundation, working tree sạch; tạo nhánh fix riêng. Chỉ stage file QA/fix liên quan |
| Django/DRF cấu hình | PASS | manage.py check: 0 issues; DRF health endpoint chạy thật; default SessionAuthentication/IsAuthenticated, health AllowAny có chủ đích |
| PostgreSQL kết nối | PASS | Backend test xác nhận connection.vendor=postgresql; SELECT 1 qua HTTP GET/HEAD trả thành công; dùng cấu hình local hiện có, không in password |
| Migration | PASS | migrate --noinput: không có migration mới cần áp; showmigrations --plan ghi các migration [X]; makemigrations --check --dry-run: No changes detected |
| React/TypeScript | PASS | npm ci/lint/typecheck/test/build exit 0; TS strict; trang Vite HTTP 200 |
| Tailwind | PASS | Vite plugin có trong config; production CSS thực tế chứa utility .bg-slate-950, không chỉ kiểm package.json |
| CORS | PASS | Test default từ chối origin ngoài; test preflight origin allowlist trả đúng origin + credentials=true, không wildcard |
| Environment/settings | PASS | Backend .env ignored, .env.example sensitive fields rỗng; subprocess test thiếu POSTGRES_DB hoặc DJANGO_SECRET_KEY fail rõ, không fallback SQLite |
| Backend tests | PASS | 8 passed, 0 skipped trên PostgreSQL thật (có test mô phỏng DB lỗi để kiểm response an toàn) |
| Backend lint/format/typecheck | PASS | Ruff check, format --check, mypy đều exit 0 sau sửa test fixture; không suppress rule/type error |
| Frontend checks | PASS | Oxlint, Prettier, tsc, Vitest 1 passed, production build đều exit 0 |
| Health + README | PASS sau sửa | HEAD ban đầu trả405 trái README; đã thêm HEAD vào allowed methods, regression200/body rỗng/cache no-store; GET và proxy HTTP đều200 |
| Secrets/local artifacts trong Git | PASS trong phạm vi scan | 80 historical blobs baseline không chứa hai giá trị secret/password local đang cấu hình hoặc private-key headers; .env/node_modules/.venv không tracked; template không có credential thật |
| Privacy/security audit toàn diện | NOT RUN | Scan không chứng minh mọi loại API key/PII hoặc metadata DOCX đều an toàn; không kiểm toán security production trong task này |
| CI baseline Ubuntu | PASS | [Run 43892927141](https://github.com/NGUYENQUANGHUY1106/QuangHuy_Store_Smart-/actions/runs/43892927141), head 618a95b, backend/frontend success; JSON evidence có steps |
| CI commit mới | NOT RUN tại thời điểm lập báo cáo | Chờ push; theo dõi run theo đúng SHA mới, không suy từ baseline |
| Browser/mobile/focus thủ công | NOT RUN | HTTP/DOM test không thay kiểm tra bằng mắt hoặc bàn phím trên browser thật |
| Đối chiếu Figma | BLOCKED cho phần đối chiếu thiết kế | Không có FIGMA_FRAME_MAPPING.md hoặc frame/node URL trong repo. Không đoán UI Figma; không chặn chạy backend QA hiện tại |
| Authentication/authorization nghiệp vụ | NOT RUN | Chưa có endpoint auth/admin nghiệp vụ; identity.User vẫn scaffold UUID AbstractUser, không gọi đó là email login đã hoàn tất |
| Checkout concurrency/AI/production | NOT RUN | Ngoài task; không thêm test giả để đánh dấu đạt FR-INV/TRY hoặc production-ready |

## 4. Lỗi và thay đổi

**F-QA-001 — HEAD /health không khớp README:** trước sửa, test database thật trả405 trong khi expected200, exit1. Root cause: decorator DRF chỉ khai báo GET. Sửa duy nhất allowed methods thành GET/HEAD; routing/caller frontend `/health` không đổi. Test HEAD thành công kiểm không có body và Cache-Control=no-store. Không thay status DB failure503 hoặc nới POST.

**Lỗi test fixture trong lượt QA:** test CORS allowlist mới ban đầu gọi Client.settings (không tồn tại). Mypy và pytest đều phát hiện; sửa dùng Django override_settings, giữ nguyên các assertions. Đã chạy lại toàn bộ backend tests/checks thành công. Log giữ các lượt FAIL, không xóa test hoặc skip để che lỗi.

File ứng dụng sửa: `backend/config/views.py`, `backend/tests/test_health.py`. File tài liệu: báo cáo này, backlog/roadmap, log backend/frontend/smoke, baseline CI JSON. Không đổi dependency, migration, dữ liệu, credentials, session policy hoặc API nghiệp vụ.

## 5. Lệnh đã chạy và evidence

Backend (cwd backend, `python` bên dưới là `../.venv/Scripts/python.exe`):

```text
python -m pip check
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate --noinput
python manage.py showmigrations --plan
python -m ruff check .
python -m ruff format --check .
python -m mypy config apps tests
python -m pytest tests/test_health.py::test_health_head_checks_database_without_response_body -v
python -m pytest -v
```

Frontend (cwd frontend): npm.cmd ci; npm.cmd run lint; npm.cmd run format:check; npm.cmd run typecheck; npm.cmd run test; npm.cmd run build. Không sửa PowerShell ExecutionPolicy.

Smoke runner đã chạy Django runserver --noreload và node node_modules/vite/bin/vite.js trên các port loopback rảnh (ghi trong log); Vite DEV_BACKEND_ORIGIN được trỏ tới backend test process. HTTP urllib GET/HEAD kiểm200/body; cache header được kiểm trong regression backend. Runner kiểm CSS build và terminate đúng process đã tạo, không kill server của người dùng.

Git checks thực thi: status/branch/log/diff, ls-files/check-ignore, rev-list --objects --all và cat-file scan blobs với các giá trị local lấy trong bộ nhớ từ .env (không in). Không scan chat/cloud bên ngoài; không reset/drop DB, rewrite history hoặc tạo account admin.

- [Backend log, gồm RED regression và final GREEN](evidence/foundation-qa-checks.txt)
- [Frontend log](evidence/foundation-qa-frontend.txt)
- [HTTP/env/Git credential scan](evidence/foundation-qa-smoke.txt)
- [Baseline CI steps](evidence/foundation-qa-baseline-ci.json)
- [Evidence Foundation trước](evidence/PROJECT_FOUNDATION.md) giữ nguyên như bản ghi lịch sử 16/11.

## 6. Handoff

Task 1 kiểm tra/sửa Foundation đã có kết quả reviewable, commit/push theo quyền user đã cấp; không có rủi ro migration/dữ liệu mới. Rollback fix ứng dụng là revert riêng commit QA nếu cần, không rollback database hoặc xóa history.

Tiếp theo: chủ dự án review report/Foundation và giao QHS-005; đối chiếu DEC-004/TD-02 và auth AC trước code. QHS-006 chỉ triển khai khi có frame mapping/Figma thật hoặc quyết định rõ thay nguồn UI. Các quyết định kho/phí/hủy/AI không tự thay đổi.
