/**
 * Resize - Quản lý resize phần tử
 * - 8 điểm resize (nw, n, ne, e, se, s, sw, w)
 * - Giữ Shift giữ nguyên tỷ lệ
 * - Hiển thị kích thước đang thay đổi
 */
import eventBus from './event-bus.js';

export class Resize {
    constructor(editor) {
        this.editor = editor;
        this.isResizing = false;
        this.resizeElement = null;
        this.handle = '';
        this.startX = 0;
        this.startY = 0;
        this.startRect = null;
        this.startState = null;

        this._bindEvents();
    }

    /** Bind events */
    _bindEvents() {
        const wrapper = this.editor.canvasWrapper;

        // Mousedown trên resize handle
        wrapper.addEventListener('mousedown', (e) => {
            const handle = e.target.closest('.resize-handle');
            if (handle) {
                e.preventDefault();
                e.stopPropagation();
                this._startResize(e, handle.dataset.handle);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isResizing) {
                e.preventDefault();
                this._handleMouseMove(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isResizing) {
                this._handleMouseUp(e);
            }
        });
    }

    /** Bắt đầu resize */
    _startResize(e, handle) {
        const el = this.editor.selection.getSelected();
        if (!el) return;

        this.isResizing = true;
        this.resizeElement = el;
        this.handle = handle;
        this.startX = e.clientX;
        this.startY = e.clientY;

        // Lưu trạng thái ban đầu
        this.startRect = {
            left: parseFloat(el.style.left) || 0,
            top: parseFloat(el.style.top) || 0,
            width: parseFloat(el.style.width) || el.offsetWidth,
            height: parseFloat(el.style.height) || el.offsetHeight
        };

        this.startState = { ...this.startRect };

        document.body.style.cursor = this._getCursor(handle);
        eventBus.emit('resize:start', el);
    }

    /** Xử lý mousemove khi resize */
    _handleMouseMove(e) {
        if (!this.resizeElement) return;

        const zoom = this.editor.zoom;
        const dx = (e.clientX - this.startX) / zoom;
        const dy = (e.clientY - this.startY) / zoom;

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
        const minSize = 20;
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

        // Cập nhật element
        this.resizeElement.style.left = left + 'px';
        this.resizeElement.style.top = top + 'px';
        this.resizeElement.style.width = width + 'px';
        this.resizeElement.style.height = height + 'px';

        // Emit transform event
        eventBus.emit('element:transform', this.resizeElement);
    }

    /** Xử lý mouseup */
    _handleMouseUp(e) {
        if (!this.resizeElement) return;

        document.body.style.cursor = '';

        // Lưu history
        const endRect = {
            left: parseFloat(this.resizeElement.style.left) || 0,
            top: parseFloat(this.resizeElement.style.top) || 0,
            width: parseFloat(this.resizeElement.style.width) || this.resizeElement.offsetWidth,
            height: parseFloat(this.resizeElement.style.height) || this.resizeElement.offsetHeight
        };

        const changed = Object.keys(endRect).some(key => endRect[key] !== this.startState[key]);
        if (changed) {
            eventBus.emit('history:push', {
                type: 'resize',
                element: this.resizeElement,
                before: this.startState,
                after: endRect
            });
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
