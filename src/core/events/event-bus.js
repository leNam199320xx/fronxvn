/**
 * EventBus - Module giao ti?p trung t�m gi?a c�c module
 * C�c module kh�ng g?i tr?c ti?p l?n nhau m� th�ng qua EventBus
 */
import debug from '../utilities/debug.js';

export class EventBus {
    constructor() {
        this._listeners = {};
    }

    on(event, callback, context = null) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        const listener = { callback, context };
        this._listeners[event].push(listener);
        return () => this.off(event, callback, context);
    }

    once(event, callback, context = null) {
        const wrapper = (...args) => {
            this.off(event, wrapper, context);
            callback.apply(context, args);
        };
        this.on(event, wrapper, context);
    }

    off(event, callback, context = null) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(
            listener => listener.callback !== callback || listener.context !== context
        );
    }

    emit(event, ...args) {
        // Chỉ log các event quan trọng, bỏ qua noise từ pointer/render/transform
        const LOG_EVENTS = new Set([
            'history:push', 'history:undo', 'history:redo',
            'project:save', 'project:load',
            'page:added', 'page:deleted', 'page:switched', 'page:renamed',
            'element:added', 'element:deleted',
            'export:show',
            'quality:updated',
            'breakpoint:switch',
        ]);
        if (LOG_EVENTS.has(event)) {
            debug.action('event-bus', `emit ${event}`, args.length > 0 ? args[0] : undefined);
        }
        return this._emitRaw(event, ...args);
    }

    _emitRaw(event, ...args) {
        const listeners = this._listeners[event];
        if (!listeners || listeners.length === 0) return;
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener.callback.apply(listener.context, args);
        }
    }

    clear(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    }
}

const eventBus = new EventBus();
export default eventBus;
