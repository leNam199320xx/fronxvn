/**
 * BreakpointManager - Quản lý responsive styles theo breakpoint
 *
 * Breakpoints:
 *   desktop : không có @media (base styles)
 *   tablet  : max-width 768px
 *   mobile  : max-width 375px
 *
 * Mỗi element lưu styles theo map:
 *   el.__bpStyles = { desktop: {}, tablet: {}, mobile: {} }
 *
 * Khi switch breakpoint:
 *   - Áp dụng style của breakpoint đang active lên element (overlay lên desktop)
 *   - Property panel đọc/ghi vào breakpoint đang active
 */
import eventBus from './event-bus.js';
import { BREAKPOINTS } from './config.js';

export { BREAKPOINTS }; // re-export để các module cũ import từ đây vẫn hoạt động

export class BreakpointManager {
    constructor(editor) {
        this.editor = editor;
        this.current = 'desktop'; // Breakpoint đang active

        this._bindEvents();
    }

    _bindEvents() {
        // Khi switch breakpoint
        eventBus.on('breakpoint:switch', (bp) => this.switchTo(bp));

        // Khi property panel thay đổi style -> lưu vào đúng breakpoint
        eventBus.on('breakpoint:set-style', ({ element, prop, value }) => {
            this.setStyle(element, prop, value);
        });

        // Khi element mới được thêm -> khởi tạo __bpStyles + capture desktop
        eventBus.on('element:added', (el) => {
            this._initElement(el);
            this._captureDesktopStyle(el);
        });

        // Khi load project -> restore styles cho breakpoint hiện tại
        eventBus.on('layer:refresh', () => this._applyCurrentBreakpoint());
    }

    /**
     * Switch sang breakpoint mới
     * @param {'desktop'|'tablet'|'mobile'} bp
     */
    switchTo(bp) {
        if (!BREAKPOINTS[bp]) return;

        // Trước khi switch: snapshot style desktop nếu đang ở desktop
        // (chỉ capture desktop lần đầu hoặc khi đang ở desktop)
        if (this.current === 'desktop') {
            this.editor.getElements().forEach(el => {
                this._captureDesktopStyle(el);
            });
        }

        this.current = bp;

        // Resize canvas preview
        this._resizeCanvas(bp);

        // Áp dụng styles của breakpoint mới lên tất cả elements
        this._applyCurrentBreakpoint();

        eventBus.emit('breakpoint:changed', bp);
    }

    /**
     * Resize canvas để preview breakpoint
     */
    _resizeCanvas(bp) {
        const bpData = BREAKPOINTS[bp];
        if (bpData.width) {
            this.editor.canvas.style.width = bpData.width + 'px';
            this.editor.canvas.style.minWidth = bpData.width + 'px';
        } else {
            this.editor.canvas.style.width = '';
            this.editor.canvas.style.minWidth = '2000px';
        }
    }

    /**
     * Capture style hiện tại vào slot desktop (chỉ khi desktop chưa có data)
     */
    _captureDesktopStyle(el) {
        this._initElement(el);
        // Nếu desktop đã có data thì không overwrite
        if (Object.keys(el.__bpStyles.desktop).length > 0) return;
        const style = el.style;
        const captured = {};
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            captured[prop] = style.getPropertyValue(prop);
        }
        el.__bpStyles.desktop = captured;
    }

    /**
     * Lưu style hiện tại của element vào breakpoint cụ thể (dùng nội bộ)
     */
    _captureCurrentStyle(el, bp) {
        this._initElement(el);
        const style = el.style;
        const captured = {};
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            captured[prop] = style.getPropertyValue(prop);
        }
        el.__bpStyles[bp] = captured;
    }

    /**
     * Áp dụng style của breakpoint hiện tại lên tất cả elements
     */
    _applyCurrentBreakpoint() {
        this.editor.getElements().forEach(el => {
            this._applyToElement(el, this.current);
        });
    }

    /**
     * Áp dụng style của breakpoint lên 1 element
     * Logic: desktop = base, tablet/mobile = merge lên base
     */
    _applyToElement(el, bp) {
        this._initElement(el);

        // Lấy base styles (desktop)
        const base = el.__bpStyles['desktop'] || {};

        // Lấy override của breakpoint hiện tại (nếu không phải desktop)
        const override = bp !== 'desktop' ? (el.__bpStyles[bp] || {}) : {};

        // Merge và áp dụng
        const merged = { ...base, ...override };

        // Reset style trước
        el.style.cssText = '';

        // Áp dụng lại
        Object.entries(merged).forEach(([prop, value]) => {
            el.style.setProperty(prop, value);
        });
    }

    /**
     * Set 1 property cho element tại breakpoint hiện tại
     */
    setStyle(element, prop, value) {
        this._initElement(element);
        if (!element.__bpStyles[this.current]) {
            element.__bpStyles[this.current] = {};
        }
        element.__bpStyles[this.current][prop] = value;
        // Áp dụng ngay
        element.style.setProperty(prop, value);
    }

    /**
     * Khởi tạo __bpStyles nếu chưa có
     */
    _initElement(el) {
        if (!el.__bpStyles) {
            el.__bpStyles = { desktop: {}, tablet: {}, mobile: {} };
        }
    }

    /**
     * Lấy style của element tại breakpoint cụ thể (dùng khi export)
     * @returns {Object} { prop: value }
     */
    getStylesForBreakpoint(el, bp) {
        if (!el.__bpStyles) return {};
        return el.__bpStyles[bp] || {};
    }

    /**
     * Lấy tất cả breakpoint overrides của element (chỉ prop khác desktop)
     * @returns {{ tablet: {}, mobile: {} }}
     */
    getOverrides(el) {
        if (!el.__bpStyles) return { tablet: {}, mobile: {} };
        const desktop = el.__bpStyles['desktop'] || {};
        const result = {};

        ['tablet', 'mobile'].forEach(bp => {
            const bpStyles = el.__bpStyles[bp] || {};
            const overrides = {};
            Object.entries(bpStyles).forEach(([prop, value]) => {
                if (desktop[prop] !== value) {
                    overrides[prop] = value;
                }
            });
            if (Object.keys(overrides).length > 0) {
                result[bp] = overrides;
            }
        });

        return result;
    }

    /**
     * Serialize __bpStyles cho save/load
     */
    serializeElement(el) {
        return el.__bpStyles || null;
    }

    /**
     * Restore __bpStyles sau khi load
     */
    deserializeElement(el, bpStyles) {
        if (bpStyles) {
            el.__bpStyles = bpStyles;
        }
    }

    /** Breakpoint hiện tại */
    getCurrent() {
        return this.current;
    }
}
