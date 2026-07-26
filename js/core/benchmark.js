/**
 * Benchmark - Internal performance measurement suite.
 * - No feature changes
 * - Non-destructive to editor state where possible
 * - Results via console.table() and exportable JSON
 */
import CanvasAPI from '../canvas/canvas-api.js';
import CoordinateSystem from '../canvas/coordinate.js';
import RenderScheduler, { PRIORITY } from './render-scheduler.js';
import DirtyState, { DIRTY } from './dirty-state.js';
import ViewportCulling from './core/viewport-culling.js';

const SIZES = [100, 500, 1000, 3000, 5000];
const CATEGORIES = [
    'Startup',
    'Load Project',
    'Save Project',
    'Export HTML',
    'Export CSS',
    'Export ZIP',
    'Drag',
    'Resize',
    'Rotate',
    'Selection',
    'Undo',
    'Redo',
    'Property Update',
    'Layer Refresh',
    'Quality Scan'
];

/**
 * @typedef {Object} BenchmarkResult
 * @property {string} category
 * @property {number} size
 * @property {number} duration
 * @property {number} frameTime
 * @property {number} fps
 * @property {number} domOps
 * @property {number} memory
 * @property {number} renderCount
 */

export class Benchmark {
    constructor() {
        this._results = [];
        this._frameCount = 0;
        this._startTime = 0;
        this._domOps = 0;
        this._memoryBaseline = 0;
        this._renderCount = 0;
        this._rafId = null;
    }

    /**
     * Run a single benchmark case.
     * @param {string} category
     * @param {number} size
     * @param {Function} fn
     * @returns {BenchmarkResult}
     */
    async run(category, size, fn) {
        const memBefore = this._getMemory();
        RenderScheduler.clear();
        DirtyState.clearAll();
        this._domOps = 0;
        this._frameCount = 0;
        this._startTime = performance.now();

        // Measure frames during execution
        const framePromise = new Promise(resolve => {
            const countFrames = (time) => {
                this._frameCount++;
                if (this._startTime === 0 || performance.now() - this._startTime > 5000) {
                    resolve();
                } else {
                    this._rafId = requestAnimationFrame(countFrames);
                }
            };
            this._rafId = requestAnimationFrame(countFrames);
        });

        await fn();

        const duration = performance.now() - this._startTime;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        const result = {
            category,
            size,
            duration: Math.round(duration * 100) / 100,
            frameTime: duration > 0 ? Math.round((duration / Math.max(1, this._frameCount)) * 100) / 100 : 0,
            fps: duration > 0 ? Math.round((this._frameCount / duration) * 100) / 100 : 0,
            domOps: this._domOps,
            memory: Math.round((this._getMemory() - memBefore) / 1024),
            renderCount: this._frameCount
        };

        this._results.push(result);
        return result;
    }

    /**
     * Run the full benchmark suite.
     */
    async runSuite() {
        this._results = [];
        const editor = window.editor;

        try {
            for (const size of SIZES) {
                await this._generateElements(size);
                for (const category of CATEGORIES) {
                    await this.runBenchmark(category, size);
                }
            }
        } catch (err) {
            console.error('[Benchmark] Suite error:', err);
        }

        this._cleanup();
        this._report();
        return this._results;
    }

    /**
     * Run a single benchmark by name.
     * @param {string} category
     * @param {number} [size]
     */
    async runOne(category, size = 100) {
        await this._generateElements(size);
        const result = await this.runBenchmark(category, size);
        console.table([result]);
        return result;
    }

    /**
     * Export results as JSON.
     * @returns {string}
     */
    exportJSON() {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            results: this._results
        }, null, 2);
    }

    /**
     * Increment DOM operation counter.
     */
    trackDOMOp() {
        this._domOps++;
    }

    /**
     * Get current memory usage.
     * @returns {number}
     */
    _getMemory() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    /**
     * Generate temporary test elements.
     * @param {number} count
     */
    async _generateElements(count) {
        this._cleanup();
        const editor = window.editor;
        if (!editor) return;

        const frag = CanvasAPI.createElement('div');
        for (let i = 0; i < count; i++) {
            const el = CanvasAPI.createElement('div');
            el.setAttribute('data-editor-element', '');
            el.dataset.type = 'div';
            el.dataset.name = `Benchmark ${i + 1}`;
            el.style.left = (i % 10) * 120 + 'px';
            el.style.top = Math.floor(i / 10) * 120 + 'px';
            el.style.width = '100px';
            el.style.height = '100px';
            el.style.backgroundColor = '#cccccc';
            frag.appendChild(el);
        }
        CanvasAPI.append(frag);
        await new Promise(r => requestAnimationFrame(() => r()));
    }

    /**
     * Cleanup temp test elements.
     */
    _cleanup() {
        const editor = window.editor;
        if (editor) {
            const temp = CanvasAPI.queryAll('[data-benchmark-temp]');
            temp.forEach(el => CanvasAPI.remove(el));
        }
    }

    /**
     * Run one benchmark category.
     * @param {string} category
     * @param {number} size
     */
    async runBenchmark(category, size) {
        switch (category) {
            case 'Startup':
                return this._benchmarkStartup(size);
            case 'Load Project':
                return this._benchmarkLoadProject(size);
            case 'Save Project':
                return this._benchmarkSaveProject(size);
            case 'Export HTML':
                return this._benchmarkExportHTML(size);
            case 'Export CSS':
                return this._benchmarkExportCSS(size);
            case 'Export ZIP':
                return this._benchmarkExportZIP(size);
            case 'Drag':
                return this._benchmarkDrag(size);
            case 'Resize':
                return this._benchmarkResize(size);
            case 'Rotate':
                return this._benchmarkRotate(size);
            case 'Selection':
                return this._benchmarkSelection(size);
            case 'Undo':
                return this._benchmarkUndo(size);
            case 'Redo':
                return this._benchmarkRedo(size);
            case 'Property Update':
                return this._benchmarkPropertyUpdate(size);
            case 'Layer Refresh':
                return this._benchmarkLayerRefresh(size);
            case 'Quality Scan':
                return this._benchmarkQualityScan(size);
            default:
                return {
                    category,
                    size,
                    duration: 0,
                    frameTime: 0,
                    fps: 0,
                    domOps: 0,
                    memory: 0,
                    renderCount: 0
                };
        }
    }

    _benchmarkStartup(size) {
        return this.run('Startup', size, () => {
            // Simulate DOM work equivalent to panel render
            for (let i = 0; i < size; i++) {
                const el = CanvasAPI.createElement('div');
                el.style.display = 'none';
                CanvasAPI.append(el);
                this.trackDOMOp();
            }
        });
    }

    _benchmarkLoadProject(size) {
        return this.run('Load Project', size, () => {
            const json = JSON.stringify({ elements: new Array(size).fill({ tag: 'div', style: {} }) });
            for (let i = 0; i < Math.max(1, Math.floor(size / 100)); i++) {
                JSON.parse(json);
                this.trackDOMOp();
            }
        });
    }

    _benchmarkSaveProject(size) {
        return this.run('Save Project', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            for (let i = 0; i < Math.min(size, els.length); i++) {
                const html = els[i].outerHTML;
                this.trackDOMOp();
            }
        });
    }

    _benchmarkExportHTML(size) {
        return this.run('Export HTML', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            for (let i = 0; i < Math.min(size, els.length); i++) {
                const html = els[i].outerHTML;
                this.trackDOMOp();
            }
        });
    }

    _benchmarkExportCSS(size) {
        return this.run('Export CSS', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            for (let i = 0; i < Math.min(size, els.length); i++) {
                const css = els[i].style.cssText;
                this.trackDOMOp();
            }
        });
    }

    _benchmarkExportZIP(size) {
        return this.run('Export ZIP', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            for (let i = 0; i < Math.min(size, els.length); i++) {
                const blob = new Blob([els[i].outerHTML]);
                this.trackDOMOp();
            }
        });
    }

    _benchmarkDrag(size) {
        return this.run('Drag', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            if (els.length === 0) return;
            const el = els[0];
            const startLeft = parseFloat(el.style.left) || 0;
            const startTop = parseFloat(el.style.top) || 0;
            el.style.left = (startLeft + 10) + 'px';
            el.style.top = (startTop + 10) + 'px';
            this.trackDOMOp();
            RenderScheduler.flush();
            el.style.left = startLeft + 'px';
            el.style.top = startTop + 'px';
            this.trackDOMOp();
            RenderScheduler.flush();
        });
    }

    _benchmarkResize(size) {
        return this.run('Resize', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            if (els.length === 0) return;
            const el = els[0];
            const orig = el.style.width;
            el.style.width = (parseFloat(orig) || 100) + 10 + 'px';
            this.trackDOMOp();
            RenderScheduler.flush();
            el.style.width = orig;
            this.trackDOMOp();
            RenderScheduler.flush();
        });
    }

    _benchmarkRotate(size) {
        return this.run('Rotate', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            if (els.length === 0) return;
            const el = els[0];
            const orig = el.style.transform;
            el.style.transform = 'rotate(5deg)';
            this.trackDOMOp();
            RenderScheduler.flush();
            el.style.transform = orig;
            this.trackDOMOp();
            RenderScheduler.flush();
        });
    }

    _benchmarkSelection(size) {
        return this.run('Selection', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            for (let i = 0; i < Math.min(size, els.length); i++) {
                this.trackDOMOp();
            }
            RenderScheduler.flush();
        });
    }

    _benchmarkUndo(size) {
        return this.run('Undo', size, () => {
            const h = window.editor?.history;
            if (!h) return;
            for (let i = 0; i < Math.min(size, 10); i++) {
                h.undo();
                this.trackDOMOp();
            }
        });
    }

    _benchmarkRedo(size) {
        return this.run('Redo', size, () => {
            const h = window.editor?.history;
            if (!h) return;
            for (let i = 0; i < Math.min(size, 10); i++) {
                h.redo();
                this.trackDOMOp();
            }
        });
    }

    _benchmarkPropertyUpdate(size) {
        return this.run('Property Update', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            if (els.length === 0) return;
            const el = els[0];
            const before = el.style.backgroundColor;
            el.style.backgroundColor = '#ff0000';
            this.trackDOMOp();
            RenderScheduler.flush();
            el.style.backgroundColor = before;
            this.trackDOMOp();
            RenderScheduler.flush();
        });
    }

    _benchmarkLayerRefresh(size) {
        return this.run('Layer Refresh', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            const half = Math.min(Math.floor(size / 2), els.length);
            for (let i = 0; i < half; i++) {
                this.trackDOMOp();
            }
            RenderScheduler.flush();
        });
    }

    _benchmarkQualityScan(size) {
        return this.run('Quality Scan', size, () => {
            const els = CanvasAPI.queryAll('[data-editor-element]');
            const count = Math.min(size, els.length);
            for (let i = 0; i < count; i++) {
                const el = els[i];
                if (!el.id) this.trackDOMOp();
                if (el.textContent.trim().length === 0) this.trackDOMOp();
                if (el.tagName === 'IMG' && !el.hasAttribute('alt')) this.trackDOMOp();
            }
        });
    }

    /**
     * Output benchmark report.
     */
    _report() {
        if (this._results.length === 0) {
            console.log('[Benchmark] No results to report.');
            return;
        }

        console.log('\n[Benchmark] Report');
        console.table(this._results);

        const slowest = [...this._results].sort((a, b) => b.duration - a.duration).slice(0, 5);
        console.log('[Benchmark] Slowest subsystems:');
        slowest.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.category} (${r.size} elems): ${r.duration}ms`);
        });

        console.log('\n[Benchmark] Export: copy window.__benchmarkExportJSON = JSON.stringify(benchmark.exportJSON()) or call benchmark.exportJSON()');
    }
}

export default new Benchmark();
