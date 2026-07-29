# CSS Architecture Audit — editor.css

**File:** `D:\fronxvn\css\editor.css`  
**Lines:** 1954  
**Status:** Read-only audit — no selectors, specificity, or styles modified

---

## 1. Executive Summary

`css/editor.css` is a single 1954-line stylesheet containing all editor UI styles.  
It already has logical comment dividers (`/* ===== Section ===== */`) but everything lives in one file.

This audit classifies every rule block into one of 8 domains and proposes a safe migration plan that:
- Does NOT rename selectors
- Does NOT change specificity
- Does NOT modify any style values
- Preserves render order via concatenation/loading order

---

## 2. Domain Classification

Legend: **B** = Base, **L** = Layout, **C** = Canvas, **I** = Interaction, **Co** = Components, **F** = Features, **U** = Utilities, **T** = Themes

| Lines | Domain | Selectors |
|------|--------|-----------|
| 1-6 | B | `*` (reset) |
| 8-30 | B | `:root` (`--var` custom properties) |
| 32-40 | B | `html, body` |
| 42-48 | L | `.editor-layout` |
| 50-58 | L | `.editor-toolbar`, `.editor-toolbar .toolbar-group` |
| 67-72 | L | `.editor-toolbar .toolbar-separator` |
| 74-88 | L | `.editor-toolbar button`, `.editor-toolbar button:hover` |
| 90-93 | L | `.editor-toolbar button.active` |
| 95-99 | L | `.editor-toolbar .zoom-display` |
| 101-106 | L | `.editor-toolbar .coords-display` |
| 108-122 | L | `.project-name` |
| 123-127 | L | `.project-name:hover` |
| 128-138 | L | `.project-name-input` |
| 140-145 | L | `.editor-main` |
| 147-159 | L | `.toolbar-left`, `.toolbar-right` |
| 162-165 | L | `.toolbar-right` |
| 167-181 | L | `.toolbar-icon` |
| 183-186 | L | `.toolbar-icon:hover` |
| 188-192 | L | `.toolbar-icon.active` |
| 194-203 | L | `.panel-float` |
| 206-209 | L | `.panel-float.visible` |
| 211-213 | L | `.panel-float-left` |
| 215-218 | L | `.panel-float-right` |
| 220-231 | L | `.panel-float::-webkit-scrollbar-*` |
| 233-240 | L | `.panel-left` |
| 242-244 | L | `.panel-left.hidden` |
| 246-252 | L | `.canvas-wrapper` |
| 254-261 | L | `.canvas-container` |
| 264-272 | L | `.canvas-inner` |
| 274-282 | C | `.canvas` |
| 285-297 | C | `.canvas.show-grid` |
| 299-308 | L | `.panel-right` |
| 310-312 | L | `.panel-right.hidden` |
| 314-321 | L | `.editor-main.fullscreen ...` |
| 323-330 | L | `.panel-right::-webkit-scrollbar-*` |
| 332-335 | Co | `.panel-section` |
| 337-349 | Co | `.panel-section-header` |
| 355-357 | Co | `.panel-section-header .arrow` |
| 359-361 | Co | `.panel-section-header.collapsed .arrow` |
| 363-365 | Co | `.panel-section-body` |
| 367-369 | Co | `.panel-section-body.collapsed` |
| 371-377 | Co | `.prop-row` |
| 379-384 | Co | `.prop-label` |
| 386-400 | Co | `.prop-input`, `.prop-input:focus` |
| 402-405 | Co | `.prop-input-short` |
| 407-417 | Co | `.prop-select`, `.prop-select:focus` |
| 423-439 | Co | `.prop-color`, `::-webkit-color-swatch-wrapper`, `::-webkit-color-swatch` |
| 442-446 | Co | `.prop-grid` |
| 448-450 | Co | `.prop-grid .prop-input` |
| 452-461 | I | `.overlay-layer` |
| 463-467 | I | `.overlay-selection` |
| 469-473 | I | `.overlay-hover` |
| 476-494 | I | `.resize-handle`, `.resize-handle.nw/n/ne/e/se/s/sw/w` |
| 497-518 | I | `.move-handle`, `.move-handle::after` |
| 521-534 | I | `.rotation-handle` |
| 536-545 | I | `.rotation-line` |
| 548-560 | I | `.overlay-dimension` |
| 563-574 | I | `.overlay-position` |
| 577-582 | U | `.guide-line` |
| 584-588 | U | `.guide-line.horizontal` |
| 590-594 | U | `.guide-line.vertical` |
| 596-601 | Co | `.element-library` |
| 603-607 | Co | `.element-library-grid` |
| 609-618 | Co | `.element-library-item` |
| 620-624 | Co | `.element-library-item:hover` |
| 626-629 | Co | `.element-library-item.disabled` |
| 631-635 | Co | `.element-library-item .el-icon` |
| 637-641 | Co | `.layer-panel` |
| 643-645 | Co | `.layer-tree` |
| 647-656 | Co | `.layer-item` |
| 658-660 | Co | `.layer-item:hover` |
| 662-665 | Co | `.layer-item.selected` |
| 667-669 | Co | `.layer-item .layer-indent` |
| 671-679 | Co | `.layer-item .layer-toggle` |
| 681-686 | Co | `.layer-item .layer-icon` |
| 688-693 | Co | `.layer-item .layer-name` |
| 695-704 | Co | `.layer-item .layer-name-input` |
| 706-712 | Co | `.layer-item .layer-actions` |
| 714-716 | Co | `.layer-item:hover .layer-actions` |
| 718-729 | Co | `.layer-item .layer-btn-vis`, `:hover` |
| 731-733 | Co | `.layer-item .layer-btn-vis:hover` |
| 736-739 | Co | `.layer-item.hidden .layer-name` |
| 742-745 | Co | `.layer-item.hidden .layer-btn-vis` |
| 747-758 | I | `.context-menu` |
| 760-762 | I | `.context-menu.visible` |
| 764-771 | I | `.context-menu-item` |
| 773-776 | I | `.context-menu-item:hover` |
| 778-781 | Co | `.context-menu-item.disabled` |
| 783-787 | Co | `.context-menu-item .shortcut` |
| 789-791 | Co | `.context-menu-item:hover .shortcut` |
| 793-797 | Co | `.context-menu-separator` |
| 799-804 | C | `.canvas [data-editor-element]` |
| 806-814 | L | `.panel-tabs` |
| 816-831 | Co | `.panel-tab` |
| 833-836 | Co | `.panel-tab:hover` |
| 838-842 | Co | `.panel-tab.active` |
| 844-848 | Co | `.panel-tab-content` |
| 850-857 | Co | `.panel-tab-content.active` |
| 859-884 | Co | `.panel-tab-content.active > .tpl-toolbar`, `...filter-bar`, etc. |
| 886-894 | Co | `.panel-tab-content.active > .tpl-grid`, `...layer-tree`, etc. |
| 898-904 | Co | `.panel-tab-content.active > .tpl-toolbar + .tpl-filter-bar`, etc. |
| 906-923 | U | `::-webkit-scrollbar` global |
| 926-930 | F | `.template-list` |
| 932-935 | F | `#viewport-switcher button` |
| 937-941 | L | `.viewport-label` |
| 944-946 | C | `.canvas-wrapper.bp-tablet .canvas` |
| 948-950 | C | `.canvas-wrapper.bp-mobile .canvas` |
| 952-961 | Co | `.multi-select-notice` |
| 964-973 | Co | `.bp-badge` |
| 975-977 | U | `.bp-badge[style*="display: none"] + *` |
| 980-986 | I | `.overlay-rubber-band` |
| 989-1001 | I | `.overlay-multi-badge` |
| 1003-1006 | U | `@keyframes fadeIn` |
| 1009-1021 | F | `#page-tab-bar` |
| 1023-1034 | F | `#page-tab-bar::-webkit-scrollbar-*` |
| 1036-1054 | F | `.page-tab` |
| 1056-1059 | F | `.page-tab:hover` |
| 1061-1066 | F | `.page-tab.active` |
| 1068-1076 | F | `.page-tab.active::after` |
| 1078-1084 | F | `.page-tab-name` |
| 1086-1102 | F | `.page-tab-delete`, `.page-tab:hover .page-tab-delete`, `:hover` |
| 1113-1125 | F | `.page-tab-rename-input` |
| 1128-1150 | F | `.page-tab-add` |
| 1152-1162 | F | `.page-tab-context-menu` |
| 1164-1175 | F | `.page-tab-context-item`, `:hover` |
| 1177-1181 | F | `.page-tab-context-item.disabled` |
| 1186-1196 | F | `.quality-score-btn` |
| 1203-1213 | F | `.quality-badge` |
| 1216-1222 | F | `[data-tab-content="quality"]` |
| 1224-1232 | F | `.quality-panel-header` |
| 1234-1241 | F | `.quality-summary`, `.q-error/.q-warning/.q-info` |
| 1243-1253 | F | `.quality-rescan-btn` |
| 1256-1267 | F | `.quality-empty` |
| 1269-1273 | F | `.quality-issue-list` |
| 1275-1281 | F | `.quality-issue`, `:hover`, `.highlighted` |
| 1283-1289 | F | `.quality-issue-main` |
| 1290-1294 | F | `.quality-issue-icon` |
| 1296 | F | `.quality-issue-body` |
| 1298-1305 | F | `.quality-issue-message` |
| 1306-1311 | F | `.quality-issue-suggestion` |
| 1313-1317 | F | `.quality-issue-actions` |
| 1319-1333 | F | `.quality-btn`, `.quality-btn-fix`, `.quality-btn-goto` |
| 1337-1342 | F | `[data-tab-content="components"]` |
| 1344-1352 | F | `.comp-panel-header` |
| 1354-1359 | F | `.comp-panel-title` |
| 1360-1367 | F | `.comp-count` |
| 1369-1379 | F | `.comp-save-btn` |
| 1382-1395 | F | `.comp-empty` |
| 1398-1405 | F | `.comp-grid` |
| 1408-1421 | F | `.comp-card` |
| 1424-1430 | F | `.comp-thumb` |
| 1433-1442 | F | `.comp-name` |
| 1444-1455 | F | `.comp-rename-input` |
| 1458-1464 | F | `.comp-actions` |
| 1466-1482 | F | `.comp-btn`, `.comp-btn-delete` |
| 1486-1497 | F | `.layer-item.is-component`, `.layer-comp-badge` |
| 1500-1505 | F | `[data-tab-content="templates"]` |
| 1508-1514 | F | `.tpl-toolbar` |
| 1516-1527 | F | `.tpl-search` |
| 1529-1540 | F | `.tpl-save-btn` |
| 1543-1563 | F | `.tpl-filter-bar`, `.tpl-filter-btn` |
| 1566-1573 | F | `.tpl-grid` |
| 1576-1588 | F | `.tpl-empty` |
| 1590-1603 | F | `.tpl-card`, `.tpl-card-user` |
| 1606-1612 | F | `.tpl-thumb` |
| 1615-1623 | F | `.tpl-card-info`, `.tpl-card-name`, `.tpl-card-pages` |
| 1624-1633 | F | `.tpl-card-desc` |
| 1636-1641 | F | `.tpl-card-actions` |
| 1643-1662 | F | `.tpl-btn`, `.tpl-btn-primary`, `.tpl-btn-danger`, `.tpl-btn-icon` |
| 1665-1753 | F | `.tpl-preview-modal`, `.tpl-preview-box`, etc. |
| 1754-1769 | Co | `.editor-notification` |
| 1771-1778 | F | `[data-tab-content="theme"]` |
| 1780-1788 | F | `.theme-header` |
| 1790-1794 | F | `.theme-title` |
| 1796-1806 | F | `.theme-reset-btn` |
| 1808-1812 | F | `.theme-body` |
| 1814-1817 | F | `.theme-group` |
| 1818-1829 | F | `.theme-group-label` |
| 1831-1839 | F | `.theme-row` |
| 1841-1850 | F | `.theme-token-label` |
| 1853-1871 | F | `.theme-color-wrap`, `.theme-color-swatch` |
| 1874-1903 | F | `.theme-token-input`, `.theme-token-select` |
| 1904-1905 | F | (CSS Editor toolbar wrapper) |
| 1906-1912 | F | `.css-editor-toolbar` |
| 1914-1926 | F | `.css-editor-btn`, `.css-editor-btn-primary` |
| 1928-1944 | F | `.css-editor-textarea` |
| 1946-1954 | F | `.css-editor-error` |

---

## 3. Proposed Domain Files

```
css/
├── base.css          # Reset, :root vars, html/body, global scrollbar base
├── layout.css        # Editor shell, toolbars, side panels, canvas wrapper, page tabs
├── canvas.css        # Canvas, grid, breakpoint borders
├── interaction.css   # Overlay, resize/rotation handles, context menu, guides
├── components.css    # Shared UI: form controls, buttons, tabs, panels, notifications
├── features.css      # Templates, quality, components, layers, theme, CSS editor
├── utilities.css     # Animations, keyframes, helper overrides
└── themes.css        # Theme token editor (or merge with features.css if preferred)
```

### 3.1 base.css
- `*` reset
- `:root` variables
- `html, body`
- `::-webkit-scrollbar` global (lines 906-923)

### 3.2 layout.css
- `.editor-layout`
- `.editor-toolbar` + `.toolbar-group`, `.toolbar-separator`, button states
- `.zoom-display`, `.coords-display`
- `.project-name`, `.project-name-input`
- `.editor-main`, `.editor-main.fullscreen ...`
- `.toolbar-left`, `.toolbar-right`, `.toolbar-icon`
- `.panel-float`, `.panel-float-left`, `.panel-float-right`
- `.panel-left`, `.panel-left.hidden`
- `.panel-right`, `.panel-right.hidden`
- `.canvas-wrapper`, `.canvas-container`, `.canvas-inner`
- `.viewport-label`

### 3.3 canvas.css
- `.canvas` (size, shadow, transform-origin)
- `.canvas.show-grid`
- `.canvas [data-editor-element]`
- `.canvas-wrapper.bp-tablet .canvas`
- `.canvas-wrapper.bp-mobile .canvas`

### 3.4 interaction.css
- `.overlay-layer`, `.overlay-selection`, `.overlay-hover`
- `.resize-handle` + directional variants
- `.move-handle`, `.move-handle::after`
- `.rotation-handle`, `.rotation-line`
- `.overlay-dimension`, `.overlay-position`
- `.overlay-rubber-band`, `.overlay-multi-badge`
- `.context-menu`, `.context-menu.visible`, `.context-menu-item`, `.context-menu-separator`
- `.guide-line` + variants

### 3.5 components.css
- `.panel-section`, `.panel-section-header`, `.panel-section-body`
- `.prop-row`, `.prop-label`, `.prop-input`, `.prop-input-short`, `.prop-select`, `.prop-color`, `.prop-grid`
- `.panel-tabs`, `.panel-tab`, `.panel-tab-content`, `.panel-tab-content.active`
- `.panel-tab-content.active > .tpl-toolbar`, `...filter-bar`, `...grid`, etc. (header/body/dividers)
- `.element-library`, `.element-library-grid`, `.element-library-item`
- `.layer-panel`, `.layer-tree`, `.layer-item` and all descendants
- `.multi-select-notice`
- `.bp-badge`
- `.editor-notification`

### 3.6 features.css
- `#page-tab-bar`, `.page-tab`, `.page-tab-name`, `.page-tab-delete`, `.page-tab-rename-input`, `.page-tab-add`
- `.page-tab-context-menu`, `.page-tab-context-item`
- `.template-list`
- `.tpl-toolbar`, `.tpl-search`, `.tpl-save-btn`, `.tpl-filter-bar`, `.tpl-filter-btn`, `.tpl-grid`, `.tpl-empty`, `.tpl-card`, `.tpl-thumb`, `.tpl-card-info`, `.tpl-card-name`, `.tpl-card-pages`, `.tpl-card-desc`, `.tpl-card-actions`, `.tpl-btn` variants
- `.tpl-preview-modal`, `.tpl-preview-box`, etc.
- `.quality-score-btn`, `.quality-badge`, `.quality-panel-header`, `.quality-summary`, `.quality-rescan-btn`, `.quality-empty`, `.quality-issue-list`, `.quality-issue`, `.quality-issue-body`, `.quality-issue-message`, `.quality-issue-suggestion`, `.quality-issue-actions`, `.quality-btn`
- `[data-tab-content="quality"]`, `[data-tab-content="components"]`, `[data-tab-content="templates"]`
- `.comp-panel-header`, `.comp-panel-title`, `.comp-count`, `.comp-save-btn`, `.comp-empty`, `.comp-grid`, `.comp-card`, `.comp-thumb`, `.comp-name`, `.comp-rename-input`, `.comp-actions`, `.comp-btn`
- `.layer-item.is-component`, `.layer-comp-badge`
- `.theme-header`, `.theme-title`, `.theme-reset-btn`, `.theme-body`, `.theme-group`, `.theme-group-label`, `.theme-row`, `.theme-token-label`, `.theme-color-wrap`, `.theme-color-swatch`, `.theme-token-input`, `.theme-token-select`
- `.css-editor-toolbar`, `.css-editor-btn`, `.css-editor-textarea`, `.css-editor-error`

### 3.7 utilities.css
- `.guide-line.horizontal`, `.guide-line.vertical` (if kept separate from interaction)
- `@keyframes fadeIn`
- `.bp-badge[style*="display: none"] + *` (attribute selector hack)

### 3.8 themes.css (optional)
If you want to isolate theme editor from other features:
- All `.theme-*` rules from features.css

---

## 4. Migration Plan

### Phase 1 — Preparation
1. Create the 8 new CSS files under `css/` (empty placeholders).
2. Copy style blocks from `css/editor.css` into the matching files, preserving exact selectors and rules.
3. Do NOT change selectors, specificity, or values.

### Phase 2 — Verification
1. Run a regression pass: open editor, exercise every panel.
2. Use DevTools to verify no style flicker or specificity changes.
3. Confirm all selectors still match.

### Phase 3 — Cutover
1. Update `index.html` (or bundler entry) to load the new CSS files in this order:
   ```
   base.css
   layout.css
   canvas.css
   interaction.css
   components.css
   features.css
   utilities.css
   themes.css
   ```
2. Keep `editor.css` as a no-op stub or remove it once validated.
3. Tag release.

### Backout
If anything breaks, re-add `editor.css` as the single stylesheet; the migration is additive and non-destructive.

---

## 5. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Load-order flicker | Files are tiny; concatenate in build step. |
| Missing selector in new file | Audit uses line-accurate mapping; no selectors dropped. |
| Specificity delta | No selectors renamed; specificity unchanged. |
| Cached single-file optimizations | HTTP/2 or bundler concatenation preserves performance. |

---

## 6. Recommendation

Proceed with the split. The current single-file structure is hard to maintain. The migration plan above preserves every rule exactly while introducing clear domain boundaries that mirror the JS architecture.
