import { findPage } from './utils.js';
import { savePageData, restorePageData } from './page-storage.js';
import { restoreHistoryFromPage } from './page-history.js';
import debug from '../debug.js';

export function switchPage(pages, activePageId, editor, eventBus, pageId) {
    debug.action('page-switch', 'switchPage', { from: activePageId, to: pageId });
    if (pageId === activePageId) return pageId;

    const fromPage = findPage(pages, activePageId);
    const toPage = findPage(pages, pageId);
    if (!toPage) {
        console.warn(`[PageManager] switchPage: page "${pageId}" not found.`);
        return activePageId;
    }

    try {
        if (fromPage) {
            savePageData(editor, fromPage);
        }

        clearCanvas(editor);

        eventBus.emit('selection:deselect-all');
        eventBus.emit('overlay:clear');

        restorePageData(editor, toPage);
        restoreHistoryFromPage(editor, toPage);

        eventBus.emit('page:switched', { pageId, pageName: toPage.name });
        eventBus.emit('layer:refresh');
        eventBus.emit('history:changed', {
            canUndo: (toPage.historyState.undoStack.length > 0),
            canRedo: (toPage.historyState.redoStack.length > 0)
        });

        return pageId;
    } catch (err) {
        console.error('[PageManager] switchPage failed:', err);
        if (fromPage) {
            try {
                restorePageData(editor, fromPage);
                restoreHistoryFromPage(editor, fromPage);
            } catch (_) {}
        }
        eventBus.emit('page:switch-error', {
            error: err,
            fromPageId: activePageId,
            toPageId: pageId
        });
        return activePageId;
    }
}

function clearCanvas(editor) {
    editor.canvas.innerHTML = '';
}
