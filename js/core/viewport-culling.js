/**
 * ViewportCulling - Skip rendering for elements outside the visible viewport.
 * - Computes visible rect from canvas container + zoom/pan
 * - Filters elements before overlay/quality/guide rendering
 * - Does NOT affect selection, export, or layer tree data
 */
import CanvasAPI from '../canvas/canvas-api.js';
import FrameCache from './frame-cache.js';

export class ViewportCulling {
    constructor() {
        this._container = null;
    }

    /**
     * Invalidate cached viewport rect.
     * Call on scroll/zoom/resize/pan.
     */
    invalidate() {
        FrameCache.invalidate('viewportRect');
    }

    /**
     * Get the current viewport rect in canvas coordinates.
     * @returns {{left: number, top: number, right: number, bottom: number}}
     */
    viewportRect() {
        return FrameCache.get('viewportRect', () => {
            const container = this._getContainer();
            const canvas = CanvasAPI.getRoot();
            if (!container || !canvas) return { left: 0, top: 0, right: 0, bottom: 0 };

            const containerRect = container.getBoundingClientRect();
            const canvasRect = CanvasAPI.getRootRect();
            const zoom = CanvasAPI.getZoom();

            const left   = (containerRect.left - canvasRect.left) / zoom;
            const top    = (containerRect.top - canvasRect.top) / zoom;
            const right  = left + containerRect.width / zoom;
            const bottom = top + containerRect.height / zoom;

            return { left, top, right, bottom };
        });
    }

    /**
     * Check if an element is visible inside the viewport.
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    isVisible(el) {
        if (!el) return false;

        const rect = CanvasAPI.getElementRect(el);
        const vr = this.viewportRect();

        return !(
            rect.right <= vr.left ||
            rect.left >= vr.right ||
            rect.bottom <= vr.top ||
            rect.top >= vr.bottom
        );
    }

    /**
     * Filter an array of elements to only visible ones.
     * @param {HTMLElement[]} elements
     * @returns {HTMLElement[]}
     */
    visibleElements(elements) {
        if (!Array.isArray(elements)) return [];
        return elements.filter(el => this.isVisible(el));
    }

    /**
     * Get canvas container for viewport calculations.
     * @returns {HTMLElement|null}
     */
    _getContainer() {
        if (!this._container) {
            this._container = document.getElementById('canvas-container') || document.querySelector('.canvas-container');
        }
        return this._container;
    }
}

export default new ViewportCulling();
