import { createSection } from './utils.js';
import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';

const BORDER_FIELDS = [
    { label: 'Width', prop: 'borderWidth', type: 'text', numeric: true, unit: 'px', placeholder: '0' },
    { label: 'Style', prop: 'borderStyle', type: 'select', options: ['', 'none', 'solid', 'dashed', 'dotted', 'double', 'groove'] },
    { label: 'Color', prop: 'borderColor', type: 'color' },
    { label: 'Radius', prop: 'borderRadius', type: 'text', numeric: true, unit: 'px', placeholder: '0' }
];

export function createBorderTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;

    function applyProperty(prop, value) {
        if (!selectedElement) return;
        const before = selectedElement.style[prop];
        if (['borderWidth', 'borderRadius'].includes(prop)) {
            if (value && !isNaN(parseFloat(value)) && !value.includes('px') && !value.includes('%') && !value.includes('auto')) {
                value = value + 'px';
            }
        }
        CanvasAPI.setStyle(selectedElement, prop, value);
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

    const section = createSection('border', 'Border', BORDER_FIELDS, (prop, value) => {
        applyProperty(prop, value);
    });

    return { section, fields: BORDER_FIELDS, update, applyProperty };
}
