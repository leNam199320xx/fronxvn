import { getClassName } from './class-generator.js';
import { escapeHtml, escapeAttr, repeatIndent } from './utils.js';
import { buildHead } from './export-seo.js';

export function exportHTML(editor) {
    const meta = editor.projectMeta || {};
    const canvas = editor.canvas;
    const elements = Array.from(canvas.querySelectorAll(':scope > [data-editor-element]'));
    const title = meta.title || 'Exported Page';
    let head = buildHead(meta, title);
    let body = '';
    elements.forEach(el => {
        body += elementToHTML(el, 1);
    });
    return head + body + '</body>\n</html>';
}

export function elementToHTML(el, indent) {
    if (el.dataset.hidden === 'true') return '';

    const spaces = repeatIndent(indent);
    const tag = el.tagName.toLowerCase();
    const className = getClassName(el);

    let attrs = ` class="${className}"`;

    const semanticAttrs = ['href', 'src', 'alt', 'placeholder', 'type', 'value',
                           'id', 'name', 'for', 'action', 'method', 'target',
                           'aria-label', 'aria-hidden', 'role', 'tabindex'];
    semanticAttrs.forEach(attr => {
        if (attr === 'id' && el.id && el.id.startsWith('el-')) return;
        if (el.hasAttribute(attr)) {
            attrs += ` ${attr}="${escapeAttr(el.getAttribute(attr))}"`;
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
            html += elementToHTML(child, indent + 1);
        });
        html += `${spaces}</${tag}>\n`;
        return html;
    } else {
        const text = escapeHtml(el.textContent || '');
        return `${spaces}<${tag}${attrs}>${text}</${tag}>\n`;
    }
}
