/**
 * Drag - Quản lý kéo thả phần tử trên canvas
 * - Drag phần tử (đơn hoặc multi-select)
 * - Rubber-band selection (kéo vùng chọn trên canvas trống)
 * - Snap theo Grid
 * - Snap theo Element khác (chỉ khi chọn 1 element)
 * - Giữ Shift để chỉ kéo ngang hoặc dọc
 * - Hiển thị Guide Line khi căn chỉnh
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
import { SNAP_THRESHOLD, DRAG_MIN_DISTANCE } from './config.js';
import { generateElementId } from './core/ids.js';
import { cloneDeep } from './core/clone.js';
import RenderScheduler, { PRIORITY } from '../core/render-scheduler.js';
import CoordinateSystem from './canvas/coordinate.js';
import DirtyState, { DIRTY } from '../core/dirty-state.js';
import ViewportCulling from '../core/viewport-culling.js';

export class Drag {
    constructor(editor) {
        this.editor = editor;
        this.isDragging = false;
        this.isRubberBanding = false;
        this.dragElements = [];   // Mảng elements đang drag
        this.startX = 0;
        this.startY = 0;
        this.startPositions = []; // [{el, left, top}]
        this.guides = [];
        this.snapThreshold = SNAP_THRESHOLD;
        this._rafId = null;
        this._snapVersion = 0;
        this._snapOthers = [];
        this._rbLayerRect = null;

        // Rubber-band state
        this.rbStartX = 0;
        this.rbStartY = 0;

        this._bindEvents();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('pointer:mousedown', (data) => {
            this._handleMouseDown(data);
        });

        eventBus.on('pointer:mousemove', (data) => {
            if (this.isDragging) {
                data.preventDefault = true;
                this._handleDragMove(data);
            } else if (this.isRubberBanding) {
                data.preventDefault = true;
                this._handleRubberBandMove(data);
            }
        });

        eventBus.on('pointer:mouseup', (data) => {
            if (this.isDragging) {
                this._handleDragUp(data);
            } else if (this.isRubberBanding) {
                this._handleRubberBandUp(data);
            }
        });

        // Di chuyển bằng arrow keys
        eventBus.on('element:move-by', ({ dx, dy }) => {
            this._moveByKey(dx, dy);
        });

        eventBus.on('selection:changed', () => {
            this._snapVersion++;
            this._snapOthers = [];
        });
    }

    /** Xử lý mousedown */
    _handleMouseDown(e) {
        if (e.button === 1) return;

        // Move handle drag
        if (CanvasAPI.closest(e.target, '.move-handle')) {
            const selected = this.editor.selection.getSelectedAll();
            if (selected.length > 0) {
                this._startDrag(e, selected);
            }
            return;
        }

        // Bỏ qua resize/rotate handle
        if (CanvasAPI.closest(e.target, '.resize-handle') || CanvasAPI.closest(e.target, '.rotation-handle')) {
            return;
        }

        const target = e.target;
        const el = CanvasAPI.closest(target, '[data-editor-element]');

        if (el && this.editor.selection.isSelected(el)) {
            this._startDrag(e, this.editor.selection.getSelectedAll());
            return;
        }

        if (!el && !e.shiftKey) {
            this._startRubberBand(e);
        }
    }

    // ─── DRAG ─────────────────────────────────────────────────────────────────

    /** Bắt đầu drag */
    _startDrag(e, elements) {
        if (this.editor.isPanning) return;

        if (e.altKey) {
            elements = this._duplicateForDrag(elements);
        }

        this.isDragging = true;
        this.dragElements = elements;

        const start = CoordinateSystem.mousePosition(e);
        this.startX = start.x;
        this.startY = start.y;

        this.startPositions = elements.map(el => ({
            el,
            left: parseFloat(CanvasAPI.getStyle(el, 'left')) || 0,
            top: parseFloat(CanvasAPI.getStyle(el, 'top')) || 0
        }));

        document.body.style.cursor = 'grabbing';
        DirtyState.mark(DIRTY.OVERLAY);
        eventBus.emit('drag:start', elements);
    }

    /**
     * Nhân bản các elements để Alt+Drag.
     * Element gốc giữ nguyên, bản copy được drag.
     * @param {HTMLElement[]} elements
     * @returns {HTMLElement[]} mảng bản copy
     */
    _duplicateForDrag(elements) {
        const copies = elements.map(el => {
            const clone = CanvasAPI.clone(el, true);
            clone.id = generateElementId();
            if (el.__bpStyles) clone.__bpStyles = cloneDeep(el.__bpStyles);
            CanvasAPI.insertAfter(clone, el, el.parentNode);
            eventBus.emit('history:push', { type: 'add', element: clone, parent: el.parentNode });
            eventBus.emit('element:added', clone);
            return clone;
        });

        eventBus.emit('layer:refresh');

        // Select các bản copy
        if (copies.length === 1) {
            this.editor.selection.select(copies[0]);
        } else {
            this.editor.selection.setSelection(copies);
        }

        return copies;
    }

    /** Xử lý khi đang kéo */
    _handleDragMove(e) {
        if (this.dragElements.length === 0) return;

        const current = CoordinateSystem.mousePosition(e);
        let dx = current.x - this.startX;
        let dy = current.y - this.startY;

        // Giữ Shift -> chỉ kéo theo 1 trục
        if (e.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) dy = 0;
            else dx = 0;
        }

        RenderScheduler.schedule('drag-visual', () => this._applyDrag(dx, dy), PRIORITY.HIGH);
    }

    _applyDrag(dx, dy) {
        if (this.dragElements.length === 0) return;

        if (this.dragElements.length === 1) {
            // Single drag: snap + guides
            const sp = this.startPositions[0];
            let newLeft = sp.left + dx;
            let newTop = sp.top + dy;

            if (this.editor.gridEnabled) {
                newLeft = this.editor.snapToGrid(newLeft);
                newTop = this.editor.snapToGrid(newTop);
            }

            const snapResult = this._snapToElements(this.dragElements[0], newLeft, newTop);
            newLeft = snapResult.x;
            newTop = snapResult.y;

            CanvasAPI.setStyle(this.dragElements[0], 'left', newLeft + 'px');
            CanvasAPI.setStyle(this.dragElements[0], 'top', newTop + 'px');

            this._showGuides(snapResult.guides);
        } else {
            // Multi drag: di chuyển tất cả theo cùng delta
            this._clearGuides();
            this.startPositions.forEach(sp => {
                let newLeft = sp.left + dx;
                let newTop = sp.top + dy;

                if (this.editor.gridEnabled) {
                    newLeft = this.editor.snapToGrid(newLeft);
                    newTop = this.editor.snapToGrid(newTop);
                }

                CanvasAPI.setStyle(sp.el, 'left', newLeft + 'px');
                CanvasAPI.setStyle(sp.el, 'top', newTop + 'px');
                eventBus.emit('element:transform', sp.el);
            });
        }

        if (this.dragElements.length === 1) {
            eventBus.emit('element:transform', this.dragElements[0]);
        }
    }

    /** Xử lý khi thả */
    _handleDragUp(e) {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._clearGuides();
        document.body.style.cursor = '';

        this.startPositions.forEach(sp => {
            const endLeft = parseFloat(sp.el.style.left) || 0;
            const endTop = parseFloat(sp.el.style.top) || 0;

            if (endLeft !== sp.left || endTop !== sp.top) {
                eventBus.emit('history:push', {
                    type: 'move',
                    element: sp.el,
                    before: { left: sp.left, top: sp.top },
                    after: { left: endLeft, top: endTop }
                });

                const bpMgr = this.editor.breakpointManager;
                bpMgr.setStyle(sp.el, 'left', endLeft + 'px');
                bpMgr.setStyle(sp.el, 'top', endTop + 'px');
            }

            eventBus.emit('element:updated', sp.el);
        });

        eventBus.emit('drag:end', this.dragElements);

        this.isDragging = false;
        this.dragElements = [];
        this.startPositions = [];
    }

    // ─── RUBBER-BAND ──────────────────────────────────────────────────────────

    /** Bắt đầu rubber-band selection */
    _startRubberBand(e) {
        this.isRubberBanding = true;
        const canvasPoint = CoordinateSystem.mousePosition(e);
        this.rbStartX = e.clientX;
        this.rbStartY = e.clientY;
        this._rbCanvasStartX = canvasPoint.x;
        this._rbCanvasStartY = canvasPoint.y;
    }

    /** Cập nhật rubber-band rect */
    _handleRubberBandMove(e) {
        if (!this._rbLayerRect) {
            this._rbLayerRect = CanvasAPI.getElementRect(this.editor.overlayLayer);
        }
        const layerRect = this._rbLayerRect;
        const x = e.clientX - layerRect.left;
        const y = e.clientY - layerRect.top;
        const startX = this.rbStartX - layerRect.left;
        const startY = this.rbStartY - layerRect.top;

        eventBus.emit('rubber-band:update', {
            left: Math.min(x, startX),
            top: Math.min(y, startY),
            width: Math.abs(x - startX),
            height: Math.abs(y - startY)
        });
    }

    /** Kết thúc rubber-band: tính elements trong vùng */
    _handleRubberBandUp(e) {
        eventBus.emit('rubber-band:end');
        this.isRubberBanding = false;
        this._rbLayerRect = null;

        const canvasPoint = CoordinateSystem.mousePosition(e);
        const x1 = Math.min(this._rbCanvasStartX, canvasPoint.x);
        const y1 = Math.min(this._rbCanvasStartY, canvasPoint.y);
        const x2 = Math.max(this._rbCanvasStartX, canvasPoint.x);
        const y2 = Math.max(this._rbCanvasStartY, canvasPoint.y);

        if (x2 - x1 < DRAG_MIN_DISTANCE && y2 - y1 < DRAG_MIN_DISTANCE) return;

        const elements = this.editor.getElements();
        const rects = new Map();
        elements.forEach(el => {
            rects.set(el, this.editor.getElementRect(el));
        });
        const selected = this.editor.selection.getSelectedAll();
        const selectedSet = new Set(selected);

        const result = elements.filter(el => {
            if (selectedSet.has(el)) return false;
            const r = rects.get(el);
            return r.x >= x1 && r.y >= y1 &&
                   r.x + r.width <= x2 &&
                   r.y + r.height <= y2;
        });

        if (result.length > 0) {
            this.editor.selection.setSelection(result);
        }
    }

    // ─── SNAP & GUIDES ────────────────────────────────────────────────────────

    /** Snap tới các element khác */
    _snapToElements(el, x, y) {
        const guides = [];
        const w = parseFloat(el.style.width) || el.offsetWidth;
        const h = parseFloat(el.style.height) || el.offsetHeight;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const right = x + w;
        const bottom = y + h;

        if (!this._snapOthers || this._snapOthersVersion !== this._snapVersion) {
            this._snapOthers = this.editor.getElements().filter(e => !this.editor.selection.isSelected(e));
            this._snapOthersVersion = this._snapVersion;
        }
        const others = this._snapOthers;

        let snappedX = x;
        let snappedY = y;

        for (let i = 0; i < others.length; i++) {
            const other = others[i];
            const rect = this.editor.getElementRect(other);
            const ox = rect.x, oy = rect.y, ow = rect.width, oh = rect.height;
            const ocx = ox + ow / 2, ocy = oy + oh / 2;
            const oRight = ox + ow, oBottom = oy + oh;

            if (Math.abs(x - ox) < this.snapThreshold) { snappedX = ox; guides.push({ type: 'vertical', pos: ox }); }
            else if (Math.abs(x - oRight) < this.snapThreshold) { snappedX = oRight; guides.push({ type: 'vertical', pos: oRight }); }
            else if (Math.abs(cx - ocx) < this.snapThreshold) { snappedX = ocx - w / 2; guides.push({ type: 'vertical', pos: ocx }); }
            else if (Math.abs(right - ox) < this.snapThreshold) { snappedX = ox - w; guides.push({ type: 'vertical', pos: ox }); }
            else if (Math.abs(right - oRight) < this.snapThreshold) { snappedX = oRight - w; guides.push({ type: 'vertical', pos: oRight }); }

            if (Math.abs(y - oy) < this.snapThreshold) { snappedY = oy; guides.push({ type: 'horizontal', pos: oy }); }
            else if (Math.abs(y - oBottom) < this.snapThreshold) { snappedY = oBottom; guides.push({ type: 'horizontal', pos: oBottom }); }
            else if (Math.abs(cy - ocy) < this.snapThreshold) { snappedY = ocy - h / 2; guides.push({ type: 'horizontal', pos: ocy }); }
            else if (Math.abs(bottom - oy) < this.snapThreshold) { snappedY = oy - h; guides.push({ type: 'horizontal', pos: oy }); }
            else if (Math.abs(bottom - oBottom) < this.snapThreshold) { snappedY = oBottom - h; guides.push({ type: 'horizontal', pos: oBottom }); }
        }

        return { x: snappedX, y: snappedY, guides };
    }

    /** Hiển thị guide lines */
    _showGuides(guideData) {
        this._clearGuides();
        const vr = ViewportCulling.viewportRect();
        guideData.forEach(guide => {
            const pos = guide.pos;
            if (guide.type === 'vertical') {
                if (pos < vr.left || pos > vr.right) return;
            } else {
                if (pos < vr.top || pos > vr.bottom) return;
            }
            const line = CanvasAPI.create('div');
            CanvasAPI.setAttribute(line, 'class', `guide-line ${guide.type}`);
            if (guide.type === 'vertical') CanvasAPI.setStyle(line, 'left', pos + 'px');
            else CanvasAPI.setStyle(line, 'top', pos + 'px');
            CanvasAPI.append(line);
            this.guides.push(line);
        });
    }

    /** Xóa guide lines */
    _clearGuides() {
        this.guides.forEach(g => CanvasAPI.remove(g));
        this.guides = [];
    }

    // ─── KEYBOARD ─────────────────────────────────────────────────────────────

    /** Di chuyển bằng phím */
    _moveByKey(dx, dy) {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;

        elements.forEach(el => {
            const left = parseFloat(CanvasAPI.getStyle(el, 'left')) || 0;
            const top = parseFloat(CanvasAPI.getStyle(el, 'top')) || 0;
            const newLeft = left + dx;
            const newTop = top + dy;

            CanvasAPI.setStyle(el, 'left', newLeft + 'px');
            CanvasAPI.setStyle(el, 'top', newTop + 'px');

            eventBus.emit('history:push', {
                type: 'move',
                element: el,
                before: { left, top },
                after: { left: newLeft, top: newTop }
            });

            eventBus.emit('element:updated', el);
            eventBus.emit('element:transform', el);
        });
    }
}
