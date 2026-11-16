# AI Virtual Try-On — feasibility và lifecycle

Ngày kiểm tra nguồn: 16/11/2026. Truy vết FR-TRY-001, FR-TRY-002, BR-007/008, NFR-PRIV-001/PERF-001, QHS-026…030. **Chưa chọn model, chưa tải/chạy weights, chưa đo trên phần cứng dự án.** Bằng chứng công khai không phải bằng chứng tương thích ảnh/SKU thực. DEC-001/005/013 còn OPEN.

## 1. Đánh giá tách giày và trang phục

| Ứng viên/hướng | Bằng chứng nguồn chính thức | Input và rủi ro cho QuangHuy_Sport | Kết luận hiện tại |
|---|---|---|---|
| CatVTON — quần áo | Model card công bố inference dưới 8 GB VRAM ở 1024×768; license CC BY-NC-SA 4.0 | Ảnh người, ảnh garment, mask/preprocessing theo bản pipeline; áo bóng đá có logo/chữ/sọc cần đánh giá riêng. Số VRAM của tác giả không bảo đảm peak toàn hệ thống ở máy dự án | Ứng viên spike áo, không bằng chứng footwear. [Model card](https://huggingface.co/zhengchong/CatVTON) |
| IDM-VTON — quần áo | Repo chính thức có pipeline inference/preprocessing; code/checkpoints CC BY-NC-SA 4.0 | Cần kiểm categories/checkpoint cụ thể, segmentation/pose, input quality, RAM/VRAM; không gán con số latency/VRAM chưa đo | Ứng viên đối chiếu áo; chưa chọn. [Repository](https://github.com/yisol/IDM-VTON) |
| ARShoe — footwear chuyên biệt | Paper mô tả foot pose/segmentation, 3D shoe occlusion, stabilization trên smartphone | Pipeline AR khác image-based clothing; cần checkpoint/code có quyền dùng, assets giày 3D/góc/che khuất. Paper không chứng minh có package free inference phù hợp shop | Nguồn nghiên cứu spike giày, chưa là model triển khai. [Paper](https://arxiv.org/abs/2108.10515) |
| Ghép ảnh 2D/overlay | Có thể minh họa vị trí từ ảnh được phép | Không bảo toàn góc/occlusion/fit, không tự thành pretrained AI try-on | Chỉ demo minh họa có nhãn nếu được duyệt; không tính FR-TRY đã hoàn tất |
| API thương mại/image editing chung | Chưa chọn provider và chưa có contract/quote | Có thể phát sinh chi phí, gửi ảnh ra ngoài, license/retention khác; tạo hình đẹp không bảo đảm đúng SKU | Không tự chọn thay model chuyên biệt hoặc gọi là free |

Nghiên cứu trên là danh sách ngắn để thử, không kết luận thị trường không có model khác. Không mặc định một model supports both. Footwear cần ảnh đủ vùng chân, góc trái/phải, đế/đinh/dây/logo; ảnh catalog một góc không bảo đảm đủ dữ liệu cho 3D. Quần áo cần category đúng và giữ danh tính/dáng ngoài vùng garment; vẫn có thể sai chi tiết sản phẩm. Không pipeline nào được dùng để hứa size/độ vừa chỉ từ ảnh sinh ra.

## 2. Phần cứng, license và chi phí

| Lựa chọn compute | Đánh giá | Điều kiện quyết định |
|---|---|---|
| GPU local sẵn có | Không mất tiền thuê nhưng vẫn có điện, dung lượng weights/RAM, CUDA/dependency; độ sẵn sàng phụ thuộc máy | Ghi GPU/VRAM/driver/OS/RAM, đo cold/warm time và peak preprocessing+inference, thử worker process tách web |
| CPU local | Có thể dùng cho web/metadata/preprocessing tùy pipeline; không mặc định inference usable hoặc được tác giả hỗ trợ | Đo thật nếu candidate hỗ trợ; không dùng làm fallback realtime chưa kiểm |
| Colab free | Tài nguyên/hạn mức không được bảo đảm; free runtimes có hạn chế với cách dùng chủ yếu qua web UI thay notebook | Chỉ spike tương tác đúng điều khoản; không đặt worker website luôn bật ở Colab. [FAQ](https://research.google.com/colaboratory/faq.html) |
| GPU thuê/serverless/API | Có thể phù hợp demo public nhưng phát sinh setup/compute/cold start/storage/egress | Chưa có quote/credentials; chủ dự án phải duyệt trần chi và privacy processor trước khi chọn |

Chưa có chi phí inference đo thực; không ghi 0 đồng/job. Công thức so sánh: chi phí demo = GPU giờ dùng (gồm warm idle/cold start) × đơn giá hiện hành + storage/egress + broker/hosting + preprocessing/API khác. Giá hiện hành phải kiểm trực tiếp provider lúc chọn; file này không đưa mức giá chưa có nguồn. Ưu tiên free không đồng nghĩa đủ GPU hoặc public SLA.

CatVTON/IDM-VTON có điều kiện non-commercial; portfolio không tự miễn mọi điều khoản, đặc biệt nếu quảng bá dịch vụ hoặc dùng ảnh thương hiệu. Lập bill of materials: code revision/license, checkpoint hash/license, base model, pose/parser/mask model, dependency, dataset, product/user assets và điều kiện attribution/share-alike/phân phối weights. Từng mục ghi URL/version/ngày kiểm và giới hạn. Chưa chứng nhận được phép commercial; không đưa weights vào repo.

## 3. Spike và gate lựa chọn

QHS-026 giày và QHS-027 áo là hai báo cáo độc lập. Timebox đề xuất 2–3 ngày đầu W1 tổng, phải xác nhận theo DEC-007. Mỗi hướng:

1. Xác minh pipeline/checkpoint chạy được, category hỗ trợ bằng source/model card và test, không chỉ ảnh marketing. Ghi input spec, preprocessing, dependency và license từng thành phần.
2. Dùng tối thiểu 10 cặp ảnh có quyền cho mỗi hướng như đề xuất audit; gồm góc/ánh sáng/che khuất/ảnh lỗi. Chốt tập test và rubric trước đo; không chỉ chọn ảnh đẹp.
3. Lưu model/version/hash, hardware, exact command, config/seed/resolution, latency cold/warm, peak VRAM/RAM, success/failure code, output có consent và phép lưu evidence.
4. Review đúng loại/màu/logo/hình dáng, giữ vùng ngoài sản phẩm, artifacts và privacy. Ngưỡng đề xuất 8/10 hợp lệ được người review chấp nhận chưa là approved AC; chủ dự án phải chốt threshold, timeout, quota và loại hàng trước integration.
5. Go chỉ khi chất lượng/giấy phép/compute/input/privacy cùng đạt; một hướng fail không kéo hướng kia thành pass/fail. Chưa đủ evidence ghi blocked/no-go. Không triển khai live shoes chỉ vì áo chạy tốt.

Nếu cả hai chưa đạt: website capabilities available=false, CTA disabled với lý do. Có thể trình bày video kết quả đã chạy kèm model/input/hardware/ngày; không replay ảnh mẫu thành live inference cho ảnh người dùng mới. Nếu bắt buộc live footwear thì cần quyết định thay phạm vi/thời gian/compute, không âm thầm đổi thành áo.

## 4. Lifecycle ảnh và job

Trước public upload phải chốt DEC-005: purpose, processor, ai được nhận ảnh, TTL input/output/temp, xóa theo yêu cầu, backup/cache exceptions. **24 giờ chỉ là đề xuất cũ, chưa policy được duyệt**. Không mở upload khi retention config/policy version chưa có; không bịa promise trong C28.

| State/event | Dữ liệu/hành vi | Chuyển tiếp |
|---|---|---|
| Upload validation | Kiểm auth/consent/quota, allowlist JPEG/PNG, MIME thực, bytes/dimensions/pixels/decoder; EXIF remove, private key; product supported | Chấp nhận → queued; reject xóa temp, không giữ ảnh lỗi |
| queued | Job DB commit, input private, garment asset đã pin, expiry ghi từ policy. Queue publish sau commit; dispatcher quét DB khi publish fail | Worker claim atomic → processing; hết hạn → expired; delete → deleted |
| processing | Lease token/lease_until, model/version và started_at; worker chỉ đọc refs đã cấp quyền, ghi temp attempt riêng | success qua token check → succeeded; error/timeout → failed; cancel/delete/expiry terminal |
| succeeded | Chỉ publish output nếu lease còn đúng, chưa delete/expired và input policy còn hiệu lực; finished_at/output ref | expiry → expired; delete → deleted |
| failed | Lý do safe, cleanup temp/input theo policy; không ảnh output giả | Retry transient có giới hạn trong cùng job → queued nếu chưa xóa/hết hạn; nếu không terminal |
| canceled | Dừng xử lý theo khả năng, thu hồi quyền xem ảnh | Cleanup tất cả refs; không retry |
| expired | API từ chối đọc ngay theo expires_at, không đợi cleanup scheduler | Purge async, tombstone tối thiểu; không retry |
| deleted | DELETE đặt delete_requested_at/status atomic, thu hồi media ngay; worker cũ không được publish | Purge async có retry; giữ purge_completed_at khi xóa xong; không resurrect |

Không cần cung cấp action cancel riêng V1: DELETE đồng thời bỏ job và yêu cầu purge ảnh. Worker không nhất thiết bị kill ngay trên GPU; trước publish phải lock job/CAS lease và check tombstone. Xóa file và DB không atomic: output ghi tên temp riêng, recheck job dưới lock trước attach; worker cleanup object nếu attach bị từ chối. Reaper xóa unreferenced temp/orphans theo tuổi an toàn để xử lý crash giữa upload/DB commit và delete. Không attach output sau khi input hết hạn.

Retry duplicate delivery chỉ một lease thắng, worker cũ token sai không update. Lease bị mất nhưng worker còn chạy cần cleanup attempt cũ; không reuse key file output giữa attempts. Broker ack không được coi là job thành công. Queue down không mất intent DB; worker dead có watchdog/requeue trong retry limit. Inference không giữ transaction/row lock suốt thời gian GPU xử lý.

Cleanup scheduler chạy định kỳ bằng command/cron độc lập kể cả broker down, khoảng chạy cấu hình theo SLA xóa đã duyệt. Mỗi lượt: lấy expired/deleted/failed refs, xóa input/output/temp và derivative/cache, retry lỗi storage, ghi purge_completed_at khi thực sự xóa. Metrics tuổi file quá TTL/pending purge, orphan count; đối soát storage inventory. Job metadata còn lại không chứa ảnh/EXIF/prompt cá nhân.

Private media chỉ owner qua authenticated endpoint no-store. Signed public URL không chọn V1 để giảm cửa sổ truy cập sau delete. Admin job monitor chỉ metadata; support xem ảnh cần consent/quyền riêng chưa được duyệt. Asset garment public không bị xóa do xóa job nếu còn tham chiếu; bản input cá nhân luôn thuộc policy riêng. Không train ảnh, không gửi third-party chưa chốt.

## 5. Integration gates và evidence

AI-AC1 / QHS-026/027: evidence từng hướng riêng, BOM license + input/hardware/version, actual outputs/errors; hiện **NOT RUN**.

AI-AC2 / QHS-028: TC-008, consent/category/ownership/private cache/quota race; missing policy/model trả unavailable, không nhận ảnh thật.

AI-AC3 / QHS-029: TC-009, GPU unavailable/OOM/timeout/worker restart, duplicate delivery, expired lease, delete khi processing, mất broker, orphan/purge retry; mock dùng kiểm lifecycle chứ không chất lượng.

AI-AC4 / QHS-030: model thật với input mới, C24…28 reflect server states, không percentage giả, không hứa fit size; test chất lượng theo rubric đã duyệt và đo latency/cost thực. Mọi kết quả ứng dụng/model hiện chưa chạy; tài liệu này chỉ thiết kế và nghiên cứu nguồn công khai.
