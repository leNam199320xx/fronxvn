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

export class RedoManager {
    constructor(history) {
        this.history = history;
    }

    redo(action) {
        this._apply(action);

        eventBus.emit('history:changed', {
            canUndo: this.history.commandStack.undoStack.length > 0,
            canRedo: this.history.commandStack.redoStack.length > 0
        });
    }

    _apply(action) {
        switch (action.type) {
            case 'move':
                if (!this.history._isElementAlive(action.element)) break;
                setElementPosition(action.element, action.after.left, action.after.top);
                syncBreakpointStyles(this.history.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.after.left + 'px' },
                    { prop: 'top', value: action.after.top + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'resize':
                if (!this.history._isElementAlive(action.element)) break;
                setElementPosition(action.element, action.after.left, action.after.top);
                setElementSize(action.element, action.after.width, action.after.height);
                syncBreakpointStyles(this.history.editor.breakpointManager, action.element, [
                    { prop: 'left', value: action.after.left + 'px' },
                    { prop: 'top', value: action.after.top + 'px' },
                    { prop: 'width', value: action.after.width + 'px' },
                    { prop: 'height', value: action.after.height + 'px' }
                ]);
                emitElementUpdated(action.element);
                emitElementTransform(action.element);
                break;

            case 'style':
                if (!this.history._isElementAlive(action.element)) break;
                setElementStyleProp(action.element, action.prop, action.after);
                emitElementUpdated(action.element);
                break;

            case 'css-bulk':
                if (!this.history._isElementAlive(action.element)) break;
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
                const parent = this.history._fallbackParent(action.parent);
                if (action.nextSibling && parent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, parent);
                } else {
                    appendElement(action.element, parent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'delete':
                if (!this.history._isElementAlive(action.element)) break;
                removeElement(action.element);
                eventBus.emit('element:deleted', action.element);
                emitLayerRefresh();
                break;

            case 'rotate':
                if (!this.history._isElementAlive(action.element)) break;
                setElementTransform(action.element, action.after);
                emitElementUpdated(action.element);
                break;

            case 'text-edit':
                if (!this.history._isElementAlive(action.element)) break;
                action.element.innerHTML = action.after;
                emitElementUpdated(action.element);
                break;

            case 'group': {
                if (!this.history._validParent(action.parent)) break;
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    if (!pos) return;
                    setElementPosition(child, pos.left - action.groupLeft, pos.top - action.groupTop);
                    appendElement(child, action.groupEl);
                });
                appendElement(action.groupEl, action.parent);
                eventBus.emit('element:added', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'ungroup': {
                if (!this.history._validParent(action.parent)) break;
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    if (!pos) return;
                    setElementPosition(child, pos.relLeft + action.groupLeft, pos.relTop + action.groupTop);
                    insertElementBefore(child, action.groupEl, action.parent);
                });
                removeElement(action.groupEl);
                eventBus.emit('element:deleted', action.groupEl);
                emitLayerRefresh();
                break;
            }

            case 'component:insert':
                const compParent = this.history._fallbackParent(action.parent);
                if (action.nextSibling && compParent.contains(action.nextSibling)) {
                    insertElementBefore(action.element, action.nextSibling, compParent);
                } else {
                    appendElement(action.element, compParent);
                }
                eventBus.emit('element:added', action.element);
                emitLayerRefresh();
                break;

            case 'component:detach':
                if (!this.history._isElementAlive(action.element)) break;
                action.element.removeAttribute('data-component-id');
                action.element.removeAttribute('data-instance-id');
                emitElementUpdated(action.element);
                emitLayerRefresh();
                break;

            case 'page:add':
                if (action.pageSnapshot) {
                    this.history.editor.pageManager._restorePageFromSnapshot(
                        action.pageSnapshot,
                        action.insertIdx
                    );
                } else {
                    this.history.editor.pageManager.addPage({ pushHistory: false });
                }
                break;

            case 'page:delete':
                this.history.editor.pageManager.deletePage(action.pageId, { pushHistory: false });
                break;

            case 'page:rename':
                this.history.editor.pageManager.renamePage(action.pageId, action.after, { pushHistory: false });
                break;
        }
    }
}
