/**
 * History - Quản lý Undo/Redo
 * Lưu mọi thao tác để có thể hoàn tác
 */
import eventBus from './event-bus.js';

export class History {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 100;

        this._bindEvents();
    }

    /** Bind events */
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

    /** Thêm action vào history */
    push(action) {
        // Lưu thêm nextSibling tại thời điểm push để insertBefore chính xác khi undo
        if ((action.type === 'add' || action.type === 'delete') && action.element) {
            action.nextSibling = action.element.nextSibling || null;
        }
        this.undoStack.push(action);
        this.redoStack = []; // Xóa redo khi có action mới

        // Giới hạn kích thước
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }

        eventBus.emit('history:changed', {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });
    }

    /** Undo */
    undo() {
        if (this.undoStack.length === 0) return;

        const action = this.undoStack.pop();
        this.redoStack.push(action);

        this._revert(action);

        eventBus.emit('history:changed', {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });
    }

    /** Redo */
    redo() {
        if (this.redoStack.length === 0) return;

        const action = this.redoStack.pop();
        this.undoStack.push(action);

        this._apply(action);

        eventBus.emit('history:changed', {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });
    }

    /** Hoàn tác một action */
    _revert(action) {
        switch (action.type) {
            case 'move':
                action.element.style.left = action.before.left + 'px';
                action.element.style.top = action.before.top + 'px';
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'resize':
                action.element.style.left = action.before.left + 'px';
                action.element.style.top = action.before.top + 'px';
                action.element.style.width = action.before.width + 'px';
                action.element.style.height = action.before.height + 'px';
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'style':
                action.element.style[action.prop] = action.before;
                eventBus.emit('element:updated', action.element);
                break;

            case 'add':
                action.element.remove();
                eventBus.emit('element:deleted', action.element);
                eventBus.emit('layer:refresh');
                break;

            case 'delete':
                // Chèn đúng vị trí ban đầu thay vì append cuối
                if (action.nextSibling && action.parent.contains(action.nextSibling)) {
                    action.parent.insertBefore(action.element, action.nextSibling);
                } else {
                    action.parent.appendChild(action.element);
                }
                eventBus.emit('element:added', action.element);
                eventBus.emit('layer:refresh');
                break;

            case 'rotate':
                action.element.style.transform = action.before;
                eventBus.emit('element:updated', action.element);
                break;
        }
    }

    /** Áp dụng lại một action (redo) */
    _apply(action) {
        switch (action.type) {
            case 'move':
                action.element.style.left = action.after.left + 'px';
                action.element.style.top = action.after.top + 'px';
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'resize':
                action.element.style.left = action.after.left + 'px';
                action.element.style.top = action.after.top + 'px';
                action.element.style.width = action.after.width + 'px';
                action.element.style.height = action.after.height + 'px';
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'style':
                action.element.style[action.prop] = action.after;
                eventBus.emit('element:updated', action.element);
                break;

            case 'add':
                // Redo add: chèn đúng vị trí ban đầu
                if (action.nextSibling && action.parent.contains(action.nextSibling)) {
                    action.parent.insertBefore(action.element, action.nextSibling);
                } else {
                    action.parent.appendChild(action.element);
                }
                eventBus.emit('element:added', action.element);
                eventBus.emit('layer:refresh');
                break;

            case 'delete':
                action.element.remove();
                eventBus.emit('element:deleted', action.element);
                eventBus.emit('layer:refresh');
                break;

            case 'rotate':
                action.element.style.transform = action.after;
                eventBus.emit('element:updated', action.element);
                break;
        }
    }

    /** Xóa toàn bộ history */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        eventBus.emit('history:changed', { canUndo: false, canRedo: false });
    }
}
