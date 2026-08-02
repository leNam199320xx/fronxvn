import CanvasAPI from '../canvas/canvas-api.js';
import ViewportCulling from '../viewport/viewport-culling.js';
import { OVERLAY_HIDE_LABEL_DELAY } from '../utilities/config.js';
import { QualityBadges } from './quality-badges.js';

export class OverlayRenderer {
    constructor(overlay) {
        this.overlay = overlay;
        this.qualityBadges = new QualityBadges(overlay);
    }

    /** Hiển thị overlay */
    _showOverlay() {
        const overlay = this.overlay;
        overlay.selectionBox.style.display = 'block';
        const isSingle = overlay.selectedElements.length === 1;
        this._setHandlesVisible(isSingle);
        overlay.multiBadge.style.display = isSingle ? 'none' : 'block';
    }

    /** Ẩn overlay */
    _hideOverlay() {
        const overlay = this.overlay;
        clearTimeout(overlay._hideLabelTimer);
        overlay.selectionBox.style.display = 'none';
        this._setHandlesVisible(false);
        overlay.multiBadge.style.display = 'none';
        overlay.elementLabel.style.display = 'none';
    }

    /** Hiển thị hover box */
    _showHover(el) {
        const overlay = this.overlay;
        if (!el || overlay.selectedElements.includes(el)) {
            overlay.hoverBox.style.display = 'none';
            return;
        }
        const rect = this._getElementScreenRect(el);
        overlay.hoverBox.style.display = 'block';
        overlay.hoverBox.style.left = rect.left + 'px';
        overlay.hoverBox.style.top = rect.top + 'px';
        overlay.hoverBox.style.width = rect.width + 'px';
        overlay.hoverBox.style.height = rect.height + 'px';
    }

    /** Toggle handles visibility */
    _setHandlesVisible(visible) {
        const overlay = this.overlay;
        Object.values(overlay.handles).forEach(h => h.style.display = visible ? 'block' : 'none');
        overlay.moveHandle.style.display = visible ? 'flex' : 'none';
        overlay.rotateHandle.setVisible(visible);
        overlay.dimensionLabel.style.display = visible ? 'block' : 'none';
        overlay.positionLabel.style.display = visible ? 'block' : 'none';

        if (!visible && overlay.selectedElements.length > 1) {
            overlay.moveHandle.style.display = 'flex';
        }
    }

    /** Cập nhật vị trí overlay — tính bounding box chung */
    _updateOverlay() {
        const overlay = this.overlay;
        if (overlay.selectedElements.length === 0) return;

        overlay._cachedLayerRect = CanvasAPI.getElementRect(overlay.layer);

        const liveElements = overlay.selectedElements.filter(el => el && el.isConnected);
        if (liveElements.length === 0) {
            overlay.selectedElements = liveElements;
            overlay._selectedIds = new Set();
            this._hideOverlay();
            overlay._cachedLayerRect = null;
            return;
        }
        overlay.selectedElements = liveElements;
        overlay._selectedIds = new Set(liveElements.map(el => el.id));

        if (liveElements.length === 1) {
            const el = liveElements[0];
            const vis = ViewportCulling.isVisible(el);
            if (!vis) {
                overlay.selectionBox.style.display = 'none';
                overlay.elementLabel.style.display = 'none';
                overlay._cachedLayerRect = null;
                return;
            }
            overlay.selectionBox.style.display = 'block';
            this._setHandlesVisible(true);
            overlay.multiBadge.style.display = 'none';
            this._updateSingleOverlay(el);
        } else {
            const visible = ViewportCulling.visibleElements(liveElements);
            if (visible.length === 0) {
                overlay.selectionBox.style.display = 'none';
                overlay.elementLabel.style.display = 'none';
                overlay._cachedLayerRect = null;
                return;
            }
            overlay.selectionBox.style.display = 'block';
            this._setHandlesVisible(false);
            overlay.multiBadge.style.display = 'block';
            this._updateMultiOverlay(visible);
        }
        overlay._cachedLayerRect = null;
    }

    /** Overlay cho 1 element */
    _updateSingleOverlay(el) {
        const overlay = this.overlay;
        const elRect = CanvasAPI.getElementRect(el);
        const layerRect = overlay._cachedLayerRect || CanvasAPI.getElementRect(overlay.layer);

        const boxLeft = elRect.left - layerRect.left;
        const boxTop  = elRect.top  - layerRect.top;

        overlay.selectionBox.style.left   = boxLeft + 'px';
        overlay.selectionBox.style.top    = boxTop  + 'px';
        overlay.selectionBox.style.width  = elRect.width  + 'px';
        overlay.selectionBox.style.height = elRect.height + 'px';

        const w = Math.round(parseFloat(el.style.width)  || el.offsetWidth);
        const h = Math.round(parseFloat(el.style.height) || el.offsetHeight);
        const x = Math.round(parseFloat(el.style.left)   || 0);
        const y = Math.round(parseFloat(el.style.top)    || 0);

        overlay.dimensionLabel.textContent = `${w} × ${h}`;
        overlay.positionLabel.textContent  = `${x}, ${y}`;

        if (overlay._isResizing || overlay._isMoving || overlay.rotateHandle.isRotating) {
            overlay.dimensionLabel.style.display = 'block';
            overlay.positionLabel.style.display = overlay._isMoving ? 'block' : 'none';
        }

        // Element name label — bottom-right corner of the selection box
        this._updateElementLabel(el, boxLeft, boxTop, elRect.width, elRect.height);
    }

    /** Overlay bounding box cho nhiều element */
    _updateMultiOverlay(visibleElements) {
        const overlay = this.overlay;
        let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
        const layerRect = overlay._cachedLayerRect || CanvasAPI.getElementRect(overlay.layer);

        for (let i = 0; i < visibleElements.length; i++) {
            const el = visibleElements[i];
            const elRect = CanvasAPI.getElementRect(el);
            const left = elRect.left - layerRect.left;
            const top = elRect.top - layerRect.top;
            if (left < minLeft) minLeft = left;
            if (top < minTop) minTop = top;
            const right = left + elRect.width;
            const bottom = top + elRect.height;
            if (right > maxRight) maxRight = right;
            if (bottom > maxBottom) maxBottom = bottom;
        }

        overlay.selectionBox.style.left = minLeft + 'px';
        overlay.selectionBox.style.top = minTop + 'px';
        overlay.selectionBox.style.width = (maxRight - minLeft) + 'px';
        overlay.selectionBox.style.height = (maxBottom - minTop) + 'px';

        overlay.multiBadge.textContent = `${visibleElements.length} selected`;

        // Multi-select label
        overlay.elementLabel.textContent = `${visibleElements.length} elements`;
        overlay.elementLabel.style.left = maxRight + 'px';
        overlay.elementLabel.style.top  = maxBottom + 'px';
        overlay.elementLabel.style.display = 'block';
    }

    /**
     * Bắt label hiện ngay khi bắt đầu thao tác.
     */
    _showRealtimeLabels() {
        const overlay = this.overlay;
        if (overlay.selectedElements.length !== 1) return;
        clearTimeout(overlay._hideLabelTimer);
        overlay.dimensionLabel.style.display = 'block';
        overlay.positionLabel.style.display  = overlay._isMoving ? 'block' : 'none';
    }

    /**
     * Ẩn position label sau 1s khi dừng thao tác.
     * Dimension label ẩn theo _setHandlesVisible() khi deselect.
     */
    _scheduleHideLabels() {
        const overlay = this.overlay;
        clearTimeout(overlay._hideLabelTimer);
        overlay._hideLabelTimer = setTimeout(() => {
            if (!overlay._isMoving && !overlay._isResizing && !overlay.rotateHandle.isRotating) {
                overlay.positionLabel.style.display = 'none';
            }
        }, OVERLAY_HIDE_LABEL_DELAY);
    }

    /** Refresh overlay (khi scroll/zoom/resize) */
    _refreshOverlay() {
        const overlay = this.overlay;
        if (overlay.selectedElements.length > 0) {
            this._updateOverlay();
        }
        overlay.hoverBox.style.display = 'none';
    }

    /** Cập nhật rubber-band rect */
    _updateRubberBand(rect) {
        const overlay = this.overlay;
        overlay.rubberBand.style.display = 'block';
        overlay.rubberBand.style.left = rect.left + 'px';
        overlay.rubberBand.style.top = rect.top + 'px';
        overlay.rubberBand.style.width = rect.width + 'px';
        overlay.rubberBand.style.height = rect.height + 'px';
    }

    /** Ẩn rubber-band */
    _hideRubberBand() {
        this.overlay.rubberBand.style.display = 'none';
    }

    /**
     * Lấy vị trí element trên screen (relative to overlay layer)
     */
    _getElementScreenRect(el) {
        const overlay = this.overlay;
        const elRect = CanvasAPI.getElementRect(el);
        const layerRect = CanvasAPI.getElementRect(overlay.layer);
        return {
            left: elRect.left - layerRect.left,
            top: elRect.top - layerRect.top,
            width: elRect.width,
            height: elRect.height
        };
    }

    /**
     * Render element name label ở góc dưới-phải của selection box.
     * Label nằm trong overlay-layer (không phải trong selectionBox)
     * nên tọa độ là relative to layer.
     */
    _updateElementLabel(el, boxLeft, boxTop, boxWidth, boxHeight) {
        const overlay = this.overlay;
        const label = overlay.elementLabel;

        // Lấy tên: ưu tiên data-name, sau đó data-type, sau đó tagName
        const name = el.dataset.name
            || el.dataset.type
            || el.tagName.toLowerCase();
        const tag  = el.tagName.toLowerCase();
        label.textContent = name !== tag ? `${name}` : tag;

        // Đặt label ngay dưới-phải góc selection box
        label.style.left    = (boxLeft + boxWidth) + 'px';
        label.style.top     = (boxTop  + boxHeight) + 'px';
        label.style.display = 'block';
    }

    /** Cập nhật vị trí tất cả badge (khi scroll/zoom) */
    _refreshBadges() {
        this.qualityBadges._refreshBadges();
    }

    _updateQualityBadges(issues) {
        this.qualityBadges._updateQualityBadges(issues);
    }
}


