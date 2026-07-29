/**
 * Canvas API - Single public DOM abstraction for the editable canvas.
 * - All canvas DOM operations must go through this API
 * - CanvasHost remains private
 * - Modules must not access iframe.contentDocument directly
 */
import CanvasHost from './canvas-host.js';
import FrameCache from '../core/frame-cache.js';
import CanvasDiagnostics from './canvas-diagnostics.js';

class CanvasAPI {
    getDocument() {
        return CanvasHost.getDocument();
    }

    getWindow() {
        return CanvasHost.getWindow();
    }

    getBody() {
        return CanvasHost.getBody();
    }

    getRoot() {
        return CanvasHost.getRoot();
    }

    getIframe() {
        return CanvasHost.getIframe();
    }

    getSelection() {
        return this.getWindow().getSelection();
    }

    query(selector) {
        CanvasDiagnostics.trackDOMQuery();
        return this.getRoot().querySelector(selector);
    }

    queryAll(selector) {
        CanvasDiagnostics.trackDOMQuery();
        return Array.from(this.getRoot().querySelectorAll(selector));
    }

    create(tag, attrs = {}) {
        const el = this.getDocument().createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'textContent') {
                el.textContent = value;
            } else if (key === 'className') {
                el.className = value;
            } else {
                el.setAttribute(key, value);
            }
        }
        return el;
    }

    remove(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    append(el, target) {
        const parent = target || this.getRoot();
        if (parent) parent.appendChild(el);
    }

    prepend(el, target) {
        const parent = target || this.getRoot();
        if (parent) parent.insertBefore(el, parent.firstChild);
    }

    insertBefore(el, refNode, target) {
        const parent = target || this.getRoot();
        if (parent && refNode && refNode.parentNode === parent) {
            parent.insertBefore(el, refNode);
        }
    }

    insertAfter(el, refNode, target) {
        const parent = target || this.getRoot();
        if (parent && refNode && refNode.nextSibling) {
            parent.insertBefore(el, refNode.nextSibling);
        }
    }

    replace(newEl, oldEl, target) {
        const parent = target || oldEl.parentNode;
        if (parent && oldEl.parentNode === parent) {
            parent.replaceChild(newEl, oldEl);
        }
    }

    clone(el, deep = true) {
        if (!el) return null;
        return el.cloneNode(deep);
    }

    closest(el, selector) {
        if (!el || !el.closest) return null;
        return el.closest(selector);
    }

    matches(el, selector) {
        if (!el || !el.matches) return false;
        return el.matches(selector);
    }

    setStyle(el, prop, value) {
        if (!el || !prop) return;
        el.style.setProperty(prop, value);
        if (el.id) {
            FrameCache.invalidate(`elementRect:${el.id}`);
        }
    }

    removeStyle(el, prop) {
        if (!el || !prop) return;
        el.style.removeProperty(prop);
    }

    getStyle(el, prop) {
        if (!el || !prop) return '';
        return el.style.getPropertyValue(prop);
    }

    setAttribute(el, key, value) {
        if (!el || !key) return;
        el.setAttribute(key, value);
    }

    getAttribute(el, key) {
        if (!el || !key) return null;
        return el.getAttribute(key);
    }

    removeAttribute(el, key) {
        if (!el || !key) return;
        el.removeAttribute(key);
    }

    hasAttribute(el, key) {
        if (!el || !key) return false;
        return el.hasAttribute(key);
    }

    addClass(el, className) {
        if (!el || !className) return;
        el.classList.add(className);
    }

    removeClass(el, className) {
        if (!el || !className) return;
        el.classList.remove(className);
    }

    toggleClass(el, className, force) {
        if (!el || !className) return;
        el.classList.toggle(className, force);
    }

    setClass(el, className) {
        if (!el || !className) return;
        el.className = className;
    }

    getClass(el) {
        if (!el) return '';
        return el.className;
    }

    setClassList(el, className, action) {
        if (!el || !className) return;
        el.classList[action](className);
    }

    contains(el, child) {
        if (!el || !child) return false;
        return el.contains(child);
    }

    setText(el, text) {
        if (!el) return;
        el.textContent = text;
    }

    getText(el) {
        if (!el) return '';
        return el.textContent;
    }

    setHTML(el, html) {
        if (!el) return;
        el.innerHTML = html;
    }

    getHTML(el) {
        if (!el) return '';
        return el.innerHTML;
    }

    getIframeRect() {
        return FrameCache.get('iframeRect', () => {
            const iframe = CanvasHost.getIframe();
            if (!iframe) return { left: 0, top: 0, width: 0, height: 0 };
            CanvasDiagnostics.trackBoundingClientRect();
            const r = iframe.getBoundingClientRect();
            return { left: r.left, top: r.top, width: r.width, height: r.height };
        });
    }

    getRootRect() {
        return FrameCache.get('rootRect', () => {
            const iframe = CanvasHost.getIframe();
            CanvasDiagnostics.trackBoundingClientRect();
            const r = this.getRoot().getBoundingClientRect();
            if (!iframe) {
                return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
            }
            CanvasDiagnostics.trackBoundingClientRect();
            const iRect = iframe.getBoundingClientRect();
            return {
                left: r.left + iRect.left,
                top: r.top + iRect.top,
                right: r.right + iRect.left,
                bottom: r.bottom + iRect.top,
                width: r.width,
                height: r.height
            };
        });
    }

    getCanvasRect() {
        return FrameCache.get('canvasRect', () => this.getRootRect());
    }

    getViewportRect() {
        return FrameCache.get('viewportRect', () => {
            const container = document.getElementById('canvas-container') || document.querySelector('.canvas-container');
            const canvas = this.getRoot();
            if (!container || !canvas) return { left: 0, top: 0, right: 0, bottom: 0 };

            CanvasDiagnostics.trackBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const canvasRect = this.getRootRect();
            const zoom = this.getZoom();

            const left   = (containerRect.left - canvasRect.left) / zoom;
            const top    = (containerRect.top - canvasRect.top) / zoom;
            const right  = left + containerRect.width / zoom;
            const bottom = top + containerRect.height / zoom;

            return { left, top, right, bottom };
        });
    }

    getZoom() {
        return FrameCache.get('zoom', () => {
            const canvas = this.getRoot();
            if (canvas) {
                const match = (canvas.style.transform || '').match(/scale\(([^)]+)\)/);
                if (match) return parseFloat(match[1]);
            }
            return 1;
        });
    }

    getDevicePixelRatio() {
        return FrameCache.get('devicePixelRatio', () => window.devicePixelRatio || 1);
    }

    getScrollX() {
        return FrameCache.get('scrollX', () => window.scrollX || window.pageXOffset || 0);
    }

    getScrollY() {
        return FrameCache.get('scrollY', () => window.scrollY || window.pageYOffset || 0);
    }

    getElementRect(el) {
        if (!el) return { left: 0, top: 0, width: 0, height: 0 };

        const cacheKey = el.id ? `elementRect:${el.id}` : null;
        if (cacheKey) {
            return FrameCache.get(cacheKey, () => {
                const iframe = CanvasHost.getIframe();
                CanvasDiagnostics.trackBoundingClientRect();
                const r = el.getBoundingClientRect();
                if (!iframe) {
                    return { left: r.left, top: r.top, width: r.width, height: r.height };
                }
                CanvasDiagnostics.trackBoundingClientRect();
                const iRect = iframe.getBoundingClientRect();
                return {
                    left: r.left + iRect.left,
                    top: r.top + iRect.top,
                    width: r.width,
                    height: r.height
                };
            });
        }

        const iframe = CanvasHost.getIframe();
        CanvasDiagnostics.trackBoundingClientRect();
        const r = el.getBoundingClientRect();
        if (!iframe) {
            return { left: r.left, top: r.top, width: r.width, height: r.height };
        }
        CanvasDiagnostics.trackBoundingClientRect();
        const iRect = iframe.getBoundingClientRect();
        return {
            left: r.left + iRect.left,
            top: r.top + iRect.top,
            width: r.width,
            height: r.height
        };
    }

    getComputedStyle(el) {
        if (!el) return {};
        return this.getWindow().getComputedStyle(el);
    }

    contains(parent, child) {
        if (!parent || !child) return false;
        return parent.contains(child);
    }

    async init() {
        await CanvasHost.init();
        const iframe = CanvasHost.getIframe();
        const doc = CanvasHost.getDocument();
        const win = CanvasHost.getWindow();

        const [{ default: CanvasEventBridge }, { CanvasMutationObserver }] = await Promise.all([
            import('./canvas-event-bridge.js'),
            import('./canvas-mutation-observer.js')
        ]);

        this._bridge = new CanvasEventBridge(iframe, doc, win, this.getIframeRect.bind(this));
        this._bridge.init();

        this._mutationObserver = new CanvasMutationObserver(
            this.getRoot.bind(this),
            this.matches.bind(this),
            this.closest.bind(this)
        );
        this._mutationObserver.init();
    }

    /** Disconnect canvas observers and event bridge to release resources. */
    dispose() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect();
            this._mutationObserver = null;
        }
        if (this._bridge) {
            this._bridge.destroy();
            this._bridge = null;
        }
        CanvasHost._disposeResizeObserver();
        FrameCache.clear();
    }
}

export default new CanvasAPI();
