/**
 * CanvasEventBridge - Forwards pointer/wheel/focus events from the iframe.
 * Emits typed data via EventBus to avoid synthetic DOM event allocations.
 * Keyboard events continue dispatching to the iframe for contentEditable support.
 */
import eventBus from '../events/event-bus.js';
import CanvasDiagnostics from './canvas-diagnostics.js';

const SUPPORTS_POINTER = typeof window !== 'undefined' && 'PointerEvent' in window;

function normalizePointer(e, getIframeRect) {
    const { left, top } = getIframeRect();
    return {
        clientX: e.clientX + left,
        clientY: e.clientY + top,
        screenX: e.screenX,
        screenY: e.screenY,
        pageX: (e.pageX || 0) + left,
        pageY: (e.pageY || 0) + top,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        button: e.button,
        buttons: e.buttons,
        pointerId: e.pointerId,
        pressure: e.pressure,
        target: e.target
    };
}

export class CanvasEventBridge {
    constructor(iframe, doc, win, getIframeRect) {
        this._iframe = iframe;
        this._doc = doc;
        this._win = win;
        this._getIframeRect = getIframeRect;
        this._handlers = new Map();
    }

    init() {
        if (!this._doc || !this._win) return;
        this._bindPointerEvents();
        this._bindWheelEvent();
        this._bindKeyboardEvents();
        this._bindContextMenu();
        this._bindFocusEvents();
    }

    /** Remove all bound event listeners. */
    destroy() {
        if (!this._doc || !this._win) return;
        for (const [, handlerData] of this._handlers) {
            const [target, type, handler] = handlerData;
            target.removeEventListener(type, handler);
        }
        this._handlers.clear();
    }

    _addHandler(target, type, handler, options) {
        this._handlers.set(handler, [target, type, handler]);
        target.addEventListener(type, handler, options);
    }

    _bindPointerEvents() {
        const map = SUPPORTS_POINTER
            ? { pointerdown: 'pointerdown', pointermove: 'pointermove', pointerup: 'pointerup', pointercancel: 'pointercancel' }
            : { mousedown: 'mousedown', mousemove: 'mousemove', mouseup: 'mouseup', dragstart: 'dragstart', dragend: 'dragend' };

        const emitPointer = (type) => (e) => this._emitPointer(type, e);
        const emitParentPointer = (type) => (e) => this._emitParentPointer(type, e);

        Object.entries(map).forEach(([source, type]) => {
            this._addHandler(this._doc, source, emitPointer(type));
        });

        if (SUPPORTS_POINTER) {
            this._addHandler(this._win.document, 'pointermove', emitParentPointer('pointermove'));
            this._addHandler(this._win.document, 'pointerup', emitParentPointer('pointerup'));
            this._addHandler(this._win.document, 'pointercancel', emitParentPointer('pointercancel'));
        } else {
            this._addHandler(this._win.document, 'mousemove', emitParentPointer('mousemove'));
            this._addHandler(this._win.document, 'mouseup', emitParentPointer('mouseup'));
        }
    }

    _emitPointer(type, e) {
        CanvasDiagnostics.trackEventBridgeEvent();
        const data = normalizePointer(e, this._getIframeRect);
        data.type = type;
        eventBus.emit('pointer:' + type, data);
    }

    _emitParentPointer(type, e) {
        if (this._iframe.contains(e.target) || e.target === this._iframe) return;
        CanvasDiagnostics.trackEventBridgeEvent();
        const data = {
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            pageX: e.pageX || 0,
            pageY: e.pageY || 0,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            button: e.button,
            buttons: e.buttons,
            target: e.target
        };
        data.type = type;
        eventBus.emit('pointer:' + type, data);
    }

    _bindContextMenu() {
        const handler = (e) => {
            e.preventDefault();
            CanvasDiagnostics.trackEventBridgeEvent();
            const data = normalizePointer(e, this._getIframeRect);
            data.type = 'contextmenu';
            eventBus.emit('pointer:contextmenu', data);
        };
        this._addHandler(this._doc, 'contextmenu', handler);
        this._emitContextMenu = handler;
    }

    _bindWheelEvent() {
        const handler = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
            CanvasDiagnostics.trackEventBridgeEvent();
            const { left, top } = this._getIframeRect();
            eventBus.emit('wheel', {
                clientX: e.clientX + left,
                clientY: e.clientY + top,
                deltaX: e.deltaX,
                deltaY: e.deltaY,
                deltaZ: e.deltaZ,
                deltaMode: e.deltaMode,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                target: e.target
            });
        };
        this._addHandler(this._doc, 'wheel', handler, { passive: false });
        this._emitWheel = handler;
    }

    _bindKeyboardEvents() {
        const forward = (type) => (e) => {
            CanvasDiagnostics.trackEventBridgeEvent();
            const synthetic = new KeyboardEvent(type, {
                bubbles: true,
                cancelable: true,
                key: e.key,
                code: e.code,
                location: e.location,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                repeat: e.repeat,
                isComposing: e.isComposing
            });
            synthetic._isIframeContentEditable = e.target.isContentEditable || !!(e.target.closest && e.target.closest('[contenteditable="true"]'));
            this._iframe.dispatchEvent(synthetic);
            if (synthetic.defaultPrevented) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const keydownHandler = forward('keydown');
        const keyupHandler = forward('keyup');
        this._addHandler(this._win, 'keydown', keydownHandler);
        this._addHandler(this._win, 'keyup', keyupHandler);
        this._forwardKeydown = keydownHandler;
        this._forwardKeyup = keyupHandler;
    }

    _bindFocusEvents() {
        const focusInHandler = (e) => {
            CanvasDiagnostics.trackEventBridgeEvent();
            eventBus.emit('focus:in', { target: e.target, relatedTarget: e.relatedTarget });
        };
        const focusOutHandler = (e) => {
            CanvasDiagnostics.trackEventBridgeEvent();
            eventBus.emit('focus:out', { target: e.target, relatedTarget: e.relatedTarget });
        };
        this._addHandler(this._win, 'focusin', focusInHandler);
        this._addHandler(this._win, 'focusout', focusOutHandler);
        this._emitFocusIn = focusInHandler;
        this._emitFocusOut = focusOutHandler;
    }
}

export default CanvasEventBridge;

