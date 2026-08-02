import { createSection } from './utils.js';
import eventBus from '../../core/events/event-bus.js';
import CanvasAPI from '../../core/canvas/canvas-api.js';
import { emitStyleHistory, emitElementUpdated, applyStyle, enableInputs, clearInputs } from '../../core/property/property-utils.js';

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
        applyStyle(CanvasAPI, bpManager, selectedElement, prop, value);
        emitStyleHistory(eventBus, selectedElement, prop, before, value);
        emitElementUpdated(eventBus, selectedElement);
        emitElementTransform(eventBus, selectedElement);
    }

    function update(el) {
        selectedElement = el;
        enableInputs(section);
        if (!el) {
            clearInputs(section);
            return;
        }
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

