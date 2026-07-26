/**
 * Dirty flags for editor state tracking.
 * Modules use these to signal what needs re-rendering.
 */
export const DIRTY = Object.freeze({
    SELECTION: 'DIRTY_SELECTION',
    OVERLAY: 'DIRTY_OVERLAY',
    GUIDES: 'DIRTY_GUIDES',
    PROPERTIES: 'DIRTY_PROPERTIES',
    LAYER: 'DIRTY_LAYER',
    HISTORY: 'DIRTY_HISTORY',
    QUALITY: 'DIRTY_QUALITY',
    EXPORT: 'DIRTY_EXPORT',
    CANVAS: 'DIRTY_CANVAS'
});

export class DirtyState {
    constructor() {
        this._flags = new Set();
        this._listeners = [];
    }

    /**
     * Mark a subsystem as dirty.
     * @param {string} flag
     */
    mark(flag) {
        this._flags.add(flag);
        this._listeners.forEach(fn => fn(flag));
    }

    /**
     * Clear a dirty flag.
     * @param {string} flag
     */
    clear(flag) {
        this._flags.delete(flag);
    }

    /**
     * Clear all dirty flags.
     */
    clearAll() {
        this._flags.clear();
    }

    /**
     * Check if a flag is dirty.
     * @param {string} flag
     * @returns {boolean}
     */
    has(flag) {
        return this._flags.has(flag);
    }

    /**
     * Get list of dirty flags.
     * @returns {string[]}
     */
    list() {
        return Array.from(this._flags);
    }

    /**
     * Subscribe to dirty state changes.
     * @param {Function} fn
     * @returns {Function} unsubscribe
     */
    onChange(fn) {
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter(f => f !== fn);
        };
    }
}

export default new DirtyState();
