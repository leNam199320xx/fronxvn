import { commandManager } from '../core/commands/register-command.js';
import { propertyRegistry } from '../core/property/property-registry.js';
import { TOOLBAR_ITEMS } from '../studio/toolbar/toolbar-registry.js';

export class PluginAPI {
    constructor(pluginManager) {
        this._pluginManager = pluginManager;
        this._commands = new Map();
        this._toolbarItems = new Map();
        this._panels = new Map();
        this._properties = new Map();
        this._templates = new Map();
        this._components = new Map();
        this._exporters = new Map();
    }

    registerCommand(pluginId, name, handler, meta = {}) {
        if (typeof handler !== 'function') {
            throw new Error(`Command "${name}" handler must be a function`);
        }
        if (this._commands.has(name) && this._commands.get(name) !== pluginId) {
            throw new Error(`Command "${name}" is already registered by another plugin`);
        }

        commandManager.register(name, handler);
        this._commands.set(name, { pluginId, meta });
        this._pluginManager._emit('plugin:command-registered', { pluginId, name });
        return { name, pluginId };
    }

    registerToolbar(pluginId, item) {
        const id = item.id;
        if (!id) {
            throw new Error('Toolbar item must have an id');
        }
        if (this._toolbarItems.has(id) && this._toolbarItems.get(id) !== pluginId) {
            throw new Error(`Toolbar item "${id}" is already registered by another plugin`);
        }

        TOOLBAR_ITEMS[id] = { ...item, _pluginId: pluginId };
        this._toolbarItems.set(id, { pluginId, item });
        this._pluginManager._emit('plugin:toolbar-registered', { pluginId, itemId: id });
        return { id, pluginId };
    }

    registerPanel(pluginId, config) {
        const { id, title, icon, render, init, destroy: destroyFn } = config;

        if (!id || typeof render !== 'function') {
            throw new Error('Panel config must have id and render function');
        }
        if (this._panels.has(id) && this._panels.get(id) !== pluginId) {
            throw new Error(`Panel "${id}" is already registered by another plugin`);
        }

        this._panels.set(id, {
            pluginId,
            config: { id, title, icon, render, init, destroy: destroyFn },
            state: 'registered'
        });

        this._pluginManager._emit('plugin:panel-registered', { pluginId, panelId: id });
        return { id, pluginId };
    }

    registerProperty(pluginId, def) {
        const { id, category, type } = def;

        if (!id || !category || !type) {
            throw new Error('Property definition must have id, category, and type');
        }
        if (this._properties.has(id) && this._properties.get(id) !== pluginId) {
            throw new Error(`Property "${id}" is already registered by another plugin`);
        }

        propertyRegistry.register({ ...def, _pluginId: pluginId });
        this._properties.set(id, pluginId);
        this._pluginManager._emit('plugin:property-registered', { pluginId, propertyId: id });
        return { id, pluginId };
    }

    registerTemplate(pluginId, template) {
        const { id, name, category } = template;

        if (!id || !name) {
            throw new Error('Template must have id and name');
        }
        if (this._templates.has(id) && this._templates.get(id) !== pluginId) {
            throw new Error(`Template "${id}" is already registered by another plugin`);
        }

        const enriched = {
            ...template,
            _pluginId: pluginId,
            _isPluginTemplate: true
        };

        this._templates.set(id, { pluginId, template: enriched });
        this._pluginManager._emit('plugin:template-registered', { pluginId, templateId: id });
        return { id, pluginId, name, category };
    }

    registerComponent(pluginId, config) {
        const { name, html } = config;

        if (!name || !html) {
            throw new Error('Component config must have name and html');
        }
        if (this._components.has(name) && this._components.get(name) !== pluginId) {
            throw new Error(`Component "${name}" is already registered by another plugin`);
        }

        const def = {
            id: `plugin-${pluginId}-${Date.now()}`,
            name,
            html,
            bpStyles: config.bpStyles || null,
            thumbnail: config.thumbnail || null,
            _pluginId: pluginId
        };

        this._components.set(name, { pluginId, def });
        this._pluginManager._emit('plugin:component-registered', { pluginId, componentName: name });
        return def;
    }

    registerExporter(pluginId, config) {
        const { id, label, export: exportFn } = config;

        if (!id || !label || typeof exportFn !== 'function') {
            throw new Error('Exporter config must have id, label, and export function');
        }
        if (this._exporters.has(id) && this._exporters.get(id) !== pluginId) {
            throw new Error(`Exporter "${id}" is already registered by another plugin`);
        }

        this._exporters.set(id, {
            pluginId,
            config: { id, label, icon: config.icon || null, export: exportFn },
            state: 'registered'
        });

        this._pluginManager._emit('plugin:exporter-registered', { pluginId, exporterId: id });
        return { id, pluginId, label };
    }

    getPanels() {
        return Array.from(this._panels.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    getPanel(id) {
        return this._panels.get(id) || null;
    }

    getExporters() {
        return Array.from(this._exporters.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    getTemplates() {
        return Array.from(this._templates.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    getComponents() {
        return Array.from(this._components.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    getCommands() {
        return Array.from(this._commands.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    getToolbarItems() {
        return Array.from(this._toolbarItems.entries()).map(([id, data]) => ({
            id,
            ...data
        }));
    }

    getProperties() {
        return Array.from(this._properties.entries()).map(([id, pluginId]) => ({
            id,
            pluginId
        }));
    }
}

export function createPluginAPI(pluginManager) {
    return new PluginAPI(pluginManager);
}

