/**
 * CanvasHost - Manages the iframe host for the editable canvas.
 */
import CanvasStyleLoader from './canvas-style-loader.js';

export class CanvasHost {
    constructor() {
        this._iframe = null;
        this._doc = null;
        this._win = null;
        this._root = null;
    }

    init() {
        if (this._iframe) return Promise.resolve(this);

        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.id = 'canvas-iframe';
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

            const container = document.getElementById('canvas-inner');
            if (container) {
                const oldCanvas = document.getElementById('canvas');
                if (oldCanvas) oldCanvas.remove();
                container.appendChild(iframe);
            }

            iframe.addEventListener('load', async () => {
                const doc = iframe.contentDocument;
                const win = iframe.contentWindow;
                if (!doc || !win) {
                    resolve(this);
                    return;
                }

                try {
                    await CanvasStyleLoader.load(doc);
                } catch (err) {
                    console.error('[CanvasHost] Style load failed:', err);
                }

                const root = doc.createElement('div');
                root.id = 'canvas';
                root.className = 'canvas show-grid';
                doc.body.appendChild(root);

                this._iframe = iframe;
                this._doc = doc;
                this._win = win;
                this._root = root;

                this._initResizeObserver();

                resolve(this);
            });

            iframe.srcdoc = '<!DOCTYPE html><html><head></head><body></body></html>';
        });
    }

    _initResizeObserver() {
        const iframe = this._iframe;
        if (!iframe || typeof ResizeObserver === 'undefined') return;
        iframe.style.display = 'block';

        const applySize = () => {
            if (this._root) {
                iframe.style.width = this._root.offsetWidth + 'px';
                iframe.style.height = this._root.offsetHeight + 'px';
            }
        };

        applySize();
        iframe.addEventListener('load', applySize, { once: true });

        let resizeTimer;
        const observer = new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(applySize, 0);
        });
        try {
            observer.observe(this._root);
        } catch (_) {}

        this._resizeObserver = observer;
        this._resizeHandler = applySize;
        window.addEventListener('resize', applySize);
    }

    /** Disconnect observers and listeners created by _initResizeObserver. */
    _disposeResizeObserver() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }

    getDocument() {
        return this._doc;
    }

    getWindow() {
        return this._win;
    }

    getBody() {
        return this._doc ? this._doc.body : null;
    }

    getRoot() {
        return this._root;
    }

    getIframe() {
        return this._iframe;
    }
}

export default new CanvasHost();
