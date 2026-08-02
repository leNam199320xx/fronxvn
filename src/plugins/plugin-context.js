export class PluginContext {
    constructor(id, editor, eventBus, store, api) {
        this.id = id;
        this._editor = editor;
        this._eventBus = eventBus;
        this._store = store;
        this._api = api;
    }

    on(event, handler) {
        this._eventBus.on(event, handler);
        return () => this._eventBus.off(event, handler);
    }

    once(event, handler) {
        this._eventBus.once(event, handler);
        return () => this._eventBus.off(event, handler);
    }

    emit(event, ...args) {
        this._eventBus.emit(event, ...args);
    }

    subscribe(key, handler) {
        this._store.subscribe(key, handler);
        return () => this._store.unsubscribe(key, handler);
    }

    getState(key) {
        return this._store.get(key);
    }

    setState(key, value) {
        this._store.set(key, value);
    }

    get editor() {
        return this._editor;
    }

    get api() {
        return this._api;
    }

    get canvas() {
        return this._editor.canvasAPI || null;
    }

    get history() {
        return this._editor.history || null;
    }

    get selection() {
        return this._editor.selection || null;
    }

    get clipboard() {
        return this._editor.clipboard || null;
    }

    get pageManager() {
        return this._editor.pageManager || null;
    }

    get projectManager() {
        return this._editor.projectManager || null;
    }

    get templateManager() {
        return this._editor.templateManager || null;
    }

    get componentManager() {
        return this._editor.componentManager || null;
    }

    get exportManager() {
        return this._editor.exportManager || null;
    }

    get qualityEngine() {
        return this._editor.qualityEngine || null;
    }

    get breakpointManager() {
        return this._editor.breakpointManager || null;
    }

    get groupManager() {
        return this._editor.groupManager || null;
    }

    get themeManager() {
        return this._editor.themeManager || null;
    }

    getContainer(id) {
        return document.getElementById(id) || null;
    }

    createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'text') {
                el.textContent = value;
            } else if (key === 'html') {
                el.innerHTML = value;
            } else {
                el.setAttribute(key, value);
            }
        }
        for (const child of children) {
            el.appendChild(child);
        }
        return el;
    }
}
