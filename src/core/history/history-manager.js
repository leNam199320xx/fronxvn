import eventBus from '../events/event-bus.js';
import { CommandStack } from './command-stack.js';
import { UndoManager } from './undo.js';
import { RedoManager } from './redo.js';

export class HistoryManager {
    constructor(editor) {
        this.editor = editor;
        this.commandStack = new CommandStack();
        this.undoManager = new UndoManager(this);
        this.redoManager = new RedoManager(this);

        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    _isElementAlive(el) {
        return !!el && el.isConnected;
    }

    _validParent(parent) {
        return !!parent && parent.isConnected;
    }

    _fallbackParent(parent) {
        if (this._validParent(parent)) return parent;
        return this.editor.canvas;
    }

    get undoStack() {
        return this.commandStack.undoStack;
    }

    set undoStack(value) {
        this.commandStack.undoStack = value;
    }

    get redoStack() {
        return this.commandStack.redoStack;
    }

    set redoStack(value) {
        this.commandStack.redoStack = value;
    }

    push(action) {
        this.commandStack.push(action);
    }

    undo() {
        const action = this.commandStack.undo();
        if (action) {
            this.undoManager.undo(action);
        }
    }

    redo() {
        const action = this.commandStack.redo();
        if (action) {
            this.redoManager.redo(action);
        }
    }

    clear() {
        this.commandStack.clear();
    }

    _bindEvents() {
        eventBus.on('history:push', (action) => {
            this.push(action);
        });

        eventBus.on('history:undo', () => {
            this.undo();
        });

        eventBus.on('history:redo', () => {
            this.redo();
        });
    }
}

