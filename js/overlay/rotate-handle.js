import eventBus from '../event-bus.js';

export class RotateHandle {
    constructor(selectionBox, overlay) {
        this.overlay = overlay;
        this.isRotating = false;

        this.rotationLine = document.createElement('div');
        this.rotationLine.className = 'rotation-line';
        this.rotationLine.style.display = 'none';
        selectionBox.appendChild(this.rotationLine);

        this.rotationHandle = document.createElement('div');
        this.rotationHandle.className = 'rotation-handle';
        this.rotationHandle.style.display = 'none';
        selectionBox.appendChild(this.rotationHandle);

        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    _bindEvents() {

    _bindEvents() {
        eventBus.on('rotate:start', () => {
            this.isRotating = true;
            this.overlay.renderer._showRealtimeLabels();
        });

        eventBus.on('rotate:end', () => {
            this.isRotating = false;
            this.overlay.renderer._scheduleHideLabels();
        });
    }

    setVisible(visible) {
        this.rotationHandle.style.display = visible ? 'block' : 'none';
        this.rotationLine.style.display = visible ? 'block' : 'none';
    }
}
