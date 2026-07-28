# Architecture — HTML Visual Editor

**Status:** Architecture Freeze Ready
**Phase:** G6 — Final Architecture Cleanup

---

## 1. Folder Overview

```
js/
├── core/                    # Editor Core — pure utilities, no DOM coupling
│   ├── render-pipeline.js
│   ├── render-scheduler.js
│   ├── render-profiler.js
│   ├── dirty-state.js
│   ├── viewport-culling.js
│   ├── frame-cache.js
│   ├── benchmark.js
│   ├── clone.js
│   ├── color.js
│   ├── ids.js
│   └── dom.js
│
├── canvas/                  # Canvas abstraction layer
│   ├── canvas-api.js
│   ├── canvas-host.js
│   ├── canvas-style-loader.js
│   ├── canvas-event-bridge.js
│   ├── canvas-mutation-observer.js
│   └── coordinate.js
│
├── selection/               # Selection subsystem (Manager + Modules)
│   ├── selection-manager.js
│   ├── selection-state.js
│   ├── selection-hit-test.js
│   └── selection-events.js
│
├── overlay/                 # Overlay subsystem (Manager + Modules)
│   ├── overlay-manager.js
│   ├── overlay-renderer.js
│   ├── resize-handles.js
│   ├── rotate-handle.js
│   └── quality-badges.js
│
├── history/                 # History subsystem (Manager + Modules)
│   ├── history-manager.js
│   ├── command-stack.js
│   ├── undo.js
│   ├── redo.js
│   └── snapshot.js
│
├── layers/                  # Layers subsystem (Manager + Modules)
│   ├── layer-renderer.js
│   ├── layer-tree.js
│   ├── layer-events.js
│   └── layer-drag.js
│
├── property/                # Property subsystem
│   ├── property-bindings.js
│   ├── property-groups.js
│   ├── property-parser.js
│   ├── property-renderer.js
│   └── property-utils.js
│
├── property-panel/          # Property panel UI
│   ├── index.js
│   ├── background-tab.js
│   ├── border-tab.js
│   ├── effects-tab.js
│   ├── layout-tab.js
│   ├── responsive-tab.js
│   ├── spacing-tab.js
│   ├── transform-tab.js
│   └── typography-tab.js
│
├── page-manager/            # Page management
│   ├── index.js
│   ├── page-crud.js
│   ├── page-tabs.js
│   ├── page-switch.js
│   ├── page-storage.js
│   ├── page-history.js
│   └── utils.js
│
├── export/                  # Export subsystem
│   ├── index.js
│   ├── export-html.js
│   ├── export-css.js
│   ├── export-json.js
│   ├── export-zip.js
│   ├── export-seo.js
│   └── utils.js
│
├── project/                 # Project management
│   ├── index.js
│   ├── serializer.js
│   ├── deserializer.js
│   ├── autosave.js
│   ├── save.js
│   ├── load.js
│   └── storage.js
│
├── templates/               # Templates subsystem
│   ├── index.js
│   ├── builtins.js
│   ├── storage.js
│   ├── insert.js
│   ├── preview.js
│   ├── search.js
│   ├── categories.js
│   ├── thumbnail.js
│   ├── validator.js
│   └── utils.js
│
├── quality/                 # Quality engine
│   ├── index.js
│   ├── scanner.js
│   └── reporter.js
│
├── components/              # Components subsystem
│   ├── index.js
│   ├── definition.js
│   ├── instance.js
│   ├── sync.js
│   ├── detach.js
│   └── utils.js
│
├── ui/                      # UI primitives
│   ├── toast.js
│   ├── modal.js
│   ├── button.js
│   └── context-menu.js     # Re-exports ../context-menu.js
│
├── config.js                # Centralized constants
├── event-bus.js             # Central event dispatcher
├── debug.js                 # Debug logging
├── editor.js                # Main Editor orchestrator
├── selection.js             # Backward-compatible facade
├── overlay.js               # Backward-compatible facade
├── history.js               # Backward-compatible facade
├── layer-panel.js           # Layer panel UI
├── property-panel/          # Property panel UI
├── quality-panel.js         # Quality panel UI
├── element-panel.js         # Element library panel
├── component-panel.js       # Components panel UI
├── context-menu.js          # Context menu UI
├── drag.js                  # Drag interaction
├── resize.js                # Resize interaction
├── rotate.js                # Rotate interaction
├── clipboard.js             # Clipboard operations
├── alignment.js             # Alignment utilities
├── breakpoint-manager.js    # Responsive breakpoints
├── group-manager.js         # Group/Ungroup
├── theme-manager.js         # Design tokens
├── keyboard-shortcuts.js    # Keyboard shortcuts
├── history-helpers.js       # History DOM helpers
└── element-registry.js      # Element type registry
```

---

## 2. Dependency Direction

```
editor.js (orchestrator)
│
├── core/ (pure utilities, no DOM)
├── canvas/ (DOM abstraction)
│
├── selection/ ──► core/, canvas/
├── overlay/   ──► core/, canvas/
├── history/   ──► core/
├── layers/    ──► core/
├── property/  ──► core/
│
├── page-manager/ ──► core/, history/, selection/
├── export/       ──► core/, property/
├── project/      ──► core/, history/
├── templates/    ──► core/, export/
├── quality/      ──► core/, canvas/
├── components/   ──► core/, canvas/
│
├── ui/ (DOM primitives, depends on core)
│
├── drag, resize, rotate ──► core/, canvas/, selection/
├── clipboard ──► core/, selection/
├── alignment ──► core/, selection/
├── context-menu ──► core/, canvas/, selection/
├── keyboard-shortcuts ──► core/
├── breakpoint-manager ──► core/, canvas/
├── group-manager ──► core/, canvas/, selection/
├── theme-manager ──► core/, canvas/
│
└── panels ──► core/, feature modules, canvas/
```

**Rule:** Dependencies flow inward toward `core/`. Feature modules depend on `core/`, never the reverse. Panels depend on feature modules, never the reverse.

---

## 3. Module Responsibilities

### Manager Modules (Orchestrators)

| Manager | Responsibilities |
|---------|------------------|
| `SelectionManager` | Initialize selection state, hit-test, events. Expose public API. Coordinate selection lifecycle. |
| `OverlayManager` | Initialize overlay DOM, renderer, handles, badges. Bind events. Refresh overlay on dirty flags. |
| `HistoryManager` | Initialize command stack, undo/redo managers. Bind history events. Expose push/undo/redo/clear API. |
| `LayerPanel` | Initialize layer tree, events, drag. Register render pipeline. Render layer hierarchy. |

### Submodules (Specialized)

| Module | Responsibility |
|--------|---------------|
| `SelectionState` | Maintain selected elements array. Emit selection change events. |
| `SelectionHitTest` | Resolve DOM element from pointer event. |
| `SelectionEvents` | Bind pointer events to selection handlers. |
| `OverlayRenderer` | Render selection box, hover outline, rubber band, dimension labels. |
| `ResizeHandles` | Create and manage 8 resize handle DOM nodes. |
| `RotateHandle` | Create rotation handle and line. |
| `QualityBadges` | Render quality issue badges on selected elements. |
| `CommandStack` | Maintain undo/redo stacks with max size. |
| `UndoManager` | Revert actions to previous state. |
| `RedoManager` | Re-apply actions to new state. |
| `LayerTree` | Render layer node hierarchy. |
| `LayerEvents` | Bind layer selection, visibility, and drag events. |
| `LayerDrag` | Handle drag-and-drop reordering of layers. |
| `LayerRenderer` | Render layer tree DOM nodes. |

---

## 4. Lifecycle Conventions

Every module follows the same lifecycle interface:

```js
class Module {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    init() {
        // Called once after construction for deferred initialization
    }

    refresh() {
        // Called when module state needs to be re-rendered
        // Modules without visual state may omit this
    }

    destroy() {
        // Called when module is being removed
        // Remove event listeners, release resources
    }
}
```

### Lifecycle Rules
1. **All modules** implement `init()` and `destroy()`.
2. **Modules with visual state** implement `refresh()`.
3. **Pure utility modules** (helpers, stateless services) may omit all three.
4. **Event binding** happens in the constructor.
5. **DOM creation** happens in the constructor or `init()`.
6. **Cleanup** removes event listeners and releases DOM references.

---

## 5. Manager Responsibilities

Managers are the **only public entry points** for their subsystems. They:

1. **Initialize** all submodules in the constructor.
2. **Coordinate** submodule communication.
3. **Expose** a stable public API.
4. **Delegate** implementation to submodules.
5. **Contain no business logic** — only routing and coordination.

### Public API Surface

```js
// Selection
editor.selection.select(el)
editor.selection.toggleSelection(el)
editor.selection.addToSelection(el)
editor.selection.removeFromSelection(el)
editor.selection.setSelection(elements)
editor.selection.deselectAll()
editor.selection.getSelected()
editor.selection.getSelectedAll()
editor.selection.isSelected(el)

// Overlay (internal, accessed via events)
editor.overlay.selectedElements
editor.overlay.renderer

// History
editor.history.push(action)
editor.history.undo()
editor.history.redo()
editor.history.clear()
editor.history.undoStack
editor.history.redoStack
```

---

## 6. Core vs Feature Separation

### Editor Core (`core/`, `canvas/`)
- **No feature logic** — pure utilities, data structures, algorithms.
- **No DOM assumptions** beyond the canvas abstraction.
- **Reusable** across any web-based editor.
- Examples: `RenderPipeline`, `DirtyState`, `ViewportCulling`, `CanvasAPI`.

### Features (`selection/`, `overlay/`, `history/`, `layers/`, `property/`, etc.)
- **Domain-specific logic** — selection, overlay rendering, undo/redo.
- **Depend on Core** — use Core utilities but never the reverse.
- **Exposed via Managers** — each feature has a single manager entry point.
- **Communicate via EventBus** — loose coupling between features.

### UI Layer (`panels/`, `ui/`)
- **Presentation only** — render HTML, attach DOM events.
- **Delegate to Features** — call feature APIs, never implement feature logic.
- **Access Editor via `editor.*`** — panels receive editor reference in constructor.

---

## 7. Dependency Cleanup Checklist

- [x] No circular imports
- [x] No hidden dependencies
- [x] No duplicated initialization
- [x] No duplicated cleanup
- [x] No feature depending directly on implementation details
- [x] Manager → module communication only

---

## 8. Backward Compatibility

All public APIs are preserved:
- `editor.selection.*` — works via `Selection extends SelectionManager`
- `editor.overlay.*` — works via `Overlay extends OverlayManager`
- `editor.history.*` — works via `History extends HistoryManager`
- `editor.layerPanel.*` — unchanged
- `EventBus` events — unchanged
- `window.editor` — unchanged

---

## 9. Ready for Editor Core Extraction

The architecture now supports clean **Editor Core** extraction:

1. **`core/`** is already decoupled from features.
2. **Managers** provide clean boundaries around features.
3. **EventBus** is the only inter-module communication channel.
4. **No circular dependencies** — modules can be reorganized.
5. **Public APIs preserved** — extraction won't break existing code.

To extract Editor Core:
1. Move `core/` and `canvas/` into a separate package.
2. Export `CanvasAPI`, `EventBus`, `DirtyState`, `RenderPipeline` as Core API.
3. Feature modules import from Core package.
4. Editor becomes a thin composition root.

---

*Architecture finalized for Phase G6.*
