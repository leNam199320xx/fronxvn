import { createSection } from './utils.js';
import eventBus from '../event-bus.js';

const TRANSFORM_FIELDS = [
    { label: 'Rotate', prop: 'rotate', type: 'text', placeholder: '0deg' },
    { label: 'Scale', prop: 'scale', type: 'text', placeholder: '1' },
    { label: 'Translate', prop: 'translate', type: 'text', placeholder: '0px 0px' },
    { label: 'Skew', prop: 'skew', type: 'text', placeholder: '0deg' }
];

export function createTransformTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;

    function applyProperty(prop, value) {
        if (!selectedElement) return;
        const before = selectedElement.style[prop];
        selectedElement.style[prop] = value;
        if (bpManager) {
            bpManager.setStyle(selectedElement, prop, value);
        }
        eventBus.emit('history:push', { type: 'style', element: selectedElement, prop, before, after: value });
        eventBus.emit('element:updated', selectedElement);
        eventBus.emit('element:transform', selectedElement);
    }

    function update(el) {
        selectedElement = el;
        section.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            input.placeholder = input.dataset.placeholder || '';
            if (!el) input.value = '';
        });
        if (!el) return;
        const style = el.style;
        section.querySelectorAll('[data-prop]').forEach(input => {
            const prop = input.dataset.prop;
            if (prop.endsWith('-text')) return;
            input.value = style[prop] || '';
        });
    }

    const section = createSection('transform', 'Transform', TRANSFORM_FIELDS, (prop, value) => {
        applyProperty(prop, value);
    });

    return { section, fields: TRANSFORM_FIELDS, update, applyProperty };
}
