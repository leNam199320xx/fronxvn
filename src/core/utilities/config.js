/**
 * config.js â€” Barrel re-export tá»« js/config/
 *
 * Giá»¯ nguyÃªn Ä‘Æ°á»ng dáº«n cÅ© Ä‘á»ƒ cÃ¡c module cÅ© váº«n hoáº¡t Ä‘á»™ng.
 * CÃ¡c module má»›i nÃªn import trá»±c tiáº¿p tá»« js/config/<file>.js
 */

// â”€â”€â”€ Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
    ARROW_NUDGE,
    ARROW_NUDGE_SHIFT,
    ZOOM_DEFAULT,
    ZOOM_MIN,
    ZOOM_MAX,
    ZOOM_STEP,
    HISTORY_MAX_SIZE,
    PASTE_OFFSET,
    AUTOSAVE_DELAY_MS,
    AUTOLOAD_DELAY_MS,
    AUTOSAVE_STORAGE_KEY,
    PROJECT_VERSION,
    CANVAS_INNER_PADDING,
    SNAP_THRESHOLD,
    DRAG_MIN_DISTANCE,
    ELEMENT_MIN_SIZE,
    ROTATE_SNAP_ANGLE,
    ELEMENT_ID_RANDOM_LENGTH,
    COMPONENT_ID_RANDOM_LENGTH,
    PAGE_ID_RANDOM_LENGTH
} from './editor.js';

// â”€â”€â”€ Canvas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
    CANVAS_DEFAULT_WIDTH,
    CANVAS_DEFAULT_HEIGHT,
    CANVAS_MARGIN,
    GRID_SIZE,
    GRID_ENABLED_DEFAULT
} from './canvas.js';

// â”€â”€â”€ Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
    JSZIP_CDN_URL,
    EXPORT_INDENT,
    EXPORT_MODAL_ZINDEX,
    EXPORT_MODAL_BG,
    EXPORT_DIALOG_WIDTH,
    EXPORT_DIALOG_MAX_HEIGHT,
    EXPORT_DIALOG_BORDER_RADIUS,
    EXPORT_DIALOG_BG,
    EXPORT_DIALOG_BORDER,
    EXPORT_DIALOG_BOX_SHADOW,
    EXPORT_TEXTAREA_HEIGHT,
    EXPORT_TEXTAREA_BG,
    EXPORT_TEXTAREA_COLOR,
    EXPORT_TEXTAREA_BORDER,
    EXPORT_TEXTAREA_PADDING,
    EXPORT_TEXTAREA_BORDER_RADIUS,
    EXPORT_TEXTAREA_FONT_FAMILY,
    EXPORT_TEXTAREA_FONT_SIZE,
    EXPORT_COPY_RESET_DELAY,
    EXPORT_BTN_PADDING,
    EXPORT_BTN_BORDER_RADIUS,
    EXPORT_BTN_FONT_SIZE,
    EXPORT_BODY_PADDING,
    EXPORT_HEADER_PADDING,
    EXPORT_HEADER_BORDER_BOTTOM,
    EXPORT_HEADER_COLOR,
    EXPORT_HEADER_FONT_SIZE,
    EXPORT_HEADER_FONT_WEIGHT,
    EXPORT_CLOSE_BTN_COLOR,
    EXPORT_CLOSE_BTN_FONT_SIZE,
    EXPORT_TAB_PADDING,
    EXPORT_TAB_COLOR,
    EXPORT_TAB_ACTIVE_COLOR,
    EXPORT_TABS_BORDER_BOTTOM,
    EXPORT_FOOTER_PADDING,
    EXPORT_FOOTER_BORDER_TOP,
    EXPORT_FOOTER_GAP,
    EXPORT_ZIP_BTN_COLOR,
    EXPORT_DOWNLOAD_BTN_BG,
    EXPORT_DOWNLOAD_BTN_COLOR,
    SEO_PANEL_COLOR,
    SEO_PANEL_FONT_SIZE,
    SEO_ROW_MARGIN_BOTTOM,
    SEO_LABEL_COLOR,
    SEO_LABEL_FONT_SIZE,
    SEO_TEXTAREA_HEIGHT,
    SEO_INPUT_PADDING,
    SEO_INPUT_BORDER_COLOR,
    SEO_INPUT_FOCUS_BORDER_COLOR
} from './export.js';

// â”€â”€â”€ Quality â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
    QUALITY_SCORE_INITIAL,
    QUALITY_SCORE_GOOD,
    QUALITY_SCORE_WARN,
    QUALITY_SCAN_DELAY,
    QUALITY_RESCAN_AFTER_FIX_DELAY,
    QUALITY_PENALTY_ERROR,
    QUALITY_PENALTY_WARNING,
    QUALITY_PENALTY_INFO,
    QUALITY_WCAG_LUMINANCE_THRESHOLD,
    QUALITY_WCAG_LUMINANCE_R,
    QUALITY_WCAG_LUMINANCE_G,
    QUALITY_WCAG_LUMINANCE_B,
    QUALITY_WCAG_CONTRAST_AA,
    QUALITY_MAX_NESTING_DEPTH,
    QUALITY_MIN_ELEMENT_SIZE
} from './quality.js';

// â”€â”€â”€ Breakpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
    BREAKPOINTS,
    TAB_NAME_MAX_LENGTH,
    BREAKPOINT_LABEL_TABLET,
    BREAKPOINT_LABEL_MOBILE
} from './breakpoints.js';

// â”€â”€â”€ Theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
    THEME_DEFAULTS,
    DEFAULT_ELEMENT_POSITION,
    DEFAULT_COLOR_FALLBACK,
    LAYER_INDENT_PER_LEVEL,
    OVERLAY_BADGE_OFFSET,
    OVERLAY_HIDE_LABEL_DELAY,
    SELECTION_EDIT_OUTLINE,
    COMPONENT_INSERT_BASE_X,
    COMPONENT_INSERT_BASE_Y,
    COMPONENT_INSERT_RANDOM_MAX,
    RENAME_INPUT_MIN_WIDTH,
    RENAME_INPUT_CHAR_WIDTH,
    NOTIFICATION_DISPLAY_DURATION,
    NOTIFICATION_FADE_DELAY,
    THUMBNAIL_WIDTH,
    THUMBNAIL_HEIGHT,
    THUMBNAIL_BG,
    THUMBNAIL_INNER_FILL,
    THUMBNAIL_STROKE,
    THUMBNAIL_STROKE_WIDTH,
    THUMBNAIL_FONT_SIZE,
    THUMBNAIL_TEXT_COLOR
} from './theme.js';

