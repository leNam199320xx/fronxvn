import { generateId } from './utils.js';
import { generateElementId } from '../core/ids.js';

export function regenPageIds(pagesData) {
    return pagesData.map(page => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = page.html;
        tempDiv.querySelectorAll('[data-editor-element]').forEach(el => {
            el.id = generateElementId();
        });
        return {
            ...page,
            id:   generateId('page', 5),
            html: tempDiv.innerHTML,
            historyState: { undoStack: [], redoStack: [] }
        };
    });
}
