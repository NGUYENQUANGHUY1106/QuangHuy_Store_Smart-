# Figma frame mapping & reading notes — QuangHuy_Sport

Ngày đọc: 17/11/2026, Asia/Saigon. Nguồn thật: [QUANGHUY_SPORT — Full UI/UX · Desktop + Mobile](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-6). File key: `2X86LRLr7wSypqUmNwUxNS`.

Truy vết: QHS-002 (design handoff), NFR-UX-001; các FR/module cụ thể theo [SRS](02_Requirements/01_SRS.md), [backlog](IMPLEMENTATION_BACKLOG.md) và [decision log](OPEN_DECISIONS.md). Đây là kết quả đọc thiết kế theo yêu cầu user, không phải phê duyệt chức năng hay yêu cầu code tiếp.

## Phạm vi đọc và bằng chứng

Đã dùng Figma MCP đọc cả **10 page**, inventory **466 node top-level**, nội dung text, kích thước, layout và reaction links của các frame. Đã xem screenshot đại diện Home desktop, Login desktop/mobile, Admin dashboard desktop/mobile, Components, Foundations, States và design system Redesign. Những frame khác được đọc cấu trúc/text; không tuyên bố đã kiểm tra bằng mắt từng pixel của mọi frame.

Kiểm 376 destination ID riêng biệt từ các reaction trên các page màn hình/prototype: tất cả còn tồn tại (370 FRAME, 6 COMPONENT). Đây là kiểm tra cấu trúc liên kết, không phải đã click thử toàn bộ prototype hoặc chứng minh validation/backend hoạt động. Component page có reactions riêng, được đọc như cấu hình component. Không sửa Figma, không chạy inference/payment, không thay source code.

## Danh sách page

| Page | Page node | Node top-level | Nội dung đã đọc |
|---|---|---:|---|
| 00-Cover & Sitemap | [0:1](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=0-1) | 2 | Cover, personas, nguồn, sitemap 77 mã, routes và các giả định mở |
| 01-Foundations | [2:2](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-2) | 1 | Typography, màu, spacing, semantic status, asset handoff; frame ngoài đang crop |
| 02-Components | [2:3](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-3) | 13 | 13 component sets / 82 variants: buttons, input, photography, order/AI status, variant picker, product card, feedback, modal, table, filter, drawer |
| 03-Customer-Desktop | [2:4](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-4) | 63 | 42 mã C01–C42 desktop + 21 supplemental frames |
| 04-Customer-Mobile | [2:5](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-5) | 65 | 42 mã C01–C42 mobile + menu/filter và 21 supplemental frames |
| 05-Admin-Desktop | [2:6](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-6) | 30 | 30 mã A01–A30 desktop |
| 06-Admin-Mobile | [2:7](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-7) | 31 | 30 mã A01–A30 mobile + menu admin |
| 07-Prototype-Flows | [2:8](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-8) | 95 | 8 flow starting points, nhánh lỗi, bản sao frame cho prototype và supplemental overlays |
| 08-States & QA | [2:9](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=2-9) | 90 | S01–S05 desktop/mobile, 63 state samples, 4 mobile viewports, 4 tablet frames, QA checklist, 8 dialogs/actions bổ sung |
| Redesign – Image Reference | [41:2](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=41-2) | 76 | Redesign theo ảnh tham chiếu: home, design system, components, assets, category TF/FG/IC và overlays/prototype |

## Hệ giao diện thực tế

- Màu chính `#FF4F00`, ink `#141413`, tertiary `#E63946`, paper `#F6F6F4`; tiêu đề **Syne**, nội dung/label **DM Sans**. Đã xác minh fontName trên text node, không chỉ đọc tên style.
- Desktop 1440px, mobile 390px; thêm tablet cho listing/detail/checkout/dashboard. Spacing 4/8/12/16/24/32/48/64/80; website ưu tiên góc vuông. Các panel bo góc trên bảng design system không có nghĩa mọi card website đều bo góc.
- Customer desktop có header/search/nav/footer, auth hai cột; mobile dùng hamburger/search, form một cột. Admin desktop sidebar + tables; mobile hamburger, KPI hai cột, dữ liệu bảng chuyển cards.
- Home gồm hero, mặt sân TF/FG/IC, featured products, Nike editorial, brands, flash sale, bài viết, cam kết và footer.
- Page Redesign không chỉ là ảnh đính kèm: có frame/editable components và prototype. Home C01 chính và QHF_Home_Desktop có cùng nội dung/section sizing đã đọc; không tự coi mọi page chính là bản cũ bỏ đi.
- Cover vẫn nhắc Inter và một số ghi chú cũ, trong khi Foundations/text node thực dùng Syne/DM Sans. Khi triển khai lấy thuộc tính frame thật và xác nhận nguồn UI với chủ dự án, không lấy DOCX cũ để ghi đè âm thầm.

## Các điểm cần lưu ý trước code

1. **Foundations bị cắt:** frame `10:2` cao160, clipsContent=true, FIXED height; child design system cao1071 ở y32, các ghi chú cuối ở y1345. Screenshot chỉ thấy phần đầu. Có thể đọc đầy đủ child `78:10313` hoặc bản đầy đủ [Redesign design system](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=49-646); chưa sửa frame vì lượt này chỉ đọc.
2. **Thiếu ảnh gốc HD:** Figma ghi ảnh nguồn chỉ380×1600, crop11 ảnh preview. Thiếu hero, Vapor16, Predator24, MoreliaNeoIV và PumaFuture7 đúng mã. Không phóng crop mờ thành asset chất lượng cao hoặc tự khẳng định quyền ảnh.
3. **A18 sample desktop/mobile lệch:** ngày15/11 desktop `6:1854` ghi21.900.000đ, mobile `6:4090` ghi8.700.000đ; chart/KPI vẫn thể hiện21,90 triệu và tổng74,55 triệu. Đây là sample inconsistency, không dùng số trong mockup làm expected business data.
4. **Cam kết thương mại chưa duyệt:** chính hãng100%, đối tác phân phối, giao2giờ, đổi size7ngày, giá/size chart và phí ship mẫu30.000đ chỉ là nội dung tham chiếu. Không hardcode thành policy/giá checkout thật; banner2025 và countdown là nội dung tĩnh giữ theo reference.
5. **Hủy đơn chưa thống nhất policy:** C36 ghi pending hoặc confirmed theo chính sách; architecture đề xuất customer chỉ pending. DEC-008 vẫn phải chốt, không lấy prototype làm approval.
6. **AI/payment/OAuth là thiết kế:** AI ghi rõ chưa có model/kết quả thật, consent/retention draft; payment sandbox/P2 chưa provider, social login chưa tích hợp. Không biến nút mô phỏng thành claim hoàn thành.
7. **Scope mới trên giao diện:** newsletter, articles, wishlist, banners, thông báo/hỗ trợ và tra cứu đơn cần FR/AC/scope tương ứng trước code, không tự mở rộng task Foundation/Auth.
8. Các tên `QUICK_P1…P8`, `CART_P1…P8` trong supplemental/Redesign là nhóm sản phẩm mẫu, không tự hiểu là backlog priority P1/P2.
9. Bảng map dưới gỡ tình trạng thiếu file/frame IDs ở QA trước; không tự phê duyệt giao diện hay đóng DEC-010/011/014. Chưa chạy browser accessibility/focus/keyboard và chưa đối chiếu ứng dụng React với toàn bộ Figma.

## 77 mã gốc — Desktop / Mobile

Mỗi mã là screen/modal/state thiết kế, không mặc định là URL hoặc một task riêng. 42 customer +30 admin +5 system =77; có154 frame chính cho hai thiết bị. Labels priority và phạm vi triển khai tiếp tục theo SRS/decision được duyệt.

| Mã | Tên frame desktop | Desktop node | Mobile node |
|---|---|---|---|
| C01 | C01_Trangchủ/Home_Desktop_Default | [4:2](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2) | [4:3447](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3447) |
| C02 | C02_Danhmụcsảnphẩm_Desktop_Default | [4:171](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-171) | [4:3599](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3599) |
| C03 | C03_Danhsáchsảnphẩmtheodanhmục_Desktop_Default | [4:251](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-251) | [4:3671](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3671) |
| C04 | C04_Tìmkiếmgợiýtrựctiếp_Desktop_Default | [4:436](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-436) | [4:3837](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3837) |
| C05 | C05_Trangkếtquảtìmkiếm_Desktop_Default | [4:529](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-529) | [4:3918](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3918) |
| C06 | C06_Chitiếtsảnphẩm_Desktop_Default | [4:713](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-713) | [4:4086](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-4086) |
| C07 | C07_Phóngtothưviệnảnhsảnphẩm_Desktop_Default | [6:5975](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-5975) | [8:1139](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=8-1139) |
| C08 | C08_Bảnghướngdẫnchọnsize_Desktop_Default | [6:6002](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-6002) | [8:1166](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=8-1166) |
| C09 | C09_Quickviewsảnphẩm_Desktop_Default | [6:6051](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-6051) | [8:1212](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=8-1212) |
| C10 | C10_Giớithiệuthươnghiệu_Desktop_Default | [4:1075](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1075) | [4:4410](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-4410) |
| C11 | C11_Liênhệ/hỗtrợ_Desktop_Default | [4:1135](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1135) | [4:4462](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-4462) |
| C12 | C12_FAQ/chínhsáchhỗtrợ_Desktop_Default | [4:1198](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1198) | [4:4517](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-4517) |
| C13 | C13_Đăngnhập_Desktop_Default | [4:1250](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1250) | [4:4561](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-4561) |
| C14 | C14_Đăngký_Desktop_Default | [4:1333](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1333) | [4:4615](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-4615) |
| C15 | C15_Quênmậtkhẩu_Desktop_Default | [4:1415](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1415) | [5:530](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-530) |
| C16 | C16_Xácminhemail_Desktop_Default | [4:1482](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1482) | [5:571](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-571) |
| C17 | C17_Đặtlạimậtkhẩu_Desktop_Default | [4:1545](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1545) | [5:608](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-608) |
| C18 | C18_Giỏhàng_Desktop_Default | [4:1611](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1611) | [5:648](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-648) |
| C19 | C19_Xácnhậnxóasảnphẩmkhỏigiỏ_Desktop_Default | [6:6094](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-6094) | [5:720](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-720) |
| C20 | C20_Checkout—địachỉvàvậnchuyển_Desktop_Default | [4:1737](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1737) | [5:744](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-744) |
| C21 | C21_Checkout—phươngthứcvàxácnhận_Desktop_Default | [4:1829](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1829) | [5:828](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-828) |
| C22 | C22_Đặthàngthànhcông_Desktop_Default | [4:1924](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1924) | [5:915](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-915) |
| C23 | C23_Thanhtoánonlinesandbox_Desktop_Default | [4:1983](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-1983) | [5:966](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-966) |
| C24 | C24_AITry-On—giớithiệu_Desktop_Default | [4:2078](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2078) | [5:1053](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1053) |
| C25 | C25_AITry-On—tảiảnh_Desktop_Default | [4:2146](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2146) | [5:1113](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1113) |
| C26 | C26_AITry-On—xửlý_Desktop_Default | [4:2208](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2208) | [5:1167](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1167) |
| C27 | C27_AITry-On—kếtquả_Desktop_Default | [4:2259](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2259) | [5:1210](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1210) |
| C28 | C28_ChínhsáchảnhvàchấpthuậnAI_Desktop_Default | [4:2347](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2347) | [5:1290](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1290) |
| C29 | C29_Tàikhoản—Tổngquan_Desktop_Default | [4:2398](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2398) | [5:1333](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1333) |
| C30 | C30_Chỉnhsửahồsơcánhân_Desktop_Default | [4:2476](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2476) | [5:1403](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1403) |
| C31 | C31_Sổđịachỉ_Desktop_Default | [4:2539](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2539) | [5:1458](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1458) |
| C32 | C32_Thêm/sửađịachỉ_Desktop_Default | [4:2601](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2601) | [5:1512](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1512) |
| C33 | C33_Xácnhậnxóađịachỉ_Desktop_Default | [6:6115](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-6115) | [5:1572](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1572) |
| C34 | C34_Đơnhàngcủatôi_Desktop_Default | [4:2712](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2712) | [5:1593](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1593) |
| C35 | C35_Chitiếtđơnhàng_Desktop_Default | [4:2853](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2853) | [5:1720](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1720) |
| C36 | C36_Hủyđơn—xácnhận_Desktop_Default | [6:6136](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-6136) | [5:1809](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1809) |
| C37 | C37_Viếtđánhgiásảnphẩm_Desktop_Default | [4:2998](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-2998) | [5:1835](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1835) |
| C38 | C38_Lịchsửđánhgiácủatôi_Desktop_Default | [4:3068](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3068) | [5:1897](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1897) |
| C39 | C39_Đổimậtkhẩu/phiênđăngnhập_Desktop_Default | [4:3132](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3132) | [5:1953](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-1953) |
| C40 | C40_Wishlist/yêuthích_Desktop_Default | [4:3195](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3195) | [5:2008](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-2008) |
| C41 | C41_Vouchercủatôi_Desktop_Default | [4:3360](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3360) | [5:2176](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-2176) |
| C42 | C42_Lịchsửthôngbáo_Desktop_Default | [4:3403](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=4-3403) | [5:2211](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=5-2211) |
| A01 | A01_Admin—Đăngnhập/xácthựcquyền_Desktop_Default | [6:160](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-160) | [6:3073](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3073) |
| A02 | A02_Admin—Dashboardtổngquan_Desktop_Default | [6:189](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-189) | [6:3102](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3102) |
| A03 | A03_Admin—Danhsáchsảnphẩm_Desktop_Default | [6:337](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-337) | [6:3202](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3202) |
| A04 | A04_Admin—Tạosảnphẩm_Desktop_Default | [6:445](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-445) | [6:3262](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3262) |
| A05 | A05_Admin—Chỉnhsửasảnphẩm_Desktop_Default | [6:557](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-557) | [6:3333](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3333) |
| A06 | A06_Admin—QuảnlýbiếnthểSKU_Desktop_Default | [6:672](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-672) | [6:3410](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3410) |
| A07 | A07_Admin—Thưviệnảnhsảnphẩm_Desktop_Default | [6:782](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-782) | [6:3476](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3476) |
| A08 | A08_Admin—Nhập/điềuchỉnhkho_Desktop_Default | [6:899](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-899) | [6:3555](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3555) |
| A09 | A09_Admin—Lịchsửnhập/xuất/tồnkho_Desktop_Default | [6:992](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-992) | [6:3610](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3610) |
| A10 | A10_Admin—Danhsáchđơnhàng_Desktop_Default | [6:1099](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1099) | [6:3673](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3673) |
| A11 | A11_Admin—Chitiếtvàxửlýđơn_Desktop_Default | [6:1200](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1200) | [6:3722](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3722) |
| A12 | A12_Admin—Xácnhậnthayđổitrạngtháiđơn_Desktop_Default | [8:1833](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=8-1833) | [8:2446](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=8-2446) |
| A13 | A13_Admin—Danhmụcsảnphẩm_Desktop_Default | [6:1404](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1404) | [6:3850](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3850) |
| A14 | A14_Admin—Tạo/sửadanhmục_Desktop_Default | [6:1505](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1505) | [6:3907](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3907) |
| A15 | A15_Admin—Thươnghiệu_Desktop_Default | [6:1588](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1588) | [6:3952](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3952) |
| A16 | A16_Admin—Quảnlýngườidùng_Desktop_Default | [6:1677](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1677) | [6:3998](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-3998) |
| A17 | A17_Admin—Chitiếtngườidùng_Desktop_Default | [6:1765](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1765) | [6:4042](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4042) |
| A18 | A18_Admin—Báocáodoanhthu_Desktop_Default | [6:1854](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1854) | [6:4090](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4090) |
| A19 | A19_Admin—Sảnphẩmbánchạy_Desktop_Default | [6:1982](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-1982) | [6:4176](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4176) |
| A20 | A20_Admin—Voucher/khuyếnmãi_Desktop_Default | [6:2104](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2104) | [6:4257](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4257) |
| A21 | A21_Admin—Tạo/sửaVoucher_Desktop_Default | [6:2180](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2180) | [6:4289](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4289) |
| A22 | A22_Admin—Quảnlýđánhgiá_Desktop_Default | [6:2272](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2272) | [6:4343](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4343) |
| A23 | A23_Admin—Chitiếtreview_Desktop_Default | [6:2348](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2348) | [6:4375](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4375) |
| A24 | A24_Admin—AITry-OnJobMonitor_Desktop_Default | [6:2424](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2424) | [6:4413](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4413) |
| A25 | A25_Admin—CàiđặtAITry-On_Desktop_Default | [6:2509](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2509) | [6:4454](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4454) |
| A26 | A26_Admin—AuditLog_Desktop_Default | [6:2602](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2602) | [6:4509](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4509) |
| A27 | A27_Admin—Càiđặtcửahàng_Desktop_Default | [6:2697](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2697) | [6:4560](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4560) |
| A28 | A28_Admin—Quảnlýbannertrangchủ_Desktop_Default | [6:2785](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2785) | [6:4610](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4610) |
| A29 | A29_Admin—Thêm/sửabanner_Desktop_Default | [6:2875](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2875) | [6:4657](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4657) |
| A30 | A30_Admin—Notifications/BackgroundJobs_Desktop_Default | [6:2981](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-2981) | [6:4725](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=6-4725) |
| S01 | S01_Khôngtìmthấytrang_Desktop_Default | [7:2](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-2) | [7:94](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-94) |
| S02 | S02_Bạnkhôngcóquyềntruycập_Desktop_Default | [7:23](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-23) | [7:109](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-109) |
| S03 | S03_Hệthốngđanggiánđoạn_Desktop_Default | [7:38](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-38) | [7:124](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-124) |
| S04 | S04_Bạnđangngoạituyến_Desktop_Default | [7:53](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-53) | [7:139](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-139) |
| S05 | S05_Xácnhận&thôngbáo_Desktop_Default | [7:68](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-68) | [7:154](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-154) |

## Components có sẵn

| Component set | Node | Số variants |
|---|---|---:|
| QHF/Functional/Button/Primary | [3:297](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-297) | 7 |
| QHF/Functional/Button/Other | [3:438](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-438) | 28 |
| QHF/Functional/Input | [3:464](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-464) | 5 |
| QHF/Functional/ProductPhotography | [3:507](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-507) | 3 |
| QHF/Functional/OrderStatus | [3:520](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-520) | 6 |
| QHF/Functional/AIProgress | [3:533](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-533) | 6 |
| QHF/Functional/VariantPicker | [3:542](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-542) | 4 |
| QHF/Functional/ProductCard | [3:615](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-615) | 4 |
| QHF/Functional/Feedback | [3:624](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=3-624) | 4 |
| QHF/Functional/Modal | [15:204](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=15-204) | 3 |
| QHF/Functional/Table | [15:249](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=15-249) | 5 |
| QHF/Functional/Filter | [15:265](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=15-265) | 5 |
| QHF/Functional/Drawer | [15:297](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=15-297) | 2 |

Các variant states cần giữ khi code: button hover/focus/pressed/loading/disabled/success; input/error; card default/sale/out-of-stock/loading; order/AI status; size selected/disabled; feedback/loading/error/success. Không giả lập trạng thái thành công nếu API/model chưa xác nhận.

## 8 luồng prototype chính

| Flow | Starting frame | Nội dung |
|---|---|---|
| FLOW-01 | [13:1841](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=13-1841) | Khám phá → variant → cart → COD → order detail |
| FLOW-02 | [13:2775](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=13-2775) | Login/register/verify/reset; có nhánh validation |
| FLOW-03 | [13:3025](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=13-3025) | My Orders → detail → cancel dialog; policy eligible |
| FLOW-04 | [13:3283](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=13-3283) | AI intro/privacy → upload/consent → job → result; failure branches, không inference thật |
| FLOW-05 | [13:3767](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=13-3767) | Admin login → dashboard → product → variant → media |
| FLOW-06 | [14:859](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=14-859) | Admin adjustment + reason → movement history; lỗi tồn âm |
| FLOW-07 | [14:1159](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=14-1159) | Order processing → transition confirm → conflict branch |
| FLOW-08 | [14:1446](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=14-1446) | Payment sandbox future; payment cancel khác order cancel |

## States dùng ngay cho task Authentication sau này

| Frame/state | Node |
|---|---|
| C13_State_Mobile_ValidationError | [7:325](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-325) |
| C13_State_Mobile_Locked | [7:341](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-341) |
| C13_State_Mobile_Loading | [7:352](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-352) |
| C14_State_Mobile_EmailDuplicate | [7:362](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-362) |
| C14_State_Mobile_WeakPassword | [7:378](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-378) |
| C15_State_Mobile_Success | [7:394](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-394) |
| C17_State_Mobile_Expired | [7:404](https://www.figma.com/design/2X86LRLr7wSypqUmNwUxNS?node-id=7-404) |

Đã đọc thêm các state catalog/cart/checkout/AI/profile/address/orders/reviews và admin SKU/upload/stock/conflict/permissions/last-admin/retention/queue. Tổng63 state samples đều nằm trên page08; bảng trên chỉ chọn nhánh auth để tránh lặp toàn bộ inventory.

## Tiêu chí hoàn tất đọc tài liệu

- FIGMA-READ-AC1: inventory đủ10 page; kiểm77 mã có đủ cặp desktop/mobile — đạt bằng node IDs thật.
- FIGMA-READ-AC2: đọc layout/text/interaction config, typography, tokens và screenshot đại diện; chỉ ra giới hạn/proposal — đạt. Không tuyên bố đã chạy app/backend hay click hết prototype.
- FIGMA-READ-AC3: link map trỏ đúng key và IDs đã đọc; ghi issue có node dẫn chứng — kiểm trước commit.
- Chưa làm: sửa Figma/cắt ảnh asset/viết frontend hoặc auth; không có application tests cần chạy cho thay đổi Markdown-only này.

Tài liệu là snapshot ngày đọc, không tự đồng bộ khi Figma thay đổi. Trước implement screen phải đọc lại node hiện tại qua MCP; nếu gọi get_design_context phải nạp skill figma-design-to-code trước.
