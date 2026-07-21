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
        this.snapThreshold = 5;

        // Rubber-band state
        this.rbStartX = 0;
        this.rbStartY = 0;

        this._bindEvents();
    }

    /** Bind events */
    _bindEvents() {
        const wrapper = this.editor.canvasWrapper;

        wrapper.addEventListener('mousedown', (e) => {
            this._handleMouseDown(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                e.preventDefault();
                this._handleDragMove(e);
            } else if (this.isRubberBanding) {
                e.preventDefault();
                this._handleRubberBandMove(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                this._handleDragUp(e);
            } else if (this.isRubberBanding) {
                this._handleRubberBandUp(e);
            }
        });

        // Di chuyển bằng arrow keys
        eventBus.on('element:move-by', ({ dx, dy }) => {
            this._moveByKey(dx, dy);
        });
    }

    /** Xử lý mousedown */
    _handleMouseDown(e) {
        // Move handle drag
        if (e.target.closest('.move-handle')) {
            const selected = this.editor.selection.getSelectedAll();
            if (selected.length > 0) {
                this._startDrag(e, selected);
            }
            return;
        }

        // Bỏ qua resize/rotate handle
        if (e.target.closest('.resize-handle') || e.target.closest('.rotation-handle')) {
            return;
        }

        const el = e.target.closest('[data-editor-element]');

        if (el && this.editor.selection.isSelected(el)) {
            // Element đang chọn được click -> bắt đầu drag tất cả selected
            this._startDrag(e, this.editor.selection.getSelectedAll());
            return;
        }

        if (!el && !e.shiftKey) {
            // Click vùng trống -> bắt đầu rubber-band
            this._startRubberBand(e);
        }
    }

    // ─── DRAG ─────────────────────────────────────────────────────────────────

    /** Bắt đầu drag */
    _startDrag(e, elements) {
        this.isDragging = true;
        this.dragElements = elements;
        this.startX = e.clientX;
        this.startY = e.clientY;

        // Lưu vị trí ban đầu của tất cả elements
        this.startPositions = elements.map(el => ({
            el,
            left: parseFloat(el.style.left) || 0,
            top: parseFloat(el.style.top) || 0
        }));

        document.body.style.cursor = 'grabbing';
        eventBus.emit('drag:start', elements);
    }

    /** Xử lý khi đang kéo */
    _handleDragMove(e) {
        if (this.dragElements.length === 0) return;

        const zoom = this.editor.zoom;
        let dx = (e.clientX - this.startX) / zoom;
        let dy = (e.clientY - this.startY) / zoom;

        // Giữ Shift -> chỉ kéo theo 1 trục
        if (e.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) dy = 0;
            else dx = 0;
        }

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

            this.dragElements[0].style.left = newLeft + 'px';
            this.dragElements[0].style.top = newTop + 'px';

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

                sp.el.style.left = newLeft + 'px';
                sp.el.style.top = newTop + 'px';
                eventBus.emit('element:transform', sp.el);
            });
        }

        if (this.dragElements.length === 1) {
            eventBus.emit('element:transform', this.dragElements[0]);
        }
    }

    /** Xử lý khi thả */
    _handleDragUp(e) {
        this._clearGuides();
        document.body.style.cursor = '';

        // Lưu history cho từng element đã di chuyển
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
        const canvasPoint = this.editor.getCanvasPoint(e);
        this.rbStartX = e.clientX;
        this.rbStartY = e.clientY;
        this._rbCanvasStartX = canvasPoint.x;
        this._rbCanvasStartY = canvasPoint.y;
    }

    /** Cập nhật rubber-band rect */
    _handleRubberBandMove(e) {
        const layerRect = this.editor.overlayLayer.getBoundingClientRect();
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

        const canvasPoint = this.editor.getCanvasPoint(e);
        const x1 = Math.min(this._rbCanvasStartX, canvasPoint.x);
        const y1 = Math.min(this._rbCanvasStartY, canvasPoint.y);
        const x2 = Math.max(this._rbCanvasStartX, canvasPoint.x);
        const y2 = Math.max(this._rbCanvasStartY, canvasPoint.y);

        // Bỏ qua nếu vùng chọn quá nhỏ (click thường)
        if (x2 - x1 < 5 && y2 - y1 < 5) return;

        // Tìm elements nằm trong vùng rubber-band
        const elements = this.editor.getElements().filter(el => {
            const rect = this.editor.getElementRect(el);
            return rect.x >= x1 && rect.y >= y1 &&
                   rect.x + rect.width <= x2 &&
                   rect.y + rect.height <= y2;
        });

        if (elements.length > 0) {
            this.editor.selection.setSelection(elements);
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

        const others = this.editor.getElements().filter(e => !this.editor.selection.isSelected(e));

        let snappedX = x;
        let snappedY = y;

        others.forEach(other => {
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
        });

        return { x: snappedX, y: snappedY, guides };
    }

    /** Hiển thị guide lines */
    _showGuides(guideData) {
        this._clearGuides();
        guideData.forEach(guide => {
            const line = document.createElement('div');
            line.className = `guide-line ${guide.type}`;
            if (guide.type === 'vertical') line.style.left = guide.pos + 'px';
            else line.style.top = guide.pos + 'px';
            this.editor.canvas.appendChild(line);
            this.guides.push(line);
        });
    }

    /** Xóa guide lines */
    _clearGuides() {
        this.guides.forEach(g => g.remove());
        this.guides = [];
    }

    // ─── KEYBOARD ─────────────────────────────────────────────────────────────

    /** Di chuyển bằng phím */
    _moveByKey(dx, dy) {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;

        elements.forEach(el => {
            const left = parseFloat(el.style.left) || 0;
            const top = parseFloat(el.style.top) || 0;
            const newLeft = left + dx;
            const newTop = top + dy;

            el.style.left = newLeft + 'px';
            el.style.top = newTop + 'px';

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
