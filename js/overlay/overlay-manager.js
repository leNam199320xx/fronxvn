import eventBus from '../event-bus.js';
import RenderPipeline from '../core/render-pipeline.js';
import ViewportCulling from '../core/viewport-culling.js';
import DirtyState, { DIRTY } from '../core/dirty-state.js';
import { OverlayRenderer } from './overlay-renderer.js';
import { RotateHandle } from './rotate-handle.js';
import { ResizeHandles } from './resize-handles.js';

export class OverlayManager {
    constructor(editor) {
        this.editor = editor;
        this.layer = editor.overlayLayer;
        this.selectedElements = [];
        this._selectedIds = new Set();

        this._badges = new Map();
        this._isMoving = false;
        this._isResizing = false;
        this._hideLabelTimer = null;

        this.renderer = new OverlayRenderer(this);
        this._createOverlayElements();
        this.resizeHandles = new ResizeHandles(this.selectionBox);
        this.handles = this.resizeHandles.handles;
        this.rotateHandle = new RotateHandle(this.selectionBox, this);
        this._bindEvents();
        this._registerPipeline();
    }

    init() {}

    refresh() {
        this._refreshOverlay();
        this.renderer._refreshBadges();
    }

    destroy() {}

    _createOverlayElements() {
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'overlay-selection';
        this.selectionBox.style.display = 'none';
        this.layer.appendChild(this.selectionBox);

        this.hoverBox = document.createElement('div');
        this.hoverBox.className = 'overlay-hover';
        this.hoverBox.style.display = 'none';
        this.layer.appendChild(this.hoverBox);

        this.moveHandle = document.createElement('div');
        this.moveHandle.className = 'move-handle';
        this.moveHandle.style.display = 'none';
        this.selectionBox.appendChild(this.moveHandle);

        this.dimensionLabel = document.createElement('div');
        this.dimensionLabel.className = 'overlay-dimension';
        this.dimensionLabel.style.display = 'none';
        this.selectionBox.appendChild(this.dimensionLabel);

        this.positionLabel = document.createElement('div');
        this.positionLabel.className = 'overlay-position';
        this.positionLabel.style.display = 'none';
        this.selectionBox.appendChild(this.positionLabel);

        this.multiBadge = document.createElement('div');
        this.multiBadge.className = 'overlay-multi-badge';
        this.multiBadge.style.display = 'none';
        this.selectionBox.appendChild(this.multiBadge);

        this.rubberBand = document.createElement('div');
        this.rubberBand.className = 'overlay-rubber-band';
        this.rubberBand.style.display = 'none';
        this.layer.appendChild(this.rubberBand);
    }

    _registerPipeline() {
        RenderPipeline.on('pipeline-selection', () => this.renderer._updateOverlay());
        RenderPipeline.on('pipeline-overlay', () => this.renderer._updateOverlay());
        RenderPipeline.on('pipeline-quality', () => this.renderer._refreshBadges());
    }

    _bindEvents() {
        eventBus.on('selection:changed', (elements) => {
            this.selectedElements = elements || [];
            this._selectedIds = new Set(elements.map(el => el.id));
            if (this.selectedElements.length === 0) {
                this.renderer._hideOverlay();
            } else {
                DirtyState.mark(DIRTY.SELECTION);
                DirtyState.mark(DIRTY.OVERLAY);
                RenderPipeline.flushStage('pipeline-selection');
            }
        });

        eventBus.on('element:selected', (el) => {
            if (!this._selectedIds.has(el.id)) {
                this.selectedElements = [el];
                this._selectedIds = new Set([el.id]);
                DirtyState.mark(DIRTY.SELECTION);
                DirtyState.mark(DIRTY.OVERLAY);
                RenderPipeline.flushStage('pipeline-selection');
            }
        });

        eventBus.on('element:deselected', () => {
            this.selectedElements = [];
            this._selectedIds = new Set();
            this.renderer._hideOverlay();
        });

        eventBus.on('element:hovered', (el) => {
            if (ViewportCulling.isVisible(el)) {
                this.renderer._showHover(el);
            } else {
                this.hoverBox.style.display = 'none';
            }
        });

        eventBus.on('element:updated', (el) => {
            if (this._selectedIds.has(el.id)) {
                DirtyState.mark(DIRTY.OVERLAY);
                RenderPipeline.flushStage('pipeline-overlay');
            }
        });

        eventBus.on('element:transform', (el) => {
            if (this._selectedIds.has(el.id)) {
                DirtyState.mark(DIRTY.OVERLAY);
                RenderPipeline.flushStage('pipeline-overlay');
            }
        });

        eventBus.on('canvas:scroll', () => {
            ViewportCulling.invalidate();
            DirtyState.mark(DIRTY.OVERLAY);
            DirtyState.mark(DIRTY.QUALITY);
            RenderPipeline.flushStage('pipeline-overlay');
            RenderPipeline.flushStage('pipeline-quality');
        });
        eventBus.on('canvas:zoom', () => {
            ViewportCulling.invalidate();
            DirtyState.mark(DIRTY.OVERLAY);
            DirtyState.mark(DIRTY.QUALITY);
            RenderPipeline.flushStage('pipeline-overlay');
            RenderPipeline.flushStage('pipeline-quality');
        });
        eventBus.on('canvas:resize', () => {
            ViewportCulling.invalidate();
            DirtyState.mark(DIRTY.OVERLAY);
            DirtyState.mark(DIRTY.QUALITY);
            RenderPipeline.flushStage('pipeline-overlay');
            RenderPipeline.flushStage('pipeline-quality');
        });
        eventBus.on('breakpoint:switch', () => {
            ViewportCulling.invalidate();
            DirtyState.mark(DIRTY.OVERLAY);
            DirtyState.mark(DIRTY.QUALITY);
            RenderPipeline.flushStage('pipeline-overlay');
            RenderPipeline.flushStage('pipeline-quality');
        });

        eventBus.on('overlay:clear', () => {
            this.selectedElements = [];
            this._selectedIds = new Set();
            this.renderer._hideOverlay();
            this.renderer._hideRubberBand();
            this.hoverBox.style.display = 'none';
        });

        eventBus.on('rubber-band:update', (rect) => this.renderer._updateRubberBand(rect));
        eventBus.on('rubber-band:end', () => this.renderer._hideRubberBand());

        eventBus.on('quality:updated', () => {
            RenderPipeline.flushStage('pipeline-quality');
        });

        eventBus.on('element:deleted', (el) => {
            const badge = this._badges.get(el);
            if (badge) {
                badge.remove();
                this._badges.delete(el);
            }
        });

        eventBus.on('drag:start', () => {
            this._isMoving = true;
            this.renderer._showRealtimeLabels();
        });

        eventBus.on('drag:end', () => {
            this._isMoving = false;
            this.renderer._scheduleHideLabels();
        });

        eventBus.on('resize:start', () => {
            this._isResizing = true;
            this.renderer._showRealtimeLabels();
        });

        eventBus.on('resize:end', () => {
            this._isResizing = false;
            this.renderer._scheduleHideLabels();
        });
    }

    _refreshOverlay() {
        if (this.selectedElements.length > 0) {
            this.renderer._updateOverlay();
        }
        this.hoverBox.style.display = 'none';
    }
}
