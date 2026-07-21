# Tài liệu Thiết kế — html-studio-missing-features

## Tổng quan

Tài liệu này mô tả kiến trúc và thiết kế chi tiết cho bốn tính năng/sửa lỗi của Sprint 1 HTML Studio:

1. **Canvas Pan** (Space+Drag và Middle-Click+Drag)
2. **Group / Ungroup Elements** (Ctrl+G / Ctrl+Shift+G)
3. **Text Edit History** (sửa lỗi undo/redo text)
4. **Alignment/Resize/Drag Breakpoint Fix** (sửa lỗi đồng bộ breakpoint)

---

## Kiến trúc tổng thể

Dự án sử dụng Vanilla JavaScript ES6 modules với pattern sau:

```
editor.js (điều phối trung tâm)
    │
    ├── event-bus.js (singleton, giao tiếp giữa các module)
    │
    ├── selection.js     ← thêm text snapshot
    ├── history.js       ← thêm case text-edit, group, ungroup, bpManager sync
    ├── drag.js          ← thêm isPanning guard + bpManager.setStyle
    ├── resize.js        ← thêm isPanning guard + bpManager.setStyle
    ├── rotate.js        ← thêm isPanning guard
    ├── alignment.js     ← thêm bpManager.setStyle calls
    └── group-manager.js ← file mới, quản lý group/ungroup
```

**Quy tắc bất biến:**
- Không thêm framework hay dependency ngoài.
- Mọi giao tiếp giữa module qua `eventBus`.
- `Editor` class là owner duy nhất của state `isPanning`.

---

## Thiết kế chi tiết

### 1. Canvas Pan

#### 1.1. State mới trong `Editor`

```javascript
// editor.js — constructor
this.isPanning = false;
this.panStartX = 0;
this.panStartY = 0;
this._panMouseActive = false; // true khi đang nhấn giữ chuột trong PanMode
```

#### 1.2. Luồng Space+Drag

```
keydown Space (document)
  ├── IF target là INPUT/TEXTAREA/contenteditable → return (không kích hoạt)
  └── editor.isPanning = true
      canvasWrapper.style.cursor = 'grab'

mousedown (canvasWrapper, button=0) trong khi isPanning=true
  ├── e.preventDefault(), e.stopPropagation()
  ├── editor._panMouseActive = true
  ├── editor.panStartX = e.clientX
  ├── editor.panStartY = e.clientY
  └── canvasWrapper.style.cursor = 'grabbing'

mousemove (document) trong khi _panMouseActive=true
  ├── dx = e.clientX - panStartX
  ├── dy = e.clientY - panStartY
  ├── canvasContainer.scrollLeft -= dx
  ├── canvasContainer.scrollTop  -= dy
  ├── panStartX = e.clientX  (cập nhật base)
  └── panStartY = e.clientY

mouseup (document) trong khi _panMouseActive=true
  ├── editor._panMouseActive = false
  └── canvasWrapper.style.cursor = 'grab'

keyup Space (document)
  ├── editor.isPanning = false
  ├── editor._panMouseActive = false
  └── canvasWrapper.style.cursor = ''
```


#### 1.3. Luồng Middle-Click+Drag

```
mousedown (canvasWrapper, e.button === 1)
  ├── e.preventDefault()
  ├── editor.isPanning = true
  ├── editor._panMouseActive = true
  ├── editor.panStartX = e.clientX
  ├── editor.panStartY = e.clientY
  └── canvasWrapper.style.cursor = 'grabbing'

mousemove (document) — dùng cùng handler với Space+Drag

mouseup (document, e.button === 1)
  ├── editor.isPanning = false
  ├── editor._panMouseActive = false
  └── canvasWrapper.style.cursor = ''
```

> **Lưu ý thiết kế:** Middle-click không có trạng thái "grab" trước khi nhấn giữ (khác Space). Khi thả nút giữa, `isPanning` được reset về `false` ngay (không giữ PanMode như Space).

#### 1.4. Guard trong drag.js, resize.js, rotate.js

Mỗi module kiểm tra `this.editor.isPanning` ở đầu hàm `_startDrag`, `_startResize`, `_startRotate`:

```javascript
// drag.js — _startDrag()
_startDrag(e, elements) {
    if (this.editor.isPanning) return; // Guard pan
    // ... logic hiện tại
}

// resize.js — _startResize()
_startResize(e, handle) {
    if (this.editor.isPanning) return; // Guard pan
    // ... logic hiện tại
}

// rotate.js — _startRotate()
_startRotate(e) {
    if (this.editor.isPanning) return; // Guard pan
    // ... logic hiện tại
}
```

#### 1.5. Binding trong editor.js

Tất cả binding pan được thêm vào `_bindEvents()` trong `editor.js`, không tạo thêm class mới, để giữ state `isPanning` tập trung.

Pan mousedown trên `canvasWrapper` phải được bind với priority cao hơn drag (dùng `e.stopPropagation()`).

---

### 2. Group / Ungroup Elements

#### 2.1. File mới: `js/group-manager.js`

```javascript
export class GroupManager {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    _bindEvents() {
        eventBus.on('group:group',   () => this.group());
        eventBus.on('group:ungroup', () => this.ungroup());
    }

    group() { /* ... */ }
    ungroup() { /* ... */ }
}
```

Khởi tạo trong `editor.js _initModules()`:
```javascript
this.groupManager = new GroupManager(this);
```

Bind phím tắt trong `editor.js _handleKeydown()`:
```javascript
// Ctrl+G: Group
if (ctrl && !shift && e.key === 'g') {
    e.preventDefault();
    eventBus.emit('group:group');
    return;
}
// Ctrl+Shift+G: Ungroup
if (ctrl && shift && (e.key === 'g' || e.key === 'G')) {
    e.preventDefault();
    eventBus.emit('group:ungroup');
    return;
}
```


#### 2.2. Thuật toán `group()`

```
1. Lấy elements = selection.getSelectedAll()
2. IF elements.length < 2 → return (guard)
3. Xác định parent chung = elements[0].parentNode
4. Tính bounding box:
     groupLeft   = min(el.style.left)
     groupTop    = min(el.style.top)
     groupRight  = max(el.style.left + el.style.width)
     groupBottom = max(el.style.top  + el.style.height)
     groupWidth  = groupRight - groupLeft
     groupHeight = groupBottom - groupTop
5. Tạo GroupElement:
     const groupEl = document.createElement('div')
     groupEl.dataset.editorElement = 'true'
     groupEl.dataset.type = 'group'
     groupEl.dataset.container = 'true'
     groupEl.dataset.name = 'Group'
     groupEl.id = 'el-' + Date.now()
     groupEl.style.position = 'absolute'
     groupEl.style.left   = groupLeft + 'px'
     groupEl.style.top    = groupTop + 'px'
     groupEl.style.width  = groupWidth + 'px'
     groupEl.style.height = groupHeight + 'px'
6. Lưu positions ban đầu:
     positions = elements.map(el => ({ el, left: parseFloat(el.style.left), top: parseFloat(el.style.top) }))
7. Chèn GroupElement vào DOM tại vị trí của elements[0].nextSibling (hoặc cuối parent)
8. Di chuyển elements vào GroupElement:
     elements.forEach(el => {
         el.style.left = (originalLeft - groupLeft) + 'px'
         el.style.top  = (originalTop  - groupTop)  + 'px'
         groupEl.appendChild(el)
     })
9. Emit history:push:
     { type: 'group', groupEl, children: elements, parent, positions,
       groupLeft, groupTop, groupWidth, groupHeight,
       nextSibling: groupEl.nextSibling }
10. Emit layer:refresh
11. selection.select(groupEl)
```

#### 2.3. Thuật toán `ungroup()`

```
1. Lấy el = selection.getSelected()
2. IF el === null OR el.dataset.type !== 'group' → return (guard)
3. parent = el.parentNode
4. groupLeft = parseFloat(el.style.left), groupTop = parseFloat(el.style.top)
5. children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'))
6. Lưu positions trong group (tọa độ tương đối):
     positions = children.map(child => ({
         el: child,
         relLeft: parseFloat(child.style.left),
         relTop:  parseFloat(child.style.top)
     }))
7. Di chuyển children ra parent, tính tọa độ tuyệt đối:
     children.forEach(child => {
         child.style.left = (relLeft + groupLeft) + 'px'
         child.style.top  = (relTop  + groupTop)  + 'px'
         parent.insertBefore(child, el)
     })
8. Xóa GroupElement: el.remove()
9. Emit history:push:
     { type: 'ungroup', groupEl: el, children, parent, positions,
       groupLeft, groupTop }
10. Emit layer:refresh
11. selection.setSelection(children)
```

#### 2.4. History cases mới trong `history.js`

```javascript
// _revert: undo group → khôi phục trạng thái trước khi group
case 'group':
    // Di chuyển children về parent, khôi phục tọa độ tuyệt đối
    action.children.forEach(child => {
        const pos = action.positions.find(p => p.el === child);
        child.style.left = pos.left + 'px';
        child.style.top  = pos.top + 'px';
        action.parent.appendChild(child);
    });
    action.groupEl.remove();
    eventBus.emit('element:deleted', action.groupEl);
    eventBus.emit('layer:refresh');
    break;

// _revert: undo ungroup → tái tạo GroupElement
case 'ungroup':
    action.groupEl.style.left = action.groupLeft + 'px';
    action.groupEl.style.top  = action.groupTop + 'px';
    action.children.forEach(child => {
        const pos = action.positions.find(p => p.el === child);
        child.style.left = pos.relLeft + 'px';
        child.style.top  = pos.relTop + 'px';
        action.groupEl.appendChild(child);
    });
    action.parent.appendChild(action.groupEl);
    eventBus.emit('element:added', action.groupEl);
    eventBus.emit('layer:refresh');
    break;

// _apply: redo group → tái tạo group từ children
case 'group':
    action.children.forEach(child => {
        const pos = action.positions.find(p => p.el === child);
        child.style.left = (pos.left - action.groupLeft) + 'px';
        child.style.top  = (pos.top  - action.groupTop) + 'px';
        action.groupEl.appendChild(child);
    });
    action.parent.appendChild(action.groupEl);
    eventBus.emit('element:added', action.groupEl);
    eventBus.emit('layer:refresh');
    break;

// _apply: redo ungroup
case 'ungroup':
    action.children.forEach(child => {
        const pos = action.positions.find(p => p.el === child);
        child.style.left = (pos.relLeft + action.groupLeft) + 'px';
        child.style.top  = (pos.relTop  + action.groupTop) + 'px';
        action.parent.insertBefore(child, action.groupEl);
    });
    action.groupEl.remove();
    eventBus.emit('element:deleted', action.groupEl);
    eventBus.emit('layer:refresh');
    break;
```


---

### 3. Text Edit History (Sửa lỗi)

#### 3.1. Thay đổi trong `selection.js`

**`_startEditing(el)`** — thêm snapshot:
```javascript
_startEditing(el) {
    this._textBefore = el.innerHTML;  // ← THÊM: lưu trạng thái ban đầu
    this.isEditing = true;
    el.contentEditable = 'true';
    // ... phần còn lại giữ nguyên
}
```

**`_stopEditing(el)`** — thêm so sánh và emit history:
```javascript
_stopEditing(el) {
    this.isEditing = false;
    el.contentEditable = 'false';
    el.style.cursor = '';
    el.style.outline = '';
    window.getSelection().removeAllRanges();

    // ← THÊM: so sánh và push history nếu có thay đổi
    if (this._textBefore !== undefined && el.innerHTML !== this._textBefore) {
        eventBus.emit('history:push', {
            type: 'text-edit',
            element: el,
            before: this._textBefore,
            after: el.innerHTML
        });
    }
    this._textBefore = undefined;

    eventBus.emit('element:editing-stop', el);
    eventBus.emit('element:updated', el);
}
```

**Handler Escape** — phải gọi `el.blur()` để trigger `_stopEditing` qua onBlur listener hiện tại, không cần thay đổi logic Escape (đã đúng).

#### 3.2. Thay đổi trong `history.js`

Thêm case `'text-edit'` vào cả `_revert` và `_apply`:

```javascript
// _revert
case 'text-edit':
    action.element.innerHTML = action.before;
    eventBus.emit('element:updated', action.element);
    break;

// _apply
case 'text-edit':
    action.element.innerHTML = action.after;
    eventBus.emit('element:updated', action.element);
    break;
```

---

### 4. Alignment/Resize/Drag Breakpoint Fix (Sửa lỗi)

#### 4.1. Pattern chung

Thay vì gán trực tiếp `el.style.xxx = value`, luôn gọi thêm:
```javascript
this.editor.breakpointManager.setStyle(el, propCamelCase, value);
```

`BreakpointManager.setStyle` đã có sẵn logic: lưu vào `el.__bpStyles[current][prop]` VÀ gán `el.style.setProperty(prop, value)`. Vì `el.style.setProperty` nhận kebab-case còn `el.style[prop]` nhận camelCase, cần chú ý convert.

> **Quyết định thiết kế:** `BreakpointManager.setStyle(el, prop, value)` nhận `prop` dạng camelCase (ví dụ: `left`, `top`, `width`, `height`) đúng như hiện tại. Khi cần `setProperty`, convert: `left → 'left'`, không có vấn đề vì các prop này giống nhau.

#### 4.2. Thay đổi trong `alignment.js`

Trong `_alignSingle()`, sau mỗi `el.style.xxx = value`, thêm lời gọi setStyle tương ứng:

```javascript
case 'left':
    el.style.left = '0px';
    this.editor.breakpointManager.setStyle(el, 'left', '0px');
    break;
case 'center':
    const centerLeft = Math.round((parentWidth - elWidth) / 2) + 'px';
    el.style.left = centerLeft;
    this.editor.breakpointManager.setStyle(el, 'left', centerLeft);
    break;
// ... tương tự cho tất cả cases
case 'full-width':
    el.style.left = '0px';
    el.style.width = parentWidth + 'px';
    this.editor.breakpointManager.setStyle(el, 'left', '0px');
    this.editor.breakpointManager.setStyle(el, 'width', parentWidth + 'px');
    break;
```

Trong `_alignMulti()` — tương tự cho `newLeft` và `newTop`.

#### 4.3. Thay đổi trong `resize.js`

Trong `_handleMouseUp()`, sau khi emit `history:push`, thêm bpManager sync cho tất cả 4 prop:

```javascript
_handleMouseUp(e) {
    // ... logic hiện tại tính endRect, emit history:push

    if (changed) {
        eventBus.emit('history:push', { type: 'resize', ... });

        // ← THÊM: sync vào breakpoint store
        const bpMgr = this.editor.breakpointManager;
        bpMgr.setStyle(this.resizeElement, 'left',   endRect.left   + 'px');
        bpMgr.setStyle(this.resizeElement, 'top',    endRect.top    + 'px');
        bpMgr.setStyle(this.resizeElement, 'width',  endRect.width  + 'px');
        bpMgr.setStyle(this.resizeElement, 'height', endRect.height + 'px');
    }
    // ...
}
```

#### 4.4. Thay đổi trong `drag.js`

Trong `_handleDragUp()`, sau khi emit `history:push` cho mỗi element:

```javascript
this.startPositions.forEach(sp => {
    const endLeft = parseFloat(sp.el.style.left) || 0;
    const endTop  = parseFloat(sp.el.style.top)  || 0;

    if (endLeft !== sp.left || endTop !== sp.top) {
        eventBus.emit('history:push', { type: 'move', ... });

        // ← THÊM: sync vào breakpoint store
        const bpMgr = this.editor.breakpointManager;
        bpMgr.setStyle(sp.el, 'left', endLeft + 'px');
        bpMgr.setStyle(sp.el, 'top',  endTop  + 'px');
    }
    // ...
});
```


#### 4.5. Thay đổi trong `history.js` — bpManager sync cho move/resize

Trong cả `_revert` và `_apply`, sau khi gán `el.style`, thêm sync:

```javascript
// _revert case 'move':
action.element.style.left = action.before.left + 'px';
action.element.style.top  = action.before.top  + 'px';
// ← THÊM
if (this._editor) {
    this._editor.breakpointManager.setStyle(action.element, 'left', action.before.left + 'px');
    this._editor.breakpointManager.setStyle(action.element, 'top',  action.before.top  + 'px');
}
```

> **Lưu ý:** `History` hiện tại không giữ tham chiếu đến `editor`. Cần truyền `editor` vào constructor của `History`, hoặc dùng `eventBus` để emit một event riêng để `editor` xử lý. 

**Giải pháp được chọn:** Truyền `editor` vào `History` constructor:
```javascript
// editor.js
this.history = new History(this);

// history.js
constructor(editor) {
    this.editor = editor;  // ← THÊM
    // ...
}
```

Điều này tránh việc phải tạo thêm event mới, giữ logic đơn giản, và nhất quán với cách các module khác (`Drag`, `Resize`, v.v.) đều nhận `editor` qua constructor.

---

## Data Model

### GroupElement

```html
<div
    id="el-{timestamp}"
    data-editor-element="true"
    data-type="group"
    data-container="true"
    data-name="Group"
    style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px;"
>
    <!-- children elements (với tọa độ relative) -->
</div>
```

### History Action Types

| `type`      | `before`                          | `after`                           | Các field bổ sung                               |
|-------------|-----------------------------------|-----------------------------------|-------------------------------------------------|
| `move`      | `{left, top}`                     | `{left, top}`                     | —                                               |
| `resize`    | `{left, top, width, height}`      | `{left, top, width, height}`      | —                                               |
| `rotate`    | transform string                  | transform string                  | —                                               |
| `style`     | value string                      | value string                      | `prop`                                          |
| `add`       | —                                 | —                                 | `element`, `parent`, `nextSibling`              |
| `delete`    | —                                 | —                                 | `element`, `parent`, `nextSibling`              |
| `text-edit` | innerHTML string                  | innerHTML string                  | `element`                                       |
| `group`     | —                                 | —                                 | `groupEl`, `children`, `parent`, `positions`, `groupLeft`, `groupTop`, `groupWidth`, `groupHeight` |
| `ungroup`   | —                                 | —                                 | `groupEl`, `children`, `parent`, `positions`, `groupLeft`, `groupTop` |

### `positions` field trong group/ungroup

```javascript
// Dùng cho group action — lưu tọa độ tuyệt đối trước khi group
positions = [{ el: HTMLElement, left: number, top: number }, ...]

// Dùng cho ungroup action — lưu tọa độ tương đối trong group
positions = [{ el: HTMLElement, relLeft: number, relTop: number }, ...]
```

---

## Xử lý lỗi

| Tình huống                                           | Xử lý                                                                    |
|------------------------------------------------------|--------------------------------------------------------------------------|
| Ctrl+G với 0 hoặc 1 element                          | Return sớm, không thay đổi DOM                                            |
| Ctrl+Shift+G với element không phải group            | Return sớm, không thay đổi DOM                                            |
| Space+Drag khi focus trong input/textarea/contenteditable | Kiểm tra `e.target` trong keydown handler, không set isPanning       |
| Middle-click pan và browser auto-scroll              | `e.preventDefault()` trên mousedown và mousemove                         |
| History undo/redo với element đã bị xóa khỏi DOM    | Giữ nguyên logic hiện tại (element vẫn có reference trong action object) |
| `breakpointManager` chưa khởi tạo khi History revert | `editor` được truyền vào History, luôn có tham chiếu hợp lệ           |


---

## Correctness Properties

*Một property là đặc tính hoặc hành vi phải đúng trên toàn bộ các lần thực thi hợp lệ của hệ thống — về bản chất là phát biểu hình thức về điều hệ thống phải làm. Properties là cầu nối giữa đặc tả dạng ngôn ngữ tự nhiên và đảm bảo tính đúng đắn có thể kiểm chứng tự động.*

**Property Reflection:** Sau khi phân tích prework, các property sau đây được loại bỏ vì trùng lặp:
- 1.3 và 2.2 gộp thành Property 1 (cùng logic scroll delta).
- 1.6 và 2.5 gộp thành Property 2 (cùng invariant isPanning guard).
- 5.2 và 5.3 gộp thành Property 5 (hai mặt của cùng điều kiện).
- 5.4 và 5.5 gộp thành Property 6 (revert và apply của text-edit).
- 4.6 và 4.7 gộp thành Property 10 (round-trip group/ungroup qua undo).

---

### Property 1: Pan scroll cập nhật đúng theo delta chuột

*Với bất kỳ* delta di chuyển chuột (dx, dy) trong khi PanMode đang hoạt động, `CanvasContainer.scrollLeft` phải giảm đúng `dx` pixel và `CanvasContainer.scrollTop` phải giảm đúng `dy` pixel (so với giá trị trước di chuyển).

**Validates: Requirements 1.3, 2.2**

---

### Property 2: PanMode ngăn drag/resize/rotate bắt đầu

*Với bất kỳ* element nào trên canvas và bất kỳ phương thức kích hoạt PanMode nào (Space hoặc middle-click), khi `editor.isPanning === true`, các thao tác `_startDrag`, `_startResize`, `_startRotate` phải không thay đổi trạng thái `isDragging`, `isResizing`, `isRotating` tương ứng.

**Validates: Requirements 1.6, 2.5**

---

### Property 3: Group bounding box chính xác

*Với bất kỳ* tập hợp ≥2 elements với vị trí và kích thước bất kỳ, `GroupElement` được tạo ra phải có:
- `left = min(el.left)` với mọi el trong tập hợp
- `top = min(el.top)` với mọi el trong tập hợp
- `left + width = max(el.left + el.width)` với mọi el
- `top + height = max(el.top + el.height)` với mọi el

**Validates: Requirements 3.2**

---

### Property 4: Tọa độ con sau group là tương đối chính xác

*Với bất kỳ* element con nào trong tập hợp được group, sau thao tác group:
```
child.left (mới) = child.left (cũ) - groupEl.left
child.top  (mới) = child.top  (cũ) - groupEl.top
```

Đồng thời, tọa độ tuyệt đối được bảo toàn:
```
child.left (mới) + groupEl.left = child.left (cũ)
```

**Validates: Requirements 3.3**

---

### Property 5: Text history chỉ emit khi có thay đổi

*Với bất kỳ* element text và bất kỳ nội dung `innerHTML` nào:
- Nếu `innerHTML` thay đổi sau khi edit, `history:push` với `type='text-edit'` phải được emit đúng một lần.
- Nếu `innerHTML` không thay đổi sau khi edit, `history:push` phải không được emit.

**Validates: Requirements 5.2, 5.3**

---

### Property 6: Text edit round-trip qua history

*Với bất kỳ* cặp `(before, after)` là hai chuỗi innerHTML khác nhau:
- Sau `_revert(textEditAction)`: `element.innerHTML === before`
- Sau `_apply(textEditAction)`: `element.innerHTML === after`
- Sau `_revert` rồi `_apply` liên tiếp: `element.innerHTML === after`

**Validates: Requirements 5.4, 5.5**

---

### Property 7: bpManager.setStyle duy trì tính nhất quán

*Với bất kỳ* element, tên thuộc tính `prop`, và giá trị `value` bất kỳ, sau khi gọi `breakpointManager.setStyle(el, prop, value)`:
- `el.__bpStyles[breakpointManager.current][prop] === value`
- `el.style.getPropertyValue(prop) === value`

**Validates: Requirements 6.5**

---

### Property 8: Alignment/Resize/Drag đồng bộ vào breakpoint store

*Với bất kỳ* element và bất kỳ thao tác alignment, resize, hoặc drag nào tạo ra giá trị `(prop, value)` mới, sau khi thao tác kết thúc:
```
el.__bpStyles[currentBreakpoint][prop] === el.style.getPropertyValue(prop)
```

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 9: Breakpoint round-trip bảo toàn styles

*Với bất kỳ* element có styles đã được ghi tại breakpoint A, sau khi chuyển A → B → A:
- Mọi giá trị `left`, `top`, `width`, `height` tại breakpoint A phải bằng giá trị trước khi chuyển breakpoint.

**Validates: Requirements 6.6**

---

### Property 10: Group/Ungroup undo là phép nghịch đảo chính xác

*Với bất kỳ* thao tác group hoặc ungroup nào, sau khi thực hiện rồi undo:
- Số lượng elements trong DOM phải bằng trước thao tác.
- `left` và `top` của từng element phải khôi phục về giá trị ban đầu (sai số < 1px).
- `GroupElement` không được tồn tại trong DOM (sau undo group).
- Các elements con phải nằm đúng trong parent ban đầu (sau undo ungroup).

**Validates: Requirements 4.6, 4.7**

---

### Property 11: History bpManager sync sau move/resize undo/redo

*Với bất kỳ* action `move` hoặc `resize` trong history stack, sau khi `_revert` hoặc `_apply`:
```
el.__bpStyles[currentBreakpoint]['left'] === parseFloat(el.style.left) + 'px'
el.__bpStyles[currentBreakpoint]['top']  === parseFloat(el.style.top)  + 'px'
```
(và tương tự cho `width`, `height` với resize)

**Validates: Requirements 6.4**
