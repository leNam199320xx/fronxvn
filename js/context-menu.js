/**
 * ContextMenu - Menu chuột phải
 * Copy, Paste, Duplicate, Delete, Bring to Front, Send to Back, Lock, Unlock
 */
import eventBus from './event-bus.js';

export class ContextMenu {
    constructor(editor) {
        this.editor = editor;
        this.menu = document.getElementById('context-menu');
        this.targetElement = null;

        this._buildMenu();
        this._bindEvents();
    }

    /** Tạo menu items */
    _buildMenu() {
        const items = [
            { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', action: 'clipboard:copy' },
            { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', action: 'clipboard:paste' },
            { id: 'duplicate', label: 'Duplicate', shortcut: 'Ctrl+D', action: 'clipboard:duplicate' },
            { id: 'separator1', separator: true },
            { id: 'delete', label: 'Delete', shortcut: 'Del', action: 'element:delete' },
            { id: 'separator2', separator: true },
            { id: 'hide', label: 'Hide', shortcut: '', action: 'element:hide' },
            { id: 'show', label: 'Show', shortcut: '', action: 'element:show' },
            { id: 'separator3', separator: true },
            { id: 'save-template', label: 'Save as Template', shortcut: '', action: 'template:save' },
            { id: 'separator4', separator: true },
            { id: 'front', label: 'Bring to Front', shortcut: '', action: 'element:bring-front' },
            { id: 'back', label: 'Send to Back', shortcut: '', action: 'element:send-back' },
            { id: 'separator5', separator: true },
            { id: 'lock', label: 'Lock', shortcut: '', action: 'element:lock' },
            { id: 'unlock', label: 'Unlock', shortcut: '', action: 'element:unlock' }
        ];

        this.menu.innerHTML = '';
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'context-menu-separator';
                this.menu.appendChild(sep);
            } else {
                const el = document.createElement('div');
                el.className = 'context-menu-item';
                el.dataset.action = item.action;
                el.innerHTML = `
                    <span>${item.label}</span>
                    ${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ''}
                `;
                el.addEventListener('click', () => {
                    this._executeAction(item.action);
                    this._hide();
                });
                this.menu.appendChild(el);
            }
        });
    }

    /** Bind events */
    _bindEvents() {
        // Right click trên canvas
        this.editor.canvasWrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this._show(e.clientX, e.clientY);
        });

        // Ẩn menu khi click ngoài
        document.addEventListener('mousedown', (e) => {
            if (!this.menu.contains(e.target)) {
                this._hide();
            }
        });

        // Ẩn khi scroll
        document.addEventListener('scroll', () => this._hide(), true);

        // Xử lý bring to front / send to back
        eventBus.on('element:bring-front', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                el.parentNode.appendChild(el);
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:send-back', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                el.parentNode.insertBefore(el, el.parentNode.firstChild);
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        // Lock/Unlock
        eventBus.on('element:lock', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                el.dataset.locked = 'true';
                el.style.pointerEvents = 'none';
                eventBus.emit('element:updated', el);
            });
        });

        eventBus.on('element:unlock', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                delete el.dataset.locked;
                el.style.pointerEvents = '';
                eventBus.emit('element:updated', el);
            });
        });

        // Hide / Show
        eventBus.on('element:hide', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (el.dataset.hidden !== 'true') {
                    el.dataset.originalDisplay = el.style.display || '';
                    el.dataset.hidden = 'true';
                    el.style.display = 'none';
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:show', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (el.dataset.hidden === 'true') {
                    el.dataset.hidden = 'false';
                    const original = el.dataset.originalDisplay || '';
                    el.style.display = original;
                    if (!original) el.style.removeProperty('display');
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });
    }

    /** Hiển thị menu */
    _show(x, y) {
        this.menu.style.left = x + 'px';
        this.menu.style.top = y + 'px';
        this.menu.classList.add('visible');

        // Đảm bảo menu không vượt viewport
        const rect = this.menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.menu.style.top = (y - rect.height) + 'px';
        }
    }

    /** Ẩn menu */
    _hide() {
        this.menu.classList.remove('visible');
    }

    /** Thực thi action */
    _executeAction(action) {
        eventBus.emit(action);
    }
}
