/**
 * RenderProfiler - Debug tool for measuring editor render performance.
 * - Tracks execution time per render subsystem
 * - Integrates with RenderScheduler for automatic wrapping
 * - Reports via console.table()
 * - No impact when DEBUG is false
 */
const DEBUG = false;

export class RenderProfiler {
    constructor() {
        this._timings = new Map();
        this._enabled = DEBUG;
        this._frameSamples = [];
        this._lastFrameStart = 0;
    }

    /**
     * Enable/disable profiling.
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
    }

    /**
     * Start timing a named section.
     * @param {string} name
     */
    begin(name) {
        if (!this._enabled) return;
        this._timings.set(name, { start: performance.now(), end: 0, duration: 0 });
    }

    /**
     * End timing a named section.
     * @param {string} name
     */
    end(name) {
        if (!this._enabled) return;
        const entry = this._timings.get(name);
        if (!entry) return;
        entry.end = performance.now();
        entry.duration = entry.end - entry.start;
    }

    /**
     * Generate report of all timed sections.
     * @returns {Array<{name: string, duration: number, status: string}>}
     */
    report() {
        if (!this._enabled) return [];

        const rows = Array.from(this._timings.entries()).map(([name, data]) => {
            const duration = Math.round(data.duration * 100) / 100;
            const status = duration > 16 ? '⚠️ OVER BUDGET' : 'OK';
            return { name, duration, status };
        });

        rows.sort((a, b) => b.duration - a.duration);

        console.log('\n[RenderProfiler] Report');
        console.table(rows);

        const slowest = rows.filter(r => r.duration > 16);
        if (slowest.length > 0) {
            console.warn(`[RenderProfiler] ${slowest.length} subsystem(s) exceed 16ms frame budget:`);
            slowest.forEach(r => console.warn(`  - ${r.name}: ${r.duration}ms`));
        }

        return rows;
    }

    /**
     * Reset all timing data.
     */
    reset() {
        this._timings.clear();
        this._frameSamples = [];
        this._lastFrameStart = 0;
    }

    /**
     * Wrap a callback with profiling.
     * @param {string} name
     * @param {Function} callback
     * @returns {Function}
     */
    wrap(name, callback) {
        return (...args) => {
            this.begin(name);
            try {
                callback(...args);
            } finally {
                this.end(name);
            }
        };
    }

    /**
     * Record frame start.
     */
    frameStart() {
        if (!this._enabled) return;
        this._lastFrameStart = performance.now();
    }

    /**
     * Record frame end and add to samples.
     */
    frameEnd() {
        if (!this._enabled || !this._lastFrameStart) return;
        const frameTime = performance.now() - this._lastFrameStart;
        this._frameSamples.push(frameTime);
        this._lastFrameStart = 0;
    }

    /**
     * Get average frame time from samples.
     * @returns {number}
     */
    getAverageFrameTime() {
        if (this._frameSamples.length === 0) return 0;
        const sum = this._frameSamples.reduce((a, b) => a + b, 0);
        return sum / this._frameSamples.length;
    }

    /**
     * Get FPS estimate from samples.
     * @returns {number}
     */
    getFPS() {
        const avgFrame = this.getAverageFrameTime();
        if (avgFrame === 0) return 0;
        return Math.round(1000 / avgFrame);
    }
}

export default new RenderProfiler();
