const STORAGE_KEY = 'editor-user-templates';

export function loadUserTemplates() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

export function saveUserTemplates(templates) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
        console.warn('[TemplateManager] Failed to save user templates:', e);
    }
}
