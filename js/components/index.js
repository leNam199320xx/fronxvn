import eventBus from '../event-bus.js';
import { create, updateFromInstance, deleteById, rename } from './definition.js';
import { createDOM, getInstances, positionInstance } from './instance.js';
import { syncAll } from './sync.js';
import { detach, detachAll } from './detach.js';
import { getPlainComponents, loadComponentsFromData } from './storage.js';
import { generateComponentId, generateInstanceId, findDef } from './utils.js';
import { COMPONENT_INSERT_BASE_X, COMPONENT_INSERT_BASE_Y } from '../config.js';

import debug from '../debug.js';

export class ComponentManager {
    constructor(editor) {
        this.editor = editor;
        this._components = [];
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    saveComponent(name) {
        debug.action('component', 'saveComponent', { name });
        const elements = this.editor.selection.getSelectedAll();
        const def = create(this._components, elements, name);
        if (def) {
            eventBus.emit('component:saved', def);
            eventBus.emit('component:list-changed', this._components);
        }
        return def;
    }

    insertComponent(componentId, opts = {}) {
        debug.action('component', 'insertComponent', { componentId });
        const def = findDef(this._components, componentId);
        if (!def) {
            console.warn(`[ComponentManager] insertComponent: component "${componentId}" not found`);
            return null;
        }

        const instanceId = generateInstanceId();
        const root = createDOM(def, instanceId);

        positionInstance(root, opts.x ?? COMPONENT_INSERT_BASE_X, opts.y ?? COMPONENT_INSERT_BASE_Y);

        const parent = this.editor.canvas;
        parent.appendChild(root);

        eventBus.emit('history:push', {
            type: 'component:insert',
            element: root,
            parent,
            componentId,
            instanceId
        });

        eventBus.emit('element:added', root);
        eventBus.emit('layer:refresh');
        this.editor.selection.select(root);

        return root;
    }

    updateDefinition(componentId) {
        debug.action('component', 'updateDefinition', { componentId });
        const def = findDef(this._components, componentId);
        if (!def) return;

        const sel = this.editor.selection.getSelected();
        if (!sel || sel.dataset.componentId !== componentId) {
            console.warn('[ComponentManager] updateDefinition: selected element is not an instance of this component');
            return;
        }

        updateFromInstance(this._components, componentId, sel);
        syncAll(this.editor, componentId, def, sel);

        eventBus.emit('component:updated', def);
        eventBus.emit('component:list-changed', this._components);
        eventBus.emit('layer:refresh');
    }

    detachInstance(instanceEl) {
        debug.action('component', 'detachInstance', { id: instanceEl.id });
        detach(instanceEl);
    }

    deleteComponent(componentId) {
        debug.action('component', 'deleteComponent', { componentId });
        const def = findDef(this._components, componentId);
        if (!def) return;

        detachAll(this.editor, componentId);
        deleteById(this._components, componentId);
    }

    renameComponent(componentId, newName) {
        debug.action('component', 'renameComponent', { componentId, newName });
        rename(this._components, componentId, newName);
    }

    getComponents() {
        return getPlainComponents(this._components);
    }

    loadComponents(data) {
        this._components = loadComponentsFromData(data);
        eventBus.emit('component:list-changed', this._components);
    }

    getDefinition(id) {
        return findDef(this._components, id);
    }

    _bindEvents() {
        eventBus.on('component:save', () => this.saveComponent());
        eventBus.on('component:insert', (id) => this.insertComponent(id));
        eventBus.on('component:update-def', (id) => this.updateDefinition(id));
        eventBus.on('component:detach', () => {
            const el = this.editor.selection.getSelected();
            if (el) this.detachInstance(el);
        });
        eventBus.on('component:delete', (id) => this.deleteComponent(id));
        eventBus.on('component:rename', ({ id, name }) => this.renameComponent(id, name));
    }
}
