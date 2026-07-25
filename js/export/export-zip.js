import { JSZIP_CDN_URL } from '../config.js';
import { exportHTML } from './export-html.js';
import { exportCSS } from './export-css.js';
import { buildHead } from './export-seo.js';
import { elementToHTML } from './export-html.js';
import { resolveFilenames } from './filename.js';
import { downloadBlob } from '../core/download.js';

export async function downloadZip(editor) {
    const css = exportCSS(editor);

    const pages = editor.pageManager
        ? editor.pageManager.getPages()
        : null;

    try {
        const JSZip = await loadJSZip();
        const zip = new JSZip();

        if (pages && pages.length > 0) {
            const filenames = resolveFilenames(pages);
            pages.forEach((page, i) => {
                try {
                    const html = generatePageHTML(editor, page);
                    zip.file(filenames[i], html);
                } catch (err) {
                    console.warn(`[ExportManager] Skipping page "${page.name}" due to error:`, err);
                }
            });
        } else {
            zip.file('index.html', exportHTML(editor));
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
        if (pages && pages.length > 0) {
            const filenames = resolveFilenames(pages);
            pages.forEach((page, i) => {
                try { downloadBlob(generatePageHTML(editor, page), filenames[i]); } catch (_) {}
            });
        } else {
            downloadBlob(exportHTML(editor), 'index.html');
        }
        downloadBlob(css, 'style.css');
    }
}

export function generatePageHTML(editor, page) {
    const meta = {
        ...{ title: '', description: '', ogTitle: '', ogDescription: '', ogImage: '', canonical: '' },
        ...(editor.projectMeta || {}),
        ...(page.meta || {})
    };

    const title = meta.title || page.name || 'Exported Page';
    let html = buildHead(meta, title);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = page.html || '';

    if (page.bpStyles) {
        Object.entries(page.bpStyles).forEach(([id, styles]) => {
            const el = tempDiv.querySelector(`#${CSS.escape(id)}`);
            if (el) el.__bpStyles = styles;
        });
    }

    const topElements = Array.from(tempDiv.querySelectorAll(':scope > [data-editor-element]'));
    topElements.forEach(el => {
        html += elementToHTML(el, 1);
    });

    return html + '</body>\n</html>';
}

function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = JSZIP_CDN_URL;
        script.onload = () => resolve(window.JSZip);
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}
