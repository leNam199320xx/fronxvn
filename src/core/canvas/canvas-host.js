/**
 * CanvasHost - Manages the editable canvas div (no iframe).
 * Canvas lives directly in the main document for reliable event handling.
 */

export class CanvasHost {
    constructor() {
        this._root = null;
    }

    init() {
        if (this._root) return Promise.resolve(this);

        // Reuse the #canvas div that already exists in index.html
        this._root = document.getElementById('canvas');
        if (!this._root) {
            // Fallback: create it inside canvas-inner
            this._root = document.createElement('div');
            this._root.id = 'canvas';
            this._root.className = 'canvas show-grid';
            const container = document.getElementById('canvas-inner');
            if (container) container.appendChild(this._root);
        }

        return Promise.resolve(this);
    }

    getDocument() {
        return document;
    }

    getWindow() {
        return window;
    }

    getBody() {
        return document.body;
    }

    getRoot() {
        return this._root;
    }

    /** No iframe — returns null. Kept for API compatibility. */
    getIframe() {
        return null;
    }

    /** No-op — no observers to dispose. */
    _disposeResizeObserver() {}
}

export default new CanvasHost();
