/**
 * RenderScheduler - Centralized batching of visual updates.
 * - Single rAF per frame
 * - Merge duplicates by key
 * - Priority order: HIGH < NORMAL < LOW
 * - Independent from editor modules
 * - No behavior changes
 */
import DirtyState, { DIRTY } from './dirty-state.js';
import RenderProfiler from './render-profiler.js';
import FrameCache from './frame-cache.js';

export const PRIORITY = Object.freeze({
    HIGH: 0,
    NORMAL: 1,
    LOW: 2
});

const FLAG_TO_KEYS = new Map([
    [DIRTY.SELECTION, ['pipeline-selection']],
    [DIRTY.OVERLAY, ['pipeline-overlay', 'pipeline-selection']],
    [DIRTY.GUIDES, ['pipeline-guides']],
    [DIRTY.PROPERTIES, ['pipeline-property']],
    [DIRTY.LAYER, ['pipeline-layer']],
    [DIRTY.HISTORY, ['pipeline-history']],
    [DIRTY.QUALITY, ['pipeline-quality']],
    [DIRTY.EXPORT, ['pipeline-export']],
    [DIRTY.CANVAS, ['pipeline-canvas']]
]);

export class RenderScheduler {
    constructor() {
        this._buckets = [[], [], []];
        this._keys = new Set();
        this._rafId = null;
        this._dirtyState = DirtyState;
        this._onFrameBegin = null;
        this._onFrameEnd = null;
    }

    setOnFrameBegin(fn) {
        this._onFrameBegin = fn;
    }

    setOnFrameEnd(fn) {
        this._onFrameEnd = fn;
    }

    /**
     * Schedule a render task.
     * @param {string} key
     * @param {Function} callback
     * @param {number} priority
     * @param {string|null} dirtyFlag - Optional dirty flag to check
     */
    schedule(key, callback, priority = PRIORITY.NORMAL, dirtyFlag = null) {
        if (dirtyFlag && !this._dirtyState.has(dirtyFlag)) {
            return;
        }
        if (this._keys.has(key)) return;
        this._keys.add(key);

        let wrapped = callback;
        if (RenderProfiler._enabled) {
            wrapped = RenderProfiler.wrap(key, callback);
        }

        this._buckets[priority].push({ key, callback: wrapped });
        this._scheduleFlush();
    }

    /**
     * Mark subsystem dirty and schedule associated keys.
     * @param {string} flag
     */
    markDirty(flag) {
        this._dirtyState.mark(flag);
        const keys = FLAG_TO_KEYS.get(flag) || [];
        keys.forEach(key => this.schedule(key, () => {}, PRIORITY.NORMAL, flag));
    }

    /**
     * Cancel a scheduled task by key.
     * @param {string} key
     */
    cancel(key) {
        this._keys.delete(key);
    }

    /**
     * Flush all queued tasks immediately.
     */
    flush() {
        if (this._rafId) {
            this._rafId = null;
        }

        let hasTasks = false;
        for (let p = 0; p < 3; p++) {
            const tasks = this._buckets[p];
            if (tasks.length === 0) continue;
            hasTasks = true;
            this._buckets[p] = [];
            for (let i = 0; i < tasks.length; i++) {
                try {
                    tasks[i].callback();
                } catch (err) {
                    console.error('[RenderScheduler] Task failed:', err);
                }
            }
        }
        this._keys.clear();

        if (hasTasks) {
            this._dirtyState.clearAll();
        }
    }

    /**
     * Remove all scheduled tasks.
     */
    clear() {
        this._buckets = [[], [], []];
        this._keys.clear();
    }

    _scheduleFlush() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = null;
            if (this._onFrameBegin) this._onFrameBegin();
            FrameCache.beginFrame();
            this.flush();
            if (this._onFrameEnd) this._onFrameEnd();
        });
    }
}

export default new RenderScheduler();
