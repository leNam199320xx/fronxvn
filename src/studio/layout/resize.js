/**
 * Resize - Quản lý resize phần tử
 * - 8 điểm resize (nw, n, ne, e, se, s, sw, w)
 * - Giữ Shift giữ nguyên tỷ lệ
 * - Hiển thị kích thước đang thay đổi
 */
import eventBus from '../../core/events/event-bus.js';
import { ELEMENT_MIN_SIZE } from '../../core/utilities/config.js';
import RenderScheduler, { PRIORITY } from '../../core/render/render-scheduler.js';
import CoordinateSystem from '../../core/canvas/coordinate.js';
import DirtyState, { DIRTY } from '../../core/dirty-state.js';
import CanvasAPI from '../../core/canvas/canvas-api.js';

export class Resize {
    constructor(editor) {
        this.editor = editor;
        this.isResizing = false;
        this.resizeElement = null;
        this.handle = '';
        this._rafId = null;
        this.startX = 0;
        this.startY = 0;
        this.startRect = null;
        this.startState = null;

        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    /** Bind events */
    _bindEvents() {
        // Mousedown trên resize handle
        eventBus.on('pointer:mousedown', (data) => {
            if (data.button === 1) return;
            const handle = CanvasAPI.closest(data.target, '.resize-handle');
            if (handle) {
                this._startResize(data, handle.dataset.handle);
            }
        });

        eventBus.on('pointer:mousemove', (data) => {
            if (this.isResizing) {
                this._handleMouseMove(data);
            }
        });

        eventBus.on('pointer:mouseup', (data) => {
            if (this.isResizing) {
                this._handleMouseUp(data);
            }
        });
    }

    /** Bắt đầu resize */
    _startResize(e, handle) {
        if (this.editor.isPanning) return;
        const el = this.editor.selection.getSelected();
        if (!el) return;

        this.isResizing = true;
        this.resizeElement = el;
        this.handle = handle;

        const start = CoordinateSystem.mousePosition(e);
        this.startX = start.x;
        this.startY = start.y;

        // Lưu trạng thái ban đầu
        this.startRect = {
            left: parseFloat(CanvasAPI.getStyle(el, 'left')) || 0,
            top: parseFloat(CanvasAPI.getStyle(el, 'top')) || 0,
            width: parseFloat(CanvasAPI.getStyle(el, 'width')) || el.offsetWidth,
            height: parseFloat(CanvasAPI.getStyle(el, 'height')) || el.offsetHeight
        };

        this.startState = { ...this.startRect };

        document.body.style.cursor = this._getCursor(handle);
        DirtyState.mark(DIRTY.OVERLAY);
        eventBus.emit('resize:start', el);
    }

    /** Xử lý mousemove khi resize */
    _handleMouseMove(e) {
        if (!this.resizeElement) return;

        const current = CoordinateSystem.mousePosition(e);
        const dx = current.x - this.startX;
        const dy = current.y - this.startY;

        let { left, top, width, height } = this.startRect;
        const aspectRatio = this.startRect.width / this.startRect.height;

        // Tính toán kích thước mới dựa trên handle
        switch (this.handle) {
            case 'n':
                top += dy;
                height -= dy;
                break;
            case 's':
                height += dy;
                break;
            case 'e':
                width += dx;
                break;
            case 'w':
                left += dx;
                width -= dx;
                break;
            case 'nw':
                left += dx;
                top += dy;
                width -= dx;
                height -= dy;
                break;
            case 'ne':
                top += dy;
                width += dx;
                height -= dy;
                break;
            case 'se':
                width += dx;
                height += dy;
                break;
            case 'sw':
                left += dx;
                width -= dx;
                height += dy;
                break;
        }

        // Giữ Shift -> giữ tỷ lệ
        if (e.shiftKey) {
            const isCorner = ['nw', 'ne', 'se', 'sw'].includes(this.handle);
            if (isCorner) {
                // Tính theo chiều lớn hơn
                if (Math.abs(dx) > Math.abs(dy)) {
                    height = width / aspectRatio;
                } else {
                    width = height * aspectRatio;
                }
                // Điều chỉnh left/top cho handle nw, ne, sw
                if (this.handle === 'nw') {
                    left = this.startRect.left + this.startRect.width - width;
                    top = this.startRect.top + this.startRect.height - height;
                } else if (this.handle === 'ne') {
                    top = this.startRect.top + this.startRect.height - height;
                } else if (this.handle === 'sw') {
                    left = this.startRect.left + this.startRect.width - width;
                }
            }
        }

        // Đảm bảo kích thước tối thiểu
        const minSize = ELEMENT_MIN_SIZE;
        if (width < minSize) {
            if (['w', 'nw', 'sw'].includes(this.handle)) {
                left = left + width - minSize;
            }
            width = minSize;
        }
        if (height < minSize) {
            if (['n', 'nw', 'ne'].includes(this.handle)) {
                top = top + height - minSize;
            }
            height = minSize;
        }

        // Snap to grid
        if (this.editor.gridEnabled) {
            width = this.editor.snapToGrid(width);
            height = this.editor.snapToGrid(height);
            left = this.editor.snapToGrid(left);
            top = this.editor.snapToGrid(top);
        }

        // Batch DOM writes via rAF
        RenderScheduler.schedule('resize-visual', () => {
            CanvasAPI.setStyle(this.resizeElement, 'left', left + 'px');
            CanvasAPI.setStyle(this.resizeElement, 'top', top + 'px');
            CanvasAPI.setStyle(this.resizeElement, 'width', width + 'px');
            CanvasAPI.setStyle(this.resizeElement, 'height', height + 'px');

            eventBus.emit('element:transform', this.resizeElement);
        }, PRIORITY.HIGH);
    }

    /** Xử lý mouseup */
    _handleMouseUp(e) {
        if (!this.resizeElement) return;

        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        document.body.style.cursor = '';

        // Lưu history
        const endRect = {
            left: parseFloat(CanvasAPI.getStyle(this.resizeElement, 'left')) || 0,
            top: parseFloat(CanvasAPI.getStyle(this.resizeElement, 'top')) || 0,
            width: parseFloat(CanvasAPI.getStyle(this.resizeElement, 'width')) || this.resizeElement.offsetWidth,
            height: parseFloat(CanvasAPI.getStyle(this.resizeElement, 'height')) || this.resizeElement.offsetHeight
        };

        const changed = Object.keys(endRect).some(key => endRect[key] !== this.startState[key]);
        if (changed) {
            eventBus.emit('history:push', {
                type: 'resize',
                element: this.resizeElement,
                before: this.startState,
                after: endRect
            });

            // Sync vào breakpoint store
            const bpMgr = this.editor.breakpointManager;
            bpMgr.setStyle(this.resizeElement, 'left',   endRect.left   + 'px');
            bpMgr.setStyle(this.resizeElement, 'top',    endRect.top    + 'px');
            bpMgr.setStyle(this.resizeElement, 'width',  endRect.width  + 'px');
            bpMgr.setStyle(this.resizeElement, 'height', endRect.height + 'px');
        }

        eventBus.emit('element:updated', this.resizeElement);
        eventBus.emit('resize:end', this.resizeElement);

        this.isResizing = false;
        this.resizeElement = null;
    }

    /** Lấy cursor cho handle */
    _getCursor(handle) {
        const cursors = {
            nw: 'nw-resize',
            n: 'n-resize',
            ne: 'ne-resize',
            e: 'e-resize',
            se: 'se-resize',
            s: 's-resize',
            sw: 'sw-resize',
            w: 'w-resize'
        };
        return cursors[handle] || 'default';
    }
}


