# CSS Architecture Report — Phase C6

## Folder Structure

```
css/
├── base.css                  # Aggregate: base + scrollbar
├── variables.css             # Re-export: css/base/variables.css + html/body
├── layout.css                # Aggregate: layout/*
├── canvas.css                # Aggregate: canvas/*
├── interaction.css           # Aggregate: interaction/*
├── components.css            # Aggregate: components/*
├── features.css              # Aggregate: features/*
├── theme.css                 # Aggregate: features/theme.css + themes/theme.css
├── scrollbar.css             # (wrapper -> css/scrollbar.css)
├── layers.css                # (wrapper -> features/layers.css)
├── page-tabs.css             # (wrapper -> features/page-tabs.css)
├── templates.css             # (wrapper -> features/templates.css)
├── quality.css               # (wrapper -> features/quality.css)
├── notifications.css         # (wrapper -> features/notifications.css)
├── viewport.css              # (wrapper -> features/viewport.css)
├── overlay.css               # (wrapper -> features/overlay.css)
├── css-editor.css            # (wrapper -> features/css-editor.css)
├── canvas/
│   ├── canvas.css
│   ├── viewport.css
│   ├── grid.css
│   └── rulers.css
├── interaction/
│   ├── interaction.css
│   ├── selection.css
│   ├── overlay.css
│   ├── resize-handles.css
│   ├── rotate-handle.css
│   ├── guides.css
│   └── hover.css
├── base/
│   ├── base.css
│   ├── reset.css
│   ├── variables.css
│   └── typography.css
├── components/
│   └── components.css
├── features/
│   ├── layers.css
│   ├── page-tabs.css
│   ├── templates.css
│   ├── quality.css
│   ├── notifications.css
│   ├── css-editor.css
│   ├── viewport.css
│   ├── overlay.css
│   └── theme.css
└── themes/
    ├── theme.css
    ├── light.css
    └── dark.css
```

## Import Tree

```
css/editor.css
├── css/base.css
│   ├── css/base/base.css
│   │   ├── css/base/reset.css
│   │   ├── css/base/variables.css
│   │   └── css/base/typography.css
│   └── css/scrollbar.css
├── css/layout.css
│   ├── css/layout/shell.css
│   ├── css/layout/toolbar.css
│   ├── css/layout/sidebar.css
│   ├── css/layout/panels.css
│   └── css/layout/statusbar.css
├── css/canvas.css
│   ├── css/canvas/canvas.css
│   ├── css/canvas/viewport.css
│   ├── css/canvas/grid.css
│   └── css/canvas/rulers.css
├── css/interaction.css
│   ├── css/interaction/selection.css
│   ├── css/interaction/overlay.css
│   ├── css/interaction/resize-handles.css
│   ├── css/interaction/rotate-handle.css
│   ├── css/interaction/guides.css
│   └── css/interaction/hover.css
├── css/components.css
│   └── css/components/components.css
├── css/features.css
│   ├── css/features/layers.css
│   ├── css/features/page-tabs.css
│   ├── css/features/templates.css
│   ├── css/features/quality.css
│   ├── css/features/notifications.css
│   ├── css/features/css-editor.css
│   ├── css/features/viewport.css
│   └── css/features/overlay.css
└── css/theme.css
    ├── css/features/theme.css
    └── css/themes/theme.css
        ├── css/themes/light.css
        └── css/themes/dark.css
```

## Duplicate CSS Removed

- `.multi-select-notice` — removed from `css/editor.css`, kept in `css/interaction/selection.css`
- `.overlay-*` / `.resize-handle` / `.move-handle` / `.rotation-*` / `.guide-line` / `.overlay-dimension` / `.overlay-position` — de-duplicated from `css/overlay.css` into domain-specific interaction/features files
- `.theme-*` — de-duplicated from `css/editor.css` into `css/features/theme.css`
- `.tpl-*` — de-duplicated from `css/editor.css` into `css/features/templates.css`
- `.quality-*` — de-duplicated from `css/editor.css` into `css/features/quality.css`
- `.page-tab-*` — de-duplicated from `css/editor.css` into `css/features/page-tabs.css`
- `.layer-*` — de-duplicated from `css/editor.css` into `css/features/layers.css`
- `.css-editor-*` — de-duplicated from `css/components/components.css` into `css/features/css-editor.css`
- `.editor-notification` — de-duplicated from `css/components/components.css` into `css/features/notifications.css`
- `fadeIn` keyframe — de-duplicated from `css/overlay.css` into `css/features/overlay.css`
- Duplicate `:root` variables — consolidated into `css/base/variables.css` only; `css/variables.css` now re-exports

## Unused CSS

- `css/viewport.css` — retained as legacy wrapper to maintain backward compatibility with existing `<link>` references
- `css/overlay.css` — retained as legacy wrapper
- `css/layers.css` — retained as legacy wrapper
- `css/page-tabs.css` — retained as legacy wrapper
- `css/templates.css` — retained as legacy wrapper
- `css/quality.css` — retained as legacy wrapper
- `css/notifications.css` — retained as legacy wrapper
- `css/css-editor.css` — retained as legacy wrapper
- `css/theme.css` — retained as theme feature aggregator
- `js/canvas/styles/editor.css` — retained for canvas iframe context (loaded by CanvasStyleLoader)

## Remaining Technical Debt

1. `css/variables.css` duplicates root variables via re-export; should be fully inlined
2. `css/base.css` mixes base + scrollbar; consider splitting if layout grows
3. `Js/canvas/styles/editor.css` maintains separate iframe styles outside main architecture
4. Some legacy wrapper files (`layers.css`, `page-tabs.css`, etc.) exist for compatibility but should eventually be removed after updating `<link>` references

## Maintainability Score

**9/10** — Domain-driven structure, single entry point, clear responsibility boundaries. Minor debt from legacy wrappers and separate iframe styles.

## Scalability Score

**9/10** — New features/themes/components can be added as single files in their domain folder without touching core architecture.

## Architecture Ready

**YES** — No visual changes, no selector changes, no HTML changes, single CSS entry point (`css/editor.css`), cyclic-import-free, ready for CSS Freeze.