import { generateId } from '../core/ids.js';

export function getPlainComponents(components) {
    return components.map(def => ({
        id: def.id,
        name: def.name,
        html: def.html,
        bpStyles: def.bpStyles || {},
        thumbnail: def.thumbnail || '',
        createdAt: def.createdAt || Date.now()
    }));
}

export function loadComponentsFromData(data) {
    if (!Array.isArray(data)) return [];
    return data.map(d => ({
        id: d.id || generateId('comp'),
        name: d.name || 'Component',
        html: d.html || '',
        bpStyles: d.bpStyles || {},
        thumbnail: d.thumbnail || '',
        createdAt: d.createdAt || Date.now()
    }));
}
