import eventBus from '../event-bus.js';
import { generatePageId, findPage, snapshotPage } from './utils.js';
import { cloneDeep } from '../core/clone.js';
import { savePageData } from './page-storage.js';
import { saveHistoryToPage } from './page-history.js';
import { switchPage } from './page-switch.js';
import { renderTabBar } from './page-tabs.js';
import debug from '../debug.js';

export function addPage(pages, activePageId, editor, eventBus, opts = {}) {
    debug.action('page-crud', 'addPage', { totalPages: pages.length + 1 });
    const page = {
        id: generatePageId(),
        name: `Page ${pages.length + 1}`,
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
    const insertIdx = pages.length;
    pages.push(page);

    if (opts.pushHistory !== false) {
        const snapshot = snapshotPage(page, true, (p) => {
            savePageData(editor, p);
            saveHistoryToPage(editor, p);
        });
        eventBus.emit('history:push', {
            type: 'page:add',
            pageId: page.id,
            insertIdx,
            pageSnapshot: snapshot
        });
    }

    eventBus.emit('page:added', { pageId: page.id });
    return page;
}

export function deletePage(pages, activePageId, editor, eventBus, pageId, opts = {}) {
    debug.action('page-crud', 'deletePage', { pageId, totalPages: pages.length });
    if (pages.length <= 1) return;

    const idx = pages.findIndex(p => p.id === pageId);
    if (idx === -1) return;

    const pageSnapshot = snapshotPage(pages[idx], pages[idx].id === activePageId, (p) => {
        savePageData(editor, p);
        saveHistoryToPage(editor, p);
    });

    if (pageId === activePageId) {
        const newIdx = idx > 0 ? idx - 1 : 1;
        activePageId = switchPage(pages, activePageId, editor, eventBus, pages[newIdx].id);
    }

    pages[idx].historyState = null;
    pages.splice(idx, 1);

    if (opts.pushHistory !== false) {
        eventBus.emit('history:push', {
            type: 'page:delete',
            pageId,
            insertIdx: idx,
            pageSnapshot
        });
    }

    renderTabBar(pages, activePageId, editor, eventBus);
    eventBus.emit('page:deleted', { pageId });
}

export function duplicatePage(pages, activePageId, editor, eventBus, pageId) {
    debug.action('page-crud', 'duplicatePage', { pageId });
    const srcIdx = pages.findIndex(p => p.id === pageId);
    if (srcIdx === -1) return;

    if (pageId === activePageId) {
        savePageData(editor, pages[srcIdx]);
    }

    const src = pages[srcIdx];
    const newPage = {
        id: generatePageId(),
        name: `${src.name} Copy`,
        html: src.html,
        bpStyles: cloneDeep(src.bpStyles || {}),
        historyState: { undoStack: [], redoStack: [] },
        meta: cloneDeep(src.meta || {})
    };

    pages.splice(srcIdx + 1, 0, newPage);

    const newActivePageId = switchPage(pages, activePageId, editor, eventBus, newPage.id);

    renderTabBar(pages, newActivePageId || newPage.id, editor, eventBus);
}

export function renamePage(pages, activePageId, editor, eventBus, pageId, newName, opts = {}) {
    debug.action('page-crud', 'renamePage', { pageId, newName });
    const trimmed = (newName || '').trim();
    if (!trimmed) return;

    const page = findPage(pages, pageId);
    if (!page) return;

    const oldName = page.name;
    page.name = trimmed;
    renderTabBar(pages, activePageId, editor, eventBus);

    if (opts.pushHistory !== false) {
        eventBus.emit('history:push', {
            type: 'page:rename',
            pageId,
            before: oldName,
            after: trimmed
        });
    }

    eventBus.emit('page:renamed', { pageId, newName: trimmed });
}
