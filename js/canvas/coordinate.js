/**
 * CoordinateSystem - Unified coordinate conversions.
 * - Independent from window.editor
 * - Reads zoom, scroll, and viewport from Canvas API
 */
import CanvasAPI from './canvas-api.js';

class CoordinateSystem {
    viewportToCanvas(viewportX, viewportY) {
        const rect = CanvasAPI.getRootRect();
        const zoom = CanvasAPI.getZoom();
        return {
            x: (viewportX - rect.left) / zoom,
            y: (viewportY - rect.top) / zoom
        };
    }

    canvasToViewport(canvasX, canvasY) {
        const rect = CanvasAPI.getRootRect();
        const zoom = CanvasAPI.getZoom();
        return {
            x: rect.left + canvasX * zoom,
            y: rect.top + canvasY * zoom
        };
    }

    elementRect(el) {
        if (!el) return { left: 0, top: 0, width: 0, height: 0 };
        return CanvasAPI.getElementRect(el);
    }

    mousePosition(e) {
        return this.viewportToCanvas(e.clientX, e.clientY);
    }

    viewportCenter() {
        const rect = CanvasAPI.getViewportRect();
        return {
            x: (rect.left + rect.right) / 2,
            y: (rect.top + rect.bottom) / 2
        };
    }
}

export default new CoordinateSystem();
