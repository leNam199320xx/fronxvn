import { HISTORY_MAX_SIZE } from '../utilities/config.js';
import eventBus from '../events/event-bus.js';
import debug from '../utilities/debug.js';

export class CommandStack {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = HISTORY_MAX_SIZE;
    }

    push(action) {
        debug.action('history', 'push', action);
        if ((action.type === 'add' || action.type === 'delete') && action.element) {
            action.nextSibling = action.element.nextSibling || null;
        }
        this.undoStack.push(action);
        this.redoStack = [];

        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        eventBus.emit('history:changed', {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const action = this.undoStack.pop();
        debug.action('history', 'undo', action);
        this.redoStack.push(action);

        eventBus.emit('history:changed', {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });

        return action;
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const action = this.redoStack.pop();
        debug.action('history', 'redo', action);
        this.undoStack.push(action);

        eventBus.emit('history:changed', {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });

        return action;
    }

    clear() {
        this._releaseElementReferences(this.undoStack);
        this._releaseElementReferences(this.redoStack);
        this.undoStack = [];
        this.redoStack = [];
        eventBus.emit('history:changed', { canUndo: false, canRedo: false });
    }

    _releaseElementReferences(stack) {
        for (let i = 0; i < stack.length; i++) {
            const action = stack[i];
            if (action && action.element && action.element.remove) {
                action.element = null;
            }
        }
    }
}


