import eventBus from '../../core/events/event-bus.js';

export function emitElementUpdated(el) {
    eventBus.emit('element:updated', el);
}

export function emitElementTransform(el) {
    eventBus.emit('element:transform', el);
}

export function emitLayerRefresh() {
    eventBus.emit('layer:refresh');
}

export function syncBreakpointStyles(breakpointManager, el, props) {
    if (!breakpointManager) return;
    props.forEach(({ prop, value }) => {
        breakpointManager.setStyle(el, prop, value);
    });
}

export function setElementPosition(el, left, top) {
    if (!el) return;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

export function setElementSize(el, width, height) {
    if (!el) return;
    el.style.width = width + 'px';
    el.style.height = height + 'px';
}

export function setElementTransform(el, transform) {
    if (!el) return;
    el.style.transform = transform;
}

export function setElementStyleProp(el, prop, value) {
    if (!el || !prop) return;
    el.style[prop] = value;
}

export function removeElement(el) {
    if (!el) return;
    el.remove();
}

export function appendElement(el, parent) {
    if (!el || !parent) return;
    parent.appendChild(el);
}

export function prependElement(el, parent) {
    if (!el || !parent) return;
    parent.insertBefore(el, parent.firstChild);
}

export function insertElementBefore(el, refNode, parent) {
    if (!el || !parent) return;
    parent.insertBefore(el, refNode);
}

export function insertElementAfter(el, refNode, target) {
    if (!el || !target) return;
    target.insertBefore(el, refNode.nextSibling);
}
