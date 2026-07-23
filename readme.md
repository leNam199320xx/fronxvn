# HTML Studio

> Build visually. Own forever.

A lightweight HTML Visual Editor that generates clean, semantic, production-ready HTML and CSS.

No vendor lock-in. No framework required. Deploy anywhere.

---

## Vision

The web should belong to its creators.

HTML Studio is designed for freelancers, startups, agencies and businesses who want to build websites visually without sacrificing ownership of their code.

Your website always belongs to you.

---

## Design Principles

**HTML First** — Generate semantic HTML before anything else. Never sacrifice code quality for visual effects.

**Clean Code** — Readable HTML. Readable CSS. No generated garbage.

**Performance First** — Fast loading, small bundle, zero unnecessary dependencies.

**Own Your Code** — Every project can be exported. No proprietary runtime. No binary project format.

**Deploy Anywhere** — Apache, Nginx, Cloudflare Pages, GitHub Pages, Netlify, Vercel, NAS, offline. Anywhere.

---

## Current Features

### Canvas

- Absolute positioning on an infinite canvas
- Drag & drop to move elements
- Resize (8 handles: corners + edges)
- Rotate with rotation handle
- Multi-select with Shift+Click and rubber-band drag
- Smart alignment guides (snap to edges and centers)
- Snap to grid (10px grid, toggleable)
- Zoom in/out (Ctrl+Scroll or toolbar buttons), reset
- Pan (Space+drag or middle-click drag)
- Lock / Hide elements
- Group / Ungroup elements

### Elements

Layout: Section, Container, Div, Row, Column, Card

Content: Heading (H1–H6), Paragraph, Text, Image, Video, SVG, Icon, Button, Link

Forms: Form, Input, Select, Checkbox, Radio, Textarea

### Properties Panel

Full CSS editing for the selected element:

- Layout: position, x/y, width/height, min/max dimensions, display, flexbox, grid, overflow, z-index
- Spacing: margin, padding (top/right/bottom/left)
- Typography: font family, size, weight, line height, letter spacing, text align, transform, decoration, color
- Background: color, image, size, position, repeat
- Border: width, style, color, radius
- Shadow: box-shadow
- Effects: opacity, filter
- Transform: rotate, scale, translate, skew

### Layers Panel

- Tree view of all elements on canvas
- Expand/collapse nested elements
- Click to select, Shift+Click to multi-select
- Drag to reorder layers
- Double-click to rename
- Toggle visibility per element

### Responsive / Breakpoints

- Three breakpoints: Desktop (full), Tablet (768px), Mobile (375px)
- Per-breakpoint style overrides (stored in `__bpStyles` on each element)
- Visual indicator on canvas when in tablet/mobile mode

### Multi-Page Project

- Unlimited pages per project, managed via Tab Bar above the canvas
- Add page ("+"), switch, rename (double-click or right-click → Rename), duplicate, delete
- Each page has an independent undo/redo history
- Tab context menu: Rename / Duplicate / Delete (Delete disabled when only 1 page)
- Page names longer than 20 characters are truncated with ellipsis in the tab; full name shown on hover

### History (Undo / Redo)

- Per-page undo/redo stack (up to 100 actions)
- Tracks: move, resize, rotate, style change, add, delete, text edit, group, ungroup
- Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
- History is swapped when switching pages — no cross-page interference

### Clipboard

- Copy / Paste / Cut / Duplicate elements
- Keyboard shortcuts: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+D

### Alignment

- Align selected elements: left, center, right, top, middle, bottom
- Full width / Full height stretch
- Works with multi-selection

### Group Manager

- Group selected elements into a container (Ctrl+G)
- Ungroup (Ctrl+Shift+G)
- Group preserves absolute positions of children

### Context Menu

Right-click any element on canvas:

- Copy / Paste / Duplicate / Delete
- **Lock / Unlock** (toggle, Ctrl+L)
- **Hide / Show** (toggle, Ctrl+H)
- **Bring to Front / Send to Back** (Ctrl+Shift+] / Ctrl+Shift+[)
- **Move Forward / Move Backward** (Ctrl+] / Ctrl+[)
- **Wrap in Container** — bọc selection trong div container mới
- Group / Ungroup (Ctrl+G / Ctrl+Shift+G)
- Save as Template / **Save as Component**
- **Detach Instance** — tách component instance thành plain HTML (chỉ hiện khi element là instance)

### Template Manager

Predefined layout templates that can be inserted onto the canvas.

- **6 built-in templates**: Landing Page, Portfolio (3 pages), Blog (2 pages), Restaurant (2 pages), Pricing, Coming Soon
- **Filter bar**: All / Landing / Portfolio / Blog / Business / Saved
- **Search**: filter by name or description
- **Insert modes**: "New Project" (replace current with confirm) or "Insert Pages" (append to existing project)
- **Preview modal**: see template description, page list and thumbnail before inserting
- **User templates**: save any selected element as a reusable template, stored in localStorage

### Component System

- **Save as Component** — lưu selected elements thành ComponentDefinition (id, name, html, bpStyles, thumbnail)
- **Component Panel** — tab "Components" trong right panel, grid thumbnail, click để insert instance
- **Instance** — element trên canvas có `data-component-id` và `data-instance-id`, icon ⬡ trong layer tree
- **Update Definition** — chọn instance, click "↑ Update" để sync HTML mới xuống tất cả instances
- **Detach** — tách instance thành plain HTML, mất link với definition
- **Delete Component** — auto-detach tất cả instances trước khi xóa definition
- **Undo/Redo** cho insert và detach
- **Export** — component refs bị loại bỏ, export ra plain HTML thuần

### HTML Quality Engine

- Tự động scan canvas sau mỗi thay đổi (debounce 800ms)
- **10 checks**: `alt-missing`, `empty-heading`, `label-missing`, `duplicate-id`, `element-too-small`, `deep-nesting`, `missing-h1`, `low-contrast` (WCAG AA 4.5:1), `empty-link`, `autoplay-video`
- **Visual badges** trên canvas: 🔴 error / 🟡 warning / 🔵 info tại góc trên-phải element
- **Quality Panel** — tab "Quality" trong right panel, issues grouped by severity, "Go to" và "Fix" (auto-fix cho một số lỗi)
- **Quality Score** 0–100 trên toolbar, màu xanh/cam/đỏ, click mở tab Quality

### Project Save / Load

- **Auto-save**: debounced 1-second save to `localStorage` on every change (element add/delete/update, history change, page add/delete/rename/switch)
- **Manual save**: downloads a `.json` project file
- **Manual load**: loads a `.json` project file
- **Format v2.0**: `{ version, timestamp, meta, pages[] }` — each page stores `id`, `name`, `html`, `bpStyles`, `meta`
- **Backward compatible** with v1.0 format (`elements[]`) — automatically converted to a single-page v2.0 project on load
- On reload: auto-restores from `localStorage`; if no saved data exists, creates a blank "Page 1"

### Export

- **HTML tab**: clean HTML with class attributes (no inline styles)
- **CSS tab**: clean CSS with `.classname` rules + `@media` queries for tablet/mobile breakpoints
- **JSON tab**: raw project data as JSON
- **SEO panel**: title, meta description, canonical URL, Open Graph tags (title, description, image)
- **Download button**: download the active tab's content as a file
- **ZIP button**: packages all pages as separate HTML files + one shared `style.css`
  - First page → `index.html`
  - Other pages → slugified filename (e.g. "About Us" → `about-us.html`)
  - Duplicate slug conflicts resolved with `-2`, `-3` suffixes

---

## Project Structure

```
fronxvn/
├── index.html              # App shell
├── css/
│   └── editor.css          # All styles (editor UI + canvas elements)
└── js/
    ├── editor.js           # Main orchestrator, initializes all modules
    ├── event-bus.js        # Singleton EventBus — central pub/sub communication
    ├── config.js           # All config constants (single source of truth)
    ├── page-manager.js     # Multi-page CRUD, Tab Bar, per-page history swap
    ├── project.js          # Save/load project JSON (v2.1), auto-save to localStorage
    ├── export.js           # Export HTML/CSS/JSON, ZIP multi-page download
    ├── history.js          # Undo/redo stack (per active page)
    ├── selection.js        # Click/shift-click/rubber-band selection
    ├── overlay.js          # Selection box, resize handles, rotation handle, hover, quality badges
    ├── drag.js             # Move elements by dragging (Alt+drag to duplicate)
    ├── resize.js           # Resize elements via handles
    ├── rotate.js           # Rotate elements via rotation handle
    ├── alignment.js        # Align/distribute selected elements
    ├── clipboard.js        # Copy/paste/cut/duplicate
    ├── group-manager.js    # Group/ungroup elements
    ├── context-menu.js     # Right-click context menu (lock, hide, z-order, wrap, component)
    ├── property-panel.js   # Left panel — CSS property editor
    ├── layer-panel.js      # Right panel — layer tree view (with component instance badge)
    ├── element-panel.js    # Right panel — element library
    ├── template-manager.js # Right panel — Template Marketplace (6 built-ins + user templates)
    ├── breakpoint-manager.js # Breakpoint switching and per-bp style overrides
    ├── quality-engine.js   # HTML quality scanner — 10 checks, score 0-100
    ├── quality-panel.js    # Right panel — Issues list, Go to, Fix, quality score badge
    ├── component-manager.js # Component save/insert/update/detach/delete
    ├── component-panel.js  # Right panel — Component library grid
    └── templates/
        ├── index.js        # Barrel export + CATEGORIES
        ├── landing-page.js
        ├── portfolio.js
        ├── blog-post.js
        ├── restaurant.js
        ├── pricing.js
        └── coming-soon.js
```

### Architecture

All modules communicate exclusively through **EventBus** — no module imports another module directly (except `editor.js` which bootstraps them all).

```
User interaction
      ↓
  DOM Events
      ↓
  EventBus.emit()
      ↓
  Module listeners
      ↓
  DOM mutations / EventBus.emit()
```

Key events:

| Event | Emitter | Listeners |
|---|---|---|
| `page:switch` | Tab Bar click | PageManager |
| `page:switched` | PageManager | PropertyPanel, LayerPanel (via `layer:refresh`) |
| `selection:deselect-all` | PageManager | Selection |
| `overlay:clear` | PageManager | Overlay |
| `history:push` | drag/resize/rotate/style | History |
| `history:changed` | History, PageManager | toolbar buttons |
| `element:selected` | Selection | Overlay, PropertyPanel, LayerPanel |
| `layer:refresh` | PageManager, History | LayerPanel |
| `project:save` | toolbar | ProjectManager |
| `export:show` | toolbar | ExportManager |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+X | Cut |
| Ctrl+D | Duplicate |
| Ctrl+G | Group |
| Ctrl+Shift+G | Ungroup |
| Ctrl+L | Lock / Unlock toggle |
| Ctrl+H | Hide / Show toggle |
| Ctrl+] | Move Forward |
| Ctrl+[ | Move Backward |
| Ctrl+Shift+] | Bring to Front |
| Ctrl+Shift+[ | Send to Back |
| Delete / Backspace | Delete selected element |
| Arrow keys | Move element 1px |
| Shift+Arrow keys | Move element 10px |
| Space+drag | Pan canvas |
| Ctrl+Scroll | Zoom |
| Alt+Drag | Duplicate & move copy |

---

## Getting Started

No build step required. Open `index.html` in a browser directly, or serve with any static file server:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

---

## Project File Format (v2.0)

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
      "html": "<div data-editor-element ...>...</div>",
      "bpStyles": {
        "el-abc": { "tablet": { "width": "100%" } }
      },
      "meta": {}
    }
  ]
}
```

Files saved with the old v1.0 format (`elements[]`) are automatically migrated to v2.0 on load.

---

## Roadmap

### v0.1 ✅
Canvas, selection, drag, resize, property panel, layers, HTML export, project save

### v0.2 ✅
Responsive breakpoints, undo/redo, clipboard, alignment, groups, context menu, templates, theme

### v0.3 ✅
Multi-page project, per-page history, ZIP export, auto-save v2.0, backward compatibility

### v0.4 ✅
HTML Quality Engine — 10 checks, visual badges, issues panel, quality score, auto-fix

### v0.5 ✅
Component System — save/insert/update/detach, component panel, layer badge, undo/redo, export-safe

### v0.6 ✅
Template Marketplace — 6 built-in templates, filter/search, New Project / Insert Pages modes, preview modal

### v0.7
Cloud Save, Cloud Publish, Forms API, Authentication

### v1.0
Platform ready, Marketplace, Backend APIs, Plugin SDK, Self-hosting

---

## Philosophy

We don't want to own your website.

We want you to own it.

Build visually. Export freely. Deploy anywhere. Grow at your own pace.
