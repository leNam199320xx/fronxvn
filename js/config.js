/**
 * config.js — Tất cả các hằng số cấu hình của HTML Studio
 *
 * Đây là file duy nhất chứa config values.
 * Không import bất kỳ module nào để tránh circular dependency.
 */

// ─── Canvas & Zoom ────────────────────────────────────────────────────────────
export const ZOOM_DEFAULT         = 1;
export const ZOOM_MIN             = 0.25;
export const ZOOM_MAX             = 3;
export const ZOOM_STEP            = 0.1;

// ─── Grid ─────────────────────────────────────────────────────────────────────
export const GRID_SIZE            = 10;     // px
export const GRID_ENABLED_DEFAULT = true;

// ─── Canvas dimensions ────────────────────────────────────────────────────────
export const CANVAS_DEFAULT_WIDTH  = '2000px';
export const CANVAS_DEFAULT_HEIGHT = '2000px';
export const CANVAS_MARGIN         = 50;   // px — margin quanh canvas trong container

// ─── Drag & Snap ──────────────────────────────────────────────────────────────
export const SNAP_THRESHOLD    = 5;        // px — khoảng cách để snap vào element khác
export const DRAG_MIN_DISTANCE = 5;        // px — rubber-band nhỏ hơn này bị bỏ qua

// ─── Resize ───────────────────────────────────────────────────────────────────
export const ELEMENT_MIN_SIZE  = 20;       // px — kích thước tối thiểu khi resize

// ─── Rotate ───────────────────────────────────────────────────────────────────
export const ROTATE_SNAP_ANGLE = 15;       // degrees — Shift+rotate snap theo bội số này

// ─── History ──────────────────────────────────────────────────────────────────
export const HISTORY_MAX_SIZE  = 100;      // số actions tối đa trong undo stack

// ─── Clipboard & Paste ────────────────────────────────────────────────────────
export const PASTE_OFFSET      = 20;       // px — offset X/Y khi paste hoặc duplicate

// ─── Element ID generation ────────────────────────────────────────────────────
export const ELEMENT_ID_RANDOM_LENGTH = 5; // số ký tự random trong element id

// ─── Project / Auto-save ──────────────────────────────────────────────────────
export const AUTOSAVE_STORAGE_KEY = 'editor-project-autosave';
export const AUTOSAVE_DELAY_MS    = 1000;  // ms — debounce delay trước khi auto-save
export const AUTOLOAD_DELAY_MS    = 100;   // ms — delay trước khi auto-load khi init
export const PROJECT_VERSION      = '2.0';

// ─── Page Manager ─────────────────────────────────────────────────────────────
export const TAB_NAME_MAX_LENGTH   = 20;   // ký tự — tên tab dài hơn sẽ bị truncate
export const PAGE_ID_RANDOM_LENGTH = 5;    // số ký tự random trong page id

// ─── Breakpoints ──────────────────────────────────────────────────────────────
export const BREAKPOINTS = {
    desktop: { label: 'Desktop', icon: '🖥', width: null, mediaQuery: null },
    tablet:  { label: 'Tablet',  icon: '📱', width: 768,  mediaQuery: '(max-width: 768px)' },
    mobile:  { label: 'Mobile',  icon: '📲', width: 375,  mediaQuery: '(max-width: 375px)' }
};

// ─── Export ───────────────────────────────────────────────────────────────────
export const JSZIP_CDN_URL  = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
export const EXPORT_INDENT  = '    ';      // 4 spaces — indent trong HTML export
