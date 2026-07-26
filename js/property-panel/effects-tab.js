import { createSection } from './utils.js';
import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';

const SHADOW_FIELDS = [
    { label: 'Box Shadow', prop: 'boxShadow', type: 'text', placeholder: '0 2px 4px rgba(0,0,0,0.2)' }
];

const EFFECT_FIELDS = [
    { label: 'Opacity', prop: 'opacity', type: 'text', numeric: true, placeholder: '1' },
    { label: 'Filter', prop: 'filter', type: 'text', placeholder: 'blur(0px)' }
];

export function createEffectsTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;
    const shadowSection = createSection('shadow', 'Shadow', SHADOW_FIELDS, (prop, value) => applyProperty(prop, value));
    const effectSection = createSection('effect', 'Effect', EFFECT_FIELDS, (prop, value) => applyProperty(prop, value));

    function applyProperty(prop, value) {
        if (!selectedElement) return;
        const before = selectedElement.style[prop];
        CanvasAPI.setStyle(selectedElement, prop, value);
        if (bpManager) {
            bpManager.setStyle(selectedElement, prop, value);
        }
        eventBus.emit('history:push', { type: 'style', element: selectedElement, prop, before, after: value });
        eventBus.emit('element:updated', selectedElement);
    }

    function update(el) {
        selectedElement = el;
        [shadowSection, effectSection].forEach(section => {
            section.querySelectorAll('[data-prop]').forEach(input => {
                input.disabled = false;
                input.placeholder = input.dataset.placeholder || '';
                if (input.type === 'color') input.value = DEFAULT_COLOR_FALLBACK;
                else if (!el) input.value = '';
            });
        });
        if (!el) return;
        const style = el.style;
        [shadowSection, effectSection].forEach(section => {
            section.querySelectorAll('[data-prop]').forEach(input => {
                const prop = input.dataset.prop;
                if (prop.endsWith('-text')) return;
                input.value = style[prop] || '';
            });
        });
    }

    return {
        sections: [shadowSection, effectSection],
        fields: [...SHADOW_FIELDS, ...EFFECT_FIELDS],
        update,
        applyProperty
    };
}
