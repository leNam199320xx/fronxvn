/**
 * ContextMenu - Menu chuột phải
 * Copy, Paste, Duplicate, Delete, Bring to Front/Back, Forward/Backward,
 * Lock/Unlock (toggle), Hide/Show (toggle), Wrap in Container, Group/Ungroup,
 * Save as Template
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
        // items với id để cập nhật label động
        this._items = [
            { id: 'copy',          label: 'Copy',              shortcut: 'Ctrl+C',       action: 'clipboard:copy' },
            { id: 'paste',         label: 'Paste',             shortcut: 'Ctrl+V',       action: 'clipboard:paste' },
            { id: 'duplicate',     label: 'Duplicate',         shortcut: 'Ctrl+D',       action: 'clipboard:duplicate' },
            { separator: true },
            { id: 'delete',        label: 'Delete',            shortcut: 'Del',          action: 'element:delete' },
            { separator: true },
            { id: 'lock-toggle',   label: 'Lock',              shortcut: 'Ctrl+L',       action: 'element:lock-toggle' },
            { id: 'hide-toggle',   label: 'Hide',              shortcut: 'Ctrl+H',       action: 'element:hide-toggle' },
            { separator: true },
            { id: 'bring-front',   label: 'Bring to Front',    shortcut: 'Ctrl+Shift+]', action: 'element:bring-front' },
            { id: 'move-forward',  label: 'Move Forward',      shortcut: 'Ctrl+]',       action: 'element:move-forward' },
            { id: 'move-backward', label: 'Move Backward',     shortcut: 'Ctrl+[',       action: 'element:move-backward' },
            { id: 'send-back',     label: 'Send to Back',      shortcut: 'Ctrl+Shift+[', action: 'element:send-back' },
            { separator: true },
            { id: 'wrap',          label: 'Wrap in Container', shortcut: '',             action: 'element:wrap' },
            { id: 'group',         label: 'Group',             shortcut: 'Ctrl+G',       action: 'group:group' },
            { id: 'ungroup',       label: 'Ungroup',           shortcut: 'Ctrl+Shift+G', action: 'group:ungroup' },
            { separator: true },
            { id: 'save-template', label: 'Save as Template',  shortcut: '',             action: 'template:save' },
            { separator: true },
            { id: 'save-component',   label: 'Save as Component', shortcut: '', action: 'component:save' },
            { id: 'detach-component', label: 'Detach Instance',   shortcut: '', action: 'component:detach' },
        ];

        this._renderMenu();
    }

    _renderMenu() {
        this.menu.innerHTML = '';
        this._items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'context-menu-separator';
                this.menu.appendChild(sep);
                return;
            }
            const el = document.createElement('div');
            el.className = 'context-menu-item';
            el.dataset.action = item.action;
            el.dataset.itemId = item.id;
            el.innerHTML = `
                <span class="item-label">${item.label}</span>
                ${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ''}
            `;
            el.addEventListener('click', () => {
                this._executeAction(item.action);
                this._hide();
            });
            this.menu.appendChild(el);
        });
    }

    /**
     * Cập nhật label của item toggle (Lock/Hide) dựa trên state element.
     * @param {HTMLElement|null} el
     */
    _updateDynamicLabels(el) {
        if (!el) return;
        const lockItem   = this.menu.querySelector('[data-item-id="lock-toggle"] .item-label');
        const hideItem   = this.menu.querySelector('[data-item-id="hide-toggle"] .item-label');
        const detachItem = this.menu.querySelector('[data-item-id="detach-component"]');

        if (lockItem) lockItem.textContent = el.dataset.locked === 'true' ? 'Unlock' : 'Lock';
        if (hideItem) hideItem.textContent = el.dataset.hidden === 'true' ? 'Show' : 'Hide';

        // "Detach Instance" chỉ hiện khi element là component instance
        if (detachItem) {
            const isInstance = !!el.dataset.componentId;
            detachItem.style.display = isInstance ? '' : 'none';
            const sep = detachItem.previousElementSibling;
            if (sep && sep.classList.contains('context-menu-separator')) {
                sep.style.display = isInstance ? '' : 'none';
            }
        }
    }

    /** Bind events */
    _bindEvents() {
        // Right click trên canvas
        this.editor.canvasWrapper.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const el = e.target.closest('[data-editor-element]');
            this._updateDynamicLabels(el);
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

        // Ẩn khi tab context menu của page-manager gọi
        eventBus.on('context-menu:hide', () => this._hide());

        // ── Z-order ─────────────────────────────────────────────────────────
        eventBus.on('element:bring-front', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                el.parentNode.appendChild(el);
                eventBus.emit('history:push', { type: 'reorder', element: el });
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:send-back', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                el.parentNode.insertBefore(el, el.parentNode.firstChild);
                eventBus.emit('history:push', { type: 'reorder', element: el });
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:move-forward', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                const next = el.nextElementSibling;
                if (next && next.dataset.editorElement !== undefined) {
                    el.parentNode.insertBefore(next, el);
                    eventBus.emit('history:push', { type: 'reorder', element: el });
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:move-backward', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                const prev = el.previousElementSibling;
                if (prev && prev.dataset.editorElement !== undefined) {
                    el.parentNode.insertBefore(el, prev);
                    eventBus.emit('history:push', { type: 'reorder', element: el });
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });

        // ── Lock/Unlock toggle ───────────────────────────────────────────────
        eventBus.on('element:lock-toggle', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (el.dataset.locked === 'true') {
                    delete el.dataset.locked;
                    el.style.pointerEvents = '';
                } else {
                    el.dataset.locked = 'true';
                    el.style.pointerEvents = 'none';
                }
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        // Backward compat
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

        // ── Hide/Show toggle ─────────────────────────────────────────────────
        eventBus.on('element:hide-toggle', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (el.dataset.hidden === 'true') {
                    el.dataset.hidden = 'false';
                    const original = el.dataset.originalDisplay || '';
                    el.style.display = original;
                    if (!original) el.style.removeProperty('display');
                } else {
                    el.dataset.originalDisplay = el.style.display || '';
                    el.dataset.hidden = 'true';
                    el.style.display = 'none';
                }
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        // Backward compat
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

        // ── Wrap in Container ────────────────────────────────────────────────
        eventBus.on('element:wrap', () => {
            const elements = this.editor.selection.getSelectedAll();
            if (elements.length === 0) return;

            // Tính bounding box của tất cả elements được chọn
            let minLeft = Infinity, minTop = Infinity;
            let maxRight = -Infinity, maxBottom = -Infinity;

            elements.forEach(el => {
                const left   = parseFloat(el.style.left)   || 0;
                const top    = parseFloat(el.style.top)    || 0;
                const width  = parseFloat(el.style.width)  || el.offsetWidth;
                const height = parseFloat(el.style.height) || el.offsetHeight;
                minLeft   = Math.min(minLeft, left);
                minTop    = Math.min(minTop, top);
                maxRight  = Math.max(maxRight, left + width);
                maxBottom = Math.max(maxBottom, top + height);
            });

            const parent = elements[0].parentNode;

            // Tạo container
            const container = document.createElement('div');
            container.setAttribute('data-editor-element', '');
            container.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            container.dataset.type = 'container';
            container.dataset.name = 'Container';
            container.dataset.container = 'true';
            container.style.position = 'absolute';
            container.style.left   = minLeft + 'px';
            container.style.top    = minTop + 'px';
            container.style.width  = (maxRight - minLeft) + 'px';
            container.style.height = (maxBottom - minTop) + 'px';

            // Chèn container vào DOM tại vị trí của element đầu tiên
            parent.insertBefore(container, elements[0]);

            // Di chuyển các elements vào container (offset lại tọa độ)
            elements.forEach(el => {
                const left = (parseFloat(el.style.left) || 0) - minLeft;
                const top  = (parseFloat(el.style.top)  || 0) - minTop;
                el.style.left = left + 'px';
                el.style.top  = top  + 'px';
                container.appendChild(el);
            });

            eventBus.emit('history:push', { type: 'add', element: container, parent });
            eventBus.emit('element:added', container);
            eventBus.emit('layer:refresh');
            this.editor.selection.select(container);
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
