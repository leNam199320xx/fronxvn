import eventBus from '../event-bus.js';

export function detach(instanceEl) {
    if (!instanceEl) return;

    const componentId = instanceEl.dataset.componentId;
    const instanceId = instanceEl.dataset.instanceId;

    instanceEl.removeAttribute('data-component-id');
    instanceEl.removeAttribute('data-instance-id');

    instanceEl.querySelectorAll('[data-component-id]').forEach(el => {
        el.removeAttribute('data-component-id');
        el.removeAttribute('data-instance-id');
    });

    eventBus.emit('history:push', {
        type: 'component:detach',
        element: instanceEl,
        componentId,
        instanceId
    });

    eventBus.emit('element:updated', instanceEl);
    eventBus.emit('layer:refresh');
}

export function detachAll(editor, componentId) {
    editor.canvas
        .querySelectorAll(`[data-component-id="${componentId}"]`)
        .forEach(el => detach(el));
}
