/**
 * Rotate - Xử lý xoay phần tử
 * - Nút xoay phía trên element
 * - Hiển thị góc xoay
 */
import eventBus from './event-bus.js';
import { ROTATE_SNAP_ANGLE } from './config.js';

export class Rotate {
    constructor(editor) {
        this.editor = editor;
        this.isRotating = false;
        this.rotateElement = null;
        this.centerX = 0;
        this.centerY = 0;
        this.startAngle = 0;
        this.currentRotation = 0;

        this._bindEvents();
    }

    /** Bind events */
    _bindEvents() {
        const wrapper = this.editor.canvasWrapper;

        wrapper.addEventListener('mousedown', (e) => {
            if (e.target.closest('.rotation-handle')) {
                e.preventDefault();
                e.stopPropagation();
                this._startRotate(e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isRotating) {
                e.preventDefault();
                this._handleMouseMove(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isRotating) {
                this._handleMouseUp(e);
            }
        });
    }

    /** Bắt đầu xoay */
    _startRotate(e) {
        if (this.editor.isPanning) return;
        const el = this.editor.selection.getSelected();
        if (!el) return;

        this.isRotating = true;
        this.rotateElement = el;

        // Lấy tâm element
        const rect = el.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;

        // Lấy góc xoay hiện tại
        this.currentRotation = this._getRotation(el);
        this.startAngle = Math.atan2(
            e.clientY - this.centerY,
            e.clientX - this.centerX
        ) * (180 / Math.PI);

        this.beforeTransform = el.style.transform || '';

        document.body.style.cursor = 'grabbing';
        eventBus.emit('rotate:start', el);
    }

    /** Xử lý mousemove khi xoay */
    _handleMouseMove(e) {
        if (!this.rotateElement) return;

        const angle = Math.atan2(
            e.clientY - this.centerY,
            e.clientX - this.centerX
        ) * (180 / Math.PI);

        let rotation = this.currentRotation + (angle - this.startAngle);

        // Snap 15 độ khi giữ Shift
        if (e.shiftKey) {
            rotation = Math.round(rotation / ROTATE_SNAP_ANGLE) * ROTATE_SNAP_ANGLE;
        }

        // Áp dụng rotation
        this.rotateElement.style.transform = `rotate(${rotation}deg)`;

        // Emit transform để cập nhật overlay
        eventBus.emit('element:transform', this.rotateElement);
    }

    /** Xử lý mouseup */
    _handleMouseUp(e) {
        if (!this.rotateElement) return;

        document.body.style.cursor = '';

        const afterTransform = this.rotateElement.style.transform;

        if (afterTransform !== this.beforeTransform) {
            eventBus.emit('history:push', {
                type: 'rotate',
                element: this.rotateElement,
                before: this.beforeTransform,
                after: afterTransform
            });
        }

        eventBus.emit('element:updated', this.rotateElement);
        eventBus.emit('rotate:end', this.rotateElement);

        this.isRotating = false;
        this.rotateElement = null;
    }

    /** Lấy góc xoay hiện tại từ transform */
    _getRotation(el) {
        const transform = el.style.transform || '';
        const match = transform.match(/rotate\(([-\d.]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
    }
}
