import eventBus from '../event-bus.js';
import {
    setElementPosition,
    setElementSize,
    setElementTransform,
    setElementStyleProp,
    removeElement,
    appendElement,
    insertElementBefore,
    syncBreakpointStyles,
    emitElementUpdated,
    emitElementTransform,
    emitLayerRefresh
} from '../history-helpers.js';

export class UndoManager {
    constructor(history) {
        this.history = history;
    }

    undo(action) {
        this._revert(action);

        eventBus.emit('history:changed', {
            canUndo: this.history.commandStack.undoStack.length > 0,
            canRedo: this.history.commandStack.redoStack.length > 0
        });
    }

    _revert(action) {
        switch (action.type) {
            case 'move':
                if (!this.history._isElementAlive(action.element)) break;
                setElementPosition(action.element, action.before.left, action.before.top);
                syncBreakpointStyles(this.history.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.before.left + 'px' },
                    { prop: 'top', value: action.before.top + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'resize':
                if (!this.history._isElementAlive(action.element)) break;
                setElementPosition(action.element, action.before.left, action.before.top);
                setElementSize(action.element, action.before.width, action.before.height);
                syncBreakpointStyles(this.history.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.before.left + 'px' },
                    { prop: 'top', value: action.before.top + 'px' },
                    { prop: 'width', value: action.before.width + 'px' },
                    { prop: 'height', value: action.before.height + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'style':
                if (!this.history._isElementAlive(action.element)) break;
                setElementStyleProp(action.element, action.prop, action.before);
                emitElementUpdated(action.element);
                break;

            case 'css-bulk':
                if (!this.history._isElementAlive(action.element)) break;
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
                if (!this.history._isElementAlive(action.element)) break;
                const delParent = this.history._fallbackParent(action.parent);
                if (action.nextSibling && delParent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, delParent);
                } else {
                    appendElement(action.element, delParent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'rotate':
                if (!this.history._isElementAlive(action.element)) break;
                setElementTransform(action.element, action.before);
                emitElementUpdated(action.element);
                break;

            case 'text-edit':
                if (!this.history._isElementAlive(action.element)) break;
                action.element.innerHTML = action.before;
                emitElementUpdated(action.element);
                break;

            case 'group': {
                if (!this.history._validParent(action.parent)) break;
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    if (!pos) return;
                    setElementPosition(child, pos.left, pos.top);
                    appendElement(child, action.parent);
                });
                removeElement(action.groupEl);
                eventBus.emit('element:deleted', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'ungroup': {
                if (!this.history._validParent(action.parent)) break;
                if (!this.history._isElementAlive(action.groupEl)) break;
                setElementPosition(action.groupEl, action.groupLeft, action.groupTop);
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    if (!pos) return;
                    setElementPosition(child, pos.relLeft, pos.relTop);
                    appendElement(child, action.groupEl);
                });
                appendElement(action.groupEl, action.parent);
                eventBus.emit('element:added', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'component:insert':
                if (!this.history._isElementAlive(action.element)) break;
                const insertParent = this.history._fallbackParent(action.parent);
                if (action.nextSibling && insertParent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, insertParent);
                } else {
                    appendElement(action.element, insertParent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'component:detach':
                if (!this.history._isElementAlive(action.element)) break;
                action.element.dataset.componentId = action.componentId;
                action.element.dataset.instanceId  = action.instanceId;
                emitElementUpdated(action.element);
                emitLayerRefresh();
                break;

            case 'page:add':
                this.history.editor.pageManager.deletePage(action.pageId, { pushHistory: false });
                break;

            case 'page:delete':
                this.history.editor.pageManager._restorePageFromSnapshot(
                    action.pageSnapshot,
                    action.insertIdx
                );
                break;

            case 'page:rename':
                this.history.editor.pageManager.renamePage(action.pageId, action.before, { pushHistory: false });
                break;
        }
    }
}
