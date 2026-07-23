/**
 * Overlay - Layer hiển thị border, resize handles, move handle,
 * rotation handle, kích thước, tọa độ cho element đang chọn.
 * Hỗ trợ multi-selection: hiển thị bounding box chung.
 */
import eventBus from './event-bus.js';

/** Map severity → emoji badge */
const SEVERITY_BADGE = { error: '🔴', warning: '🟡', info: '🔵' };

export class Overlay {
    constructor(editor) {
        this.editor = editor;
        this.layer = editor.overlayLayer;
        this.selectedElements = [];

        /** @type {Map<HTMLElement, HTMLElement>} element → badge DOM node */
        this._badges = new Map();

        this._isMoving   = false;
        this._isResizing = false;
        this._isRotating = false;
        this._hideLabelTimer = null;

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
        eventBus.on('canvas:scroll', () => { this._refreshOverlay(); this._refreshBadges(); });
        eventBus.on('canvas:zoom',   () => { this._refreshOverlay(); this._refreshBadges(); });
        eventBus.on('canvas:resize', () => { this._refreshOverlay(); this._refreshBadges(); });

        // Page switch — xóa toàn bộ overlay và guides
        eventBus.on('overlay:clear', () => {
            this.selectedElements = [];
            this._hideOverlay();
            this._hideRubberBand();
            this.hoverBox.style.display = 'none';
        });

        // Rubber-band events từ drag.js
        eventBus.on('rubber-band:update', (rect) => this._updateRubberBand(rect));
        eventBus.on('rubber-band:end', () => this._hideRubberBand());

        // ── Quality badges ─────────────────────────────────────────────────────
        eventBus.on('quality:updated', ({ issues }) => {
            this._updateQualityBadges(issues);
        });

        // ── Realtime indicators khi drag ──────────────────────────────────────
        eventBus.on('drag:start', () => {
            this._isMoving = true;
            this._showRealtimeLabels();
        });

        eventBus.on('drag:end', () => {
            this._isMoving = false;
            this._scheduleHideLabels();
        });

        // ── Realtime indicators khi resize ────────────────────────────────────
        eventBus.on('resize:start', () => {
            this._isResizing = true;
            this._showRealtimeLabels();
        });

        eventBus.on('resize:end', () => {
            this._isResizing = false;
            this._scheduleHideLabels();
        });

        // ── Realtime indicators khi rotate ────────────────────────────────────
        eventBus.on('rotate:start', () => {
            this._isRotating = true;
            this._showRealtimeLabels();
        });

        eventBus.on('rotate:end', () => {
            this._isRotating = false;
            this._scheduleHideLabels();
        });
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

        this.selectionBox.style.left   = rect.left   + 'px';
        this.selectionBox.style.top    = rect.top    + 'px';
        this.selectionBox.style.width  = rect.width  + 'px';
        this.selectionBox.style.height = rect.height + 'px';

        const w = Math.round(parseFloat(el.style.width)  || el.offsetWidth);
        const h = Math.round(parseFloat(el.style.height) || el.offsetHeight);
        const x = Math.round(parseFloat(el.style.left)   || 0);
        const y = Math.round(parseFloat(el.style.top)    || 0);

        this.dimensionLabel.textContent = `${w} × ${h}`;
        this.positionLabel.textContent  = `${x}, ${y}`;

        // Khi đang thao tác: dimension luôn hiện
        if (this._isResizing || this._isMoving || this._isRotating) {
            this.dimensionLabel.style.display = 'block';
            // Position hiện thêm khi đang di chuyển
            this.positionLabel.style.display = this._isMoving ? 'block' : 'none';
        }
    }

    /**
     * Bắt label hiện ngay khi bắt đầu thao tác.
     */
    _showRealtimeLabels() {
        if (this.selectedElements.length !== 1) return;
        clearTimeout(this._hideLabelTimer);
        this.dimensionLabel.style.display = 'block';
        this.positionLabel.style.display  = this._isMoving ? 'block' : 'none';
    }

    /**
     * Ẩn position label sau 1s khi dừng thao tác.
     * Dimension label ẩn theo _setHandlesVisible() khi deselect.
     */
    _scheduleHideLabels() {
        clearTimeout(this._hideLabelTimer);
        this._hideLabelTimer = setTimeout(() => {
            if (!this._isMoving && !this._isResizing && !this._isRotating) {
                this.positionLabel.style.display = 'none';
            }
        }, 1000);
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

    // ─────────────────────────────────────────────
    //  Quality Badges
    // ─────────────────────────────────────────────

    /**
     * Cập nhật toàn bộ badge dựa trên issues mới nhất.
     * @param {import('./quality-engine.js').Issue[]} issues
     */
    _updateQualityBadges(issues) {
        // Xóa tất cả badge cũ
        this._badges.forEach(badge => badge.remove());
        this._badges.clear();

        // Nhóm issues theo element (ưu tiên severity cao nhất)
        const elMap = new Map(); // element → worst severity
        issues.forEach(issue => {
            if (!issue.element) return;
            const current = elMap.get(issue.element);
            if (!current || this._severityRank(issue.severity) > this._severityRank(current)) {
                elMap.set(issue.element, issue.severity);
            }
        });

        // Tạo badge cho từng element có issue
        elMap.forEach((severity, el) => {
            const badge = document.createElement('div');
            badge.className = `quality-badge quality-badge-${severity}`;
            badge.textContent = SEVERITY_BADGE[severity];
            badge.title = `Quality issue: ${severity}`;

            // Vị trí: góc trên-phải của element (relative to overlay layer)
            this._positionBadge(badge, el);

            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                eventBus.emit('quality:badge-click', el);
            });

            this.layer.appendChild(badge);
            this._badges.set(el, badge);
        });
    }

    /**
     * Đặt badge tại góc trên-phải của element.
     * @param {HTMLElement} badge
     * @param {HTMLElement} el
     */
    _positionBadge(badge, el) {
        const rect = this._getElementScreenRect(el);
        badge.style.position = 'absolute';
        badge.style.left = (rect.left + rect.width - 10) + 'px';
        badge.style.top  = (rect.top - 10) + 'px';
    }

    /** Cập nhật vị trí tất cả badge (khi scroll/zoom) */
    _refreshBadges() {
        this._badges.forEach((badge, el) => {
            this._positionBadge(badge, el);
        });
    }

    /**
     * Rank severity để so sánh.
     * @param {'error'|'warning'|'info'} s
     * @returns {number}
     */
    _severityRank(s) {
        return { error: 3, warning: 2, info: 1 }[s] || 0;
    }
}
