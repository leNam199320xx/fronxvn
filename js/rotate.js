/**
 * Rotate - Xử lý xoay phần tử
 * - Nút xoay phía trên element
 * - Hiển thị góc xoay
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
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

    init() {}

    refresh() {}

    destroy() {}

    /** Bind events */
    _bindEvents() {
        eventBus.on('pointer:mousedown', (data) => {
            if (data.button === 1) return;
            if (CanvasAPI.closest(data.target, '.rotation-handle')) {
                this._startRotate(data);
            }
        });

        eventBus.on('pointer:mousemove', (data) => {
            if (this.isRotating) {
                this._handleMouseMove(data);
            }
        });

        eventBus.on('pointer:mouseup', (data) => {
            if (this.isRotating) {
                this._handleMouseUp(data);
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
        const rect = CanvasAPI.getElementRect(el);
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;

        // Lấy góc xoay hiện tại
        this.currentRotation = this._getRotation(el);
        this.startAngle = Math.atan2(
            e.clientY - this.centerY,
            e.clientX - this.centerX
        ) * (180 / Math.PI);

        this.beforeTransform = CanvasAPI.getStyle(el, 'transform') || '';

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
        CanvasAPI.setStyle(this.rotateElement, 'transform', `rotate(${rotation}deg)`);

        // Emit transform để cập nhật overlay
        eventBus.emit('element:transform', this.rotateElement);
    }

    /** Xử lý mouseup */
    _handleMouseUp(e) {
        if (!this.rotateElement) return;

        document.body.style.cursor = '';

        const afterTransform = CanvasAPI.getStyle(this.rotateElement, 'transform');

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
        const transform = CanvasAPI.getStyle(el, 'transform') || '';
        const match = transform.match(/rotate\(([-\d.]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
    }
}
