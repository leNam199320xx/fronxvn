# Kế hoạch Triển khai: html-studio-missing-features

## Tổng quan

Triển khai 4 tính năng/sửa lỗi cho HTML Studio Sprint 1: Text Edit History fix, Alignment/Resize/Drag Breakpoint Fix, Canvas Pan (Space+Drag và Middle-Click+Drag), và Group/Ungroup Elements. Các bug fix (nhóm 1) có thể implement song song với Canvas Pan (nhóm 2); Group Manager (nhóm 3) phụ thuộc vào sửa lỗi history.js từ nhóm 1.

---

## Tasks

- [x] 1. Sửa lỗi Text Edit History trong `selection.js` và `history.js`
  - [x] 1.1 Thêm snapshot `_textBefore` vào `_startEditing` trong `selection.js`
    - Trong `_startEditing(el)`, thêm dòng `this._textBefore = el.innerHTML;` trước khi gán `contentEditable = 'true'`
    - _Yêu cầu: 5.1_

  - [x] 1.2 Emit `history:push` trong `_stopEditing` nếu nội dung thay đổi
    - Trong `_stopEditing(el)`, sau khi reset `contentEditable`, so sánh `el.innerHTML !== this._textBefore`
    - Nếu khác nhau: emit `history:push` với `{ type: 'text-edit', element: el, before: this._textBefore, after: el.innerHTML }`
    - Sau đó reset `this._textBefore = undefined`
    - Đặt emit này trước `eventBus.emit('element:editing-stop', el)`
    - _Yêu cầu: 5.2, 5.3, 5.6_

  - [x] 1.3 Thêm case `text-edit` vào `_revert` và `_apply` trong `history.js`
    - Trong `_revert`: thêm `case 'text-edit': action.element.innerHTML = action.before; eventBus.emit('element:updated', action.element); break;`
    - Trong `_apply`: thêm `case 'text-edit': action.element.innerHTML = action.after; eventBus.emit('element:updated', action.element); break;`
    - _Yêu cầu: 5.4, 5.5_

  - [ ]* 1.4 Viết unit test cho Text Edit History
    - Test: emit `history:push` khi innerHTML thay đổi
    - Test: không emit khi innerHTML giữ nguyên
    - Test: `_revert` khôi phục `before`, `_apply` áp dụng `after`
    - _Yêu cầu: 5.1–5.6_

- [x] 2. Sửa lỗi Breakpoint Fix cho `alignment.js` và truyền `editor` vào `History`
  - [x] 2.1 Truyền `editor` vào constructor của `History` trong `history.js` và `editor.js`
    - Sửa `history.js` constructor: `constructor(editor) { this.editor = editor; ... }`
    - Sửa `editor.js` trong `_initModules()`: đổi `this.history = new History()` thành `this.history = new History(this)`
    - _Yêu cầu: 6.4_

  - [x] 2.2 Thêm `bpManager.setStyle` vào `alignment.js` cho từng case trong `_alignSingle`
    - Với mỗi `case` trong switch của `_alignSingle`, sau khi gán `el.style.xxx`, thêm gọi `this.editor.breakpointManager.setStyle(el, 'xxx', value)` tương ứng
    - Các prop cần sync: `left`, `top`, `width`, `height`
    - Case `full-width`: gọi `setStyle` cho cả `left` ('0px') và `width` (parentWidth + 'px')
    - Case `full-height`: gọi `setStyle` cho cả `top` ('0px') và `height` (parentHeight + 'px')
    - _Yêu cầu: 6.1_

  - [x] 2.3 Thêm `bpManager.setStyle` vào `_alignMulti` trong `alignment.js`
    - Trong vòng lặp `elements.forEach`, sau khi gán `el.style.left = newLeft + 'px'` và `el.style.top = newTop + 'px'`, thêm:
      ```js
      this.editor.breakpointManager.setStyle(el, 'left', newLeft + 'px');
      this.editor.breakpointManager.setStyle(el, 'top', newTop + 'px');
      ```
    - _Yêu cầu: 6.1_

  - [x] 2.4 Thêm bpManager sync cho `move`/`resize` trong `history.js` `_revert` và `_apply`
    - Trong `_revert` case `'move'`: sau khi gán `el.style`, thêm:
      ```js
      if (this.editor) {
          this.editor.breakpointManager.setStyle(action.element, 'left', action.before.left + 'px');
          this.editor.breakpointManager.setStyle(action.element, 'top', action.before.top + 'px');
      }
      ```
    - Trong `_apply` case `'move'`: tương tự với `action.after`
    - Trong `_revert` case `'resize'`: sync cả 4 props `left`, `top`, `width`, `height` từ `action.before`
    - Trong `_apply` case `'resize'`: sync cả 4 props từ `action.after`
    - _Yêu cầu: 6.4_

  - [ ]* 2.5 Viết unit test cho Alignment Breakpoint Fix
    - Test: sau `align('left')`, `el.__bpStyles[currentBreakpoint]['left'] === '0px'`
    - Test: sau undo move, `el.__bpStyles[currentBreakpoint]['left']` khớp với `before.left`
    - _Yêu cầu: 6.1, 6.4, 6.5_

- [x] 3. Sửa lỗi Breakpoint Fix cho `drag.js` và `resize.js`
  - [x] 3.1 Thêm `bpManager.setStyle` vào `_handleDragUp` trong `drag.js`
    - Trong vòng lặp `this.startPositions.forEach(sp => {...})`, sau khi emit `history:push`, thêm:
      ```js
      const bpMgr = this.editor.breakpointManager;
      bpMgr.setStyle(sp.el, 'left', endLeft + 'px');
      bpMgr.setStyle(sp.el, 'top', endTop + 'px');
      ```
    - Chỉ thêm trong nhánh `if (endLeft !== sp.left || endTop !== sp.top)` (vì chỉ khi có thay đổi)
    - _Yêu cầu: 6.3_

  - [x] 3.2 Thêm `bpManager.setStyle` vào `_handleMouseUp` trong `resize.js`
    - Trong nhánh `if (changed)`, sau khi emit `history:push`, thêm:
      ```js
      const bpMgr = this.editor.breakpointManager;
      bpMgr.setStyle(this.resizeElement, 'left', endRect.left + 'px');
      bpMgr.setStyle(this.resizeElement, 'top', endRect.top + 'px');
      bpMgr.setStyle(this.resizeElement, 'width', endRect.width + 'px');
      bpMgr.setStyle(this.resizeElement, 'height', endRect.height + 'px');
      ```
    - _Yêu cầu: 6.2_

  - [ ]* 3.3 Viết unit test cho Drag/Resize Breakpoint Fix
    - Test: sau drag, `el.__bpStyles[bp]['left']` và `['top']` khớp `el.style.left`/`el.style.top`
    - Test: sau resize, tất cả 4 props trong `__bpStyles` khớp với `el.style`
    - _Yêu cầu: 6.2, 6.3_

- [x] 4. Checkpoint — Đảm bảo tất cả tests nhóm bug fix pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

- [x] 5. Triển khai Canvas Pan — State và Space+Drag trong `editor.js`
  - [x] 5.1 Thêm state `isPanning` và các biến pan vào `Editor` constructor
    - Trong `constructor()`, thêm sau block `// State`:
      ```js
      this.isPanning = false;
      this.panStartX = 0;
      this.panStartY = 0;
      this._panMouseActive = false;
      ```
    - _Yêu cầu: 1.1_

  - [x] 5.2 Bind sự kiện `keydown`/`keyup` Space để kích hoạt PanMode trong `_bindEvents`
    - Trong `_bindEvents()`, thêm listener cho `keydown` trên `document` (tách riêng khỏi `_handleKeydown`):
      ```js
      document.addEventListener('keydown', (e) => {
          if (e.code === 'Space') {
              const t = e.target;
              if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
              e.preventDefault();
              if (!this.isPanning) {
                  this.isPanning = true;
                  this.canvasWrapper.style.cursor = 'grab';
              }
          }
      });
      document.addEventListener('keyup', (e) => {
          if (e.code === 'Space') {
              this.isPanning = false;
              this._panMouseActive = false;
              this.canvasWrapper.style.cursor = '';
          }
      });
      ```
    - _Yêu cầu: 1.1, 1.5, 1.7_

  - [x] 5.3 Bind mousedown/mousemove/mouseup trên `canvasWrapper` cho Space pan
    - Trong `_bindEvents()`, thêm listener `mousedown` trên `canvasWrapper`:
      ```js
      this.canvasWrapper.addEventListener('mousedown', (e) => {
          if (this.isPanning && e.button === 0) {
              e.preventDefault();
              e.stopPropagation();
              this._panMouseActive = true;
              this.panStartX = e.clientX;
              this.panStartY = e.clientY;
              this.canvasWrapper.style.cursor = 'grabbing';
          }
      }, true); // capture phase để ưu tiên cao hơn drag
      ```
    - Thêm listener `mousemove` trên `document` cho pan (kiểm tra `_panMouseActive`):
      ```js
      document.addEventListener('mousemove', (e) => {
          if (this._panMouseActive) {
              const dx = e.clientX - this.panStartX;
              const dy = e.clientY - this.panStartY;
              this.canvasContainer.scrollLeft -= dx;
              this.canvasContainer.scrollTop -= dy;
              this.panStartX = e.clientX;
              this.panStartY = e.clientY;
          }
      });
      ```
    - Thêm listener `mouseup` trên `document`:
      ```js
      document.addEventListener('mouseup', (e) => {
          if (this._panMouseActive && e.button === 0) {
              this._panMouseActive = false;
              if (this.isPanning) this.canvasWrapper.style.cursor = 'grab';
          }
      });
      ```
    - _Yêu cầu: 1.2, 1.3, 1.4_

  - [ ]* 5.4 Viết property test — Pan scroll cập nhật đúng theo delta (Property 1)
    - **Property 1: Pan scroll cập nhật đúng theo delta chuột**
    - **Validates: Yêu cầu 1.3, 2.2**
    - Test: với dx, dy bất kỳ, `scrollLeft` giảm dx và `scrollTop` giảm dy
    - _Yêu cầu: 1.3_

- [x] 6. Triển khai Canvas Pan — Middle-Click+Drag trong `editor.js`
  - [x] 6.1 Bind mousedown middle-click để kích hoạt PanMode trong `_bindEvents`
    - Trong `_bindEvents()`, thêm vào listener `mousedown` của `canvasWrapper` (hoặc thêm listener riêng):
      ```js
      this.canvasWrapper.addEventListener('mousedown', (e) => {
          if (e.button === 1) {
              e.preventDefault();
              this.isPanning = true;
              this._panMouseActive = true;
              this.panStartX = e.clientX;
              this.panStartY = e.clientY;
              this.canvasWrapper.style.cursor = 'grabbing';
          }
      });
      ```
    - Cập nhật listener `mouseup` trên `document` để xử lý cả middle-click release (button === 1):
      ```js
      if (this._panMouseActive && e.button === 1) {
          this.isPanning = false;
          this._panMouseActive = false;
          this.canvasWrapper.style.cursor = '';
      }
      ```
    - Handler mousemove đã có từ task 5.3 — dùng lại không cần thay đổi
    - _Yêu cầu: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 6.2 Viết unit test cho Middle-Click PanMode
    - Test: khi `e.button === 1` mousedown, `editor.isPanning === true`
    - Test: khi mouseup `e.button === 1`, `isPanning === false` và cursor reset
    - _Yêu cầu: 2.1, 2.3_

- [x] 7. Thêm guard `isPanning` vào `drag.js`, `resize.js`, `rotate.js`
  - [x] 7.1 Thêm guard vào `_startDrag` trong `drag.js`
    - Thêm dòng đầu tiên trong `_startDrag(e, elements)`:
      ```js
      if (this.editor.isPanning) return;
      ```
    - _Yêu cầu: 1.6, 2.5_

  - [x] 7.2 Thêm guard vào `_startResize` trong `resize.js`
    - Thêm dòng đầu tiên trong `_startResize(e, handle)`:
      ```js
      if (this.editor.isPanning) return;
      ```
    - _Yêu cầu: 1.6, 2.5_

  - [x] 7.3 Thêm guard vào `_startRotate` trong `rotate.js`
    - Thêm dòng đầu tiên trong `_startRotate(e)`:
      ```js
      if (this.editor.isPanning) return;
      ```
    - _Yêu cầu: 1.6, 2.5_

  - [ ]* 7.4 Viết property test — PanMode ngăn drag/resize/rotate (Property 2)
    - **Property 2: PanMode ngăn drag/resize/rotate bắt đầu**
    - **Validates: Yêu cầu 1.6, 2.5**
    - Test: với `editor.isPanning = true`, gọi `_startDrag`/`_startResize`/`_startRotate` → `isDragging`/`isResizing`/`isRotating` vẫn là `false`
    - _Yêu cầu: 1.6, 2.5_

- [x] 8. Checkpoint — Đảm bảo tất cả tests Canvas Pan pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

- [x] 9. Tạo module `js/group-manager.js`
  - [x] 9.1 Tạo file `js/group-manager.js` với class `GroupManager` và hàm `group()`
    - Tạo file mới `d:/fronxvn/js/group-manager.js`
    - Implement `GroupManager` với constructor nhận `editor`, bind sự kiện `group:group` → `this.group()`, `group:ungroup` → `this.ungroup()`
    - Implement `group()`:
      1. Lấy `elements = editor.selection.getSelectedAll()`, guard `length < 2`
      2. Xác định `parent = elements[0].parentNode`
      3. Tính bounding box: `groupLeft = min(el.style.left)`, `groupTop = min(el.style.top)`, `groupWidth`, `groupHeight`
      4. Tạo `groupEl = document.createElement('div')` với attributes: `data-editor-element="true"`, `data-type="group"`, `data-container="true"`, `data-name="Group"`, `id="el-" + Date.now()`, style `position: absolute; left/top/width/height`
      5. Lưu `positions = elements.map(el => ({ el, left: parseFloat(el.style.left), top: parseFloat(el.style.top) }))`
      6. Chèn `groupEl` vào parent (trước `elements[0]` hoặc cuối parent)
      7. Di chuyển elements vào groupEl với tọa độ tương đối: `el.style.left = (originalLeft - groupLeft) + 'px'`
      8. Emit `history:push` với `{ type: 'group', groupEl, children: elements, parent, positions, groupLeft, groupTop, groupWidth, groupHeight }`
      9. Emit `layer:refresh`, rồi `editor.selection.select(groupEl)`
    - _Yêu cầu: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

  - [x] 9.2 Implement hàm `ungroup()` trong `group-manager.js`
    - Implement `ungroup()`:
      1. Lấy `el = editor.selection.getSelected()`, guard `el === null || el.dataset.type !== 'group'`
      2. Lấy `parent = el.parentNode`, `groupLeft = parseFloat(el.style.left)`, `groupTop = parseFloat(el.style.top)`
      3. Lấy `children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'))`
      4. Lưu `positions = children.map(child => ({ el: child, relLeft: parseFloat(child.style.left), relTop: parseFloat(child.style.top) }))`
      5. Di chuyển children ra parent với tọa độ tuyệt đối: `child.style.left = (relLeft + groupLeft) + 'px'`, dùng `parent.insertBefore(child, el)`
      6. Xóa `el.remove()`
      7. Emit `history:push` với `{ type: 'ungroup', groupEl: el, children, parent, positions, groupLeft, groupTop }`
      8. Emit `layer:refresh`, rồi `editor.selection.setSelection(children)`
    - _Yêu cầu: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 9.3 Viết property test — Group bounding box chính xác (Property 3)
    - **Property 3: Group bounding box chính xác**
    - **Validates: Yêu cầu 3.2**
    - Test: với tập elements bất kỳ, `groupEl.left === min(el.left)`, `groupEl.top === min(el.top)`, `groupEl.width === max(el.right) - min(el.left)`
    - _Yêu cầu: 3.2_

  - [ ]* 9.4 Viết property test — Tọa độ con sau group là tương đối chính xác (Property 4)
    - **Property 4: Tọa độ con sau group là tương đối chính xác**
    - **Validates: Yêu cầu 3.3**
    - Test: `child.left (mới) === child.left (cũ) - groupEl.left` cho tất cả elements con
    - _Yêu cầu: 3.3_

- [x] 10. Thêm history cases `group`/`ungroup` vào `history.js`
  - [x] 10.1 Thêm case `group` và `ungroup` vào `_revert` trong `history.js`
    - Trong `_revert`, thêm:
      ```js
      case 'group':
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
      ```
    - _Yêu cầu: 3.4, 4.6, 4.7_

  - [x] 10.2 Thêm case `group` và `ungroup` vào `_apply` trong `history.js`
    - Trong `_apply`, thêm:
      ```js
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
    - _Yêu cầu: 4.6, 4.7_

  - [ ]* 10.3 Viết property test — Group/Ungroup undo là phép nghịch đảo chính xác (Property 10)
    - **Property 10: Group/Ungroup undo là phép nghịch đảo chính xác**
    - **Validates: Yêu cầu 4.6, 4.7**
    - Test: sau group rồi undo → số element trong DOM bằng trước, tọa độ khôi phục, GroupElement không còn
    - Test: sau ungroup rồi undo → GroupElement tái tạo, children trở lại bên trong với tọa độ tương đối ban đầu
    - _Yêu cầu: 4.6, 4.7_

- [x] 11. Tích hợp `GroupManager` vào `editor.js` và thêm phím tắt
  - [x] 11.1 Import và khởi tạo `GroupManager` trong `editor.js`
    - Thêm import ở đầu file: `import { GroupManager } from './group-manager.js';`
    - Trong `_initModules()`, thêm: `this.groupManager = new GroupManager(this);`
    - _Yêu cầu: 3.1, 4.1_

  - [x] 11.2 Thêm phím tắt Ctrl+G và Ctrl+Shift+G vào `_handleKeydown` trong `editor.js`
    - Trong `_handleKeydown(e)`, thêm trước block xử lý Delete/Backspace:
      ```js
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
    - _Yêu cầu: 3.1, 4.1_

- [x] 12. Cập nhật `layer-panel.js` để hiển thị icon cho GroupElement
  - [x] 12.1 Thêm icon `group` vào `_getIcon` trong `layer-panel.js`
    - Trong hàm `_getIcon(type)`, thêm entry vào object `icons`:
      ```js
      group: '⊞',
      ```
    - Kết quả: GroupElement (với `data-type="group"`) sẽ hiển thị icon `⊞` thay vì icon mặc định `□`
    - Layer panel đã hỗ trợ expand/collapse cho container elements (bất kỳ element có children) thông qua logic hiện tại — không cần thay đổi thêm
    - _Yêu cầu: 3.5_

  - [ ]* 12.2 Viết unit test cho Layer Panel GroupElement
    - Test: sau `group()`, layer panel render node với icon `⊞` và children elements là con của node đó
    - Test: expand/collapse GroupElement hoạt động đúng
    - _Yêu cầu: 3.5_

- [x] 13. Checkpoint cuối — Đảm bảo tất cả tests pass
  - Đảm bảo tất cả tests pass, hỏi người dùng nếu có thắc mắc.

---

## Ghi chú

- Tasks đánh dấu `*` là optional và có thể bỏ qua để đẩy nhanh tiến độ (hầu hết là test tasks)
- Mỗi task tham chiếu các yêu cầu cụ thể từ `requirements.md` (ví dụ: _Yêu cầu: 1.1, 1.2_)
- Checkpoint tasks giúp xác minh từng giai đoạn trước khi tiếp tục
- Nhóm 1 (bug fixes) có thể chạy song song với nhóm 2 (Canvas Pan)
- Nhóm 3 (Group Manager) phụ thuộc vào task 2.1 (truyền editor vào History)
- Tất cả property tests validate universal correctness properties từ design.md
- Unit tests validate specific examples và edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "5.2"] },
    { "id": 2, "tasks": ["1.3", "2.3", "2.4", "5.3", "6.1", "7.1", "7.2", "7.3"] },
    { "id": 3, "tasks": ["1.4", "2.5", "3.1", "3.2", "5.4", "6.2", "7.4"] },
    { "id": 4, "tasks": ["3.3", "9.1"] },
    { "id": 5, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 6, "tasks": ["10.1", "10.2", "11.1"] },
    { "id": 7, "tasks": ["10.3", "11.2", "12.1"] },
    { "id": 8, "tasks": ["12.2"] }
  ]
}
```
