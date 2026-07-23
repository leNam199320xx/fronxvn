/**
 * QualityEngine — Phân tích chất lượng HTML ngay trong editor.
 *
 * Scan canvas sau mỗi thay đổi (debounce 800ms) và emit:
 *   quality:updated  { issues: Issue[], score: number }
 *
 * Mỗi Issue:
 *   { id, severity, element, message, suggestion, autofix }
 *   severity: 'error' | 'warning' | 'info'
 *   autofix: function|null — nếu có, Issues Panel hiện nút "Fix"
 */
import eventBus from './event-bus.js';

/** Điểm trừ theo severity */
const PENALTY = { error: 10, warning: 3, info: 1 };

export class QualityEngine {
    constructor(editor) {
        this.editor = editor;

        /** @type {Issue[]} */
        this.issues = [];

        /** @type {number} 0–100 */
        this.score = 100;

        this._scanTimer = null;
        this._scanDelay = 800; // ms

        this._bindEvents();
    }

    // ─────────────────────────────────────────────
    //  Public
    // ─────────────────────────────────────────────

    /** Chạy scan ngay lập tức (không debounce). */
    scanNow() {
        this._runScan();
    }

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    _bindEvents() {
        const schedule = () => this._scheduleScan();

        eventBus.on('element:added',   schedule);
        eventBus.on('element:deleted', schedule);
        eventBus.on('element:updated', schedule);
        eventBus.on('layer:refresh',   schedule);
        eventBus.on('page:switched',   schedule);
    }

    _scheduleScan() {
        clearTimeout(this._scanTimer);
        this._scanTimer = setTimeout(() => this._runScan(), this._scanDelay);
    }

    // ─────────────────────────────────────────────
    //  Core scan
    // ─────────────────────────────────────────────

    _runScan() {
        const elements = Array.from(
            this.editor.canvas.querySelectorAll('[data-editor-element]')
        );

        const issues = [];

        // Run all checks
        this._checkDuplicateIds(elements, issues);
        this._checkMissingH1(elements, issues);

        elements.forEach(el => {
            this._checkAltMissing(el, issues);
            this._checkEmptyHeading(el, issues);
            this._checkLabelMissing(el, issues);
            this._checkElementTooSmall(el, issues);
            this._checkDeepNesting(el, issues);
            this._checkLowContrast(el, issues);
            this._checkEmptyLink(el, issues);
            this._checkAutoplayVideo(el, issues);
        });

        this.issues = issues;
        this.score  = this._calcScore(issues);

        eventBus.emit('quality:updated', { issues: this.issues, score: this.score });
    }

    _calcScore(issues) {
        const penalty = issues.reduce((sum, i) => sum + (PENALTY[i.severity] || 0), 0);
        return Math.max(0, 100 - penalty);
    }

    // ─────────────────────────────────────────────
    //  Checks
    // ─────────────────────────────────────────────

    /** alt-missing: <img> không có alt attribute */
    _checkAltMissing(el, issues) {
        if (el.tagName.toLowerCase() !== 'img') return;
        if (el.hasAttribute('alt')) return;

        issues.push({
            id: 'alt-missing',
            severity: 'error',
            element: el,
            message: `<img> "${el.dataset.name || el.id}" is missing alt attribute`,
            suggestion: 'Add alt="" for decorative images, or alt="description" for informative images.',
            autofix: () => {
                el.setAttribute('alt', '');
                eventBus.emit('element:updated', el);
            }
        });
    }

    /** empty-heading: <h1>–<h6> không có text content */
    _checkEmptyHeading(el, issues) {
        if (!/^h[1-6]$/.test(el.tagName.toLowerCase())) return;
        if (el.textContent.trim()) return;

        issues.push({
            id: 'empty-heading',
            severity: 'warning',
            element: el,
            message: `<${el.tagName.toLowerCase()}> "${el.dataset.name || el.id}" is empty`,
            suggestion: 'Add text content to heading elements.',
            autofix: null
        });
    }

    /** label-missing: <input> không có aria-label và không có <label> liên kết */
    _checkLabelMissing(el, issues) {
        const tag = el.tagName.toLowerCase();
        const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time'];
        if (tag !== 'input') return;
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        if (!inputTypes.includes(type)) return;
        if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;

        // Kiểm tra có <label for="id"> liên kết không
        if (el.id) {
            const label = this.editor.canvas.querySelector(`label[for="${CSS.escape(el.id)}"]`);
            if (label) return;
        }

        issues.push({
            id: 'label-missing',
            severity: 'error',
            element: el,
            message: `<input> "${el.dataset.name || el.id}" has no associated label`,
            suggestion: 'Add aria-label attribute or associate a <label> element using the for attribute.',
            autofix: () => {
                el.setAttribute('aria-label', el.getAttribute('placeholder') || 'Input');
                eventBus.emit('element:updated', el);
            }
        });
    }

    /** duplicate-id: nhiều elements có cùng id */
    _checkDuplicateIds(elements, issues) {
        const seen = new Map();
        elements.forEach(el => {
            if (!el.id) return;
            if (seen.has(el.id)) {
                seen.get(el.id).push(el);
            } else {
                seen.set(el.id, [el]);
            }
        });

        seen.forEach((els, id) => {
            if (els.length < 2) return;
            els.forEach(el => {
                issues.push({
                    id: 'duplicate-id',
                    severity: 'error',
                    element: el,
                    message: `Duplicate id="${id}" found on ${els.length} elements`,
                    suggestion: 'Each id must be unique within the page.',
                    autofix: null
                });
            });
        });
    }

    /** element-too-small: width hoặc height < 20px */
    _checkElementTooSmall(el, issues) {
        const w = parseFloat(el.style.width)  || el.offsetWidth;
        const h = parseFloat(el.style.height) || el.offsetHeight;
        if (w >= 20 && h >= 20) return;

        issues.push({
            id: 'element-too-small',
            severity: 'warning',
            element: el,
            message: `"${el.dataset.name || el.id}" is very small (${Math.round(w)}×${Math.round(h)}px)`,
            suggestion: 'Elements smaller than 20×20px may be hard to interact with.',
            autofix: null
        });
    }

    /** deep-nesting: nesting level > 5 */
    _checkDeepNesting(el, issues) {
        let depth = 0;
        let node = el;
        while (node && node !== this.editor.canvas) {
            if (node.dataset && node.dataset.editorElement !== undefined) depth++;
            node = node.parentElement;
        }
        if (depth <= 5) return;

        issues.push({
            id: 'deep-nesting',
            severity: 'info',
            element: el,
            message: `"${el.dataset.name || el.id}" is nested ${depth} levels deep`,
            suggestion: 'Deep nesting can affect readability and performance.',
            autofix: null
        });
    }

    /** missing-h1: canvas không có <h1> nào */
    _checkMissingH1(elements, issues) {
        const hasH1 = elements.some(el => el.tagName.toLowerCase() === 'h1' && el.textContent.trim());
        if (hasH1) return;

        issues.push({
            id: 'missing-h1',
            severity: 'warning',
            element: null, // page-level issue
            message: 'Page has no <h1> heading',
            suggestion: 'Every page should have exactly one <h1> heading for SEO and accessibility.',
            autofix: null
        });
    }

    /** low-contrast: text color vs background color ratio < 4.5 (WCAG AA) */
    _checkLowContrast(el, issues) {
        const textTags = ['p', 'span', 'h1','h2','h3','h4','h5','h6', 'a', 'button', 'label', 'li'];
        if (!textTags.includes(el.tagName.toLowerCase())) return;
        if (!el.textContent.trim()) return;

        const style     = window.getComputedStyle(el);
        const fgColor   = style.color;
        const bgColor   = style.backgroundColor;

        // Bỏ qua nếu background transparent / không xác định
        if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return;

        const fgLum = this._relativeLuminance(fgColor);
        const bgLum = this._relativeLuminance(bgColor);
        if (fgLum === null || bgLum === null) return;

        const lighter = Math.max(fgLum, bgLum);
        const darker  = Math.min(fgLum, bgLum);
        const ratio   = (lighter + 0.05) / (darker + 0.05);

        if (ratio >= 4.5) return;

        issues.push({
            id: 'low-contrast',
            severity: 'warning',
            element: el,
            message: `"${el.dataset.name || el.id}" has low contrast ratio (${ratio.toFixed(1)}:1, min 4.5:1)`,
            suggestion: 'Increase contrast between text and background color for WCAG AA compliance.',
            autofix: null
        });
    }

    /** empty-link: <a> không có href hoặc text content */
    _checkEmptyLink(el, issues) {
        if (el.tagName.toLowerCase() !== 'a') return;
        const hasHref = el.hasAttribute('href') && el.getAttribute('href').trim() !== '';
        const hasText = el.textContent.trim() || el.querySelector('img[alt]');
        if (hasHref && hasText) return;

        issues.push({
            id: 'empty-link',
            severity: 'error',
            element: el,
            message: `<a> "${el.dataset.name || el.id}" ${!hasHref ? 'has no href' : 'has no text content'}`,
            suggestion: !hasHref
                ? 'Add a href attribute with a valid URL.'
                : 'Add descriptive text or an image with alt attribute inside the link.',
            autofix: !hasHref ? () => {
                el.setAttribute('href', '#');
                eventBus.emit('element:updated', el);
            } : null
        });
    }

    /** autoplay-video: <video autoplay> không có muted */
    _checkAutoplayVideo(el, issues) {
        if (el.tagName.toLowerCase() !== 'video') return;
        if (!el.hasAttribute('autoplay')) return;
        if (el.hasAttribute('muted')) return;

        issues.push({
            id: 'autoplay-video',
            severity: 'warning',
            element: el,
            message: `<video> "${el.dataset.name || el.id}" has autoplay without muted`,
            suggestion: 'Add the muted attribute to allow autoplay in most browsers.',
            autofix: () => {
                el.setAttribute('muted', '');
                eventBus.emit('element:updated', el);
            }
        });
    }

    // ─────────────────────────────────────────────
    //  Color contrast helpers
    // ─────────────────────────────────────────────

    /**
     * Tính relative luminance từ CSS color string.
     * @param {string} cssColor
     * @returns {number|null}
     */
    _relativeLuminance(cssColor) {
        const rgb = this._parseColor(cssColor);
        if (!rgb) return null;

        const [r, g, b] = rgb.map(c => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Parse CSS color string thành [r, g, b] array.
     * Hỗ trợ rgb() và rgba() format.
     * @param {string} color
     * @returns {number[]|null}
     */
    _parseColor(color) {
        const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return null;
        return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    }
}

/**
 * @typedef {Object} Issue
 * @property {string} id
 * @property {'error'|'warning'|'info'} severity
 * @property {HTMLElement|null} element
 * @property {string} message
 * @property {string} suggestion
 * @property {Function|null} autofix
 */
