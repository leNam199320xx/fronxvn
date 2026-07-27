/**
 * FrameCache - Per-frame cache for expensive DOM-derived values.
 * - Values are cached for exactly one animation frame
 * - Automatically invalidated on next frame
 * - Never caches DOM nodes, only plain objects/numbers
 * - Integrates with CanvasAPI and CoordinateSystem
 */
export class FrameCache {
    constructor() {
        this._cache = new Map();
        this._frameId = 0;
        this._onHit = null;
        this._onMiss = null;
    }

    setDiagnosticsHooks(onHit, onMiss) {
        this._onHit = onHit;
        this._onMiss = onMiss;
    }

    /**
     * Get a cached value or compute and cache it.
     * @param {string} key
     * @param {Function} resolver - returns a plain value (number, object)
     * @returns {*}
     */
    get(key, resolver) {
        if (typeof resolver !== 'function') {
            return resolver;
        }

        const entry = this._cache.get(key);
        if (entry && entry.frame === this._frameId) {
            if (this._onHit) this._onHit();
            return entry.value;
        }

        const value = resolver();
        this._cache.set(key, { frame: this._frameId, value });
        if (this._onMiss) this._onMiss();
        return value;
    }

    /**
     * Invalidate a single cache entry.
     * @param {string} key
     */
    invalidate(key) {
        this._cache.delete(key);
    }

    /**
     * Clear all cached values.
     */
    clear() {
        this._cache.clear();
    }

    /**
     * Mark the start of a new frame.
     * All cached values from previous frames become stale.
     */
    beginFrame() {
        this._frameId++;
    }

    /**
     * End the current frame. Alias for beginFrame.
     */
    endFrame() {
        this.beginFrame();
    }

    /**
     * Get current frame id.
     * @returns {number}
     */
    getFrameId() {
        return this._frameId;
    }
}

export default new FrameCache();
