/**
 * History - Quản lý Undo/Redo
 * Lưu mọi thao tác để có thể hoàn tác
 */
import eventBus from './event-bus.js';
import { HISTORY_MAX_SIZE } from './config.js';
import debug from './debug.js';

import {
    setElementPosition,
    setElementSize,
    setElementTransform,
    setElementStyleProp,
    removeElement,
    appendElement,
    prependElement,
    insertElementBefore,
    insertElementAfter,
    syncBreakpointStyles,
    emitElementUpdated,
    emitElementTransform,
    emitLayerRefresh
} from './history-helpers.js';

export class History {
    constructor(editor) {
        this.editor = editor;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = HISTORY_MAX_SIZE;

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

    /** Undo */
    undo() {
        if (this.undoStack.length === 0) return;

        const action = this.undoStack.pop();
        debug.action('history', 'undo', action);
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
        debug.action('history', 'redo', action);
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
                setElementPosition(action.element, action.before.left, action.before.top);
                syncBreakpointStyles(this.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.before.left + 'px' },
                    { prop: 'top', value: action.before.top + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'resize':
                setElementPosition(action.element, action.before.left, action.before.top);
                setElementSize(action.element, action.before.width, action.before.height);
                syncBreakpointStyles(this.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.before.left + 'px' },
                    { prop: 'top', value: action.before.top + 'px' },
                    { prop: 'width', value: action.before.width + 'px' },
                    { prop: 'height', value: action.before.height + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'style':
                setElementStyleProp(action.element, action.prop, action.before);
                emitElementUpdated(action.element);
                break;

            case 'css-bulk':
                action.element.removeAttribute('style');
                (action.before || '').split('\n').forEach(line => {
                    const clean = line.trim().replace(/;$/, '');
                    const idx   = clean.indexOf(':');
                    if (idx === -1) return;
                    action.element.style.setProperty(clean.slice(0, idx).trim(), clean.slice(idx + 1).trim());
                });
                emitElementUpdated(action.element);
                break;

            case 'add':
                removeElement(action.element);
                eventBus.emit('element:deleted', action.element);
                emitLayerRefresh();
                break;

            case 'delete':
                if (action.nextSibling && action.parent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, action.parent);
                } else {
                    appendElement(action.element, action.parent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'rotate':
                setElementTransform(action.element, action.before);
                emitElementUpdated(action.element);
                break;

            case 'text-edit':
                action.element.innerHTML = action.before;
                emitElementUpdated(action.element);
                break;

            case 'group': {
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    setElementPosition(child, pos.left, pos.top);
                    appendElement(child, action.parent);
                });
                removeElement(action.groupEl);
                eventBus.emit('element:deleted', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'ungroup': {
                setElementPosition(action.groupEl, action.groupLeft, action.groupTop);
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    setElementPosition(child, pos.relLeft, pos.relTop);
                    appendElement(child, action.groupEl);
                });
                appendElement(action.groupEl, action.parent);
                eventBus.emit('element:added', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'component:insert':
                removeElement(action.element);
                eventBus.emit('element:deleted', action.element);
                emitLayerRefresh();
                break;

            case 'component:detach':
                action.element.dataset.componentId = action.componentId;
                action.element.dataset.instanceId  = action.instanceId;
                emitElementUpdated(action.element);
                emitLayerRefresh();
                break;

            case 'page:add':
                this.editor.pageManager.deletePage(action.pageId, { pushHistory: false });
                break;

            case 'page:delete':
                this.editor.pageManager._restorePageFromSnapshot(
                    action.pageSnapshot,
                    action.insertIdx
                );
                break;

            case 'page:rename':
                this.editor.pageManager.renamePage(action.pageId, action.before, { pushHistory: false });
                break;
        }
    }

    /** Áp dụng lại một action (redo) */
    _apply(action) {
        switch (action.type) {
            case 'move':
                setElementPosition(action.element, action.after.left, action.after.top);
                syncBreakpointStyles(this.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.after.left + 'px' },
                    { prop: 'top', value: action.after.top + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'resize':
                setElementPosition(action.element, action.after.left, action.after.top);
                setElementSize(action.element, action.after.width, action.after.height);
                syncBreakpointStyles(this.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.after.left + 'px' },
                    { prop: 'top', value: action.after.top + 'px' },
                    { prop: 'width', value: action.after.width + 'px' },
                    { prop: 'height', value: action.after.height + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'style':
                setElementStyleProp(action.element, action.prop, action.after);
                emitElementUpdated(action.element);
                break;

            case 'css-bulk':
                action.element.removeAttribute('style');
                (action.after || '').split('\n').forEach(line => {
                    const clean = line.trim().replace(/;$/, '');
                    const idx   = clean.indexOf(':');
                    if (idx === -1) return;
                    action.element.style.setProperty(clean.slice(0, idx).trim(), clean.slice(idx + 1).trim());
                });
                emitElementUpdated(action.element);
                break;

            case 'add':
                if (action.nextSibling && action.parent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, action.parent);
                } else {
                    appendElement(action.element, action.parent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'delete':
                removeElement(action.element);
                eventBus.emit('element:deleted', action.element);
                emitLayerRefresh();
                break;

            case 'rotate':
                setElementTransform(action.element, action.after);
                emitElementUpdated(action.element);
                break;

            case 'text-edit':
                action.element.innerHTML = action.after;
                emitElementUpdated(action.element);
                break;

            case 'group': {
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    setElementPosition(child, pos.left - action.groupLeft, pos.top - action.groupTop);
                    appendElement(child, action.groupEl);
                });
                appendElement(action.groupEl, action.parent);
                eventBus.emit('element:added', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'ungroup': {
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    setElementPosition(child, pos.relLeft + action.groupLeft, pos.relTop + action.groupTop);
                    insertElementBefore(child, action.groupEl, action.parent);
                });
                removeElement(action.groupEl);
                eventBus.emit('element:deleted', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'component:insert':
                if (action.nextSibling && action.parent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, action.parent);
                } else {
                    appendElement(action.element, action.parent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'component:detach':
                action.element.removeAttribute('data-component-id');
                action.element.removeAttribute('data-instance-id');
                emitElementUpdated(action.element);
                emitLayerRefresh();
                break;

            case 'page:add':
                if (action.pageSnapshot) {
                    this.editor.pageManager._restorePageFromSnapshot(
                        action.pageSnapshot,
                        action.insertIdx
                    );
                } else {
                    this.editor.pageManager.addPage({ pushHistory: false });
                }
                break;

            case 'page:delete':
                this.editor.pageManager.deletePage(action.pageId, { pushHistory: false });
                break;

            case 'page:rename':
                this.editor.pageManager.renamePage(action.pageId, action.after, { pushHistory: false });
                break;
        }
    }

    /** Xóa toàn bộ history */
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
