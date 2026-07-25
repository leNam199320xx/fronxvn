import { generatePageId } from '../core/ids.js';
import { cloneDeep } from '../core/clone.js';

export { generatePageId };

export function generatePageName(pages) {
    return `Page ${pages.length + 1}`;
}

export function createEmptyPage(pages) {
    return {
        id: generatePageId(),
        name: generatePageName(pages),
        html: '',
        bpStyles: {},
        historyState: { undoStack: [], redoStack: [] },
        meta: {
            title: '',
            description: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            canonical: ''
        }
    };
}

export function findPage(pages, id) {
    return pages.find(p => p.id === id);
}

export function snapshotPage(page, isActive, saveStateFn) {
    if (isActive) {
        saveStateFn(page);
    }
    return {
        id: page.id,
        name: page.name,
        html: page.html,
        bpStyles: cloneDeep(page.bpStyles || {}),
        meta: cloneDeep(page.meta || {})
    };
}

export function restorePageFromSnapshot(snapshot, insertIdx, pages) {
    const page = {
        id: snapshot.id,
        name: snapshot.name,
        html: snapshot.html,
        bpStyles: snapshot.bpStyles || {},
        historyState: { undoStack: [], redoStack: [] },
        meta: snapshot.meta || {}
    };
    const idx = Math.min(insertIdx, pages.length);
    pages.splice(idx, 0, page);
    return page;
}
