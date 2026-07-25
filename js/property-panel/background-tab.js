import { createSection } from './utils.js';
import eventBus from '../event-bus.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';

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
        selectedElement.style[prop] = value;
        if (bpManager) {
            bpManager.setStyle(selectedElement, prop, value);
        }
        eventBus.emit('history:push', { type: 'style', element: selectedElement, prop, before, after: value });
        eventBus.emit('element:updated', selectedElement);
    }

    function update(el) {
        selectedElement = el;
        section.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            input.placeholder = input.dataset.placeholder || '';
            if (input.type === 'color') input.value = DEFAULT_COLOR_FALLBACK;
            else if (!el) input.value = '';
        });
        if (!el) return;
        const style = el.style;
        const computed = window.getComputedStyle(el);
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
