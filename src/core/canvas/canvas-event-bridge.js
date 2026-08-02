/**
 * CanvasEventBridge - Forwards pointer/wheel events from the main document canvas.
 * No iframe — events are bound directly on the canvas root div and main document.
 * All events are normalized to mousedown/mousemove/mouseup names for consumer consistency.
 */
import eventBus from '../events/event-bus.js';
import CanvasDiagnostics from './canvas-diagnostics.js';

const SUPPORTS_POINTER = typeof window !== 'undefined' && 'PointerEvent' in window;

export class CanvasEventBridge {
    constructor() {
        this._handlers = [];
    }

    init() {
        this._bindPointerEvents();
        this._bindDblClickEvent();
        this._bindWheelEvent();
        this._bindContextMenu();
    }

    destroy() {
        for (const { target, type, handler, options } of this._handlers) {
            target.removeEventListener(type, handler, options);
        }
        this._handlers = [];
    }

    _add(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        this._handlers.push({ target, type, handler, options });
    }

    // ─── Pointer ──────────────────────────────────────────────────────────────

    _bindPointerEvents() {
        if (SUPPORTS_POINTER) {
            this._add(document, 'pointerdown',   (e) => this._emit('mousedown', e));
            this._add(document, 'pointermove',   (e) => this._emit('mousemove', e));
            this._add(document, 'pointerup',     (e) => this._emit('mouseup', e));
            this._add(document, 'pointercancel', (e) => this._emit('mouseup', e));
        } else {
            this._add(document, 'mousedown', (e) => this._emit('mousedown', e));
            this._add(document, 'mousemove', (e) => this._emit('mousemove', e));
            this._add(document, 'mouseup',   (e) => this._emit('mouseup', e));
        }
    }

    /** Returns true if the event originated from within the editor canvas area. */
    _isCanvasEvent(e) {
        const wrapper = document.getElementById('canvas-wrapper');
        return wrapper ? wrapper.contains(e.target) : true;
    }

    _emit(normalizedType, e) {
        // mousemove and mouseup fire globally (needed for drag outside canvas).
        // mousedown only fires if it originated inside canvas-wrapper.
        if (normalizedType === 'mousedown' && !this._isCanvasEvent(e)) return;
        CanvasDiagnostics.trackEventBridgeEvent();
        eventBus.emit('pointer:' + normalizedType, {
            clientX:  e.clientX,
            clientY:  e.clientY,
            screenX:  e.screenX,
            screenY:  e.screenY,
            pageX:    e.pageX  || 0,
            pageY:    e.pageY  || 0,
            ctrlKey:  e.ctrlKey,
            metaKey:  e.metaKey,
            shiftKey: e.shiftKey,
            altKey:   e.altKey,
            button:   e.button,
            buttons:  e.buttons,
            target:   e.target,
            type:     normalizedType
        });
    }

    // ─── Double click ─────────────────────────────────────────────────────────

    _bindDblClickEvent() {
        this._add(document, 'dblclick', (e) => {
            CanvasDiagnostics.trackEventBridgeEvent();
            eventBus.emit('pointer:dblclick', {
                clientX: e.clientX, clientY: e.clientY,
                target: e.target, shiftKey: e.shiftKey,
                type: 'dblclick'
            });
        });
    }

    // ─── Wheel ────────────────────────────────────────────────────────────────

    _bindWheelEvent() {
        const handler = (e) => {
            if (e.ctrlKey) e.preventDefault();
            CanvasDiagnostics.trackEventBridgeEvent();
            eventBus.emit('wheel', {
                clientX: e.clientX,
                clientY: e.clientY,
                deltaX:  e.deltaX,
                deltaY:  e.deltaY,
                deltaZ:  e.deltaZ,
                deltaMode: e.deltaMode,
                ctrlKey:  e.ctrlKey,
                metaKey:  e.metaKey,
                shiftKey: e.shiftKey,
                altKey:   e.altKey,
                target:   e.target
            });
        };
        this._add(document, 'wheel', handler, { passive: false });
    }

    // ─── Context menu ─────────────────────────────────────────────────────────

    _bindContextMenu() {
        this._add(document, 'contextmenu', (e) => {
            // Only intercept right-clicks inside the canvas area
            const canvas = document.getElementById('canvas');
            if (!canvas || !canvas.contains(e.target)) return;
            e.preventDefault();
            CanvasDiagnostics.trackEventBridgeEvent();
            eventBus.emit('pointer:contextmenu', {
                clientX: e.clientX, clientY: e.clientY,
                target: e.target, type: 'contextmenu'
            });
        });
    }
}

export default CanvasEventBridge;
