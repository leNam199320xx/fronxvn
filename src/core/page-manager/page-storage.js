import { findPage, generatePageId } from './utils.js';

export function savePageData(editor, page) {
    if (!page) return;
    page.html = editor.canvas.innerHTML;

    const bpStyles = {};
    editor.canvas.querySelectorAll('[data-editor-element]').forEach(el => {
        if (el.id && el.__bpStyles) {
            bpStyles[el.id] = el.__bpStyles;
        }
    });
    page.bpStyles = bpStyles;
}

export function restorePageData(editor, page) {
    editor.canvas.innerHTML = page.html || '';

    if (page.bpStyles) {
        Object.entries(page.bpStyles).forEach(([id, styles]) => {
            const el = editor.canvas.querySelector(`#${CSS.escape(id)}`);
            if (el) el.__bpStyles = styles;
        });
    }
}

export function clearCanvas(editor) {
    editor.canvas.innerHTML = '';
}

export function getPagesData(pages, activePageId, saveStateFn) {
    const activePage = findPage(pages, activePageId);
    if (activePage) {
        saveStateFn(activePage);
    }
    return pages.map(p => ({
        id: p.id,
        name: p.name,
        html: p.html,
        bpStyles: p.bpStyles || {},
        meta: p.meta || {}
    }));
}

export function loadPagesData(pagesData) {
    if (!Array.isArray(pagesData) || pagesData.length === 0) {
        return null;
    }

    return pagesData.map(data => ({
        id: data.id || generatePageId(),
        name: data.name || 'Page',
        html: data.html || '',
        bpStyles: data.bpStyles || {},
        historyState: { undoStack: [], redoStack: [] },
        meta: data.meta || {}
    }));
}
