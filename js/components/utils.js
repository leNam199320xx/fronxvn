import { generateId } from '../core/ids.js';

export function generateComponentId() {
    return generateId('comp');
}

export function generateInstanceId() {
    return generateId('inst');
}

export function findDef(components, id) {
    return components.find(c => c.id === id);
}

export function collectBpStyles(elements) {
    const bpStyles = {};
    elements.forEach(el => {
        el.querySelectorAll('[data-editor-element]').forEach(node => {
            if (node.id && node.__bpStyles) bpStyles[node.id] = node.__bpStyles;
        });
        if (el.id && el.__bpStyles) bpStyles[el.id] = el.__bpStyles;
    });
    return bpStyles;
}

export function isPlainObject(val) {
    return val && typeof val === 'object' && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype;
}
