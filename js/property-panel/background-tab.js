import { createSection } from './utils.js';
import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';
import { emitStyleHistory, emitElementUpdated, applyStyle, enableInputs, clearInputs } from '../property/property-utils.js';

const BACKGROUND_FIELDS = [
    { label: 'BG Color', prop: 'backgroundColor', type: 'color' },
    { label: 'BG Image', prop: 'backgroundImage', type: 'text', placeholder: "url(...) or linear-gradient(...)" },
    { label: 'BG Size', prop: 'backgroundSize', type: 'select', options: ['', 'auto', 'cover', 'contain', '100% 100%'] },
    { label: 'BG Pos', prop: 'backgroundPosition', type: 'text', placeholder: 'center' },
    { label: 'BG Repeat', prop: 'backgroundRepeat', type: 'select', options: ['', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'] }
];

export function createBackgroundTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;

    function applyProperty(prop, value) {
        if (!selectedElement) return;
        const before = selectedElement.style[prop];
        applyStyle(CanvasAPI, bpManager, selectedElement, prop, value);
        emitStyleHistory(eventBus, selectedElement, prop, before, value);
        emitElementUpdated(eventBus, selectedElement);
    }

    function update(el) {
        selectedElement = el;
        enableInputs(section);
        if (!el) {
            clearInputs(section, DEFAULT_COLOR_FALLBACK);
            return;
        }
        const style = el.style;
        const computed = CanvasAPI.getComputedStyle(el);
        section.querySelectorAll('[data-prop]').forEach(input => {
            const prop = input.dataset.prop;
            if (prop.endsWith('-text')) return;
            let value = style[prop] || '';
            if (input.type === 'color') {
                value = value || computed[prop];
                input.value = value || DEFAULT_COLOR_FALLBACK;
                const textInput = section.querySelector(`[data-prop="${prop}-text"]`);
                if (textInput) textInput.value = input.value;
            } else if (input.tagName === 'SELECT') {
                input.value = value || computed[prop] || '';
            } else {
                input.value = value || '';
            }
        });
    }

    const section = createSection('background', 'Background', BACKGROUND_FIELDS, (prop, value) => {
        applyProperty(prop, value);
    });

    return { section, fields: BACKGROUND_FIELDS, update, applyProperty };
}
