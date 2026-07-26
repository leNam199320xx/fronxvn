import eventBus from '../event-bus.js';
import { runScan } from './scanner.js';
import { buildReport } from './reporter.js';
import { QUALITY_SCAN_DELAY } from '../config.js';

/**
 * @typedef {Object} Issue
 * @property {string} id
 * @property {'error'|'warning'|'info'} severity
 * @property {HTMLElement|null} element
 * @property {string} message
 * @property {string} suggestion
 * @property {Function|null} autofix
 */

import debug from '../debug.js';

export class QualityEngine {
    constructor(editor) {
        this.editor = editor;

        /** @type {Issue[]} */
        this.issues = [];

        /** @type {number} 0–100 */
        this.score = 100;

        this._scanTimer = null;
        this._scanDelay = QUALITY_SCAN_DELAY;

        this._bindEvents();
    }

    /** Chạy scan ngay lập tức (không debounce). */
    scanNow() {
        this._runScan();
    }

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    _bindEvents() {
        const schedule = () => this._scheduleScan();

        eventBus.on('element:added',   schedule);
        eventBus.on('element:deleted', schedule);
        eventBus.on('element:updated', schedule);
        eventBus.on('layer:refresh',   schedule);
        eventBus.on('page:switched',   schedule);
    }

    _scheduleScan() {
        debug.action('quality', 'scheduleScan', { delay: this._scanDelay });
        clearTimeout(this._scanTimer);
        this._scanTimer = setTimeout(() => this._runScan(), this._scanDelay);
    }

    // ─────────────────────────────────────────────
    //  Core scan
    // ─────────────────────────────────────────────

    _runScan() {
        debug.action('quality', 'runScan');
        const issues = runScan(this.editor, eventBus);
        const report = buildReport(issues);

        this.issues = report.issues;
        this.score  = report.score;

        eventBus.emit('quality:updated', { issues: this.issues, score: this.score });
    }
}
