# Tài liệu Yêu cầu

## Giới thiệu

Sprint 1 của HTML Studio bổ sung bốn tính năng/sửa lỗi có mức độ ảnh hưởng cao:

1. **Canvas Pan** — Cuộn canvas bằng Space+drag hoặc Middle-click+drag mà không ảnh hưởng đến drag/resize/rotate đang hoạt động.
2. **Group / Ungroup Elements** — Nhóm nhiều elements thành một group container (Ctrl+G) và giải tán group (Ctrl+Shift+G) kèm hỗ trợ undo/redo và hiển thị trong Layer Panel.
3. **Text Edit History (Sửa lỗi)** — Ghi lại lịch sử thay đổi nội dung text khi double-click chỉnh sửa để hỗ trợ undo/redo đúng cách.
4. **Alignment/Resize Breakpoint Fix (Sửa lỗi)** — Đảm bảo mọi thay đổi style từ alignment, resize, drag đều được ghi vào `BreakpointManager` để styles nhất quán khi chuyển breakpoint.

---

## Bảng thuật ngữ

- **Editor**: Module trung tâm (`editor.js`) khởi tạo và điều phối toàn bộ ứng dụng.
- **Canvas**: Vùng làm việc HTML (`#canvas`) nơi các element được đặt.
- **CanvasWrapper**: Phần tử bao ngoài canvas (`#canvas-wrapper`) nhận sự kiện chuột.
- **CanvasContainer**: Phần tử có scrollbar (`#canvas-container`) chứa canvas.
- **Element**: Một phần tử HTML trên canvas có thuộc tính `data-editor-element`.
- **GroupManager**: Module mới (`js/group-manager.js`) quản lý group/ungroup.
- **GroupElement**: Phần tử `<div data-type="group" data-container="true">` bao bọc các element con.
- **Selection**: Module (`selection.js`) quản lý các element đang được chọn.
- **History**: Module (`history.js`) quản lý undo/redo stack.
- **BreakpointManager**: Module (`breakpoint-manager.js`) lưu và áp dụng styles theo breakpoint (desktop/tablet/mobile).
- **LayerPanel**: Module (`layer-panel.js`) hiển thị cây DOM dạng danh sách layer.
- **TextEditAction**: Action history có `type: 'text-edit'` lưu nội dung HTML trước và sau khi sửa.
- **PanMode**: Trạng thái cuộn canvas khi người dùng giữ phím Space hoặc nhấn middle-click.
- **Breakpoint**: Một trong ba ngưỡng hiển thị: `desktop`, `tablet`, `mobile`.

---

## Yêu cầu

### Yêu cầu 1 — Canvas Pan (Space+Drag)

**User Story:** Là một designer, tôi muốn giữ phím Space và kéo chuột để cuộn canvas, để có thể di chuyển góc nhìn mà không cần dùng scrollbar.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn phím Space trong khi con trỏ ở trên CanvasWrapper, THE Editor SHALL chuyển cursor của CanvasWrapper sang `grab`.
2. WHILE PanMode đang hoạt động và người dùng nhấn giữ nút chuột trái, THE Editor SHALL chuyển cursor sang `grabbing` và ghi nhận tọa độ bắt đầu kéo.
3. WHILE PanMode đang hoạt động và chuột đang di chuyển, THE Editor SHALL cập nhật `CanvasContainer.scrollLeft` và `CanvasContainer.scrollTop` theo delta di chuyển của chuột.
4. WHEN người dùng thả nút chuột trái trong PanMode, THE Editor SHALL kết thúc thao tác pan và giữ cursor là `grab`.
5. WHEN người dùng nhả phím Space, THE Editor SHALL thoát PanMode và khôi phục cursor về mặc định.
6. IF PanMode đang hoạt động, THEN THE Editor SHALL ngăn không cho thao tác drag element, resize, hoặc rotate bắt đầu trong thời gian đó.
7. WHEN người dùng nhấn phím Space trong khi con trỏ đang focus vào `INPUT`, `TEXTAREA`, hoặc `contenteditable`, THE Editor SHALL không kích hoạt PanMode.

### Yêu cầu 2 — Canvas Pan (Middle-Click+Drag)

**User Story:** Là một designer, tôi muốn nhấn giữ nút giữa chuột và kéo để cuộn canvas, để có thao tác pan tự nhiên như các phần mềm thiết kế khác.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn nút giữa chuột (button 1) trên CanvasWrapper, THE Editor SHALL kích hoạt PanMode và ghi nhận tọa độ bắt đầu.
2. WHILE Middle-click PanMode đang hoạt động và chuột di chuyển, THE Editor SHALL cập nhật `CanvasContainer.scrollLeft` và `CanvasContainer.scrollTop` theo delta di chuyển.
3. WHEN người dùng thả nút giữa chuột, THE Editor SHALL kết thúc Middle-click PanMode và khôi phục cursor.
4. IF Middle-click PanMode đang hoạt động, THEN THE Editor SHALL ngăn hành vi mặc định của browser (auto-scroll) bằng cách gọi `e.preventDefault()`.
5. IF PanMode đang hoạt động (qua bất kỳ phương thức nào), THEN THE Editor SHALL không bắt đầu thao tác drag element, resize, hoặc rotate mới.

### Yêu cầu 3 — Group Elements (Ctrl+G)

**User Story:** Là một designer, tôi muốn nhóm nhiều elements đang chọn thành một group container bằng Ctrl+G, để quản lý và di chuyển chúng như một khối duy nhất.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn Ctrl+G và có từ 2 elements trở lên đang được chọn, THE GroupManager SHALL tạo một GroupElement mới với `data-type="group"` và `data-container="true"`.
2. WHEN GroupManager tạo GroupElement, THE GroupManager SHALL đặt `position: absolute` và bounding box (left, top, width, height) của GroupElement bằng bounding box bao quanh tất cả elements con được chọn.
3. WHEN GroupManager tạo GroupElement, THE GroupManager SHALL di chuyển các elements con được chọn vào bên trong GroupElement và điều chỉnh `left`, `top` của từng element con thành tọa độ tương đối so với góc trên-trái của GroupElement.
4. WHEN GroupManager hoàn tất group, THE History SHALL nhận một action `{ type: 'group', groupEl, children, parent, positions }` để hỗ trợ undo.
5. WHEN GroupManager hoàn tất group, THE LayerPanel SHALL hiển thị GroupElement như một node cha có thể expand/collapse và hiển thị các elements con bên trong.
6. WHEN GroupManager hoàn tất group, THE Selection SHALL tự động chọn GroupElement mới.
7. IF chỉ có 1 element đang được chọn khi nhấn Ctrl+G, THEN THE GroupManager SHALL không thực hiện thao tác group.

### Yêu cầu 4 — Ungroup Elements (Ctrl+Shift+G)

**User Story:** Là một designer, tôi muốn giải tán một group bằng Ctrl+Shift+G, để chỉnh sửa từng element con riêng lẻ.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhấn Ctrl+Shift+G và element đang chọn là GroupElement (`data-type="group"`), THE GroupManager SHALL di chuyển các elements con ra khỏi GroupElement và về parent của GroupElement, đồng thời điều chỉnh `left`, `top` thành tọa độ tuyệt đối trên canvas.
2. WHEN GroupManager thực hiện ungroup, THE GroupManager SHALL xóa GroupElement khỏi DOM sau khi các elements con đã được chuyển ra.
3. WHEN GroupManager hoàn tất ungroup, THE History SHALL nhận một action `{ type: 'ungroup', groupEl, children, parent, positions }` để hỗ trợ undo.
4. WHEN GroupManager hoàn tất ungroup, THE Selection SHALL tự động chọn tất cả elements con vừa được giải tán.
5. IF element đang chọn không phải GroupElement khi nhấn Ctrl+Shift+G, THEN THE GroupManager SHALL không thực hiện thao tác ungroup.
6. WHEN History nhận action `group` và undo được gọi, THE History SHALL khôi phục các elements con về parent ban đầu, xóa GroupElement, và phát `element:deleted` + `layer:refresh`.
7. WHEN History nhận action `ungroup` và undo được gọi, THE History SHALL tái tạo GroupElement, đưa elements con trở lại bên trong GroupElement, và phát `element:added` + `layer:refresh`.

### Yêu cầu 5 — Text Edit History (Sửa lỗi)

**User Story:** Là một designer, tôi muốn có thể undo/redo thay đổi nội dung text sau khi double-click chỉnh sửa, để không mất công sức khi chỉnh sửa nhầm.

#### Tiêu chí chấp nhận

1. WHEN Selection bắt đầu `_startEditing(el)`, THE Selection SHALL lưu giá trị `el.innerHTML` vào biến `_textBefore`.
2. WHEN Selection kết thúc `_stopEditing(el)` và `el.innerHTML` khác với `_textBefore`, THE Selection SHALL phát `history:push` với action `{ type: 'text-edit', element: el, before: _textBefore, after: el.innerHTML }`.
3. IF `el.innerHTML` khi kết thúc edit bằng với `_textBefore`, THEN THE Selection SHALL không phát `history:push` để tránh thêm action thừa vào history stack.
4. WHEN History nhận action `{ type: 'text-edit' }` và `_revert` được gọi, THE History SHALL gán `action.element.innerHTML = action.before` và phát `element:updated`.
5. WHEN History nhận action `{ type: 'text-edit' }` và `_apply` được gọi, THE History SHALL gán `action.element.innerHTML = action.after` và phát `element:updated`.
6. WHEN người dùng nhấn Escape trong lúc editing, THE Selection SHALL kết thúc edit và kiểm tra thay đổi theo tiêu chí 2–3 trước khi blur.

### Yêu cầu 6 — Alignment/Resize/Drag Breakpoint Fix (Sửa lỗi)

**User Story:** Là một designer, tôi muốn các thay đổi vị trí và kích thước từ alignment, resize, và drag luôn được lưu đúng vào breakpoint hiện tại, để khi chuyển sang breakpoint khác rồi quay lại, các giá trị không bị mất.

#### Tiêu chí chấp nhận

1. WHEN Alignment thay đổi `left`, `top`, `width`, hoặc `height` của một element, THE Alignment SHALL gọi `editor.breakpointManager.setStyle(el, prop, value)` cho mỗi thuộc tính thay đổi thay vì gán trực tiếp vào `el.style`.
2. WHEN Resize kết thúc (mouseup) và kích thước đã thay đổi, THE Resize SHALL gọi `editor.breakpointManager.setStyle(el, prop, value)` cho mỗi thuộc tính `left`, `top`, `width`, `height` của trạng thái cuối.
3. WHEN Drag kết thúc (mouseup) và vị trí đã thay đổi, THE Drag SHALL gọi `editor.breakpointManager.setStyle(el, prop, value)` cho `left` và `top` của trạng thái cuối.
4. WHEN History thực hiện `_revert` hoặc `_apply` cho action type `move` hoặc `resize`, THE History SHALL gọi `editor.breakpointManager.setStyle(el, prop, value)` sau khi gán `el.style` để đồng bộ ngược vào breakpoint store.
5. THE BreakpointManager SHALL duy trì tính nhất quán: sau khi `setStyle` được gọi, giá trị được lưu trong `el.__bpStyles[currentBreakpoint][prop]` và được phản ánh ngay lập tức trên `el.style`.
6. WHEN người dùng chuyển từ breakpoint A sang breakpoint B rồi quay lại breakpoint A, THE BreakpointManager SHALL hiển thị lại đúng các giá trị `left`, `top`, `width`, `height` đã được ghi bởi Alignment, Resize, hoặc Drag tại breakpoint A.
