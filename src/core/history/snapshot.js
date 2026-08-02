import { cloneDeep } from '../clone.js';

export function createSnapshot(page, isActive, saveStateFn) {
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

