import { PluginContext } from './plugin-context.js';

export class PluginManager {
    constructor(editor, eventBus, store) {
        this._editor = editor;
        this._eventBus = eventBus;
        this._store = store;
        this._plugins = new Map();
        this._api = null;
    }

    setApi(api) {
        this._api = api;
    }

    createContext(pluginId) {
        return new PluginContext(pluginId, this._editor, this._eventBus, this._store, this._api);
    }

    register(id, plugin) {
        if (this._plugins.has(id)) {
            throw new Error(`Plugin "${id}" is already registered`);
        }

        const context = this.createContext(id);
        const def = {
            id,
            plugin,
            context,
            state: 'pending',
            dispose: null
        };

        this._plugins.set(id, def);
        this._emit('plugin:registered', { id });
        return def;
    }

    async init(id) {
        const def = this._plugins.get(id);
        if (!def || def.state !== 'pending') return;

        const { plugin, context } = def;

        if (typeof plugin.init === 'function') {
            def.dispose = await plugin.init(context) || null;
        }

        def.state = 'active';
        this._emit('plugin:initialized', { id });
    }

    async initAll() {
        const entries = Array.from(this._plugins.entries());
        for (const [id, def] of entries) {
            if (def.state === 'pending') {
                await this.init(id);
            }
        }
        this._emit('plugins:all-initialized', { count: entries.length });
    }

    destroy(id) {
        const def = this._plugins.get(id);
        if (!def || def.state === 'destroyed') return;

        if (typeof def.plugin.destroy === 'function') {
            def.plugin.destroy(def.context);
        }
        if (typeof def.dispose === 'function') {
            def.dispose();
        }

        def.state = 'destroyed';
        def.dispose = null;
        this._emit('plugin:destroyed', { id });
    }

    destroyAll() {
        const entries = Array.from(this._plugins.entries());
        for (const [id] of entries) {
            this.destroy(id);
        }
    }

    get(id) {
        const def = this._plugins.get(id);
        return def && def.state !== 'destroyed' ? def : null;
    }

    getAll() {
        return Array.from(this._plugins.values()).filter(p => p.state !== 'destroyed');
    }

    has(id) {
        const def = this._plugins.get(id);
        return def !== undefined && def.state !== 'destroyed';
    }

    get ids() {
        return Array.from(this._plugins.keys());
    }

    _emit(event, detail) {
        if (this._eventBus) {
            this._eventBus.emit(event, detail);
        }
    }
}

export function createPluginManager(editor, eventBus, store) {
    return new PluginManager(editor, eventBus, store);
}
