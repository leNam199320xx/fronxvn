export function storageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn('[Storage] Read failed:', e);
        return null;
    }
}

export function storageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn('[Storage] Write failed:', e);
    }
}

export function storageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('[Storage] Remove failed:', e);
    }
}
