import { generateInstanceId } from './utils.js';
import { generateElementId } from '../core/ids.js';
import { cloneDeep } from '../core/clone.js';
import CanvasAPI from '../canvas/canvas-api.js';

export function createDOM(def, instanceId) {
    const tempDiv = CanvasAPI.createElement('div');
    tempDiv.innerHTML = def.html;

    const roots = Array.from(tempDiv.children);
    let root;

    if (roots.length === 1) {
        root = roots[0];
    } else {
        root = CanvasAPI.createElement('div');
        root.setAttribute('data-editor-element', '');
        root.dataset.type = 'container';
        root.dataset.name = def.name;
        root.dataset.container = 'true';
        root.style.position = 'absolute';
        roots.forEach(r => root.appendChild(r));
    }

    root.dataset.componentId = def.id;
    root.dataset.instanceId = instanceId;
    root.dataset.name = def.name;

    const idMap = regenIds(root);

    if (def.bpStyles) {
        const remapped = {};
        Object.entries(def.bpStyles).forEach(([oldId, styles]) => {
            const newId = idMap.get(oldId) || oldId;
            remapped[newId] = cloneDeep(styles);
        });
        Object.entries(remapped).forEach(([id, styles]) => {
            const el = id === root.id ? root : root.querySelector(`#${CSS.escape(id)}`);
            if (el) el.__bpStyles = styles;
        });
    }

    return root;
}

export function regenIds(el) {
    const oldId = el.id;
    const newId = generateElementId();
    el.id = newId;
    const mapping = new Map();
    if (oldId) mapping.set(oldId, newId);

    el.querySelectorAll('[data-editor-element]').forEach(child => {
        const childOldId = child.id;
        const childNewId = generateElementId();
        child.id = childNewId;
        if (childOldId) mapping.set(childOldId, childNewId);
    });

    return mapping;
}

export function getInstances(editor, componentId) {
    return editor.canvas.querySelectorAll(`[data-component-id="${componentId}"]`);
}

export function positionInstance(root, x, y) {
    root.style.left = x + 'px';
    root.style.top = y + 'px';
}
