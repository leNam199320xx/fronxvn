# Tài liệu Yêu cầu

## Giới thiệu

Tính năng **Multi-Page Project** cho phép người dùng quản lý nhiều trang HTML trong cùng một project của HTML Studio. Mỗi trang là một canvas độc lập với lịch sử thao tác (undo/redo) riêng biệt. Người dùng có thể thêm, xóa, nhân bản, đặt tên lại và chuyển đổi giữa các trang thông qua tab bar hiển thị phía trên canvas. Dữ liệu đa trang được lưu trong cấu trúc JSON của project và có thể export thành nhiều file HTML riêng lẻ.

---

## Bảng chú giải

- **Page_Manager**: Module ES6 mới (`js/page-manager.js`) điều phối toàn bộ logic đa trang, giao tiếp với các module khác qua EventBus.
- **Tab_Bar**: Thanh tab nằm giữa toolbar và canvas-wrapper, hiển thị danh sách trang của project hiện tại.
- **Page**: Đơn vị dữ liệu đại diện cho một trang HTML, bao gồm `id`, `name`, `html` (snapshot nội dung canvas), `bpStyles` (breakpoint style overrides), và `meta` (SEO metadata riêng của trang).
- **Active_Page**: Trang đang được hiển thị và chỉnh sửa trên canvas tại một thời điểm.
- **Page_History**: Một instance `History` độc lập gắn liền với từng trang, lưu trữ ngăn xếp undo/redo riêng.
- **Editor**: Module orchestrator `js/editor.js`, quản lý canvas và các module con.
- **Project_Manager**: Module `js/project.js`, chịu trách nhiệm serialize/deserialize toàn bộ project sang/từ JSON.
- **Export_Manager**: Module `js/export.js`, chịu trách nhiệm sinh HTML/CSS và đóng gói ZIP.
- **EventBus**: Singleton `js/event-bus.js`, kênh giao tiếp trung tâm giữa các module.
- **Canvas_Snapshot**: Chuỗi HTML (`innerHTML`) biểu diễn trạng thái hiện tại của canvas, được serialize trước khi chuyển trang.
- **Context_Menu**: Menu chuột phải, hiện được dùng cho element; sẽ được mở rộng cho tab.

---

## Yêu cầu

### Yêu cầu 1: Hiển thị Tab Bar

**User Story:** Là một người dùng, tôi muốn thấy danh sách các trang dưới dạng tab phía trên canvas, để tôi biết mình đang ở trang nào và có thể điều hướng nhanh giữa các trang.

#### Tiêu chí chấp nhận

1. THE `Tab_Bar` SHALL được render vào DOM, nằm giữa phần tử `.editor-toolbar` và phần tử `#canvas-wrapper` trong `index.html`.
2. WHEN dự án có ít nhất một trang, THE `Tab_Bar` SHALL hiển thị một tab cho mỗi trang với tên trang tương ứng.
3. THE `Tab_Bar` SHALL hiển thị nút "+" ở cuối danh sách tab để thêm trang mới.
4. WHEN `Active_Page` thay đổi, THE `Tab_Bar` SHALL áp dụng trạng thái highlight (class `active`) lên tab tương ứng và xóa trạng thái này khỏi các tab còn lại.
5. WHILE tên một trang vượt quá 20 ký tự, THE `Tab_Bar` SHALL hiển thị tên bị cắt ngắn với dấu ellipsis (`...`) và hiện tên đầy đủ qua thuộc tính `title` của phần tử tab.

---

### Yêu cầu 2: Thêm Trang Mới

**User Story:** Là một người dùng, tôi muốn tạo trang mới với canvas trống, để tôi có thể thiết kế các trang khác nhau trong cùng một project.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn nút "+" trên `Tab_Bar`, THE `Page_Manager` SHALL tạo một `Page` mới với `id` duy nhất, `name` mặc định là "Page N" (N là số thứ tự trang tiếp theo), canvas rỗng, và `Page_History` trống.
2. WHEN một `Page` mới được tạo, THE `Page_Manager` SHALL tự động switch sang trang mới đó và làm cho trang đó trở thành `Active_Page`.
3. THE `Page_Manager` SHALL sinh `id` trang theo định dạng `page-{timestamp}-{random}` để đảm bảo tính duy nhất.
4. WHEN một `Page` mới được tạo, THE `Tab_Bar` SHALL cập nhật và hiển thị tab mới ngay lập tức.

---

### Yêu cầu 3: Chuyển Đổi Giữa Các Trang

**User Story:** Là một người dùng, tôi muốn nhấn vào một tab để chuyển sang trang tương ứng, để tôi có thể chỉnh sửa từng trang độc lập.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn vào một tab của trang chưa được active, THE `Page_Manager` SHALL thực hiện tuần tự: (a) serialize `innerHTML` của canvas hiện tại vào `Page.html` của `Active_Page`; (b) lưu trạng thái `Page_History` hiện tại vào `Active_Page`; (c) clear canvas; (d) clear selection; (e) clear overlay/guides; (f) restore `Page.html` của trang đích lên canvas; (g) restore `Page_History` của trang đích; (h) cập nhật `Active_Page`.
2. WHEN switch trang hoàn thành, THE `EventBus` SHALL emit sự kiện `page:switched` với payload `{ pageId, pageName }`.
3. WHEN switch trang hoàn thành, THE `Tab_Bar` SHALL cập nhật trạng thái highlight đúng với `Active_Page` mới.
4. WHEN switch trang hoàn thành, THE `Editor` SHALL emit `layer:refresh` để layer panel phản ánh nội dung trang mới.
5. IF người dùng nhấn vào tab của trang đang là `Active_Page`, THEN THE `Page_Manager` SHALL không thực hiện bất kỳ thao tác nào.

---

### Yêu cầu 4: Đổi Tên Trang

**User Story:** Là một người dùng, tôi muốn đổi tên trang để đặt tên có nghĩa như "Home", "About", "Contact", thay vì tên mặc định "Page N".

#### Tiêu chí chấp nhận

1. WHEN người dùng double-click vào một tab, THE `Tab_Bar` SHALL thay thế văn bản tên tab bằng một `<input>` text được focus sẵn, chứa giá trị là tên trang hiện tại.
2. WHEN người dùng nhấn phím Enter hoặc `<input>` bị blur, THE `Page_Manager` SHALL cập nhật `Page.name` với giá trị mới và render lại tab.
3. IF giá trị `<input>` sau khi trim là chuỗi rỗng, THEN THE `Page_Manager` SHALL giữ nguyên tên trang cũ và hủy thao tác đổi tên.
4. WHEN người dùng chọn "Rename" từ context menu của tab, THE `Tab_Bar` SHALL kích hoạt chế độ chỉnh sửa tên inline giống như double-click.
5. WHEN tên trang thay đổi, THE `EventBus` SHALL emit sự kiện `page:renamed` với payload `{ pageId, newName }`.

---

### Yêu cầu 5: Nhân Bản Trang

**User Story:** Là một người dùng, tôi muốn nhân bản một trang để tạo trang mới dựa trên nội dung hiện có, tiết kiệm thời gian thiết kế.

#### Tiêu chí chấp nhận

1. WHEN người dùng chọn "Duplicate" từ context menu của tab, THE `Page_Manager` SHALL tạo một `Page` mới với `id` duy nhất, `name` là "{tên trang gốc} Copy", nội dung `html` và `bpStyles` được sao chép từ trang gốc, và `Page_History` trống.
2. WHEN trang được nhân bản, THE `Page_Manager` SHALL chèn tab mới ngay sau tab của trang gốc.
3. WHEN trang được nhân bản, THE `Page_Manager` SHALL tự động switch sang trang nhân bản mới.
4. WHEN nhân bản trang đang là `Active_Page`, THE `Page_Manager` SHALL serialize trạng thái canvas hiện tại trước khi nhân bản để đảm bảo dữ liệu mới nhất được sao chép.

---

### Yêu cầu 6: Xóa Trang

**User Story:** Là một người dùng, tôi muốn xóa trang không cần thiết để project gọn gàng hơn.

#### Tiêu chí chấp nhận

1. WHEN người dùng chọn "Delete" từ context menu của tab và project có nhiều hơn 1 trang, THE `Page_Manager` SHALL xóa `Page` tương ứng khỏi danh sách, xóa tab khỏi `Tab_Bar`, và giải phóng `Page_History` của trang đó.
2. IF project chỉ còn 1 trang, THEN THE `Page_Manager` SHALL vô hiệu hóa (disable) tùy chọn "Delete" trong context menu tab.
3. WHEN trang bị xóa là `Active_Page`, THE `Page_Manager` SHALL tự động switch sang trang liền kề (ưu tiên trang trước, nếu không có thì trang sau).
4. WHEN trang không phải `Active_Page` bị xóa, THE `Page_Manager` SHALL không thay đổi canvas hiện tại.

---

### Yêu cầu 7: Context Menu của Tab

**User Story:** Là một người dùng, tôi muốn right-click vào tab để thấy menu thao tác nhanh, để tôi không phải tìm kiếm các nút chức năng ở nơi khác.

#### Tiêu chí chấp nhận

1. WHEN người dùng right-click vào bất kỳ tab nào trên `Tab_Bar`, THE `Tab_Bar` SHALL hiển thị context menu với các tùy chọn: "Rename", "Duplicate", "Delete".
2. WHEN project chỉ còn 1 trang, THE context menu SHALL hiển thị tùy chọn "Delete" với trạng thái disabled và không thể click.
3. WHEN context menu của tab được hiển thị, THE `Tab_Bar` SHALL đóng mọi context menu khác đang mở (kể cả context menu của element).
4. WHEN người dùng click ra ngoài context menu, THE context menu SHALL đóng lại.

---

### Yêu cầu 8: History Độc Lập theo Trang

**User Story:** Là một người dùng, tôi muốn undo/redo chỉ ảnh hưởng đến trang hiện tại, để tránh vô tình hoàn tác thao tác trên trang khác.

#### Tiêu chí chấp nhận

1. THE `Page_Manager` SHALL duy trì một instance `Page_History` độc lập cho mỗi `Page`.
2. WHEN switch trang, THE `Editor` SHALL gắn `Page_History` của `Active_Page` mới làm history đang hoạt động, thay thế history trước đó.
3. WHEN `history:undo` hoặc `history:redo` được emit, THE `History` module SHALL chỉ thao tác trên ngăn xếp của `Active_Page` hiện tại.
4. WHEN switch trang, THE `EventBus` SHALL emit `history:changed` với trạng thái `canUndo`/`canRedo` phản ánh đúng `Page_History` của trang mới.

---

### Yêu cầu 9: Lưu và Tải Project Đa Trang

**User Story:** Là một người dùng, tôi muốn save/load project bao gồm toàn bộ các trang, để dữ liệu không bị mất khi đóng trình duyệt.

#### Tiêu chí chấp nhận

1. WHEN `project:save` được emit, THE `Project_Manager` SHALL serialize toàn bộ `pages[]` array vào JSON với cấu trúc: `{ version, timestamp, meta, pages: [{ id, name, html, bpStyles, meta }] }`.
2. WHEN `project:save` được emit, THE `Project_Manager` SHALL serialize trạng thái canvas của `Active_Page` hiện tại trước khi lưu để đảm bảo dữ liệu mới nhất được ghi vào.
3. WHEN một file JSON project đa trang được load, THE `Project_Manager` SHALL khôi phục toàn bộ `pages[]` array, render `Tab_Bar`, và tự động activate trang đầu tiên.
4. WHEN project được load, THE `Project_Manager` SHALL xóa toàn bộ history của mọi trang trước khi khôi phục dữ liệu.
5. THE `Project_Manager` SHALL duy trì khả năng đọc (backward compatibility) với định dạng JSON project cũ (single-page, có trường `elements`), bằng cách chuyển đổi dữ liệu thành một mảng `pages[]` gồm 1 phần tử.

---

### Yêu cầu 10: Auto-Save Đa Trang

**User Story:** Là một người dùng, tôi muốn trình duyệt tự động lưu toàn bộ các trang vào localStorage, để tôi không mất dữ liệu khi reload trang.

#### Tiêu chí chấp nhận

1. WHEN bất kỳ thay đổi nào xảy ra trên canvas (`element:added`, `element:deleted`, `element:updated`, `history:changed`), THE `Project_Manager` SHALL lên lịch auto-save với debounce 1 giây.
2. WHEN auto-save kích hoạt, THE `Project_Manager` SHALL serialize toàn bộ `pages[]` (bao gồm trạng thái canvas hiện tại của `Active_Page`) vào localStorage với key `editor-project-autosave`.
3. WHEN trang được tải lại (reload), THE `Project_Manager` SHALL tự động khôi phục project từ localStorage nếu dữ liệu tồn tại và mảng `pages[]` có ít nhất 1 trang.
4. IF auto-save thất bại do vượt quá giới hạn dung lượng localStorage, THEN THE `Project_Manager` SHALL log cảnh báo vào console và không throw lỗi làm crash ứng dụng.

---

### Yêu cầu 11: Export ZIP Đa Trang

**User Story:** Là một người dùng, tôi muốn export toàn bộ project thành các file HTML riêng biệt trong một file ZIP, để tôi có thể deploy trực tiếp lên hosting.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn "Download ZIP" trong dialog Export, THE `Export_Manager` SHALL sinh một file HTML riêng cho mỗi `Page` trong project.
2. THE `Export_Manager` SHALL đặt tên file HTML theo quy tắc: trang đầu tiên là `index.html`, các trang còn lại dùng tên trang được slug hóa (lowercase, khoảng trắng thành `-`, ký tự đặc biệt bị loại bỏ) với đuôi `.html` (ví dụ: "About Us" → `about-us.html`).
3. IF tên file sau khi slug hóa bị trùng với tên file đã có, THEN THE `Export_Manager` SHALL thêm hậu tố số tăng dần (`-2`, `-3`, ...) để đảm bảo tên file duy nhất.
4. THE `Export_Manager` SHALL đóng gói tất cả file HTML và file `style.css` chung vào một file ZIP duy nhất.
5. WHEN sinh HTML cho một trang không phải `Active_Page`, THE `Export_Manager` SHALL sử dụng nội dung `Page.html` đã được serialize thay vì đọc từ canvas hiện tại.
6. WHEN sinh HTML cho `Active_Page`, THE `Export_Manager` SHALL serialize trạng thái canvas hiện tại để đảm bảo export ra nội dung mới nhất.

---

### Yêu cầu 12: Tính Toàn Vẹn Module Hiện Tại

**User Story:** Là một developer, tôi muốn các module hiện tại (history, selection, overlay, property panel, layer panel) vẫn hoạt động đúng sau khi tích hợp multi-page, để không phát sinh lỗi hồi quy.

#### Tiêu chí chấp nhận

1. WHILE `Active_Page` đang được chỉnh sửa, THE `Selection` module SHALL hoạt động bình thường trên canvas của trang đó như khi project chỉ có một trang.
2. WHILE `Active_Page` đang được chỉnh sửa, THE `Overlay` module SHALL render các overlay handle đúng vị trí trên canvas hiện tại.
3. WHEN switch trang, THE `Selection` module SHALL gọi `deselectAll()` để xóa toàn bộ selection trước khi restore canvas mới.
4. WHEN switch trang, THE `Overlay` module SHALL xóa toàn bộ overlay và guide lines trước khi restore canvas mới.
5. WHEN switch trang, THE `Layer_Panel` SHALL refresh và hiển thị layer tree của `Active_Page` mới.
6. THE `Page_Manager` SHALL giao tiếp với tất cả module khác chỉ thông qua `EventBus`, không import trực tiếp các module ngoài `EventBus`.
