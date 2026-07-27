/**
 * CanvasDiagnostics - Development and debugging tool for the Canvas subsystem.
 * - Monitors: frame count, DOM queries, getBoundingClientRect() calls,
 *   EventBridge events/sec, MutationObserver records/sec, FrameCache hit/miss ratios,
 *   and average frame time.
 * - Enabled only in DEBUG mode via explicit enable()/disable().
 * - Zero overhead when disabled (all tracking methods return immediately).
 * - Reports via console.table().
 */

import FrameCache from '../core/frame-cache.js';
import RenderScheduler from '../core/render-scheduler.js';

const DEBUG = false;

export class CanvasDiagnostics {
    constructor() {
        this._enabled = DEBUG;
        this._reset();
    }

    _reset() {
        this._frameCount = 0;
        this._domQueries = 0;
        this._rectCalls = 0;
        this._eventTotal = 0;
        this._mutationTotal = 0;
        this._cacheHits = 0;
        this._cacheMisses = 0;
        this._frameTimes = [];
        this._lastFrameStart = 0;
        this._eventsThisSecond = 0;
        this._mutationsThisSecond = 0;
        this._eventsPerSecond = 0;
        this._mutationsPerSecond = 0;
        this._lastSecondStart = 0;
    }

    enable() {
        this._enabled = true;
        this._reset();
        FrameCache.setDiagnosticsHooks(
            () => this._trackCacheHit(),
            () => this._trackCacheMiss()
        );
        RenderScheduler.setOnFrameBegin(() => this.beginFrame());
        RenderScheduler.setOnFrameEnd(() => this.endFrame());
    }

    disable() {
        this._enabled = false;
        this._reset();
        FrameCache.setDiagnosticsHooks(null, null);
        RenderScheduler.setOnFrameBegin(null);
        RenderScheduler.setOnFrameEnd(null);
    }

    reset() {
        this._reset();
    }

    trackDOMQuery() {
        if (!this._enabled) return;
        this._domQueries++;
    }

    trackBoundingClientRect() {
        if (!this._enabled) return;
        this._rectCalls++;
    }

    trackEventBridgeEvent() {
        if (!this._enabled) return;
        this._eventTotal++;
        this._eventsThisSecond++;
    }

    trackMutationRecords(count) {
        if (!this._enabled) return;
        this._mutationTotal += count;
        this._mutationsThisSecond += count;
    }

    _trackCacheHit() {
        this._cacheHits++;
    }

    _trackCacheMiss() {
        this._cacheMisses++;
    }

    beginFrame() {
        if (!this._enabled) return;
        const now = performance.now();
        if (this._lastSecondStart > 0 && now - this._lastSecondStart >= 1000) {
            this._eventsPerSecond = this._eventsThisSecond;
            this._mutationsPerSecond = this._mutationsThisSecond;
            this._eventsThisSecond = 0;
            this._mutationsThisSecond = 0;
        }
        this._lastSecondStart = now;
        this._lastFrameStart = now;
        this._frameCount++;
    }

    endFrame() {
        if (!this._enabled || !this._lastFrameStart) return;
        const now = performance.now();
        const duration = now - this._lastFrameStart;
        this._lastFrameStart = 0;
        this._frameTimes.push(duration);
        if (this._frameTimes.length > 120) {
            this._frameTimes.shift();
        }
    }

    report() {
        if (!this._enabled) return;

        const totalCache = this._cacheHits + this._cacheMisses;
        const hitRatio = totalCache > 0 ? ((this._cacheHits / totalCache) * 100).toFixed(1) + '%' : '0%';
        const missRatio = totalCache > 0 ? ((this._cacheMisses / totalCache) * 100).toFixed(1) + '%' : '0%';

        const avgFrameTime = this._frameTimes.length > 0
            ? (this._frameTimes.reduce((a, b) => a + b, 0) / this._frameTimes.length).toFixed(2) + 'ms'
            : '0ms';

        console.table([
            { metric: 'Frame Count', value: this._frameCount },
            { metric: 'DOM Queries', value: this._domQueries },
            { metric: 'getBoundingClientRect Calls', value: this._rectCalls },
            { metric: 'EventBridge Events/sec', value: this._eventsPerSecond },
            { metric: 'MutationObserver Records/sec', value: this._mutationsPerSecond },
            { metric: 'Cache Hits', value: this._cacheHits },
            { metric: 'Cache Misses', value: this._cacheMisses },
            { metric: 'Cache Hit Ratio', value: hitRatio },
            { metric: 'Cache Miss Ratio', value: missRatio },
            { metric: 'Average Frame Time', value: avgFrameTime }
        ]);
    }
}

export default new CanvasDiagnostics();
