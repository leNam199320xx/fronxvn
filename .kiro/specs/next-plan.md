# HTML Studio — Next Development Plan

Thứ tự ưu tiên: **Config → C → B → D → A**

---

## Sprint 0 — Config Constants Refactor

**Mục tiêu:** Tập trung toàn bộ magic numbers và hardcoded config vào `js/config.js` trước khi làm các sprint tiếp theo, tránh phải sửa lại sau.  
**Ước tính:** 1 ngày  
**Chi tiết:** xem [config-constants-refactor.md](./config-constants-refactor.md)

### Tóm tắt công việc

Tạo `js/config.js` với tất cả constants, sau đó import vào từng module:

| Module | Values cần extract |
|---|---|
| `editor.js` | `ZOOM_DEFAULT/MIN/MAX/STEP`, `GRID_SIZE`, `GRID_ENABLED_DEFAULT` |
| `drag.js` | `SNAP_THRESHOLD`, `DRAG_MIN_DISTANCE` |
| `resize.js` | `ELEMENT_MIN_SIZE` |
| `rotate.js` | `ROTATE_SNAP_ANGLE` |
| `history.js` | `HISTORY_MAX_SIZE` |
| `project.js` | `AUTOSAVE_STORAGE_KEY`, `AUTOSAVE_DELAY_MS`, `AUTOLOAD_DELAY_MS`, `PROJECT_VERSION` |
| `page-manager.js` | `TAB_NAME_MAX_LENGTH`, `PAGE_ID_RANDOM_LENGTH` |
| `clipboard.js` | `PASTE_OFFSET`, `ELEMENT_ID_RANDOM_LENGTH` |
| `export.js` | `JSZIP_CDN_URL`, `EXPORT_INDENT` |
| `breakpoint-manager.js` | move `BREAKPOINTS` vào config.js |

---

## Sprint C — Context Menu & Quick Actions

**Mục tiêu:** Cải thiện workflow hàng ngày ngay lập tức, không cần thay đổi data model.  
**Ước tính:** 2–3 ngày

### C1. Context Menu đầy đủ

Mở rộng `js/context-menu.js` với các action còn thiếu:

- **Lock / Unlock** — toggle `data-locked`, disable drag/resize/rotate khi locked
- **Hide / Show** — đồng bộ với layer panel visibility toggle hiện có
- **Bring to Front / Send to Back** — thao tác `z-index` tự động (tìm max z-index trên canvas + 1)
- **Move Forward / Move Backward** — tăng/giảm z-index 1 bậc
- **Wrap in Container** — bọc selected elements trong một `div` container mới (tương tự Group nhưng không thay đổi tọa độ tuyệt đối)
- **Separator** phân chia nhóm actions rõ ràng trong menu

### C2. Alt+Drag để Duplicate & Move

Trong `js/drag.js`:

- Khi `mousedown` với `e.altKey === true`, duplicate element trước khi drag
- Element gốc giữ nguyên vị trí, bản copy được drag
- Push `history:push` với `type: 'add'` cho bản copy

### C3. Inline Size Indicator khi Drag/Resize

Trong `js/overlay.js`:

- Hiện `dimensionLabel` (`width × height`) realtime trong khi đang drag hoặc resize, không chỉ khi selected
- Hiện `positionLabel` (`x, y`) realtime khi drag
- Tự ẩn sau 1 giây khi dừng thao tác

### C4. Double-Click Image → File Picker

Trong `js/selection.js` tại `_handleDoubleClick`:

- Nếu element là `<img>` (hoặc `data-type="image"`), mở `<input type="file" accept="image/*">`
- Sau khi chọn file, convert sang `data:URL` và set vào `src`
- Push `history:push` với `type: 'style'` (prop: `src`)

### C5. Keyboard shortcut bổ sung

Trong `js/editor.js` tại `_handleKeydown`:

- `Ctrl+L` — Lock/Unlock selected element
- `Ctrl+H` — Hide/Show selected element  
- `Ctrl+]` — Bring Forward
- `Ctrl+[` — Send Backward
- `Ctrl+Shift+]` — Bring to Front
- `Ctrl+Shift+[` — Send to Back

---

## Sprint B — HTML Quality Engine

**Mục tiêu:** Differentiator rõ nhất của HTML Studio — phân tích chất lượng HTML ngay trong editor.  
**Ước tính:** 4–6 ngày

### B1. Module `js/quality-engine.js`

Module mới, khởi tạo bởi `editor.js`. Chạy scan sau mỗi `element:added`, `element:updated`, `element:deleted`, `layer:refresh` (debounce 800ms).

**Checks cần implement:**

| ID | Severity | Mô tả |
|----|----------|-------|
| `alt-missing` | error | `<img>` không có `alt` attribute |
| `empty-heading` | warning | `<h1>`–`<h6>` không có text content |
| `label-missing` | error | `<input>` không có `<label>` hoặc `aria-label` |
| `duplicate-id` | error | Nhiều elements có cùng `id` trên canvas |
| `element-too-small` | warning | width hoặc height < 20px |
| `deep-nesting` | info | Nesting level > 5 |
| `missing-heading-h1` | warning | Canvas không có `<h1>` nào |
| `low-contrast` | warning | Text color vs background color ratio < 4.5 (WCAG AA) |
| `empty-link` | error | `<a>` không có `href` hoặc text content |
| `autoplay-video` | warning | `<video>` có `autoplay` nhưng không có `muted` |

**Output:** mảng `Issue[]`:
```javascript
{
    id: 'alt-missing',
    severity: 'error' | 'warning' | 'info',
    element: HTMLElement,
    message: 'Image missing alt attribute',
    suggestion: 'Add alt="" for decorative images or alt="description" for informative images'
}
```

### B2. Visual Badge trên Canvas

Trong `js/overlay.js` hoặc module riêng:

- Gắn badge nhỏ (🔴/🟡/🔵) lên góc trên-phải của element có issue
- Badge hiện khi hover element, luôn hiện khi `Quality Mode` bật
- Click badge → mở Issues Panel và highlight issue tương ứng

### B3. Issues Panel

Tab mới `"Quality"` trong right panel (bên cạnh Elements / Templates / Layers / Theme):

- List tất cả issues, nhóm theo severity (Errors → Warnings → Info)
- Mỗi issue: icon severity + tên element + message ngắn + nút "Fix" hoặc "Go to"
- Click "Go to" → select element trên canvas, scroll vào view
- Click "Fix" (với các lỗi auto-fixable như `alt-missing`) → tự thêm attribute
- Header hiện tổng: `3 errors · 5 warnings · 2 info`

### B4. Quality Score

Ở cuối Issues Panel:

- Score 0–100 tổng hợp từ errors (−10 mỗi cái) + warnings (−3) + info (−1)
- Màu: đỏ < 60, vàng 60–80, xanh > 80
- Hiện score nhỏ trên toolbar (badge bên cạnh Export button)

---

## Sprint D — Component System

**Mục tiêu:** Foundation cho reuse và Marketplace. Thay đổi data model đáng kể.  
**Ước tính:** 7–10 ngày

### D1. Component Definition

Thêm `components[]` vào project JSON v2.1:

```json
{
    "version": "2.1",
    "components": [
        {
            "id": "comp-xxx",
            "name": "Hero Section",
            "html": "...",
            "bpStyles": {},
            "slots": ["heading", "subheading", "cta-button"],
            "thumbnail": "data:image/png;base64,..."
        }
    ],
    "pages": [...]
}
```

Module mới `js/component-manager.js`.

### D2. Create Component

Từ context menu hoặc toolbar khi element/group được chọn:

- "Save as Component" → extract `innerHTML` thành component definition
- Mở dialog đặt tên, chọn slots (các text node / img src có thể override)
- Lưu vào `project.components[]`

### D3. Component Instance

Khi insert component từ library vào canvas:

- Element được wrap với `data-component-id="comp-xxx"` và `data-instance-id="inst-yyy"`
- `innerHTML` là bản copy của definition, nhưng slot overrides được lưu riêng trong instance
- Double-click text slot → edit instance override (không ảnh hưởng definition)

### D4. Component Library Panel

Tab mới `"Components"` trong right panel:

- Grid thumbnail các components đã tạo
- Drag & drop component từ panel lên canvas để tạo instance
- Edit definition → cập nhật tất cả instances trên tất cả pages

### D5. Detach Instance

Context menu trên component instance:

- "Detach from Component" → chuyển thành plain HTML, mất link với definition
- Sau detach có thể chỉnh sửa tự do

### D6. Export với Component awareness

`ExportManager._generatePageHTML()` cần inline slot overrides vào HTML khi export — không export component refs, chỉ export final HTML.

---

## Sprint A — Template Marketplace

**Mục tiêu:** Ship templates thực tế, khai thác Component System từ Sprint D.  
**Ước tính:** 3–5 ngày (sau khi có Sprint D)

### A1. Template Definitions

Tạo `js/templates/` folder với các template JSON:

| Template | Pages | Mô tả |
|----------|-------|-------|
| `landing-page` | 1 | Hero + Features + CTA + Footer |
| `portfolio` | 3 | Home, Projects, Contact |
| `blog-post` | 2 | Article page + Archive |
| `restaurant` | 4 | Home, Menu, About, Contact |
| `pricing` | 1 | Pricing table + FAQ |
| `coming-soon` | 1 | Minimal splash page |

Mỗi template là một project JSON v2.1 hợp lệ — có thể được load trực tiếp qua `projectManager.loadProject()`.

### A2. Template Picker UI

Thay thế nội dung tab Templates hiện tại bằng:

- Grid dạng card, mỗi card có thumbnail (ảnh PNG tĩnh), tên template, số trang
- Filter bar: All / Landing / Portfolio / Blog / Business
- Search input
- Click card → preview (mở modal full-screen preview)

### A3. Insert Modes

Hai cách dùng template:

- **"New Project"** — load toàn bộ project, replace current (confirm dialog nếu có unsaved changes)
- **"Insert Page"** — thêm các pages của template vào project hiện tại, không xóa pages cũ

### A4. Thumbnail Generator

Utility để sinh thumbnail tự động từ template JSON (dùng khi develop, không ship runtime):

- Render template lên offscreen canvas
- `html2canvas` → PNG base64
- Lưu vào `js/templates/{name}.thumbnail.js` dạng exported constant

---

## Dependency Graph

```
Sprint C  ──────────────────────────────►  có thể ship độc lập
    │
    ▼
Sprint B  ──────────────────────────────►  có thể ship độc lập
    │
    ▼
Sprint D  ──────────────────────────────►  cần trước Sprint A
    │
    ▼
Sprint A  ──────────────────────────────►  cần Sprint D xong
```

Sprint C và B không phụ thuộc nhau — có thể chạy song song nếu có nhiều người.

---

## Versioning

| Sprint | Version | Mô tả |
|--------|---------|-------|
| 0 (Config) | v0.3.1 | Config constants refactor |
| C | v0.3.5 | Quick actions, UX polish |
| B | v0.4.0 | HTML Quality Engine |
| D | v0.5.0 | Component System |
| A | v0.6.0 | Template Marketplace |
