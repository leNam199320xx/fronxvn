# Config Constants Refactor

**Mục tiêu:** Tập trung toàn bộ magic numbers và hardcoded config vào một file `js/config.js`, giúp dễ sửa đổi mà không cần tìm kiếm trong từng module.

**Ước tính:** 1 ngày — không thay đổi logic, chỉ extract và import.

---

## File mới: `js/config.js`

Tạo file export tất cả constants:

```javascript
// js/config.js
// ─── Canvas & Zoom ────────────────────────────────────────────────────────────
export const ZOOM_DEFAULT      = 1;
export const ZOOM_MIN          = 0.25;
export const ZOOM_MAX          = 3;
export const ZOOM_STEP         = 0.1;

// ─── Grid ─────────────────────────────────────────────────────────────────────
export const GRID_SIZE         = 10;       // px
export const GRID_ENABLED_DEFAULT = true;

// ─── Canvas dimensions ────────────────────────────────────────────────────────
export const CANVAS_DEFAULT_WIDTH  = '2000px';
export const CANVAS_DEFAULT_HEIGHT = '2000px';
export const CANVAS_MARGIN         = 50;   // px — margin quanh canvas trong container

// ─── Drag & Snap ──────────────────────────────────────────────────────────────
export const SNAP_THRESHOLD    = 5;        // px — khoảng cách để snap vào element khác
export const DRAG_MIN_DISTANCE = 3;        // px — drag nhỏ hơn này bị bỏ qua (tránh micro-drag)

// ─── Resize ───────────────────────────────────────────────────────────────────
export const ELEMENT_MIN_SIZE  = 20;       // px — kích thước tối thiểu khi resize

// ─── Rotate ───────────────────────────────────────────────────────────────────
export const ROTATE_SNAP_ANGLE = 15;       // degrees — Shift+rotate snap theo bội số này

// ─── History ──────────────────────────────────────────────────────────────────
export const HISTORY_MAX_SIZE  = 100;      // số actions tối đa lưu trong undo stack

// ─── Clipboard & Paste ────────────────────────────────────────────────────────
export const PASTE_OFFSET      = 20;       // px — offset X/Y khi paste hoặc duplicate

// ─── Project / Auto-save ──────────────────────────────────────────────────────
export const AUTOSAVE_STORAGE_KEY  = 'editor-project-autosave';
export const AUTOSAVE_DELAY_MS     = 1000; // ms — debounce delay trước khi auto-save
export const AUTOLOAD_DELAY_MS     = 100;  // ms — delay trước khi auto-load khi init
export const PROJECT_VERSION       = '2.0';

// ─── Page Manager ─────────────────────────────────────────────────────────────
export const TAB_NAME_MAX_LENGTH   = 20;   // ký tự — tên tab dài hơn sẽ bị truncate
export const PAGE_ID_RANDOM_LENGTH = 5;    // số ký tự random trong page id

// ─── Breakpoints (đồng bộ với breakpoint-manager.js) ─────────────────────────
export const BREAKPOINTS = {
    desktop: { label: 'Desktop', icon: '🖥', width: null, mediaQuery: null },
    tablet:  { label: 'Tablet',  icon: '📱', width: 768,  mediaQuery: '(max-width: 768px)' },
    mobile:  { label: 'Mobile',  icon: '📲', width: 375,  mediaQuery: '(max-width: 375px)' }
};

// ─── Export ───────────────────────────────────────────────────────────────────
export const JSZIP_CDN_URL     = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
export const EXPORT_INDENT     = '    ';   // 4 spaces — indent trong HTML export

// ─── Element ID generation ────────────────────────────────────────────────────
export const ELEMENT_ID_RANDOM_LENGTH = 5; // số ký tự random trong element id
```

---

## Tasks

- [x] Task 1 — Tạo `js/config.js`
- [x] Task 2 — Cập nhật `js/editor.js`
- [x] Task 3 — Cập nhật `js/drag.js`
- [x] Task 4 — Cập nhật `js/resize.js`
- [x] Task 5 — Cập nhật `js/rotate.js`
- [x] Task 6 — Cập nhật `js/history.js`
- [x] Task 7 — Cập nhật `js/project.js`
- [x] Task 8 — Cập nhật `js/page-manager.js`
- [x] Task 9 — Cập nhật `js/clipboard.js`
- [x] Task 10 — Cập nhật `js/export.js`
- [x] Task 11 — Cập nhật `js/breakpoint-manager.js`
- [x] Task 12 — Cập nhật `js/project.js` backward compat + element-panel, group-manager, template-manager

---

### Task 2 — Cập nhật `js/editor.js`

Import và dùng constants thay cho hardcoded values:

```javascript
import { ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, GRID_SIZE, GRID_ENABLED_DEFAULT } from './config.js';

// Trong constructor:
this.zoom        = ZOOM_DEFAULT;
this.minZoom     = ZOOM_MIN;
this.maxZoom     = ZOOM_MAX;
this.zoomStep    = ZOOM_STEP;
this.gridEnabled = GRID_ENABLED_DEFAULT;
this.gridSize    = GRID_SIZE;
```

**Thay đổi:** 6 values trong constructor.

---

### Task 3 — Cập nhật `js/drag.js`

```javascript
import { SNAP_THRESHOLD, DRAG_MIN_DISTANCE } from './config.js';

// Trong constructor:
this.snapThreshold = SNAP_THRESHOLD;

// Trong _handleRubberBandUp:
if (x2 - x1 < DRAG_MIN_DISTANCE && y2 - y1 < DRAG_MIN_DISTANCE) return;
// (hiện đang hardcode là 5 — rename thành DRAG_MIN_DISTANCE để rõ nghĩa hơn)
```

**Thay đổi:** 2 values.

---

### Task 4 — Cập nhật `js/resize.js`

```javascript
import { ELEMENT_MIN_SIZE } from './config.js';

// Trong _handleMouseMove:
const minSize = ELEMENT_MIN_SIZE;
```

**Thay đổi:** 1 value.

---

### Task 5 — Cập nhật `js/rotate.js`

```javascript
import { ROTATE_SNAP_ANGLE } from './config.js';

// Trong _handleMouseMove:
rotation = Math.round(rotation / ROTATE_SNAP_ANGLE) * ROTATE_SNAP_ANGLE;
```

**Thay đổi:** 1 value.

---

### Task 6 — Cập nhật `js/history.js`

```javascript
import { HISTORY_MAX_SIZE } from './config.js';

// Trong constructor:
this.maxHistory = HISTORY_MAX_SIZE;
```

**Thay đổi:** 1 value.

---

### Task 7 — Cập nhật `js/project.js`

```javascript
import {
    AUTOSAVE_STORAGE_KEY,
    AUTOSAVE_DELAY_MS,
    AUTOLOAD_DELAY_MS,
    PROJECT_VERSION
} from './config.js';

// Trong constructor:
this.autoSaveKey   = AUTOSAVE_STORAGE_KEY;
this.autoSaveDelay = AUTOSAVE_DELAY_MS;

// Trong setTimeout:
setTimeout(() => this._autoLoad(), AUTOLOAD_DELAY_MS);

// Trong _getProjectData:
version: PROJECT_VERSION,
```

**Thay đổi:** 4 values.

---

### Task 8 — Cập nhật `js/page-manager.js`

```javascript
import { TAB_NAME_MAX_LENGTH, PAGE_ID_RANDOM_LENGTH } from './config.js';

// Trong _buildTabElement:
nameSpan.textContent = page.name.length > TAB_NAME_MAX_LENGTH
    ? page.name.slice(0, TAB_NAME_MAX_LENGTH) + '…'
    : page.name;

// Trong _generatePageId:
const random = Math.random().toString(36).slice(2, 2 + PAGE_ID_RANDOM_LENGTH);
```

**Thay đổi:** 2 values.

---

### Task 9 — Cập nhật `js/clipboard.js`

```javascript
import { PASTE_OFFSET, ELEMENT_ID_RANDOM_LENGTH } from './config.js';

// Trong paste() và duplicate():
const left = (parseFloat(clone.style.left) || 0) + PASTE_OFFSET;
const top  = (parseFloat(clone.style.top)  || 0) + PASTE_OFFSET;

// Trong id generation:
clone.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;
```

**Thay đổi:** 2 values, xuất hiện ở 2 chỗ (paste + duplicate).

---

### Task 10 — Cập nhật `js/export.js`

```javascript
import { JSZIP_CDN_URL, EXPORT_INDENT } from './config.js';

// Trong _loadJSZip:
script.src = JSZIP_CDN_URL;

// Trong _elementToHTML (hiện dùng '    '.repeat(indent)):
const spaces = EXPORT_INDENT.repeat(indent);
```

**Thay đổi:** 2 values.

---

### Task 11 — Cập nhật `js/breakpoint-manager.js`

File này đã có `export const BREAKPOINTS` riêng. Cần:

1. Xóa `BREAKPOINTS` khỏi `breakpoint-manager.js`
2. Import từ `config.js` thay thế:

```javascript
import { BREAKPOINTS } from './config.js';
```

3. Đảm bảo các file khác đang import `BREAKPOINTS` từ `breakpoint-manager.js` (nếu có) chuyển sang import từ `config.js`

**Thay đổi:** 1 export được chuyển sang config.js, import path cập nhật.

---

### Task 12 — Cập nhật `js/project.js` backward compat

Hardcoded legacy page id và canvas dimensions:

```javascript
import { CANVAS_DEFAULT_WIDTH, CANVAS_DEFAULT_HEIGHT } from './config.js';

// Trong backward compat legacy page:
id: 'page-legacy-0001',   // giữ nguyên — đây là identifier cố định, không phải config

// Trong _getProjectData (nếu canvas size được include):
width:  canvas.style.width  || CANVAS_DEFAULT_WIDTH,
height: canvas.style.height || CANVAS_DEFAULT_HEIGHT
```

---

## Thứ tự thực hiện

Tasks hoàn toàn độc lập nhau — có thể làm theo thứ tự 1 → 12 hoặc song song.

Recommended order (theo dependency):
1. Task 1 (tạo config.js) — **bắt buộc trước**
2. Tasks 2–11 — bất kỳ thứ tự nào

---

## Checklist xác nhận

Sau khi hoàn thành, xác nhận:

- [ ] Không còn magic number nào trong các file đã list
- [ ] `js/config.js` là file duy nhất chứa các giá trị config
- [ ] App vẫn chạy đúng sau refactor (zoom, grid, drag, resize, rotate, history, autosave, page tab, clipboard, export ZIP)
- [ ] Không có circular import (config.js không import gì cả)
