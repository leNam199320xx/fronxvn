/**
 * History - Quản lý Undo/Redo
 * Lưu mọi thao tác để có thể hoàn tác
 */
import eventBus from './event-bus.js';
import { HISTORY_MAX_SIZE } from './config.js';

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
                if (this.editor) {
                    this.editor.breakpointManager.setStyle(action.element, 'left', action.before.left + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'top', action.before.top + 'px');
                }
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'resize':
                action.element.style.left = action.before.left + 'px';
                action.element.style.top = action.before.top + 'px';
                action.element.style.width = action.before.width + 'px';
                action.element.style.height = action.before.height + 'px';
                if (this.editor) {
                    this.editor.breakpointManager.setStyle(action.element, 'left', action.before.left + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'top', action.before.top + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'width', action.before.width + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'height', action.before.height + 'px');
                }
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'style':
                action.element.style[action.prop] = action.before;
                eventBus.emit('element:updated', action.element);
                break;

            case 'css-bulk':
                // Undo bulk CSS: restore toàn bộ style từ before string
                action.element.removeAttribute('style');
                (action.before || '').split('\n').forEach(line => {
                    const clean = line.trim().replace(/;$/, '');
                    const idx   = clean.indexOf(':');
                    if (idx === -1) return;
                    action.element.style.setProperty(clean.slice(0, idx).trim(), clean.slice(idx + 1).trim());
                });
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

            case 'text-edit':
                action.element.innerHTML = action.before;
                eventBus.emit('element:updated', action.element);
                break;

            case 'group':
                // Undo group: di chuyển children về parent, khôi phục tọa độ tuyệt đối, xóa GroupElement
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    child.style.left = pos.left + 'px';
                    child.style.top  = pos.top  + 'px';
                    action.parent.appendChild(child);
                });
                action.groupEl.remove();
                eventBus.emit('element:deleted', action.groupEl);
                eventBus.emit('layer:refresh');
                break;

            case 'ungroup':
                // Undo ungroup: tái tạo GroupElement, đưa children trở lại bên trong
                action.groupEl.style.left = action.groupLeft + 'px';
                action.groupEl.style.top  = action.groupTop  + 'px';
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    child.style.left = pos.relLeft + 'px';
                    child.style.top  = pos.relTop  + 'px';
                    action.groupEl.appendChild(child);
                });
                action.parent.appendChild(action.groupEl);
                eventBus.emit('element:added', action.groupEl);
                eventBus.emit('layer:refresh');
                break;

            case 'component:insert':
                // Undo insert: xóa instance khỏi canvas
                action.element.remove();
                eventBus.emit('element:deleted', action.element);
                eventBus.emit('layer:refresh');
                break;

            case 'component:detach':
                // Undo detach: restore component attrs lên element
                action.element.dataset.componentId = action.componentId;
                action.element.dataset.instanceId  = action.instanceId;
                eventBus.emit('element:updated', action.element);
                eventBus.emit('layer:refresh');
                break;

            // ── Page operations ────────────────────────────────────────────────
            case 'page:add':
                // Undo page add: xóa trang (không push history lại)
                this.editor.pageManager.deletePage(action.pageId, { pushHistory: false });
                break;

            case 'page:delete':
                // Undo page delete: restore trang từ snapshot
                this.editor.pageManager._restorePageFromSnapshot(
                    action.pageSnapshot,
                    action.insertIdx
                );
                break;

            case 'page:rename':
                // Undo rename: đặt lại tên cũ
                this.editor.pageManager.renamePage(action.pageId, action.before, { pushHistory: false });
                break;
        }
    }

    /** Áp dụng lại một action (redo) */
    _apply(action) {
        switch (action.type) {
            case 'move':
                action.element.style.left = action.after.left + 'px';
                action.element.style.top = action.after.top + 'px';
                if (this.editor) {
                    this.editor.breakpointManager.setStyle(action.element, 'left', action.after.left + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'top', action.after.top + 'px');
                }
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'resize':
                action.element.style.left = action.after.left + 'px';
                action.element.style.top = action.after.top + 'px';
                action.element.style.width = action.after.width + 'px';
                action.element.style.height = action.after.height + 'px';
                if (this.editor) {
                    this.editor.breakpointManager.setStyle(action.element, 'left', action.after.left + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'top', action.after.top + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'width', action.after.width + 'px');
                    this.editor.breakpointManager.setStyle(action.element, 'height', action.after.height + 'px');
                }
                eventBus.emit('element:updated', action.element);
                eventBus.emit('element:transform', action.element);
                break;

            case 'style':
                action.element.style[action.prop] = action.after;
                eventBus.emit('element:updated', action.element);
                break;

            case 'css-bulk':
                // Redo bulk CSS: restore toàn bộ style từ after string
                action.element.removeAttribute('style');
                (action.after || '').split('\n').forEach(line => {
                    const clean = line.trim().replace(/;$/, '');
                    const idx   = clean.indexOf(':');
                    if (idx === -1) return;
                    action.element.style.setProperty(clean.slice(0, idx).trim(), clean.slice(idx + 1).trim());
                });
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

            case 'text-edit':
                action.element.innerHTML = action.after;
                eventBus.emit('element:updated', action.element);
                break;

            case 'group':
                // Redo group: di chuyển children vào GroupElement với tọa độ tương đối
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    child.style.left = (pos.left - action.groupLeft) + 'px';
                    child.style.top  = (pos.top  - action.groupTop)  + 'px';
                    action.groupEl.appendChild(child);
                });
                action.parent.appendChild(action.groupEl);
                eventBus.emit('element:added', action.groupEl);
                eventBus.emit('layer:refresh');
                break;

            case 'ungroup':
                // Redo ungroup: di chuyển children ra parent với tọa độ tuyệt đối, xóa GroupElement
                action.children.forEach(child => {
                    const pos = action.positions.find(p => p.el === child);
                    child.style.left = (pos.relLeft + action.groupLeft) + 'px';
                    child.style.top  = (pos.relTop  + action.groupTop)  + 'px';
                    action.parent.insertBefore(child, action.groupEl);
                });
                action.groupEl.remove();
                eventBus.emit('element:deleted', action.groupEl);
                eventBus.emit('layer:refresh');
                break;

            case 'component:insert':
                // Redo insert: chèn lại instance
                if (action.nextSibling && action.parent.contains(action.nextSibling)) {
                    action.parent.insertBefore(action.element, action.nextSibling);
                } else {
                    action.parent.appendChild(action.element);
                }
                eventBus.emit('element:added', action.element);
                eventBus.emit('layer:refresh');
                break;

            case 'component:detach':
                // Redo detach: xóa component attrs
                action.element.removeAttribute('data-component-id');
                action.element.removeAttribute('data-instance-id');
                eventBus.emit('element:updated', action.element);
                eventBus.emit('layer:refresh');
                break;

            // ── Page operations ────────────────────────────────────────────────
            case 'page:add':
                // Redo page add: tạo lại trang (không push history)
                // Restore từ snapshot nếu có, hoặc addPage mới
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
                // Redo page delete: xóa trang lại
                this.editor.pageManager.deletePage(action.pageId, { pushHistory: false });
                break;

            case 'page:rename':
                // Redo rename: đặt lại tên mới
                this.editor.pageManager.renamePage(action.pageId, action.after, { pushHistory: false });
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
