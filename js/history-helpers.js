import eventBus from './event-bus.js';

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
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}

export function setElementSize(el, width, height) {
    el.style.width = width + 'px';
    el.style.height = height + 'px';
}

export function setElementTransform(el, transform) {
    el.style.transform = transform;
}

export function setElementStyleProp(el, prop, value) {
    el.style[prop] = value;
}

export function removeElement(el) {
    el.remove();
}

export function appendElement(el, parent) {
    parent.appendChild(el);
}

export function prependElement(el, parent) {
    parent.insertBefore(el, parent.firstChild);
}

export function insertElementBefore(el, refNode, parent) {
    parent.insertBefore(el, refNode);
}

export function insertElementAfter(el, refNode, parent) {
    parent.insertBefore(el, refNode.nextSibling);
}
