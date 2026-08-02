import { createSection } from './utils.js';
import eventBus from '../../core/events/event-bus.js';
import CanvasAPI from '../../core/canvas/canvas-api.js';
import { DEFAULT_COLOR_FALLBACK } from '../../core/utilities/config.js';
import { emitStyleHistory, emitElementUpdated, applyStyle, enableInputs, clearInputs } from '../../core/property/property-utils.js';

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
        applyStyle(CanvasAPI, bpManager, selectedElement, prop, value);
        emitStyleHistory(eventBus, selectedElement, prop, before, value);
        emitElementUpdated(eventBus, selectedElement);
    }

    function update(el) {
        selectedElement = el;
        [shadowSection, effectSection].forEach(section => {
            enableInputs(section);
            if (!el) clearInputs(section, DEFAULT_COLOR_FALLBACK);
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


