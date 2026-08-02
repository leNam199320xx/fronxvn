export class ResizeHandles {
    constructor(selectionBox) {
        this.handles = {};
        this.selectionBox = selectionBox;

        const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.handle = pos;
            handle.style.display = 'none';
            this.selectionBox.appendChild(handle);
            this.handles[pos] = handle;
        });
    }

    init() {}

    refresh() {}

    destroy() {}

    setVisible(visible) {
        Object.values(this.handles).forEach(h => h.style.display = visible ? 'block' : 'none');
    }
}
