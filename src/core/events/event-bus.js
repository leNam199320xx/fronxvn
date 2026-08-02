/**
 * EventBus - Module giao ti?p trung tâm gi?a các module
 * Các module không g?i tr?c ti?p l?n nhau mà thông qua EventBus
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
        if(event != "canvas:mousemove" && event != "canvas:mouseup" && event != "canvas:mousedown") {
            debug.action('event-bus', `emit ${event}`, args.length > 0 ? args[0] : undefined);
        }
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
