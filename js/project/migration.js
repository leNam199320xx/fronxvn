import { deserializeElement } from '../core/dom.js';

export function extractBpStyles(elements) {
    const bpStyles = {};
    const collect = (elData) => {
        if (elData.id && elData.bpStyles) {
            bpStyles[elData.id] = elData.bpStyles;
        }
        if (Array.isArray(elData.children)) {
            elData.children.forEach(collect);
        }
    };
    elements.forEach(collect);
    return bpStyles;
}

export function buildLegacyPage(elements, meta) {
    const tempContainer = document.createElement('div');
    elements.forEach(data => {
        const el = deserializeElement(data);
        tempContainer.appendChild(el);
    });
    const html = tempContainer.innerHTML;
    const bpStyles = extractBpStyles(elements);
    return {
        id: 'page-legacy-0001',
        name: 'Page 1',
        html,
        bpStyles,
        meta: meta || {
            title: '',
            description: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            canonical: ''
        }
    };
}
