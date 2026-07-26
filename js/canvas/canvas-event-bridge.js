/**
 * CanvasEventBridge - Forwards pointer/wheel/focus events from the iframe.
 * Emits typed data via EventBus to avoid synthetic DOM event allocations.
 * Keyboard events continue dispatching to the iframe for contentEditable support.
 */
import eventBus from '../event-bus.js';
import CanvasAPI from './canvas-api.js';

const SUPPORTS_POINTER = typeof window !== 'undefined' && 'PointerEvent' in window;

function normalizePointer(e) {
    const { left, top } = CanvasAPI.getIframeRect();
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
    constructor(iframe, doc, win) {
        this._iframe = iframe;
        this._doc = doc;
        this._win = win;
    }

    init() {
        if (!this._doc || !this._win) return;
        this._bindPointerEvents();
        this._bindWheelEvent();
        this._bindKeyboardEvents();
        this._bindContextMenu();
        this._bindFocusEvents();
    }

    _bindPointerEvents() {
        const map = SUPPORTS_POINTER
            ? { pointerdown: 'pointerdown', pointermove: 'pointermove', pointerup: 'pointerup', pointercancel: 'pointercancel' }
            : { mousedown: 'mousedown', mousemove: 'mousemove', mouseup: 'mouseup', dragstart: 'dragstart', dragend: 'dragend' };

        Object.entries(map).forEach(([source, type]) => {
            this._doc.addEventListener(source, (e) => this._emitPointer(type, e));
        });

        if (SUPPORTS_POINTER) {
            this._win.document.addEventListener('pointermove', (e) => this._emitParentPointer('pointermove', e));
            this._win.document.addEventListener('pointerup', (e) => this._emitParentPointer('pointerup', e));
            this._win.document.addEventListener('pointercancel', (e) => this._emitParentPointer('pointercancel', e));
        } else {
            this._win.document.addEventListener('mousemove', (e) => this._emitParentPointer('mousemove', e));
            this._win.document.addEventListener('mouseup', (e) => this._emitParentPointer('mouseup', e));
        }
    }

    _emitPointer(type, e) {
        const data = normalizePointer(e);
        data.type = type;
        eventBus.emit('pointer:' + type, data);
    }

    _emitParentPointer(type, e) {
        if (this._iframe.contains(e.target) || e.target === this._iframe) return;
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
        this._doc.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const data = normalizePointer(e);
            data.type = 'contextmenu';
            eventBus.emit('pointer:contextmenu', data);
        });
    }

    _bindWheelEvent() {
        this._doc.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
            const { left, top } = CanvasAPI.getIframeRect();
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
        });
    }

    _bindKeyboardEvents() {
        const forward = (type) => (e) => {
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

        this._win.addEventListener('keydown', forward('keydown'));
        this._win.addEventListener('keyup', forward('keyup'));
    }

    _bindFocusEvents() {
        this._win.addEventListener('focusin', (e) => {
            eventBus.emit('focus:in', { target: e.target, relatedTarget: e.relatedTarget });
        });

        this._win.addEventListener('focusout', (e) => {
            eventBus.emit('focus:out', { target: e.target, relatedTarget: e.relatedTarget });
        });
    }
}

export default CanvasEventBridge;
