import { generateElementId } from './ids.js';

export function deserializeElement(data) {
    const el = document.createElement(data.tag || 'div');
    el.setAttribute('data-editor-element', '');
    el.id = data.id || generateElementId();

    if (data.type) el.dataset.type = data.type;
    if (data.name) el.dataset.name = data.name;
    if (data.container) el.dataset.container = 'true';
    if (data.locked) {
        el.dataset.locked = 'true';
        el.style.pointerEvents = 'none';
    }
    if (data.hidden) {
        el.dataset.hidden = 'true';
        el.dataset.originalDisplay = data.originalDisplay || '';
    }

    if (data.bpStyles) {
        el.__bpStyles = data.bpStyles;
    }

    if (data.style) {
        Object.entries(data.style).forEach(([prop, value]) => {
            el.style[prop] = value;
        });
    }

    if (data.attributes) {
        Object.entries(data.attributes).forEach(([attr, value]) => {
            el.setAttribute(attr, value);
        });
    }

    if (data.text && (!data.children || data.children.length === 0)) {
        el.innerHTML = data.text;
    }

    if (data.children) {
        data.children.forEach(childData => {
            const child = deserializeElement(childData);
            el.appendChild(child);
        });
    }

    return el;
}
