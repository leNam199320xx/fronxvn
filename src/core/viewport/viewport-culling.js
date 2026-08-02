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
     * Returns null if the viewport cannot be determined (e.g. canvas not yet loaded).
     * @returns {{left: number, top: number, right: number, bottom: number}|null}
     */
    viewportRect() {
        return FrameCache.get('viewportRect', () => {
            const container = this._getContainer();
            const canvas = CanvasAPI.getRoot();
            if (!container || !canvas) return null;

            const containerRect = container.getBoundingClientRect();
            const canvasRect = CanvasAPI.getRootRect();
            const zoom = CanvasAPI.getZoom();

            // canvasRect.width == 0 means canvas not yet rendered
            if (!canvasRect.width) return null;

            const left   = (containerRect.left - canvasRect.left) / zoom;
            const top    = (containerRect.top - canvasRect.top) / zoom;
            const right  = left + containerRect.width / zoom;
            const bottom = top + containerRect.height / zoom;

            return { left, top, right, bottom };
        });
    }

    /**
     * Check if an element is visible inside the viewport.
     * Returns true when viewport cannot be determined (safe default).
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    isVisible(el) {
        if (!el) return false;

        const vr = this.viewportRect();
        // If viewport rect is unavailable, treat all elements as visible
        if (!vr) return true;

        // Use canvas-space coordinates (style left/top/width/height) so they match viewportRect.
        const left   = parseFloat(el.style.left)   || 0;
        const top    = parseFloat(el.style.top)    || 0;
        const width  = parseFloat(el.style.width)  || el.offsetWidth  || 0;
        const height = parseFloat(el.style.height) || el.offsetHeight || 0;
        const right  = left + width;
        const bottom = top + height;

        return !(
            right  <= vr.left  ||
            left   >= vr.right ||
            bottom <= vr.top   ||
            top    >= vr.bottom
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
