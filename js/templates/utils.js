export function serializeElement(el) {
    const obj = {
        tag:       el.tagName.toLowerCase(),
        type:      el.dataset.type || '',
        name:      el.dataset.name || '',
        container: el.dataset.container === 'true',
        style:     {},
        attributes: {},
        innerHTML: '',
        children:  []
    };

    const style = el.style;
    for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        obj.style[prop] = style.getPropertyValue(prop);
    }

    ['href', 'src', 'alt', 'placeholder', 'type', 'value'].forEach(attr => {
        if (el.hasAttribute(attr)) obj.attributes[attr] = el.getAttribute(attr);
    });

    const editorChildren = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
    if (editorChildren.length > 0) {
        editorChildren.forEach(child => obj.children.push(serializeElement(child)));
    } else {
        obj.innerHTML = el.innerHTML || '';
    }

    return obj;
}

export { deserializeElement } from '../core/dom.js';
export { generateId } from '../core/ids.js';
export { showNotification } from '../ui/toast.js';
import { NOTIFICATION_DISPLAY_DURATION, NOTIFICATION_FADE_DELAY } from '../config.js';
