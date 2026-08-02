import eventBus from '../events/event-bus.js';
import { exportHTML } from './export-html.js';
import { exportCSS } from './export-css.js';
import { exportJSON } from './export-json.js';
import { downloadZip } from './export-zip.js';
import { buildSeoPanel } from './export-seo.js';
import { downloadBlob } from '../download.js';
import { createModal } from '../../studio/panels/ui/modal.js';
import { createButton } from '../../studio/panels/ui/button.js';
import {
    EXPORT_DIALOG_BORDER,
    EXPORT_TAB_COLOR,
    EXPORT_TAB_ACTIVE_COLOR,
    EXPORT_TEXTAREA_HEIGHT,
    EXPORT_TEXTAREA_BG,
    EXPORT_TEXTAREA_BORDER,
    EXPORT_TEXTAREA_COLOR,
    EXPORT_TEXTAREA_FONT_FAMILY,
    EXPORT_TEXTAREA_FONT_SIZE,
    EXPORT_TEXTAREA_PADDING,
    EXPORT_TEXTAREA_BORDER_RADIUS,
    EXPORT_COPY_RESET_DELAY,
    EXPORT_FOOTER_PADDING,
    EXPORT_FOOTER_BORDER_TOP,
    EXPORT_FOOTER_GAP,
    EXPORT_ZIP_BTN_COLOR,
    EXPORT_DOWNLOAD_BTN_BG,
    EXPORT_DOWNLOAD_BTN_COLOR,
    EXPORT_BODY_PADDING
} from '../utilities/config.js';

import debug from '../utilities/debug.js';

export class ExportManager {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    /** Bind events */
    _bindEvents() {
        eventBus.on('export:show', () => this._showExportDialog());
    }

    // ─── DIALOG ───────────────────────────────────────────────────────────────

    /** Hiển thị dialog export */
    _showExportDialog() {
        debug.action('export', 'showExportDialog');
        const textarea = document.createElement('textarea');
        textarea.style.cssText = `
            width: 100%; height: ${EXPORT_TEXTAREA_HEIGHT}; background: ${EXPORT_TEXTAREA_BG}; border: 1px solid ${EXPORT_TEXTAREA_BORDER};
            color: ${EXPORT_TEXTAREA_COLOR}; font-family: ${EXPORT_TEXTAREA_FONT_FAMILY}; font-size: ${EXPORT_TEXTAREA_FONT_SIZE};
            padding: ${EXPORT_TEXTAREA_PADDING}; border-radius: ${EXPORT_TEXTAREA_BORDER_RADIUS}; resize: vertical; outline: none; box-sizing: border-box;
        `;
        textarea.value = this.exportHTML();
        textarea.readOnly = true;

        const seoPanel = buildSeoPanel(this.editor);
        seoPanel.style.display = 'none';

        const bodyContent = document.createElement('div');
        bodyContent.style.cssText = `padding: ${EXPORT_BODY_PADDING}; flex: 1; overflow: auto; min-height: 0;`;
        bodyContent.appendChild(textarea);
        bodyContent.appendChild(seoPanel);

        const { modal, dialog, body } = createModal({
            title: 'Export',
            content: bodyContent,
            className: 'export-modal'
        });

        const tabs = document.createElement('div');
        tabs.style.cssText = `display:flex; border-bottom:1px solid ${EXPORT_DIALOG_BORDER}; flex-shrink:0;`;
        const tabNames = ['HTML', 'CSS', 'JSON', 'SEO'];
        tabNames.forEach((name, i) => {
            const tab = document.createElement('div');
            tab.className = 'export-tab';
            tab.dataset.exportTab = name.toLowerCase();
            tab.style.cssText = `
                padding: 10px 20px; cursor: pointer; color: ${EXPORT_TAB_COLOR};
                border-bottom: 2px solid transparent; font-size: 12px; user-select: none;
            `;
            if (i === 0) { tab.style.color = EXPORT_TAB_ACTIVE_COLOR; tab.style.borderBottomColor = EXPORT_TAB_ACTIVE_COLOR; }
            tab.textContent = name;
            tab.addEventListener('click', () => {
                tabs.querySelectorAll('.export-tab').forEach(t => {
                    t.style.color = EXPORT_TAB_COLOR;
                    t.style.borderBottomColor = 'transparent';
                });
                tab.style.color = EXPORT_TAB_ACTIVE_COLOR;
                tab.style.borderBottomColor = EXPORT_TAB_ACTIVE_COLOR;
                this._switchExportTab(name.toLowerCase(), body, textarea, seoPanel);
            });
            tabs.appendChild(tab);
        });

        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: ${EXPORT_FOOTER_PADDING}; border-top: ${EXPORT_FOOTER_BORDER_TOP}; flex-shrink: 0;
            display: flex; justify-content: flex-end; gap: ${EXPORT_FOOTER_GAP}; align-items: center;
        `;

        const btnZip = createButton('⬇ ZIP', EXPORT_ZIP_BTN_COLOR, 'white');
        btnZip.title = 'Download ZIP (index.html + style.css)';
        btnZip.addEventListener('click', () => downloadZip(this.editor));

        const btnCopy = createButton('Copy', EXPORT_TAB_ACTIVE_COLOR, 'white');
        btnCopy.addEventListener('click', () => {
            if (textarea.style.display !== 'none') {
                navigator.clipboard.writeText(textarea.value);
                btnCopy.textContent = 'Copied!';
                setTimeout(() => btnCopy.textContent = 'Copy', EXPORT_COPY_RESET_DELAY);
            }
        });

        const btnDownload = createButton('Download', EXPORT_DOWNLOAD_BTN_BG, EXPORT_DOWNLOAD_BTN_COLOR);
        btnDownload.addEventListener('click', () => {
            const activeTab = tabs.querySelector('[data-export-tab]');
            const type = activeTab?.dataset.exportTab || 'html';
            if (type === 'seo') return;
            const ext = { html: 'html', css: 'css', json: 'json' }[type] || 'html';
            const content = this._getExport(type);
            downloadBlob(content, `export.${ext}`);
        });

        footer.appendChild(btnZip);
        footer.appendChild(btnCopy);
        footer.appendChild(btnDownload);

        dialog.insertBefore(tabs, body);
        dialog.appendChild(footer);
    }

    _switchExportTab(type, body, textarea, seoPanel) {
        debug.action('export', 'switchExportTab', { type });
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
        debug.action('export', 'getExport', { type });
        switch (type) {
            case 'html': return this.exportHTML();
            case 'css':  return this.exportCSS();
            case 'json': return this.exportJSON();
            default: return '';
        }
    }

    // ─── PUBLIC EXPORT API ────────────────────────────────────────────────────

    exportHTML() {
        return exportHTML(this.editor);
    }

    exportCSS() {
        return exportCSS(this.editor);
    }

    exportJSON() {
        return exportJSON(this.editor);
    }

    async _downloadZip() {
        await downloadZip(this.editor);
    }

    _download(content, filename) {
        downloadBlob(content, filename);
    }
}


