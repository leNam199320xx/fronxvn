import { createSection, toHex } from './utils.js';
import eventBus from '../event-bus.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';

const LAYOUT_FIELDS = [
    { label: 'Position', prop: 'position', type: 'select', options: ['', 'static', 'relative', 'absolute', 'fixed', 'sticky'] },
    { label: 'X-Y', type: 'group', fields: [
        { label: 'X', prop: 'left', type: 'text', numeric: true, unit: 'px', placeholder: '0px', short: true },
        { label: 'Y', prop: 'top', type: 'text', numeric: true, unit: 'px', placeholder: '0px', short: true }
    ]},
    { label: 'W-H', type: 'group', fields: [
        { label: 'W', prop: 'width', type: 'text', numeric: true, unit: 'px', placeholder: 'auto', short: true },
        { label: 'H', prop: 'height', type: 'text', numeric: true, unit: 'px', placeholder: 'auto', short: true }
    ]},
    { label: 'Min-Max', type: 'group', fields: [
        { label: 'Min W', prop: 'minWidth', type: 'text', placeholder: 'none', short: true },
        { label: 'Max W', prop: 'maxWidth', type: 'text', placeholder: 'none', short: true }
    ]},
    { label: 'Min-Max H', type: 'group', fields: [
        { label: 'Min H', prop: 'minHeight', type: 'text', placeholder: 'none', short: true },
        { label: 'Max H', prop: 'maxHeight', type: 'text', placeholder: 'none', short: true }
    ]},
    { label: 'Display', prop: 'display', type: 'select', options: ['', 'block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
    { label: 'Direction', prop: 'flexDirection', type: 'select', options: ['', 'row', 'row-reverse', 'column', 'column-reverse'] },
    { label: 'Justify', prop: 'justifyContent', type: 'select', options: ['', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
    { label: 'Align', prop: 'alignItems', type: 'select', options: ['', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'] },
    { label: 'Wrap', prop: 'flexWrap', type: 'select', options: ['', 'nowrap', 'wrap', 'wrap-reverse'] },
    { label: 'Gap', prop: 'gap', type: 'text', numeric: true, unit: 'px', placeholder: '0' },
    { label: 'Overflow', prop: 'overflow', type: 'select', options: ['', 'visible', 'hidden', 'scroll', 'auto'] },
    { label: 'Z-Index', prop: 'zIndex', type: 'text', numeric: true, placeholder: 'auto' }
];

export function createLayoutTab({ editor, eventBus }) {
    const bpManager = editor.breakpointManager;
    let selectedElement = null;

    function applyProperty(prop, value) {
        if (!selectedElement) return;

        const before = selectedElement.style[prop];

        if (['left', 'top', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'gap'].includes(prop)) {
            if (value && !isNaN(parseFloat(value)) && !value.includes('px') && !value.includes('%') && !value.includes('auto')) {
                value = value + 'px';
            }
        }

        selectedElement.style[prop] = value;

        if (bpManager) {
            bpManager.setStyle(selectedElement, prop, value);
        }

        if (prop === 'display') {
            handleDisplayChange(selectedElement, value);
        }

        if (prop === 'position') {
            handlePositionChange(selectedElement, value);
        }

        eventBus.emit('history:push', {
            type: 'style',
            element: selectedElement,
            prop,
            before,
            after: value
        });

        eventBus.emit('element:updated', selectedElement);
    }

    function handleDisplayChange(el, displayValue) {
        const isFlowLayout = ['flex', 'grid'].includes(displayValue);
        const children = el.querySelectorAll(':scope > [data-editor-element]');

        children.forEach(child => {
            if (isFlowLayout) {
                child.style.position = 'relative';
                child.style.left = '';
                child.style.top = '';
            } else {
                child.style.position = 'absolute';
                if (!child.style.left) child.style.left = '0px';
                if (!child.style.top) child.style.top = '0px';
            }
        });

        eventBus.emit('layer:refresh');
    }

    function handlePositionChange(el, positionValue) {
        if (['relative', 'static', ''].includes(positionValue)) {
            const parent = el.parentNode;
            if (parent && parent !== editor.canvas) {
                const parentDisplay = parent.style.display;
                if (['flex', 'grid'].includes(parentDisplay)) {
                    el.style.left = '';
                    el.style.top = '';
                }
            }
        }
    }

    function update(el) {
        selectedElement = el;
        section.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            input.placeholder = input.dataset.placeholder || '';
            if (input.type === 'color') {
                input.value = DEFAULT_COLOR_FALLBACK;
            } else if (!el) {
                input.value = '';
            }
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

    const section = createSection('layout', 'Layout', LAYOUT_FIELDS, (prop, value) => {
        applyProperty(prop, value);
    });

    return { section, fields: LAYOUT_FIELDS, update, applyProperty };
}
