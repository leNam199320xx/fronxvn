/**
 * Overlay - Layer hiển thị border, resize handles, move handle,
 * rotation handle, kích thước, tọa độ cho element đang chọn.
 * Hỗ trợ multi-selection: hiển thị bounding box chung.
 */
import eventBus from './event-bus.js';

export class Overlay {
    constructor(editor) {
        this.editor = editor;
        this.layer = editor.overlayLayer;
        this.selectedElements = [];

        this._createOverlayElements();
        this._bindEvents();
    }

    /** Tạo các DOM element cho overlay */
    _createOverlayElements() {
        // Selection border
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'overlay-selection';
        this.selectionBox.style.display = 'none';
        this.layer.appendChild(this.selectionBox);

        // Hover border
        this.hoverBox = document.createElement('div');
        this.hoverBox.className = 'overlay-hover';
        this.hoverBox.style.display = 'none';
        this.layer.appendChild(this.hoverBox);

        // 8 Resize handles (chỉ hiện khi chọn 1 element)
        this.handles = {};
        const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.handle = pos;
            handle.style.display = 'none';
            this.selectionBox.appendChild(handle);
            this.handles[pos] = handle;
        });

        // Move handle
        this.moveHandle = document.createElement('div');
        this.moveHandle.className = 'move-handle';
        this.moveHandle.style.display = 'none';
        this.selectionBox.appendChild(this.moveHandle);

        // Rotation handle và line (chỉ hiện khi chọn 1 element)
        this.rotationLine = document.createElement('div');
        this.rotationLine.className = 'rotation-line';
        this.rotationLine.style.display = 'none';
        this.selectionBox.appendChild(this.rotationLine);

        this.rotationHandle = document.createElement('div');
        this.rotationHandle.className = 'rotation-handle';
        this.rotationHandle.style.display = 'none';
        this.selectionBox.appendChild(this.rotationHandle);

        // Dimension label
        this.dimensionLabel = document.createElement('div');
        this.dimensionLabel.className = 'overlay-dimension';
        this.dimensionLabel.style.display = 'none';
        this.selectionBox.appendChild(this.dimensionLabel);

        // Position label
        this.positionLabel = document.createElement('div');
        this.positionLabel.className = 'overlay-position';
        this.positionLabel.style.display = 'none';
        this.selectionBox.appendChild(this.positionLabel);

        // Multi-selection count badge
        this.multiBadge = document.createElement('div');
        this.multiBadge.className = 'overlay-multi-badge';
        this.multiBadge.style.display = 'none';
        this.selectionBox.appendChild(this.multiBadge);

        // Rubber-band rect
        this.rubberBand = document.createElement('div');
        this.rubberBand.className = 'overlay-rubber-band';
        this.rubberBand.style.display = 'none';
        this.layer.appendChild(this.rubberBand);
    }

    /** Bind events */
    _bindEvents() {
        // Selection thay đổi
        eventBus.on('selection:changed', (elements) => {
            this.selectedElements = elements || [];
            if (this.selectedElements.length === 0) {
                this._hideOverlay();
            } else {
                this._showOverlay();
            }
        });

        // Backward compat
        eventBus.on('element:selected', (el) => {
            if (!this.selectedElements.includes(el)) {
                this.selectedElements = [el];
                this._showOverlay();
            }
        });

        eventBus.on('element:deselected', () => {
            this.selectedElements = [];
            this._hideOverlay();
        });

        // Hover
        eventBus.on('element:hovered', (el) => {
            this._showHover(el);
        });

        // Element cập nhật
        eventBus.on('element:updated', (el) => {
            if (this.selectedElements.includes(el)) {
                this._updateOverlay();
            }
        });

        eventBus.on('element:transform', (el) => {
            if (this.selectedElements.includes(el)) {
                this._updateOverlay();
            }
        });

        // Scroll / Zoom / Resize -> cập nhật overlay
        eventBus.on('canvas:scroll', () => this._refreshOverlay());
        eventBus.on('canvas:zoom', () => this._refreshOverlay());
        eventBus.on('canvas:resize', () => this._refreshOverlay());

        // Rubber-band events từ drag.js
        eventBus.on('rubber-band:update', (rect) => this._updateRubberBand(rect));
        eventBus.on('rubber-band:end', () => this._hideRubberBand());
    }

    /** Hiển thị overlay */
    _showOverlay() {
        this.selectionBox.style.display = 'block';
        const isSingle = this.selectedElements.length === 1;
        this._setHandlesVisible(isSingle);
        this.multiBadge.style.display = isSingle ? 'none' : 'block';
        this._updateOverlay();
    }

    /** Ẩn overlay */
    _hideOverlay() {
        this.selectionBox.style.display = 'none';
        this._setHandlesVisible(false);
        this.multiBadge.style.display = 'none';
    }

    /** Hiển thị hover box */
    _showHover(el) {
        if (!el || this.selectedElements.includes(el)) {
            this.hoverBox.style.display = 'none';
            return;
        }
        const rect = this._getElementScreenRect(el);
        this.hoverBox.style.display = 'block';
        this.hoverBox.style.left = rect.left + 'px';
        this.hoverBox.style.top = rect.top + 'px';
        this.hoverBox.style.width = rect.width + 'px';
        this.hoverBox.style.height = rect.height + 'px';
    }

    /** Toggle handles visibility */
    _setHandlesVisible(visible) {
        Object.values(this.handles).forEach(h => h.style.display = visible ? 'block' : 'none');
        this.moveHandle.style.display = visible ? 'flex' : 'none';
        this.rotationHandle.style.display = visible ? 'block' : 'none';
        this.rotationLine.style.display = visible ? 'block' : 'none';
        this.dimensionLabel.style.display = visible ? 'block' : 'none';
        this.positionLabel.style.display = visible ? 'block' : 'none';

        // Multi-select vẫn cần move handle
        if (!visible && this.selectedElements.length > 1) {
            this.moveHandle.style.display = 'flex';
        }
    }

    /** Cập nhật vị trí overlay — tính bounding box chung */
    _updateOverlay() {
        if (this.selectedElements.length === 0) return;

        if (this.selectedElements.length === 1) {
            this._updateSingleOverlay(this.selectedElements[0]);
        } else {
            this._updateMultiOverlay();
        }
    }

    /** Overlay cho 1 element */
    _updateSingleOverlay(el) {
        const rect = this._getElementScreenRect(el);

        this.selectionBox.style.left = rect.left + 'px';
        this.selectionBox.style.top = rect.top + 'px';
        this.selectionBox.style.width = rect.width + 'px';
        this.selectionBox.style.height = rect.height + 'px';

        const w = Math.round(parseFloat(el.style.width) || el.offsetWidth);
        const h = Math.round(parseFloat(el.style.height) || el.offsetHeight);
        this.dimensionLabel.textContent = `${w} × ${h}`;

        const x = Math.round(parseFloat(el.style.left) || 0);
        const y = Math.round(parseFloat(el.style.top) || 0);
        this.positionLabel.textContent = `${x}, ${y}`;
    }

    /** Overlay bounding box cho nhiều element */
    _updateMultiOverlay() {
        let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
        const layerRect = this.layer.getBoundingClientRect();

        this.selectedElements.forEach(el => {
            const elRect = el.getBoundingClientRect();
            const left = elRect.left - layerRect.left;
            const top = elRect.top - layerRect.top;
            minLeft = Math.min(minLeft, left);
            minTop = Math.min(minTop, top);
            maxRight = Math.max(maxRight, left + elRect.width);
            maxBottom = Math.max(maxBottom, top + elRect.height);
        });

        this.selectionBox.style.left = minLeft + 'px';
        this.selectionBox.style.top = minTop + 'px';
        this.selectionBox.style.width = (maxRight - minLeft) + 'px';
        this.selectionBox.style.height = (maxBottom - minTop) + 'px';

        this.multiBadge.textContent = `${this.selectedElements.length} selected`;
    }

    /** Refresh overlay (khi scroll/zoom/resize) */
    _refreshOverlay() {
        if (this.selectedElements.length > 0) {
            this._updateOverlay();
        }
        this.hoverBox.style.display = 'none';
    }

    /** Cập nhật rubber-band rect */
    _updateRubberBand(rect) {
        this.rubberBand.style.display = 'block';
        this.rubberBand.style.left = rect.left + 'px';
        this.rubberBand.style.top = rect.top + 'px';
        this.rubberBand.style.width = rect.width + 'px';
        this.rubberBand.style.height = rect.height + 'px';
    }

    /** Ẩn rubber-band */
    _hideRubberBand() {
        this.rubberBand.style.display = 'none';
    }

    /**
     * Lấy vị trí element trên screen (relative to overlay layer)
     */
    _getElementScreenRect(el) {
        const elRect = el.getBoundingClientRect();
        const layerRect = this.layer.getBoundingClientRect();
        return {
            left: elRect.left - layerRect.left,
            top: elRect.top - layerRect.top,
            width: elRect.width,
            height: elRect.height
        };
    }
}
