/**
 * CanvasMutationObserver - Giám sát thay đổi DOM bên trong iframe canvas.
 * - Dùng MutationObserver trên #canvas
 * - Batch theo rAF
 * - Phát hiện thêm/xóa/cập nhật element
 * - Đánh dấu DirtyState flags
 * - Phát Events để tương thích ngược
 * - Không phát history:push (modules vẫn quản lý history)
 * - Ngăn observer tự cập nhật đệ quy
 */
import eventBus from '../event-bus.js';
import DirtyState, { DIRTY } from '../core/dirty-state.js';
import CanvasDiagnostics from './canvas-diagnostics.js';

const RECENT_EMIT_WINDOW = 150;

export class CanvasMutationObserver {
    constructor(getRoot, matches, closest) {
        this._getRoot = getRoot;
        this._matches = matches;
        this._closest = closest;
        this._observer = null;
        this._queue = [];
        this._rafId = null;
        this._isFlushing = false;
        this._recentEmits = new WeakMap();
    }

    init() {
        const root = this._getRoot();
        if (!root || this._observer) return;

        this._observer = new MutationObserver((records) => {
            this._queue.push(...records);
            if (!this._isFlushing) {
                this._scheduleFlush();
            }
        });

        this._observer.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        eventBus.on('element:added',   (el) => this._recentEmits.set(el, Date.now()));
        eventBus.on('element:removed', (el) => this._recentEmits.set(el, Date.now()));
        eventBus.on('element:updated', (el) => this._recentEmits.set(el, Date.now()));
    }

    /** Disconnect the MutationObserver and clear pending work. */
    disconnect() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._queue = [];
        this._recentEmits = new WeakMap();
    }

    _scheduleFlush() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(() => this._flush());
    }

    _flush() {
        this._rafId = null;
        const records = this._queue;
        this._queue = [];
        if (records.length === 0) return;

        this._isFlushing = true;
        try {
            CanvasDiagnostics.trackMutationRecords(records.length);
            let hasRealChanges = false;
            const root = this._getRoot();
            const now = Date.now();

            const added = [];
            const removed = [];
            const updated = [];

            for (const record of records) {
                const target = record.target;
                const isCanvasRoot = target === root;

                if (record.type === 'childList') {
                    for (const node of record.addedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (this._matches(node, '[data-editor-element]')) {
                            added.push(node);
                        }
                    }
                    for (const node of record.removedNodes) {
                        if (node.nodeType !== 1) continue;
                        if (this._matches(node, '[data-editor-element]')) {
                            removed.push(node);
                        }
                    }
                } else if (record.type === 'attributes') {
                    if (isCanvasRoot) {
                        hasRealChanges = true;
                    } else {
                        const el = this._matches(target, '[data-editor-element]') ? target : this._closest(target, '[data-editor-element]');
                        if (el) updated.push(el);
                    }
                } else if (record.type === 'characterData') {
                    const el = target.parentElement && this._closest(target.parentElement, '[data-editor-element]');
                    if (el) updated.push(el);
                }
            }

            added.forEach(node => {
                if (!this._wasRecentlyEmitted(node, now)) {
                    eventBus.emit('element:added', node);
                    hasRealChanges = true;
                }
            });
            removed.forEach(node => {
                if (!this._wasRecentlyEmitted(node, now)) {
                    eventBus.emit('element:removed', node);
                    hasRealChanges = true;
                }
            });
            updated.forEach(el => {
                if (!this._wasRecentlyEmitted(el, now)) {
                    eventBus.emit('element:updated', el);
                    hasRealChanges = true;
                }
            });

            if (hasRealChanges) {
                eventBus.emit('canvas:changed');
                DirtyState.mark(DIRTY.CANVAS);
                DirtyState.mark(DIRTY.LAYER);
            }
        } finally {
            this._isFlushing = false;
        }

        if (this._queue.length > 0) {
            this._scheduleFlush();
        }
    }

    _wasRecentlyEmitted(el, now) {
        const t = this._recentEmits.get(el);
        return t && (now - t < RECENT_EMIT_WINDOW);
    }
}

export default new CanvasMutationObserver();
