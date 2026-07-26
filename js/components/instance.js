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

    regenIds(root);

    if (def.bpStyles) {
        Object.entries(def.bpStyles).forEach(([id, styles]) => {
            const el = root.id === id ? root : root.querySelector(`#${CSS.escape(id)}`);
            if (el) el.__bpStyles = cloneDeep(styles);
        });
    }

    return root;
}

export function regenIds(el) {
    el.id = generateElementId();
    el.querySelectorAll('[data-editor-element]').forEach(child => {
        child.id = generateElementId();
    });
}

export function getInstances(editor, componentId) {
    return editor.canvas.querySelectorAll(`[data-component-id="${componentId}"]`);
}

export function positionInstance(root, x, y) {
    root.style.left = x + 'px';
    root.style.top = y + 'px';
}
