import { createSection } from './utils.js';
import eventBus from '../event-bus.js';

const MARGIN_FIELDS = [
    { label: 'Top', prop: 'marginTop', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
    { label: 'Right', prop: 'marginRight', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
    { label: 'Bottom', prop: 'marginBottom', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
    { label: 'Left', prop: 'marginLeft', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true }
];

const PADDING_FIELDS = [
    { label: 'Top', prop: 'paddingTop', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
    { label: 'Right', prop: 'paddingRight', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
    { label: 'Bottom', prop: 'paddingBottom', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
    { label: 'Left', prop: 'paddingLeft', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true }
];

export function createSpacingTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;
    const marginSection = createSection('margin', 'Margin', MARGIN_FIELDS, (prop, value) => applyProperty(prop, value));
    const paddingSection = createSection('padding', 'Padding', PADDING_FIELDS, (prop, value) => applyProperty(prop, value));

    function applyProperty(prop, value) {
        if (!selectedElement) return;
        const before = selectedElement.style[prop];
        if (['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(prop)) {
            if (value && !isNaN(parseFloat(value)) && !value.includes('px') && !value.includes('%') && !value.includes('auto')) {
                value = value + 'px';
            }
        }
        selectedElement.style[prop] = value;
        if (bpManager) {
            bpManager.setStyle(selectedElement, prop, value);
        }
        eventBus.emit('history:push', { type: 'style', element: selectedElement, prop, before, after: value });
        eventBus.emit('element:updated', selectedElement);
    }

    function update(el) {
        selectedElement = el;
        [marginSection, paddingSection].forEach(section => {
            section.querySelectorAll('[data-prop]').forEach(input => {
                input.disabled = false;
                input.placeholder = input.dataset.placeholder || '';
                if (!el) input.value = '';
            });
        });
        if (!el) return;
        const style = el.style;
        [marginSection, paddingSection].forEach(section => {
            section.querySelectorAll('[data-prop]').forEach(input => {
                const prop = input.dataset.prop;
                if (prop.endsWith('-text')) return;
                input.value = style[prop] || '';
            });
        });
    }

    return {
        sections: [marginSection, paddingSection],
        fields: [...MARGIN_FIELDS, ...PADDING_FIELDS],
        update,
        applyProperty
    };
}
