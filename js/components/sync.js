import eventBus from '../event-bus.js';
import { createDOM } from './instance.js';

export function syncAll(editor, componentId, def, skip) {
    editor.canvas
        .querySelectorAll(`[data-component-id="${componentId}"]`)
        .forEach(inst => {
            if (inst === skip) return;

            const instanceId = inst.dataset.instanceId;
            const parent = inst.parentNode;
            const nextSibling = inst.nextSibling;

            const newInst = createDOM(def, instanceId);

            newInst.style.left = inst.style.left;
            newInst.style.top = inst.style.top;
            newInst.style.width = inst.style.width || newInst.style.width;
            newInst.style.height = inst.style.height || newInst.style.height;

            if (nextSibling) {
                parent.insertBefore(newInst, nextSibling);
            } else {
                parent.appendChild(newInst);
            }
            inst.remove();

            eventBus.emit('element:updated', newInst);
        });
}
