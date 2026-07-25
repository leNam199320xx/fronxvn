import eventBus from '../event-bus.js';
import { generateComponentId, findDef, collectBpStyles } from './utils.js';
import { generateThumbnail } from './thumbnail.js';

export function create(components, elements, name) {
    if (elements.length === 0) {
        console.warn('[ComponentManager] saveComponent: nothing selected');
        return null;
    }

    const tempDiv = document.createElement('div');
    elements.forEach(el => tempDiv.appendChild(el.cloneNode(true)));

    const bpStyles = collectBpStyles(elements);
    const compName = (name || '').trim() || `Component ${components.length + 1}`;
    const id = generateComponentId();

    const def = {
        id,
        name: compName,
        html: tempDiv.innerHTML,
        bpStyles,
        thumbnail: generateThumbnail(elements),
        createdAt: Date.now()
    };

    components.push(def);

    return def;
}

export function updateFromInstance(components, componentId, selectedElement) {
    const def = findDef(components, componentId);
    if (!def) return null;

    if (!selectedElement || selectedElement.dataset.componentId !== componentId) {
        console.warn('[ComponentManager] updateDefinition: selected element is not an instance of this component');
        return null;
    }

    const clone = selectedElement.cloneNode(true);
    clone.removeAttribute('data-component-id');
    clone.removeAttribute('data-instance-id');

    const tempDiv = document.createElement('div');
    tempDiv.appendChild(clone);
    def.html = tempDiv.innerHTML;

    const bpStyles = {};
    selectedElement.querySelectorAll('[data-editor-element]').forEach(node => {
        if (node.id && node.__bpStyles) bpStyles[node.id] = node.__bpStyles;
    });
    if (selectedElement.id && selectedElement.__bpStyles) bpStyles[selectedElement.id] = selectedElement.__bpStyles;
    def.bpStyles = bpStyles;

    def.thumbnail = generateThumbnail([selectedElement]);

    return def;
}

export function deleteById(components, componentId) {
    const idx = components.findIndex(c => c.id === componentId);
    if (idx === -1) return false;
    components.splice(idx, 1);
    eventBus.emit('component:deleted', componentId);
    eventBus.emit('component:list-changed', components);
    return true;
}

export function rename(components, componentId, newName) {
    const def = findDef(components, componentId);
    if (!def) return;
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    def.name = trimmed;
    eventBus.emit('component:list-changed', components);
}
