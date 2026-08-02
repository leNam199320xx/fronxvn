import { storageSet, storageGet } from './storage.js';

export function autoSave(getProjectData, autoSaveKey) {
    try {
        const project = getProjectData();
        storageSet(autoSaveKey, JSON.stringify(project));
    } catch (e) {
        console.warn('[ProjectManager] Auto-save failed (storage full?):', e);
    }
}

export function autoLoad(autoSaveKey, onProjectLoaded, onEmpty) {
    try {
        const data = storageGet(autoSaveKey);
        if (data) {
            const project = JSON.parse(data);
            if (project) {
                onProjectLoaded(project);
                return;
            }
        }
    } catch (e) {
        console.warn('[ProjectManager] Auto-load failed:', e);
    }
    onEmpty();
}
