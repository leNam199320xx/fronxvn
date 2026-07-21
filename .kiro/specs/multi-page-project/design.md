# Tài liệu Thiết kế: Multi-Page Project

## Tổng quan

Tính năng **Multi-Page Project** mở rộng HTML Studio từ một canvas đơn lên hệ thống nhiều trang trong cùng một project. Người dùng quản lý các trang qua Tab Bar nằm giữa toolbar và canvas, mỗi trang có history undo/redo độc lập, và toàn bộ project được serialize/deserialize sang JSON v2.0 cùng hỗ trợ backward compatibility với format cũ.

Thiết kế tuân thủ nguyên tắc kiến trúc hiện tại: **Vanilla JS ES6 modules**, không framework, không build tool, giao tiếp qua **EventBus singleton**.

---

## Kiến trúc

### Luồng dữ liệu tổng thể

```mermaid
flowchart TD
    User([Người dùng]) -->|Click tab / nút "+"| TabBar[Tab Bar DOM]
    TabBar -->|EventBus events| PageManager[PageManager]
    PageManager -->|Đọc/Ghi canvas.innerHTML| Canvas[Canvas DOM]
    PageManager -->|Swap undoStack/redoStack| History[History module]
    PageManager -->|emit layer:refresh| LayerPanel[LayerPanel]
    PageManager -->|emit selection:deselect| Selection[Selection module]
    PageManager -->|emit overlay:clear| Overlay[Overlay module]
    ProjectManager[ProjectManager] -->|serialize pages[]| LocalStorage[(localStorage)]
    ProjectManager -->|deserialize pages[]| PageManager
    ExportManager[ExportManager] -->|đọc pages[]| ZIP[ZIP download]
```

### Phân tách trách nhiệm

| Module | Trách nhiệm |
|--------|-------------|
| `PageManager` | CRUD trang, switch trang, render Tab Bar, manage page history state |
| `ProjectManager` | Serialize/deserialize JSON v2.0, auto-save, backward compat |
| `ExportManager` | Sinh HTML per-page, slug filename, đóng gói ZIP |
| `History` | Undo/redo stack (chỉ thao tác trên active page) |
| `EventBus` | Kênh giao tiếp duy nhất giữa các module |

### Nguyên tắc thiết kế chính

1. **PageManager không import module ngoài EventBus** — mọi giao tiếp qua events.
2. **Switch trang là atomic** — serialize trước, restore sau, không để canvas ở trạng thái dở.
3. **History được swap, không được nhân bản** — một `History` instance duy nhất, `undoStack`/`redoStack` được thay thế khi switch trang.
4. **Project JSON v2.0 backward compatible** — đọc được format v1.0 có trường `elements`.

---

## Components và Interfaces

### PageManager (`js/page-manager.js`)

Module mới, khởi tạo bởi `Editor._initModules()`.

```javascript
class PageManager {
    constructor(editor)

    // Public API
    addPage()                          // Tạo trang mới, switch đến trang đó
    switchPage(pageId)                 // Switch sang trang theo id
    deletePage(pageId)                 // Xóa trang
    duplicatePage(pageId)              // Nhân bản trang
    renamePage(pageId, newName)        // Đổi tên trang

    // Serialization (dùng bởi ProjectManager, ExportManager)
    getPages()                         // Trả về mảng Page objects (đã serialize active page)
    loadPages(pagesArray)              // Khôi phục từ mảng Page objects

    // Tab Bar
    _renderTabBar()                    // Re-render toàn bộ tab bar
    _buildTabElement(page)             // Tạo DOM cho 1 tab

    // Internal
    _saveCurrentPageState()            // Serialize canvas → active page data
    _restorePageState(page)            // Deserialize page data → canvas
    _generatePageId()                  // Sinh id theo format page-{ts}-{random}
    _generatePageName()                // Sinh tên "Page N"
    _showTabContextMenu(pageId, x, y)  // Hiển thị context menu của tab
}
```

**Sự kiện lắng nghe:**

| Event | Hành động |
|-------|-----------|
| `page:add` | Tạo trang mới |
| `page:switch` | Switch sang pageId |
| `page:delete` | Xóa trang |
| `page:duplicate` | Nhân bản trang |
| `page:rename` | Đổi tên trang |

**Sự kiện phát ra:**

| Event | Payload | Mô tả |
|-------|---------|-------|
| `page:switched` | `{ pageId, pageName }` | Sau khi switch thành công |
| `page:renamed` | `{ pageId, newName }` | Sau khi đổi tên |
| `page:added` | `{ pageId }` | Sau khi thêm trang |
| `page:deleted` | `{ pageId }` | Sau khi xóa trang |
| `layer:refresh` | — | Để LayerPanel refresh |
| `history:changed` | `{ canUndo, canRedo }` | Sau khi swap history |

### Tab Bar DOM

Tab Bar được render động bởi `PageManager`, insert vào DOM ngay sau `.editor-toolbar`:

```html
<div id="page-tab-bar">
    <div class="page-tab active" data-page-id="page-xxx">
        <span class="page-tab-name" title="Home">Home</span>
    </div>
    <div class="page-tab" data-page-id="page-yyy">
        <span class="page-tab-name" title="About Us">About Us</span>
    </div>
    <button id="page-tab-add" title="Thêm trang">+</button>
</div>
```

### ProjectManager — thay đổi

Sửa ba phương thức:

- `_getProjectData()` — serialize sang format v2.0 với `pages[]`
- `_loadProject(project)` — dispatch sang `pageManager.loadPages()`, handle backward compat
- `_autoLoad()` — kiểm tra `pages[]` thay vì `elements[]`

### ExportManager — thay đổi

Sửa `_downloadZip()`:

```javascript
async _downloadZip() {
    const pages = this.editor.pageManager.getPages();
    const css   = this.exportCSS();
    // Sinh HTML per-page, resolve filename conflicts
    // pages[0] → index.html, pages[1..n] → slug.html
}
```

---

## Data Models

### Page Object

```javascript
{
    id: 'page-1748920012345-x7k2p',  // page-{timestamp}-{random 5 chars}
    name: 'Home',                     // Tên trang (không rỗng)
    html: '<div data-editor-element ...>...</div>',  // innerHTML của canvas
    bpStyles: {
        // Map: elementId → __bpStyles object
        'el-123': {
            tablet: { width: '100%', left: '0px' },
            mobile: { ... }
        }
    },
    historyState: {
        undoStack: [],   // Serialized history (Element references → null khi serialize)
        redoStack: []
    },
    meta: {              // SEO per-page (tùy chọn, dùng project meta nếu thiếu)
        title: '',
        description: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        canonical: ''
    }
}
```

> **Lưu ý về historyState:** History chứa references đến DOM elements. Khi switch trang, `PageManager` lưu `undoStack[]` và `redoStack[]` references vào `page.historyState` trong memory (không serialize sang JSON). Khi load project từ file/localStorage, history luôn được clear.

### Project JSON v2.0

```json
{
    "version": "2.0",
    "timestamp": 1748920012345,
    "meta": {
        "title": "",
        "description": "",
        "ogTitle": "",
        "ogDescription": "",
        "ogImage": "",
        "canonical": ""
    },
    "pages": [
        {
            "id": "page-1748920012345-x7k2p",
            "name": "Home",
            "html": "...",
            "bpStyles": {},
            "meta": {}
        }
    ]
}
```

### Backward Compatibility (v1.0 → v2.0)

Khi `ProjectManager._loadProject()` gặp JSON có trường `elements` (format v1.0):

```javascript
// Detect format cũ
if (project.elements && !project.pages) {
    // Deserialize elements lên canvas tạm thời để lấy innerHTML
    // Wrap thành 1-page project
    project = {
        version: '2.0',
        pages: [{
            id: 'page-legacy-0001',
            name: 'Page 1',
            html: serializedHtmlFromElements,
            bpStyles: extractedBpStyles,
            meta: project.meta || {}
        }]
    };
}
```

### Slug filename (Export)

```javascript
function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'page';
}

// Resolve conflicts
function resolveFilenames(pages) {
    const seen = new Map();   // slug → count
    return pages.map((page, i) => {
        if (i === 0) return 'index.html';
        const base = slugify(page.name);
        const count = seen.get(base) || 0;
        seen.set(base, count + 1);
        return count === 0 ? `${base}.html` : `${base}-${count + 1}.html`;
    });
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Tab count phản ánh page count

*For any* mảng pages[] với ít nhất 1 phần tử, số lượng tab được render trong Tab Bar phải bằng đúng số phần tử trong mảng pages[].

**Validates: Requirements 1.2**

---

### Property 2: Active tab luôn khớp với Active Page

*For any* pageId hợp lệ trong danh sách pages[], sau khi set trang đó làm Active Page, đúng và chỉ đúng một tab có class `active` và tab đó phải có `data-page-id` bằng pageId đã set.

**Validates: Requirements 1.4, 3.3**

---

### Property 3: Tên trang dài bị cắt ngắn đúng

*For any* tên trang có độ dài > 20 ký tự, văn bản hiển thị trong tab phải bị cắt ngắn (có dấu `...`) và thuộc tính `title` của phần tử tab phải chứa tên đầy đủ không cắt.

**Validates: Requirements 1.5**

---

### Property 4: Page id luôn duy nhất

*For any* số lần gọi `addPage()` và `duplicatePage()` trong cùng một session, tất cả id được sinh ra phải khác nhau và phải match regex `^page-\d+-[a-z0-9]+$`.

**Validates: Requirements 2.1, 2.3**

---

### Property 5: Trang mới tạo trở thành Active Page

*For any* trạng thái ban đầu của project (bất kỳ số trang nào), sau khi gọi `addPage()`, trang vừa tạo phải trở thành Active Page.

**Validates: Requirements 2.2**

---

### Property 6: Switch trang khôi phục canvas đúng nội dung

*For any* project có ít nhất 2 trang với nội dung khác nhau, sau khi switch từ trang A sang trang B rồi switch lại trang A, `canvas.innerHTML` phải tương đương với nội dung ban đầu của trang A (sau khi serialize/deserialize qua innerHTML).

**Validates: Requirements 3.1**

---

### Property 7: Click active tab là no-op

*For any* trạng thái Active Page, gọi `switchPage(activePageId)` không được thay đổi nội dung canvas, không emit `page:switched`, và không gây bất kỳ side effect nào.

**Validates: Requirements 3.5**

---

### Property 8: Rename không chấp nhận tên rỗng

*For any* tên trang hiện tại và bất kỳ chuỗi nào gồm toàn whitespace, gọi `renamePage(pageId, whitespaceString)` phải giữ nguyên tên trang cũ và không emit `page:renamed`.

**Validates: Requirements 4.3**

---

### Property 9: Trang nhân bản có nội dung giống hệt trang gốc

*For any* Page với bất kỳ nội dung html và bpStyles nào, sau khi `duplicatePage(pageId)`, trang mới được tạo ra phải có `html` và `bpStyles` giống hệt trang gốc tại thời điểm nhân bản (deep equality), và có `id` khác với trang gốc.

**Validates: Requirements 5.1**

---

### Property 10: Project luôn có ít nhất 1 trang (invariant)

*For any* chuỗi thao tác delete trang bất kỳ, `pages.length` không bao giờ giảm xuống dưới 1. Nếu chỉ còn 1 trang, tùy chọn Delete phải bị disabled.

**Validates: Requirements 6.2**

---

### Property 11: Xóa trang active chọn trang liền kề đúng

*For any* project có N ≥ 2 trang và Active Page ở vị trí i (0-indexed), sau khi xóa Active Page, Active Page mới phải là trang tại vị trí i-1 (nếu i > 0) hoặc trang tại vị trí 0 mới (nếu i = 0, tức trang đầu bị xóa).

**Validates: Requirements 6.3**

---

### Property 12: History isolation giữa các trang

*For any* project có ít nhất 2 trang A và B, các thao tác push/undo/redo trên trang A không được thay đổi `undoStack` hoặc `redoStack` của trang B. Cụ thể: sau khi switch từ A sang B và push N actions trên B, switch lại A — stack của A phải giống hệt trước khi switch.

**Validates: Requirements 8.1, 8.3**

---

### Property 13: Project save/load round-trip

*For any* project với bất kỳ số trang, tên, nội dung html và bpStyles nào, gọi `_getProjectData()` rồi `_loadProject()` với kết quả đó phải cho ra project tương đương: cùng số trang, cùng tên trang, và html tương đương (sau normalize whitespace).

**Validates: Requirements 9.1, 9.2**

---

### Property 14: Backward compat với format JSON cũ

*For any* JSON project v1.0 hợp lệ (có trường `elements` thay vì `pages`), `_loadProject()` phải thành công và tạo project với đúng 1 trang chứa toàn bộ elements đó.

**Validates: Requirements 9.5**

---

### Property 15: Export filenames không trùng nhau

*For any* project với bất kỳ số trang và tên trang nào (kể cả khi nhiều trang có tên giống nhau sau khi slug hóa), các filename sinh ra trong ZIP phải đều khác nhau (uniqueness). Trang đầu tiên luôn là `index.html`.

**Validates: Requirements 11.2, 11.3**

---

## Error Handling

### Switch trang thất bại

Switch trang là thao tác quan trọng nhất về tính toàn vẹn dữ liệu. Quy tắc:

1. **Serialize trước, restore sau** — nếu restore thất bại, canvas ở trạng thái trống thay vì corrupted.
2. Bao toàn bộ logic switch trong `try/catch`. Nếu có lỗi:
   - Log lỗi vào console.
   - Emit `page:switch-error` với `{ error, fromPageId, toPageId }`.
   - Restore lại trang nguồn (revert).

```javascript
async switchPage(pageId) {
    if (pageId === this._activePageId) return;  // no-op

    const fromPage = this._findPage(this._activePageId);
    const toPage   = this._findPage(pageId);
    if (!toPage) return;

    try {
        this._saveCurrentPageState();   // serialize canvas → fromPage
        this._clearCanvas();            // clear DOM
        this._restorePageState(toPage); // restore toPage → canvas
        this._activePageId = pageId;
        this._renderTabBar();
        // emit events...
    } catch (err) {
        console.error('[PageManager] switchPage failed:', err);
        // Revert: restore lại fromPage
        try { this._restorePageState(fromPage); } catch (_) {}
        eventBus.emit('page:switch-error', { error: err, fromPageId: this._activePageId, toPageId: pageId });
    }
}
```

### Auto-save thất bại (localStorage đầy)

`ProjectManager._autoSave()` bao trong `try/catch`:

```javascript
_autoSave() {
    try {
        const project = this._getProjectData();
        localStorage.setItem(this.autoSaveKey, JSON.stringify(project));
    } catch (e) {
        // QuotaExceededError: không crash, chỉ warn
        console.warn('[ProjectManager] Auto-save failed (storage full?):', e);
    }
}
```

### Export với trang bị lỗi

Nếu một trang có `html` không hợp lệ hoặc gây lỗi khi sinh HTML:
- Skip trang đó, log warning.
- Đảm bảo các trang còn lại vẫn được export.
- Không throw lỗi làm crash toàn bộ ZIP export.

### Đổi tên với input rỗng

`renamePage(pageId, newName)` validate trước khi lưu:

```javascript
renamePage(pageId, newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;  // Giữ nguyên tên cũ, không emit event
    // ...
}
```

### Backward compat thất bại

Nếu JSON không có `pages` lẫn `elements`, hoặc `pages[]` rỗng:
- Log warning.
- Tạo 1 trang trống "Page 1" để editor vẫn dùng được.

---

## Testing Strategy

Tính năng này phù hợp với **Property-Based Testing (PBT)** cho các hàm pure/logic (slug, id generation, page state management) và **Example-based tests** cho UI interactions và event flows.

### Thư viện PBT

Sử dụng **[fast-check](https://fast-check.dev/)** (JavaScript PBT library) — không cần build tool, có thể import qua CDN trong test environment.

### Unit Tests (Example-based)

Các trường hợp cụ thể cần cover:

- Tab Bar render đúng số tab với 1, 2, N trang
- Nút "+" luôn hiển thị ở cuối Tab Bar
- Double-click tab hiển thị input đang focus
- Context menu tab có đúng 3 options: Rename, Duplicate, Delete
- Delete disabled khi chỉ còn 1 trang
- Auto-save không crash khi localStorage throw QuotaExceededError
- Load JSON v1.0 cũ thành công
- `layer:refresh` được emit sau switch trang

### Property-Based Tests

Mỗi property test chạy **tối thiểu 100 iterations**.

Format tag: `Feature: multi-page-project, Property {N}: {mô tả ngắn}`

**Property 1 — Tab count:**
```javascript
// Feature: multi-page-project, Property 1: tab count mirrors page count
fc.assert(fc.property(
    fc.array(fc.record({ id: fc.string(), name: fc.string() }), { minLength: 1 }),
    (pages) => {
        pageManager.loadPages(pages);
        const tabs = tabBar.querySelectorAll('.page-tab').length;
        return tabs === pages.length;
    }
), { numRuns: 100 });
```

**Property 2 — Active tab:**
```javascript
// Feature: multi-page-project, Property 2: active tab matches active page
fc.assert(fc.property(
    fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }),
    fc.nat(),
    (pageNames, idx) => {
        // setup pages, switch to pages[idx % pages.length]
        // verify exactly one tab has class 'active' with correct data-page-id
    }
), { numRuns: 100 });
```

**Property 4 — ID uniqueness:**
```javascript
// Feature: multi-page-project, Property 4: page ids are always unique
fc.assert(fc.property(
    fc.integer({ min: 1, max: 50 }),
    (n) => {
        const ids = Array.from({ length: n }, () => pageManager._generatePageId());
        return new Set(ids).size === ids.length &&
               ids.every(id => /^page-\d+-[a-z0-9]+$/.test(id));
    }
), { numRuns: 100 });
```

**Property 12 — History isolation:**
```javascript
// Feature: multi-page-project, Property 12: history isolation between pages
fc.assert(fc.property(
    fc.array(fc.record({ ... }), { minLength: 2 }),
    fc.array(fc.anything(), { minLength: 1 }),
    (pages, actions) => {
        // Load pages, record stack of page A
        // Switch to page B, push actions
        // Switch back to page A
        // Stack of page A must equal original
    }
), { numRuns: 100 });
```

**Property 13 — Save/load round-trip:**
```javascript
// Feature: multi-page-project, Property 13: project save/load round-trip
fc.assert(fc.property(
    fc.array(fc.record({
        name: fc.string({ minLength: 1 }),
        html: fc.string(),
        bpStyles: fc.object()
    }), { minLength: 1, maxLength: 10 }),
    (pagesData) => {
        pageManager.loadPages(pagesData);
        const serialized = projectManager._getProjectData();
        projectManager._loadProject(serialized);
        const restored = pageManager.getPages();
        return restored.length === pagesData.length &&
               restored.every((p, i) => p.name === pagesData[i].name);
    }
), { numRuns: 100 });
```

**Property 15 — Export filename uniqueness:**
```javascript
// Feature: multi-page-project, Property 15: export filenames are always unique
fc.assert(fc.property(
    fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
    (pageNames) => {
        const filenames = resolveFilenames(pageNames.map(name => ({ name })));
        return new Set(filenames).size === filenames.length &&
               filenames[0] === 'index.html';
    }
), { numRuns: 200 });
```

### Integration Tests

- Load project từ localStorage và kiểm tra Tab Bar render đúng
- Switch trang nhiều lần liên tiếp, xác nhận canvas không bị corrupt
- Export ZIP với project 3 trang, xác nhận ZIP chứa đúng số file HTML + 1 style.css

### Testing Coverage ưu tiên

1. **Cao nhất:** Property 12 (history isolation), Property 15 (filename uniqueness), Property 6 (switch round-trip)
2. **Trung bình:** Property 13 (save/load round-trip), Property 9 (duplicate copy)
3. **Thấp hơn:** Property 3 (text truncation), Property 8 (rename validation)
