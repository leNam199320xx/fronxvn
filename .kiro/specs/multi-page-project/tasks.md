# Kế hoạch Triển khai: Multi-Page Project

## Tasks

- [x] 1. Tạo file `js/page-manager.js` với skeleton class PageManager
  - Tạo file mới `js/page-manager.js` với class `PageManager`
  - Định nghĩa constructor nhận `editor` instance, khởi tạo `this._pages = []`, `this._activePageId = null`, `this._eventBus = editor.eventBus`
  - Cài đặt `_generatePageId()` sinh id theo format `page-{timestamp}-{random5chars}`
  - Cài đặt `_generatePageName()` trả về `"Page N"` dựa trên `this._pages.length + 1`
  - Đăng ký listeners cho các events: `page:add`, `page:switch`, `page:delete`, `page:duplicate`, `page:rename`
  - Export module theo pattern hiện tại của project

- [x] 2. Cài đặt Tab Bar DOM và CSS
  - Thêm phần tử `<div id="page-tab-bar"></div>` vào `index.html`, nằm giữa `.editor-toolbar` và `#canvas-wrapper`
  - Thêm CSS cho `#page-tab-bar`, `.page-tab`, `.page-tab.active`, `.page-tab-name`, `#page-tab-add` vào `css/editor.css`
  - CSS phải bao gồm: truncate tên dài bằng `text-overflow: ellipsis`, highlight tab active, hover state, layout flexbox ngang
  - Cài đặt `_renderTabBar()` trong `PageManager` — xóa nội dung cũ và build lại toàn bộ Tab Bar từ `this._pages`
  - Cài đặt `_buildTabElement(page)` — tạo DOM cho 1 tab với `data-page-id`, `title` đầy đủ, tên bị cắt nếu > 20 ký tự, gắn event listeners click và dblclick

- [x] 3. Cài đặt `addPage()` — thêm trang mới
- [x] 4. Cài đặt `switchPage(pageId)` — chuyển đổi giữa các trang
- [x] 5. Cài đặt `renamePage(pageId, newName)` và inline editing
- [x] 6. Cài đặt `duplicatePage(pageId)` — nhân bản trang
- [x] 7. Cài đặt `deletePage(pageId)` — xóa trang
- [x] 8. Cài đặt Tab Context Menu — Rename, Duplicate, Delete
- [x] 9. Tích hợp History swap vào `switchPage()`
- [x] 10. Tích hợp PageManager vào `js/editor.js`
- [x] 11. Cập nhật `js/project.js` — serialize/deserialize format v2.0

- [ ] 12. Cập nhật `js/export.js` — export ZIP đa trang
- [x] 12. Cập nhật `js/export.js` — export ZIP đa trang

- [x] 13. Cài đặt Auto-Save đa trang

- [x] 14. Đảm bảo tính toàn vẹn module hiện tại sau switch trang

- [ ] 15. Viết tests cho logic core
  - Tạo file test (ví dụ `tests/page-manager.test.js`) với các unit test example-based:
    - Tab Bar render đúng số tab với 1, 2, N trang
    - `_generatePageId()` sinh id duy nhất và match regex `^page-\d+-[a-z0-9]+$`
    - `renamePage()` không chấp nhận tên rỗng hoặc toàn whitespace
    - `deletePage()` không làm gì nếu chỉ còn 1 trang
    - Backward compat: load JSON v1.0 có `elements` thành công, tạo ra 1 trang
    - Auto-save không crash khi `localStorage` throw `QuotaExceededError`
  - Viết property-based tests với fast-check (import qua CDN trong test env) cho:
    - Property 4: ID uniqueness sau N lần gọi `_generatePageId()`
    - Property 8: Rename không chấp nhận whitespace-only input
    - Property 15: Export filenames luôn unique, trang đầu luôn là `index.html`
  - Chạy tests và xác nhận tất cả pass
