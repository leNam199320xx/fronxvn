import eventBus from '../events/event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { SelectionState } from './selection-state.js';

export class SelectionEvents {
    constructor(selection) {
        this.selection = selection;
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    _bindEvents() {
        eventBus.on('pointer:mousedown', (data) => {
            if (this.selection.isEditing) return;
            const target = data.target;
            if (CanvasAPI.closest(target, '.resize-handle') ||
                CanvasAPI.closest(target, '.move-handle') ||
                CanvasAPI.closest(target, '.rotation-handle')) {
                return;
            }
            this.selection._handleMouseDown(data);
        });

        eventBus.on('pointer:mousemove', (data) => {
            if (this.selection.isEditing) return;
            this.selection._handleHover(data);
        });

        eventBus.on('pointer:dblclick', (data) => {
            this.selection._handleDoubleClick(data);
        });

        eventBus.on('element:deleted', (el) => {
            if (this.selection.selectionState.isSelected(el)) {
                this.selection.selectionState.removeFromSelection(el);
            }
        });

        eventBus.on('layer:select', (el) => {
            this.selection.selectionState.select(el);
        });

        eventBus.on('selection:deselect-all', () => {
            this.selection.selectionState.deselectAll();
        });
    }
}

