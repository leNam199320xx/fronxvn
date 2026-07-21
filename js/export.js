/**
 * ExportManager - Export HTML, CSS, JSON
 *
 * Clean Export:
 * - HTML chỉ chứa class attribute, không inline style
 * - CSS được tách ra file style.css riêng
 * - Tên class sinh từ data-name hoặc data-type + ID suffix để tránh trùng
 *
 * ZIP Export:
 * - Đóng gói index.html + style.css thành file .zip
 * - Dùng JSZip qua CDN (lazy load khi cần)
 *
 * SEO Meta Panel:
 * - Title, Meta Description, OG tags, Canonical
 * - Inject vào <head> khi export
 */
import eventBus from './event-bus.js';
import { JSZIP_CDN_URL, EXPORT_INDENT } from './config.js';

export class ExportManager {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('export:show', () => this._showExportDialog());
    }

    // ─── DIALOG ───────────────────────────────────────────────────────────────

    /** Hiển thị dialog export */
    _showExportDialog() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 100000;
            display: flex; align-items: center; justify-content: center;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #252526; border: 1px solid #3e3e42; border-radius: 8px;
            width: 660px; max-height: 85vh; display: flex; flex-direction: column;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px; border-bottom: 1px solid #3e3e42;
            display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
        `;
        header.innerHTML = `
            <span style="font-size:14px;font-weight:600;color:#ccc;">Export</span>
            <button id="export-close" style="background:none;border:none;color:#ccc;font-size:18px;cursor:pointer;">✕</button>
        `;

        // Tabs: HTML | CSS | JSON | SEO
        const tabs = document.createElement('div');
        tabs.style.cssText = `display:flex; border-bottom:1px solid #3e3e42; flex-shrink:0;`;
        const tabNames = ['HTML', 'CSS', 'JSON', 'SEO'];
        tabNames.forEach((name, i) => {
            const tab = document.createElement('div');
            tab.style.cssText = `
                padding: 10px 20px; cursor: pointer; color: #969696;
                border-bottom: 2px solid transparent; font-size: 12px; user-select: none;
            `;
            if (i === 0) { tab.style.color = '#0078d4'; tab.style.borderBottomColor = '#0078d4'; }
            tab.textContent = name;
            tab.dataset.exportTab = name.toLowerCase();
            tab.addEventListener('click', () => {
                tabs.querySelectorAll('div').forEach(t => {
                    t.style.color = '#969696';
                    t.style.borderBottomColor = 'transparent';
                });
                tab.style.color = '#0078d4';
                tab.style.borderBottomColor = '#0078d4';
                this._switchExportTab(name.toLowerCase(), body, textarea, seoPanel);
            });
            tabs.appendChild(tab);
        });

        // Body
        const body = document.createElement('div');
        body.style.cssText = `padding: 16px 20px; flex: 1; overflow: auto; min-height: 0;`;

        const textarea = document.createElement('textarea');
        textarea.style.cssText = `
            width: 100%; height: 300px; background: #1e1e1e; border: 1px solid #3e3e42;
            color: #ccc; font-family: 'Consolas', monospace; font-size: 12px;
            padding: 12px; border-radius: 4px; resize: vertical; outline: none; box-sizing: border-box;
        `;
        textarea.value = this.exportHTML();
        textarea.readOnly = true;

        // SEO panel (hidden by default)
        const seoPanel = this._buildSeoPanel();
        seoPanel.style.display = 'none';

        body.appendChild(textarea);
        body.appendChild(seoPanel);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 12px 20px; border-top: 1px solid #3e3e42; flex-shrink: 0;
            display: flex; justify-content: flex-end; gap: 8px; align-items: center;
        `;

        const btnCopy = this._makeBtn('Copy', '#0078d4', 'white');
        btnCopy.addEventListener('click', () => {
            if (textarea.style.display !== 'none') {
                navigator.clipboard.writeText(textarea.value);
                btnCopy.textContent = 'Copied!';
                setTimeout(() => btnCopy.textContent = 'Copy', 1500);
            }
        });

        const btnDownload = this._makeBtn('Download', '#3e3e42', '#ccc');
        btnDownload.addEventListener('click', () => {
            const activeTab = tabs.querySelector('div[style*="rgb(0, 120, 212)"]');
            const type = activeTab?.dataset.exportTab || 'html';
            if (type === 'seo') return;
            const ext = { html: 'html', css: 'css', json: 'json' }[type] || 'html';
            this._download(textarea.value, `export.${ext}`);
        });

        const btnZip = this._makeBtn('⬇ ZIP', '#107c10', 'white');
        btnZip.title = 'Download ZIP (index.html + style.css)';
        btnZip.addEventListener('click', () => this._downloadZip());

        footer.appendChild(btnZip);
        footer.appendChild(btnCopy);
        footer.appendChild(btnDownload);

        dialog.appendChild(header);
        dialog.appendChild(tabs);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        modal.appendChild(dialog);
        document.body.appendChild(modal);

        header.querySelector('#export-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    _makeBtn(text, bg, color) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            padding: 6px 16px; background: ${bg}; border: none; color: ${color};
            border-radius: 4px; cursor: pointer; font-size: 12px;
        `;
        return btn;
    }

    _switchExportTab(type, body, textarea, seoPanel) {
        if (type === 'seo') {
            textarea.style.display = 'none';
            seoPanel.style.display = 'block';
        } else {
            textarea.style.display = 'block';
            seoPanel.style.display = 'none';
            textarea.value = this._getExport(type);
        }
    }

    _getExport(type) {
        switch (type) {
            case 'html': return this.exportHTML();
            case 'css':  return this.exportCSS();
            case 'json': return this.exportJSON();
            default: return '';
        }
    }

    // ─── SEO PANEL ────────────────────────────────────────────────────────────

    _buildSeoPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = 'color: #ccc; font-size: 12px;';

        const meta = this.editor.projectMeta;

        const fields = [
            { key: 'title',         label: 'Page Title',         placeholder: 'My Website' },
            { key: 'description',   label: 'Meta Description',   placeholder: 'Description (max 160 chars)', multiline: true },
            { key: 'canonical',     label: 'Canonical URL',      placeholder: 'https://example.com/page' },
            { key: 'ogTitle',       label: 'OG Title',           placeholder: 'Open Graph title' },
            { key: 'ogDescription', label: 'OG Description',     placeholder: 'Open Graph description', multiline: true },
            { key: 'ogImage',       label: 'OG Image URL',       placeholder: 'https://example.com/og.jpg' }
        ];

        fields.forEach(f => {
            const row = document.createElement('div');
            row.style.cssText = 'margin-bottom: 12px;';

            const label = document.createElement('label');
            label.style.cssText = 'display: block; margin-bottom: 4px; color: #969696; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;';
            label.textContent = f.label;

            let input;
            if (f.multiline) {
                input = document.createElement('textarea');
                input.style.cssText = `
                    width: 100%; height: 60px; background: #1e1e1e; border: 1px solid #3e3e42;
                    color: #ccc; font-size: 12px; padding: 8px; border-radius: 4px;
                    outline: none; resize: vertical; font-family: inherit; box-sizing: border-box;
                `;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.style.cssText = `
                    width: 100%; background: #1e1e1e; border: 1px solid #3e3e42;
                    color: #ccc; font-size: 12px; padding: 8px; border-radius: 4px;
                    outline: none; box-sizing: border-box;
                `;
            }

            input.placeholder = f.placeholder;
            input.value = meta[f.key] || '';
            input.addEventListener('input', () => {
                this.editor.projectMeta[f.key] = input.value;
            });
            input.addEventListener('focus', () => input.style.borderColor = '#0078d4');
            input.addEventListener('blur', () => input.style.borderColor = '#3e3e42');

            row.appendChild(label);
            row.appendChild(input);
            panel.appendChild(row);
        });

        return panel;
    }

    // ─── CLEAN HTML EXPORT ────────────────────────────────────────────────────

    /**
     * Sinh class name từ element (unique per element)
     * Format: data-name hoặc data-type, + id suffix tránh trùng
     */
    _getClassName(el) {
        const base = (el.dataset.name || el.dataset.type || el.tagName.toLowerCase())
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        // Lấy 4 ký tự cuối của ID để đảm bảo unique
        const suffix = (el.id || '').split('-').pop() || '';
        return suffix ? `${base}-${suffix}` : base;
    }

    /** Export HTML sạch — không inline style, dùng class */
    exportHTML() {
        const meta = this.editor.projectMeta || {};
        const canvas = this.editor.canvas;
        const elements = Array.from(canvas.querySelectorAll(':scope > [data-editor-element]'));

        const title = meta.title || 'Exported Page';
        let head = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`;
        head += `    <meta charset="UTF-8">\n`;
        head += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        head += `    <title>${this._escapeHtml(title)}</title>\n`;

        if (meta.description) {
            head += `    <meta name="description" content="${this._escapeAttr(meta.description)}">\n`;
        }
        if (meta.canonical) {
            head += `    <link rel="canonical" href="${this._escapeAttr(meta.canonical)}">\n`;
        }
        if (meta.ogTitle || meta.ogDescription || meta.ogImage) {
            if (meta.ogTitle)       head += `    <meta property="og:title" content="${this._escapeAttr(meta.ogTitle)}">\n`;
            if (meta.ogDescription) head += `    <meta property="og:description" content="${this._escapeAttr(meta.ogDescription)}">\n`;
            if (meta.ogImage)       head += `    <meta property="og:image" content="${this._escapeAttr(meta.ogImage)}">\n`;
            head += `    <meta property="og:type" content="website">\n`;
        }

        head += `    <link rel="stylesheet" href="style.css">\n`;
        head += `</head>\n<body>\n`;

        let body = '';
        elements.forEach(el => {
            body += this._elementToHTML(el, 1);
        });

        return head + body + `</body>\n</html>`;
    }

    /** Chuyển element thành HTML với class (không inline style) */
    _elementToHTML(el, indent) {
        // Bỏ qua element hidden khi export
        if (el.dataset.hidden === 'true') return '';

        const spaces = '    '.repeat(indent);
        const tag = el.tagName.toLowerCase();
        const className = this._getClassName(el);

        let attrs = ` class="${className}"`;

        // Thêm các attribute có nghĩa ngữ nghĩa
        const semanticAttrs = ['href', 'src', 'alt', 'placeholder', 'type', 'value',
                               'id', 'name', 'for', 'action', 'method', 'target',
                               'aria-label', 'aria-hidden', 'role', 'tabindex'];
        semanticAttrs.forEach(attr => {
            // Bỏ qua id nếu là generated ID (el-...)
            if (attr === 'id' && el.id && el.id.startsWith('el-')) return;
            if (el.hasAttribute(attr)) {
                attrs += ` ${attr}="${this._escapeAttr(el.getAttribute(attr))}"`;
            }
        });

        const children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
        const selfClosing = ['img', 'input', 'br', 'hr', 'link', 'meta', 'source'];

        if (selfClosing.includes(tag)) {
            return `${spaces}<${tag}${attrs}>\n`;
        }

        if (children.length > 0) {
            let html = `${spaces}<${tag}${attrs}>\n`;
            children.forEach(child => {
                html += this._elementToHTML(child, indent + 1);
            });
            html += `${spaces}</${tag}>\n`;
            return html;
        } else {
            const text = this._escapeHtml(el.textContent || '');
            return `${spaces}<${tag}${attrs}>${text}</${tag}>\n`;
        }
    }

    // ─── CLEAN CSS EXPORT ─────────────────────────────────────────────────────

    /** Export CSS sạch — mỗi element thành 1 class rule + @media queries */
    exportCSS() {
        const elements = this.editor.getElements();
        const seen = new Set();
        let css = '/* Generated by HTML Studio */\n\n';

        // Reset cơ bản
        css += `*, *::before, *::after {\n    box-sizing: border-box;\n}\n\n`;
        css += `body {\n    margin: 0;\n    padding: 0;\n    font-family: sans-serif;\n}\n\n`;

        // Base styles (desktop)
        elements.forEach(el => {
            if (el.dataset.hidden === 'true') return;

            const className = this._getClassName(el);
            if (seen.has(className)) return;
            seen.add(className);

            const style = el.style;
            if (style.length === 0) return;

            const skipProps = new Set(['pointer-events']);
            const props = [];
            for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                if (skipProps.has(prop)) continue;
                const value = style.getPropertyValue(prop);
                if (value) props.push(`    ${prop}: ${value};`);
            }

            if (props.length > 0) {
                css += `.${className} {\n${props.join('\n')}\n}\n\n`;
            }
        });

        // @media queries từ breakpoint overrides
        const bpManager = this.editor.breakpointManager;
        if (bpManager) {
            const breakpointDefs = [
                { bp: 'tablet', media: '(max-width: 768px)' },
                { bp: 'mobile', media: '(max-width: 375px)' }
            ];

            breakpointDefs.forEach(({ bp, media }) => {
                const mediaRules = [];

                elements.forEach(el => {
                    if (el.dataset.hidden === 'true') return;
                    const overrides = bpManager.getOverrides(el);
                    const bpOverride = overrides[bp];
                    if (!bpOverride || Object.keys(bpOverride).length === 0) return;

                    const className = this._getClassName(el);
                    const skipProps = new Set(['pointer-events']);
                    const props = Object.entries(bpOverride)
                        .filter(([p]) => !skipProps.has(p))
                        .map(([p, v]) => `        ${p}: ${v};`);

                    if (props.length > 0) {
                        mediaRules.push(`.${className} {\n${props.join('\n')}\n    }`);
                    }
                });

                if (mediaRules.length > 0) {
                    css += `@media ${media} {\n    ${mediaRules.join('\n\n    ')}\n}\n\n`;
                }
            });
        }

        return css;
    }

    // ─── JSON EXPORT ──────────────────────────────────────────────────────────

    exportJSON() {
        const canvas = this.editor.canvas;
        const elements = Array.from(canvas.querySelectorAll(':scope > [data-editor-element]'));
        const data = {
            meta: this.editor.projectMeta || {},
            elements: elements.map(el => this._elementToJSON(el))
        };
        return JSON.stringify(data, null, 2);
    }

    _elementToJSON(el) {
        const obj = {
            id: el.id,
            type: el.dataset.type || el.tagName.toLowerCase(),
            name: el.dataset.name || '',
            tag: el.tagName.toLowerCase(),
            container: el.dataset.container === 'true',
            hidden: el.dataset.hidden === 'true',
            style: {},
            text: '',
            children: []
        };

        const style = el.style;
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            obj.style[prop] = style.getPropertyValue(prop);
        }

        const childEls = el.querySelectorAll(':scope > [data-editor-element]');
        if (childEls.length === 0) {
            obj.text = el.textContent || '';
        }

        Array.from(childEls).forEach(child => {
            obj.children.push(this._elementToJSON(child));
        });

        return obj;
    }

    // ─── ZIP DOWNLOAD ─────────────────────────────────────────────────────────

    /** Download ZIP chứa tất cả pages dưới dạng file HTML riêng + style.css */
    async _downloadZip() {
        const css = this.exportCSS();

        // Lấy danh sách trang từ PageManager (đã serialize active page)
        const pages = this.editor.pageManager
            ? this.editor.pageManager.getPages()
            : null;

        try {
            const JSZip = await this._loadJSZip();
            const zip = new JSZip();

            if (pages && pages.length > 0) {
                // Multi-page export
                const filenames = this._resolveFilenames(pages);
                pages.forEach((page, i) => {
                    try {
                        const html = this._generatePageHTML(page);
                        zip.file(filenames[i], html);
                    } catch (err) {
                        console.warn(`[ExportManager] Skipping page "${page.name}" due to error:`, err);
                    }
                });
            } else {
                // Fallback: single-page export từ canvas hiện tại
                zip.file('index.html', this.exportHTML());
            }

            zip.file('style.css', css);

            const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${Date.now()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('[ExportManager] ZIP failed:', e);
            // Fallback: download riêng lẻ
            if (pages && pages.length > 0) {
                const filenames = this._resolveFilenames(pages);
                pages.forEach((page, i) => {
                    try { this._download(this._generatePageHTML(page), filenames[i]); } catch (_) {}
                });
            } else {
                this._download(this.exportHTML(), 'index.html');
            }
            this._download(css, 'style.css');
        }
    }

    /**
     * Sinh HTML hoàn chỉnh cho một page object.
     * Dùng page.html (innerHTML của canvas) — không đọc từ DOM.
     * @param {Object} page - { id, name, html, bpStyles, meta }
     * @returns {string}
     */
    _generatePageHTML(page) {
        const meta = {
            ...({ title: '', description: '', ogTitle: '', ogDescription: '', ogImage: '', canonical: '' }),
            ...(this.editor.projectMeta || {}),
            ...(page.meta || {})  // page-level meta override project meta
        };

        // Build <head>
        const title = meta.title || page.name || 'Exported Page';
        let head = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`;
        head += `    <meta charset="UTF-8">\n`;
        head += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        head += `    <title>${this._escapeHtml(title)}</title>\n`;

        if (meta.description) {
            head += `    <meta name="description" content="${this._escapeAttr(meta.description)}">\n`;
        }
        if (meta.canonical) {
            head += `    <link rel="canonical" href="${this._escapeAttr(meta.canonical)}">\n`;
        }
        if (meta.ogTitle || meta.ogDescription || meta.ogImage) {
            if (meta.ogTitle)       head += `    <meta property="og:title" content="${this._escapeAttr(meta.ogTitle)}">\n`;
            if (meta.ogDescription) head += `    <meta property="og:description" content="${this._escapeAttr(meta.ogDescription)}">\n`;
            if (meta.ogImage)       head += `    <meta property="og:image" content="${this._escapeAttr(meta.ogImage)}">\n`;
            head += `    <meta property="og:type" content="website">\n`;
        }

        head += `    <link rel="stylesheet" href="style.css">\n`;
        head += `</head>\n<body>\n`;

        // Parse page.html thành DOM tạm để dùng _elementToHTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = page.html || '';

        // Restore __bpStyles vào elements tạm để exportCSS có thể đọc nếu cần
        if (page.bpStyles) {
            Object.entries(page.bpStyles).forEach(([id, styles]) => {
                const el = tempDiv.querySelector(`#${CSS.escape(id)}`);
                if (el) el.__bpStyles = styles;
            });
        }

        // Sinh HTML từ các top-level editor elements
        let body = '';
        const topElements = Array.from(tempDiv.querySelectorAll(':scope > [data-editor-element]'));
        topElements.forEach(el => {
            body += this._elementToHTML(el, 1);
        });

        return head + body + `</body>\n</html>`;
    }

    /**
     * Slug hóa tên trang thành filename hợp lệ.
     * @param {string} name
     * @returns {string} slug (không có .html)
     */
    _slugify(name) {
        return (name || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '') || 'page';
    }

    /**
     * Tạo danh sách filenames không trùng cho tất cả pages.
     * Trang đầu tiên luôn là index.html.
     * @param {Array<{name: string}>} pages
     * @returns {string[]}
     */
    _resolveFilenames(pages) {
        const seen = new Map(); // slug → count
        return pages.map((page, i) => {
            if (i === 0) return 'index.html';
            const base = this._slugify(page.name);
            const count = seen.get(base) || 0;
            seen.set(base, count + 1);
            return count === 0 ? `${base}.html` : `${base}-${count + 1}.html`;
        });
    }

    /** Lazy load JSZip từ CDN */
    _loadJSZip() {
        if (window.JSZip) return Promise.resolve(window.JSZip);

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error('Failed to load JSZip'));
            document.head.appendChild(script);
        });
    }

    // ─── UTILITIES ────────────────────────────────────────────────────────────

    _download(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    _escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    _escapeAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
    }
}
