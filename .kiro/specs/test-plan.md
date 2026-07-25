# HTML Studio — Test Plan

Thực hiện theo thứ tự từ trên xuống. Mỗi test đánh dấu ✅ PASS / ❌ FAIL / ⚠️ PARTIAL.

---

## T1 — Khởi động & Auto-load

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T1.1 | Mở `index.html` trong browser | App load không lỗi console |
| T1.2 | Kiểm tra tab Bar | Hiện 1 tab "Page 1" active |
| T1.3 | Kiểm tra right panel | Có 7 tabs: Elements / Templates / Layers / Theme / Quality / Components |
| T1.4 | Kiểm tra toolbar | Có nút Q: — bên phải |
| T1.5 | Kiểm tra CSS editor | Panel trái có section "CSS" ở cuối (collapsed) |

---

## T2 — Element Operations

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T2.1 | Click "Section" trong Elements panel | Section xuất hiện trên canvas, selected |
| T2.2 | Drag section trên canvas | Di chuyển mượt, dimension label hiện realtime |
| T2.3 | Resize section (kéo handle) | Size label hiện realtime khi resize |
| T2.4 | Rotate section (handle xanh) | Rotate mượt, snap 15° khi giữ Shift |
| T2.5 | Alt+Drag section | Section gốc giữ nguyên, bản copy được drag |
| T2.6 | Double-click vào `<img>` element | File picker mở |
| T2.7 | Ctrl+Z sau T2.5 | Bản copy bị xóa, section gốc còn nguyên |

---

## T3 — Context Menu

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T3.1 | Right-click element | Menu hiện đủ items: Copy, Paste, Duplicate, Delete, Lock, Hide, Bring to Front, Move Forward, Move Backward, Send to Back, Wrap in Container, Group, Ungroup, Save as Template, Save as Component |
| T3.2 | Click "Lock" | Element bị lock (pointer-events: none), label đổi thành "Unlock" |
| T3.3 | Right-click element locked | Label hiện "Unlock" |
| T3.4 | Click "Hide" | Element ẩn trong layer tree (icon ○), hiển thị style display:none |
| T3.5 | Click "Bring to Front" | Element lên top z-order trong layer |
| T3.6 | Click "Wrap in Container" | Element được bọc trong div container mới |
| T3.7 | Right-click element không phải component instance | Item "Detach Instance" ẩn |

---

## T4 — Keyboard Shortcuts

| # | Phím | Kết quả mong đợi |
|---|---|---|
| T4.1 | Ctrl+Z / Ctrl+Shift+Z | Undo/Redo hoạt động |
| T4.2 | Ctrl+D | Duplicate element |
| T4.3 | Ctrl+L | Lock/Unlock toggle |
| T4.4 | Ctrl+H | Hide/Show toggle |
| T4.5 | Ctrl+] | Move Forward |
| T4.6 | Ctrl+[ | Move Backward |
| T4.7 | Ctrl+Shift+] | Bring to Front |
| T4.8 | Ctrl+Shift+[ | Send to Back |
| T4.9 | Ctrl+G | Group 2+ selected elements |
| T4.10 | Ctrl+Shift+G | Ungroup |

---

## T5 — Multi-Page

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T5.1 | Click "+" trên Tab Bar | Tab mới "Page 2" xuất hiện, canvas trống |
| T5.2 | Add element vào Page 2 | Element hiện trên Page 2 |
| T5.3 | Click tab "Page 1" | Canvas hiển thị nội dung Page 1, không thấy element Page 2 |
| T5.4 | Ctrl+Z | Undo action cuối của Page 1 (không ảnh hưởng Page 2) |
| T5.5 | Ctrl+Z để undo thêm trang | Page 2 bị xóa (page:add undo) |
| T5.6 | Ctrl+Shift+Z | Page 2 được restore |
| T5.7 | Double-click tab | Inline rename hoạt động, Enter để confirm |
| T5.8 | Right-click tab | Context menu: Rename / Duplicate / Delete |
| T5.9 | Delete page khi chỉ có 1 trang | Không làm gì |
| T5.10 | Rename page + Ctrl+Z | Tên cũ được khôi phục |

---

## T6 — Auto-save & Load

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T6.1 | Add 2 trang, thêm elements vào mỗi trang | — |
| T6.2 | Reload browser (F5) | Project khôi phục đúng 2 trang + nội dung |
| T6.3 | Tab Bar hiện đúng số trang | ✓ |
| T6.4 | Switch trang sau reload | Canvas đúng với từng trang |
| T6.5 | Click "Save" → download JSON | File `project-*.json` có `version: "2.2"`, có `theme`, `components`, `pages` |
| T6.6 | Xóa localStorage, click "Load", load file vừa save | Project khôi phục hoàn toàn |
| T6.7 | Load file v1.0 (chỉ có `elements`) | Backward compat: tạo 1 trang với elements đó |

---

## T7 — Theme System

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T7.1 | Mở tab "Theme" | Panel hiện đúng 5 groups: Colors, Typography, Spacing, Radius, Shadow |
| T7.2 | Đổi `--color-primary` sang màu đỏ | Color picker + text input sync nhau |
| T7.3 | Thêm element dùng `var(--color-primary)` trong background | Element hiển thị màu đỏ ngay |
| T7.4 | Click "↺ Reset" | Tất cả tokens trở về defaults |
| T7.5 | Save + reload → kiểm tra JSON | `theme` object có đủ tokens |
| T7.6 | Export ZIP → mở `style.css` | Đầu file có `:root { --color-primary: ...; }` |

---

## T8 — Quality Engine

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T8.1 | Thêm `<img>` element, không set alt | Badge 🔴 xuất hiện trên element sau ~1s |
| T8.2 | Mở tab "Quality" | Issue "alt-missing" hiện trong list, severity: error |
| T8.3 | Click "Fix" | `alt=""` được thêm vào, badge biến mất |
| T8.4 | Canvas không có `<h1>` | Issue "missing-h1" trong list |
| T8.5 | Click badge 🔴 trên canvas | Tab Quality mở, issue tương ứng highlight |
| T8.6 | Click "Go to" | Element được select + scroll vào view |
| T8.7 | Score badge trên toolbar | Hiện đúng giá trị, màu đỏ/cam/xanh theo score |
| T8.8 | Click "⟳ Scan" | Rescan thủ công |

---

## T9 — Component System

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T9.1 | Select element, right-click → "Save as Component" | Component xuất hiện trong tab Components |
| T9.2 | Click component trong panel | Instance được insert lên canvas với icon ⬡ trong layer tree |
| T9.3 | Insert thêm 1 instance nữa | 2 instances trên canvas |
| T9.4 | Select instance, right-click → "Detach Instance" | Icon ⬡ biến mất, element thành plain HTML |
| T9.5 | Ctrl+Z sau detach | Instance được restore (⬡ trở lại) |
| T9.6 | Select instance, click "↑ Update" trong component panel | Instance khác trên canvas cũng cập nhật |
| T9.7 | Delete component (✕ trong panel) | Instances còn lại được detach |
| T9.8 | Save project → reload | Components được khôi phục từ JSON |

---

## T10 — Inline CSS Editor

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T10.1 | Select element → click "CSS" section | Section mở ra, textarea hiện current CSS |
| T10.2 | Sửa một property (vd: `color: red;`) → click "Apply" | Element cập nhật ngay |
| T10.3 | Ctrl+Enter trong textarea | Apply hoạt động với shortcut |
| T10.4 | Property panel fields sync | Fields "Color" trong Typography cập nhật theo |
| T10.5 | Nhập CSS lỗi (thiếu `:`) | Error message hiện bên dưới textarea |
| T10.6 | Ctrl+Z sau Apply | Style trở về trước khi Apply |
| T10.7 | Switch element | Textarea cập nhật CSS của element mới |
| T10.8 | Click "Copy" | CSS text được copy vào clipboard |

---

## T11 — Template Marketplace

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T11.1 | Mở tab "Templates" | Hiện filter bar + 6 built-in templates |
| T11.2 | Filter "Landing" | Chỉ hiện "Landing Page" |
| T11.3 | Search "blog" | Chỉ hiện "Blog" template |
| T11.4 | Click 👁 Preview | Modal mở với thumbnail, description, page list |
| T11.5 | Click "New Project" khi canvas có nội dung | Confirm dialog hiện |
| T11.6 | Confirm → load "Landing Page" | Canvas hiện Hero section, có 1 tab "Home" |
| T11.7 | Load "Portfolio" → "Insert Pages" | 3 trang Portfolio được append vào project hiện tại |
| T11.8 | Tab "Saved" | Hiện user templates (trống nếu chưa save) |
| T11.9 | Select element → "+ Save" | Template xuất hiện trong tab Saved |

---

## T12 — Export

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T12.1 | Click "Export" → tab HTML | Clean HTML không có inline style |
| T12.2 | Tab CSS | `:root` vars ở đầu, `.classname` rules bên dưới |
| T12.3 | Click "⬇ ZIP" | Download `project-*.zip` |
| T12.4 | Mở ZIP | Có `index.html` + `style.css` + các trang khác dạng slug |
| T12.5 | Project 2 trang: "Home" + "About Us" | ZIP: `index.html` + `about-us.html` + `style.css` |
| T12.6 | Mở `index.html` trong browser | Render đúng, không có `data-editor-element`, không có `data-component-id` |
| T12.7 | `style.css` đầu file | Có `:root { --color-primary: ...; }` nếu đã sửa theme |

---

## T13 — Responsive / Breakpoints

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T13.1 | Click 📱 Tablet | Canvas thu nhỏ, badge "Tablet" hiện |
| T13.2 | Thay đổi width element ở Tablet | Style chỉ apply cho breakpoint tablet |
| T13.3 | Quay về Desktop | Element về width desktop |
| T13.4 | Export CSS | `@media (max-width: 768px)` có override đó |

---

## T14 — Known Edge Cases

| # | Bước | Kết quả mong đợi |
|---|---|---|
| T14.1 | Add 100+ elements | App không lag, auto-save không crash |
| T14.2 | Undo 100 lần | Stack dừng ở maxHistory (100), không crash |
| T14.3 | Tab name 25 ký tự | Bị truncate thành 20 ký tự + "…" trong tab |
| T14.4 | Drag element ra ngoài canvas bounds | Element không bị lost (clamp hoặc scroll) |
| T14.5 | Page tab rename rỗng → Enter | Tên cũ được giữ nguyên |
| T14.6 | localStorage full (QuotaExceededError) | Warning log, không crash, không mất dữ liệu hiện tại |

---

## Bugs Tracking

| # | Mô tả | File | Status |
|---|---|---|---|
| — | — | — | — |

> Ghi bug vào bảng này khi test. Format: `B1 | Mô tả | file.js:line | Open/Fixed`
