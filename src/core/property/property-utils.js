import DirtyState, { DIRTY } from '../dirty-state.js';

export function emitStyleHistory(eventBus, element, prop, before, after) {
    eventBus.emit('history:push', {
        type: 'style',
        element,
        prop,
        before,
        after
    });
}

export function emitElementUpdated(eventBus, element) {
    eventBus.emit('element:updated', element);
}

export function emitElementTransform(eventBus, element) {
    eventBus.emit('element:transform', element);
}

export function applyStyle(CanvasAPI, bpManager, el, prop, value) {
    CanvasAPI.setStyle(el, prop, value);
    if (bpManager) {
        bpManager.setStyle(el, prop, value);
    }
}

export function enableInputs(container) {
    container.querySelectorAll('[data-prop]').forEach(input => {
        input.disabled = false;
        input.placeholder = input.dataset.placeholder || '';
    });
}

export function clearInputs(container, colorFallback = '') {
    container.querySelectorAll('[data-prop]').forEach(input => {
        input.disabled = false;
        if (input.type === 'color') {
            input.value = colorFallback;
        } else {
            input.value = '';
        }
    });
}

export function removeMultiSelectNotice(panel) {
    const notice = panel.querySelector('.multi-select-notice');
    if (notice) notice.remove();
}

