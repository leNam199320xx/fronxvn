import { createSection, toHex } from './utils.js';
import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';
import { XY_GROUP, WH_GROUP, MIN_MAX_GROUP, MIN_MAX_H_GROUP } from '../property/property-groups.js';
import { emitStyleHistory, emitElementUpdated, applyStyle, enableInputs, clearInputs } from '../property/property-utils.js';

const LAYOUT_FIELDS = [
    { label: 'Position', prop: 'position', type: 'select', options: ['', 'static', 'relative', 'absolute', 'fixed', 'sticky'] },
    XY_GROUP,
    WH_GROUP,
    MIN_MAX_GROUP,
    MIN_MAX_H_GROUP,
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

        applyStyle(CanvasAPI, bpManager, selectedElement, prop, value);

        if (prop === 'display') {
            handleDisplayChange(selectedElement, value);
        }

        if (prop === 'position') {
            handlePositionChange(selectedElement, value);
        }

        emitStyleHistory(eventBus, selectedElement, prop, before, value);
        emitElementUpdated(eventBus, selectedElement);
    }

    function handleDisplayChange(el, displayValue) {
        const isFlowLayout = ['flex', 'grid'].includes(displayValue);
        const children = el.querySelectorAll(':scope > [data-editor-element]');

        children.forEach(child => {
            if (isFlowLayout) {
                CanvasAPI.setStyle(child, 'position', 'relative');
                CanvasAPI.setStyle(child, 'left', '');
                CanvasAPI.setStyle(child, 'top', '');
            } else {
                CanvasAPI.setStyle(child, 'position', 'absolute');
                if (!child.style.left) CanvasAPI.setStyle(child, 'left', '0px');
                if (!child.style.top) CanvasAPI.setStyle(child, 'top', '0px');
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
                    CanvasAPI.setStyle(el, 'left', '');
                    CanvasAPI.setStyle(el, 'top', '');
                }
            }
        }
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

    const section = createSection('layout', 'Layout', LAYOUT_FIELDS, (prop, value) => {
        applyProperty(prop, value);
    });

    return { section, fields: LAYOUT_FIELDS, update, applyProperty };
}
