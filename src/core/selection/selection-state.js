import eventBus from '../events/event-bus.js';
import DirtyState, { DIRTY } from '../dirty-state.js';
import debug from '../utilities/debug.js';

export class SelectionState {
    constructor() {
        this.selectedElements = [];
    }

    init() {}

    refresh() {}

    destroy() {}

    select(el) {
        if (!el) return;
        if (this.selectedElements.length === 1 && this.selectedElements[0] === el) return;
        debug.action('selection', 'select', { id: el.id, type: el.dataset.type });
        this.selectedElements = [el];
        DirtyState.mark(DIRTY.SELECTION);
        eventBus.emit('selection:changed', this.selectedElements);
        eventBus.emit('element:selected', el);
    }

    toggleSelection(el) {
        if (!el) return;
        const idx = this.selectedElements.indexOf(el);
        debug.action('selection', 'toggleSelection', { id: el.id, type: el.dataset.type, adding: idx === -1 });
        if (idx === -1) {
            this.selectedElements.push(el);
        } else {
            this.selectedElements.splice(idx, 1);
        }

        DirtyState.mark(DIRTY.SELECTION);

        if (this.selectedElements.length === 1) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', this.selectedElements[0]);
        } else if (this.selectedElements.length === 0) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', this.selectedElements[0]);
        }
    }

    addToSelection(el) {
        if (!el) return;
        if (!this.selectedElements.includes(el)) {
            debug.action('selection', 'addToSelection', { id: el.id, type: el.dataset.type });
            this.selectedElements.push(el);
            DirtyState.mark(DIRTY.SELECTION);
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', el);
        }
    }

    removeFromSelection(el) {
        if (!el) return;
        debug.action('selection', 'removeFromSelection', { id: el.id, type: el.dataset.type });
        this.selectedElements = this.selectedElements.filter(e => e !== el);
        DirtyState.mark(DIRTY.SELECTION);
        if (this.selectedElements.length === 0) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('selection:changed', this.selectedElements);
        }
    }

    setSelection(elements) {
        debug.action('selection', 'setSelection', { count: elements.length });
        this.selectedElements = [...elements];
        DirtyState.mark(DIRTY.SELECTION);
        if (this.selectedElements.length === 0) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', this.selectedElements[0]);
        }
    }

    deselectAll() {
        if (this.selectedElements.length === 0) return;
        debug.action('selection', 'deselectAll', { count: this.selectedElements.length });
        this.selectedElements = [];
        DirtyState.mark(DIRTY.SELECTION);
        eventBus.emit('selection:changed', this.selectedElements);
        eventBus.emit('element:deselected');
    }

    deselect() {
        this.deselectAll();
    }

    getSelected() {
        return this.selectedElements[0] || null;
    }

    getSelectedAll() {
        return this.selectedElements;
    }

    isSelected(el) {
        return this.selectedElements.includes(el);
    }
}

