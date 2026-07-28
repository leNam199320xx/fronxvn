import eventBus from '../event-bus.js';

export class LayerDrag {
    constructor(panel) {
        this.panel = panel;
    }

    init() {}

    refresh() {}

    destroy() {}

    attach(item, el) {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', el.id);
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.style.borderBottom = '2px solid #2563eb';
        });
        item.addEventListener('dragleave', () => {
            item.style.borderBottom = '';
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.style.borderBottom = '';
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedEl = document.getElementById(draggedId);
            if (draggedEl && draggedEl !== el) {
                el.parentNode.insertBefore(draggedEl, el.nextSibling);
                eventBus.emit('layer:refresh');
                eventBus.emit('element:updated', draggedEl);
            }
        });
    }
}
