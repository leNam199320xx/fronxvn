import { createSection, toHex } from './utils.js';
import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';
import { emitStyleHistory, emitElementUpdated, applyStyle, enableInputs, clearInputs } from '../property/property-utils.js';

const TYPOGRAPHY_FIELDS = [
    { label: 'Font', prop: 'fontFamily', type: 'text', placeholder: 'Arial' },
    { label: 'Size', prop: 'fontSize', type: 'text', numeric: true, unit: 'px', placeholder: '16px' },
    { label: 'Weight', prop: 'fontWeight', type: 'select', options: ['', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
    { label: 'Line H', prop: 'lineHeight', type: 'text', placeholder: 'normal' },
    { label: 'Spacing', prop: 'letterSpacing', type: 'text', numeric: true, unit: 'px', placeholder: '0' },
    { label: 'Align', prop: 'textAlign', type: 'select', options: ['', 'left', 'center', 'right', 'justify'] },
    { label: 'Transform', prop: 'textTransform', type: 'select', options: ['', 'none', 'uppercase', 'lowercase', 'capitalize'] },
    { label: 'Decoration', prop: 'textDecoration', type: 'select', options: ['', 'none', 'underline', 'overline', 'line-through'] },
    { label: 'Color', prop: 'color', type: 'color' }
];

export function createTypographyTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;

    function applyProperty(prop, value) {
        if (!selectedElement) return;
        const before = selectedElement.style[prop];
        if (['fontSize', 'letterSpacing'].includes(prop)) {
            if (value && !isNaN(parseFloat(value)) && !value.includes('px') && !value.includes('em') && !value.includes('%')) {
                value = value + 'px';
            }
        }
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
                input.value = toHex(value) || DEFAULT_COLOR_FALLBACK;
                const textInput = section.querySelector(`[data-prop="${prop}-text"]`);
                if (textInput) textInput.value = input.value;
            } else if (input.tagName === 'SELECT') {
                input.value = value || computed[prop] || '';
            } else {
                input.value = value || '';
            }
        });
    }

    const section = createSection('typography', 'Typography', TYPOGRAPHY_FIELDS, (prop, value) => {
        applyProperty(prop, value);
    });

    return { section, fields: TYPOGRAPHY_FIELDS, update, applyProperty };
}
