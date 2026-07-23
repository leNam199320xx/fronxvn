/**
 * ThemeManager — Global CSS Variables / Design Tokens
 *
 * Quản lý các CSS custom properties trên :root của canvas.
 * User chỉnh token một lần, toàn bộ elements dùng var(--token) được cập nhật ngay.
 *
 * Tokens:
 *   Colors   : --color-primary, --color-secondary, --color-accent, --color-bg, --color-text, --color-muted
 *   Typography: --font-family, --font-size-base, --font-size-lg, --font-size-sm, --line-height, --font-weight-bold
 *   Spacing  : --spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl
 *   Radius   : --radius-sm, --radius-md, --radius-lg, --radius-full
 *   Shadow   : --shadow-sm, --shadow-md, --shadow-lg
 *
 * Serialize vào project JSON v2.2 dưới key "theme".
 * Export vào style.css đầu file dưới dạng :root { --token: value; }
 */
import eventBus from './event-bus.js';

/** Default token values */
export const THEME_DEFAULTS = {
    // Colors
    '--color-primary':   '#0078d4',
    '--color-secondary': '#6c757d',
    '--color-accent':    '#e94560',
    '--color-bg':        '#ffffff',
    '--color-text':      '#1a1a2e',
    '--color-muted':     '#6b7280',
    // Typography
    '--font-family':     'sans-serif',
    '--font-size-base':  '16px',
    '--font-size-lg':    '20px',
    '--font-size-sm':    '14px',
    '--line-height':     '1.6',
    '--font-weight-bold':'700',
    // Spacing
    '--spacing-xs':      '4px',
    '--spacing-sm':      '8px',
    '--spacing-md':      '16px',
    '--spacing-lg':      '32px',
    '--spacing-xl':      '64px',
    // Border radius
    '--radius-sm':       '4px',
    '--radius-md':       '8px',
    '--radius-lg':       '16px',
    '--radius-full':     '9999px',
    // Shadow
    '--shadow-sm':       '0 1px 3px rgba(0,0,0,0.12)',
    '--shadow-md':       '0 4px 12px rgba(0,0,0,0.15)',
    '--shadow-lg':       '0 8px 32px rgba(0,0,0,0.2)'
};

/** Token group definitions for UI rendering */
const TOKEN_GROUPS = [
    {
        label: 'Colors',
        tokens: [
            { key: '--color-primary',   label: 'Primary',   type: 'color' },
            { key: '--color-secondary', label: 'Secondary', type: 'color' },
            { key: '--color-accent',    label: 'Accent',    type: 'color' },
            { key: '--color-bg',        label: 'Background',type: 'color' },
            { key: '--color-text',      label: 'Text',      type: 'color' },
            { key: '--color-muted',     label: 'Muted',     type: 'color' }
        ]
    },
    {
        label: 'Typography',
        tokens: [
            { key: '--font-family',      label: 'Font Family',   type: 'font-family' },
            { key: '--font-size-base',   label: 'Base Size',     type: 'size' },
            { key: '--font-size-lg',     label: 'Large Size',    type: 'size' },
            { key: '--font-size-sm',     label: 'Small Size',    type: 'size' },
            { key: '--line-height',      label: 'Line Height',   type: 'number' },
            { key: '--font-weight-bold', label: 'Bold Weight',   type: 'number' }
        ]
    },
    {
        label: 'Spacing',
        tokens: [
            { key: '--spacing-xs', label: 'XS', type: 'size' },
            { key: '--spacing-sm', label: 'SM', type: 'size' },
            { key: '--spacing-md', label: 'MD', type: 'size' },
            { key: '--spacing-lg', label: 'LG', type: 'size' },
            { key: '--spacing-xl', label: 'XL', type: 'size' }
        ]
    },
    {
        label: 'Border Radius',
        tokens: [
            { key: '--radius-sm',   label: 'Small',  type: 'size' },
            { key: '--radius-md',   label: 'Medium', type: 'size' },
            { key: '--radius-lg',   label: 'Large',  type: 'size' },
            { key: '--radius-full', label: 'Full',   type: 'text' }
        ]
    },
    {
        label: 'Shadow',
        tokens: [
            { key: '--shadow-sm', label: 'Small',  type: 'text' },
            { key: '--shadow-md', label: 'Medium', type: 'text' },
            { key: '--shadow-lg', label: 'Large',  type: 'text' }
        ]
    }
];

export class ThemeManager {
    constructor(editor) {
        this.editor    = editor;
        this.container = document.querySelector('[data-tab-content="theme"]');

        /** Current token values — starts from defaults */
        this._tokens = { ...THEME_DEFAULTS };

        /** <style> element injected into canvas iframe / document */
        this._styleEl = null;

        this._ensureStyleEl();
        this._applyAll();
        this._render();
        this._bindEvents();
    }

    // ─────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────

    /**
     * Trả về object tokens để serialize vào project JSON.
     * @returns {Object}
     */
    getTheme() {
        return { ...this._tokens };
    }

    /**
     * Load theme từ object (từ project JSON).
     * @param {Object} tokens
     */
    loadTheme(tokens) {
        if (!tokens || typeof tokens !== 'object') return;
        // Merge với defaults để đảm bảo tất cả tokens đều có giá trị
        this._tokens = { ...THEME_DEFAULTS, ...tokens };
        this._applyAll();
        this._render();
        eventBus.emit('theme:changed', this._tokens);
    }

    /**
     * Reset tất cả tokens về defaults.
     */
    resetToDefaults() {
        this._tokens = { ...THEME_DEFAULTS };
        this._applyAll();
        this._render();
        eventBus.emit('theme:changed', this._tokens);
        eventBus.emit('theme:reset');
    }

    /**
     * Sinh CSS string cho :root block — dùng trong exportCSS().
     * @returns {string}
     */
    exportThemeCSS() {
        const lines = Object.entries(this._tokens)
            .map(([k, v]) => `    ${k}: ${v};`);
        return `:root {\n${lines.join('\n')}\n}\n\n`;
    }

    // ─────────────────────────────────────────────
    //  Apply to canvas
    // ─────────────────────────────────────────────

    /**
     * Đảm bảo có <style id="theme-variables"> trong document.
     * Inject vào <head> để tất cả elements trên canvas inherit được.
     */
    _ensureStyleEl() {
        let el = document.getElementById('theme-variables');
        if (!el) {
            el = document.createElement('style');
            el.id = 'theme-variables';
            document.head.appendChild(el);
        }
        this._styleEl = el;
    }

    /**
     * Apply tất cả tokens lên document :root.
     */
    _applyAll() {
        if (!this._styleEl) return;
        const lines = Object.entries(this._tokens)
            .map(([k, v]) => `    ${k}: ${v};`);
        this._styleEl.textContent = `:root {\n${lines.join('\n')}\n}`;
    }

    /**
     * Set một token và apply ngay.
     * @param {string} key
     * @param {string} value
     */
    _setToken(key, value) {
        this._tokens[key] = value;
        this._applyAll();
        eventBus.emit('theme:changed', this._tokens);
        eventBus.emit('theme:token-changed', { key, value });
    }

    // ─────────────────────────────────────────────
    //  UI Render
    // ─────────────────────────────────────────────

    _render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // ── Header ────────────────────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'theme-header';
        header.innerHTML = `
            <span class="theme-title">Design Tokens</span>
            <button class="theme-reset-btn" title="Reset to defaults">↺ Reset</button>
        `;
        header.querySelector('.theme-reset-btn').addEventListener('click', () => {
            if (confirm('Reset all tokens to defaults?')) this.resetToDefaults();
        });
        this.container.appendChild(header);

        // ── Token groups ──────────────────────────────────────────────────────
        const body = document.createElement('div');
        body.className = 'theme-body';

        TOKEN_GROUPS.forEach(group => {
            const section = document.createElement('div');
            section.className = 'theme-group';

            const groupHeader = document.createElement('div');
            groupHeader.className = 'theme-group-label';
            groupHeader.textContent = group.label;
            section.appendChild(groupHeader);

            group.tokens.forEach(token => {
                section.appendChild(this._buildTokenRow(token));
            });

            body.appendChild(section);
        });

        this.container.appendChild(body);
    }

    /**
     * Tạo row UI cho một token.
     * @param {{ key: string, label: string, type: string }} token
     * @returns {HTMLElement}
     */
    _buildTokenRow(token) {
        const row = document.createElement('div');
        row.className = 'theme-row';

        const label = document.createElement('label');
        label.className = 'theme-token-label';
        label.textContent = token.label;
        label.title = token.key;
        row.appendChild(label);

        const value = this._tokens[token.key] ?? THEME_DEFAULTS[token.key] ?? '';

        if (token.type === 'color') {
            const wrap = document.createElement('div');
            wrap.className = 'theme-color-wrap';

            const swatch = document.createElement('input');
            swatch.type  = 'color';
            swatch.className = 'theme-color-swatch';
            swatch.value = this._toHex(value);

            const text = document.createElement('input');
            text.type  = 'text';
            text.className = 'theme-token-input';
            text.value = value;

            // Color picker → update text + token
            swatch.addEventListener('input', () => {
                text.value = swatch.value;
                this._setToken(token.key, swatch.value);
            });

            // Text input → update swatch + token
            text.addEventListener('change', () => {
                const v = text.value.trim();
                if (v) {
                    this._setToken(token.key, v);
                    // Try to update swatch if valid hex
                    const hex = this._toHex(v);
                    if (hex) swatch.value = hex;
                }
            });

            wrap.appendChild(swatch);
            wrap.appendChild(text);
            row.appendChild(wrap);

        } else if (token.type === 'font-family') {
            const select = document.createElement('select');
            select.className = 'theme-token-select';
            const families = [
                'sans-serif', 'serif', 'monospace',
                'Inter, sans-serif', 'Georgia, serif',
                'Roboto, sans-serif', 'Open Sans, sans-serif',
                '"Helvetica Neue", Helvetica, Arial, sans-serif'
            ];
            families.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f.split(',')[0].replace(/"/g, '');
                opt.selected = value === f;
                select.appendChild(opt);
            });
            // Custom option
            const customOpt = document.createElement('option');
            customOpt.value = '__custom__';
            customOpt.textContent = 'Custom…';
            select.appendChild(customOpt);

            select.addEventListener('change', () => {
                if (select.value === '__custom__') {
                    const custom = prompt('Enter font family:', value);
                    if (custom) this._setToken(token.key, custom);
                    this._render(); // re-render to update
                } else {
                    this._setToken(token.key, select.value);
                }
            });
            row.appendChild(select);

        } else {
            // text, size, number → plain input
            const input = document.createElement('input');
            input.type  = 'text';
            input.className = 'theme-token-input';
            input.value = value;

            input.addEventListener('change', () => {
                const v = input.value.trim();
                if (v) this._setToken(token.key, v);
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
                e.stopPropagation();
            });
            row.appendChild(input);
        }

        return row;
    }

    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────

    /**
     * Chuyển CSS color string sang hex (best effort).
     * @param {string} color
     * @returns {string}
     */
    _toHex(color) {
        if (!color) return '#000000';
        if (/^#[0-9a-fA-F]{3,6}$/.test(color)) return color.length === 4
            ? '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3]
            : color;
        // rgb/rgba → hex via canvas trick
        try {
            const tmp = document.createElement('canvas');
            tmp.width = tmp.height = 1;
            const ctx = tmp.getContext('2d');
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        } catch {
            return '#000000';
        }
    }

    _bindEvents() {
        // Auto-save khi theme thay đổi
        eventBus.on('theme:changed', () => {
            eventBus.emit('project:schedule-save');
        });
    }
}
