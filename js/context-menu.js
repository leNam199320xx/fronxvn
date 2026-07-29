/**
 * ContextMenu - Menu chuột phải
 * Copy, Paste, Duplicate, Delete, Bring to Front/Back, Forward/Backward,
 * Lock/Unlock (toggle), Hide/Show (toggle), Wrap in Container, Group/Ungroup,
 * Save as Template
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
import { generateElementId } from './core/ids.js';

export class ContextMenu {
    constructor(editor) {
        this.editor = editor;
        this.menu = document.getElementById('context-menu');
        this.targetElement = null;

        this._buildMenu();
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {
        if (this._onMousedown) {
            document.removeEventListener('mousedown', this._onMousedown);
        }
        if (this._onScroll) {
            document.removeEventListener('scroll', this._onScroll, true);
        }
    }

    /** Tạo menu items */
    _buildMenu() {
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
        this._bindShowHideEvents();
        this._bindZOrderEvents();
        this._bindLockEvents();
        this._bindVisibilityToggleEvents();
        this._bindHideEvents();
        this._bindWrapEvent();
    }

    _bindShowHideEvents() {
        eventBus.on('pointer:contextmenu', (data) => {
            const el = CanvasAPI.closest(data.target, '[data-editor-element]');
            this._updateDynamicLabels(el);
            this._show(data.clientX, data.clientY);
        });
    }

    _bindHideEvents() {
        this._onMousedown = (e) => {
            if (!this.menu.contains(e.target)) {
                this._hide();
            }
        };
        this._onScroll = () => this._hide();
        document.addEventListener('mousedown', this._onMousedown);
        document.addEventListener('scroll', this._onScroll, true);

        eventBus.on('context-menu:hide', () => this._hide());
    }

    _bindZOrderEvents() {
        eventBus.on('element:bring-front', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                CanvasAPI.append(el, el.parentNode);
                eventBus.emit('history:push', { type: 'reorder', element: el });
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:send-back', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                CanvasAPI.prepend(el, el.parentNode);
                eventBus.emit('history:push', { type: 'reorder', element: el });
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:move-forward', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                const next = el.nextElementSibling;
                if (next && next.dataset.editorElement !== undefined) {
                    CanvasAPI.insertAfter(el, next, el.parentNode);
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
                    CanvasAPI.insertBefore(el, prev, el.parentNode);
                    eventBus.emit('history:push', { type: 'reorder', element: el });
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });
    }

    _bindLockEvents() {
        eventBus.on('element:lock-toggle', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (CanvasAPI.getAttribute(el, 'data-locked') === 'true') {
                    CanvasAPI.removeAttribute(el, 'data-locked');
                    CanvasAPI.setStyle(el, 'pointer-events', '');
                } else {
                    CanvasAPI.setAttribute(el, 'data-locked', 'true');
                    CanvasAPI.setStyle(el, 'pointer-events', 'none');
                }
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:lock', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                CanvasAPI.setAttribute(el, 'data-locked', 'true');
                CanvasAPI.setStyle(el, 'pointer-events', 'none');
                eventBus.emit('element:updated', el);
            });
        });

        eventBus.on('element:unlock', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                CanvasAPI.removeAttribute(el, 'data-locked');
                CanvasAPI.setStyle(el, 'pointer-events', '');
                eventBus.emit('element:updated', el);
            });
        });
    }

    _bindVisibilityToggleEvents() {
        eventBus.on('element:hide-toggle', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (CanvasAPI.getAttribute(el, 'data-hidden') === 'true') {
                    CanvasAPI.setAttribute(el, 'data-hidden', 'false');
                    const original = CanvasAPI.getAttribute(el, 'data-original-display') || '';
                    CanvasAPI.setStyle(el, 'display', original);
                    if (!original) CanvasAPI.removeStyle(el, 'display');
                } else {
                    CanvasAPI.setAttribute(el, 'data-original-display', CanvasAPI.getStyle(el, 'display') || '');
                    CanvasAPI.setAttribute(el, 'data-hidden', 'true');
                    CanvasAPI.setStyle(el, 'display', 'none');
                }
                eventBus.emit('element:updated', el);
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:hide', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (CanvasAPI.getAttribute(el, 'data-hidden') !== 'true') {
                    CanvasAPI.setAttribute(el, 'data-original-display', CanvasAPI.getStyle(el, 'display') || '');
                    CanvasAPI.setAttribute(el, 'data-hidden', 'true');
                    CanvasAPI.setStyle(el, 'display', 'none');
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });

        eventBus.on('element:show', () => {
            this.editor.selection.getSelectedAll().forEach(el => {
                if (CanvasAPI.getAttribute(el, 'data-hidden') === 'true') {
                    CanvasAPI.setAttribute(el, 'data-hidden', 'false');
                    const original = CanvasAPI.getAttribute(el, 'data-original-display') || '';
                    CanvasAPI.setStyle(el, 'display', original);
                    if (!original) CanvasAPI.removeAttribute(el, 'style');
                    eventBus.emit('element:updated', el);
                }
            });
            eventBus.emit('layer:refresh');
        });
    }

    _bindWrapEvent() {
        eventBus.on('element:wrap', () => {
            const elements = this.editor.selection.getSelectedAll();
            if (elements.length === 0) return;

            let minLeft = Infinity, minTop = Infinity;
            let maxRight = -Infinity, maxBottom = -Infinity;

            elements.forEach(el => {
                const left   = parseFloat(CanvasAPI.getStyle(el, 'left'))   || 0;
                const top    = parseFloat(CanvasAPI.getStyle(el, 'top'))    || 0;
                const width  = parseFloat(CanvasAPI.getStyle(el, 'width'))  || el.offsetWidth;
                const height = parseFloat(CanvasAPI.getStyle(el, 'height')) || el.offsetHeight;
                minLeft   = Math.min(minLeft, left);
                minTop    = Math.min(minTop, top);
                maxRight  = Math.max(maxRight, left + width);
                maxBottom = Math.max(maxBottom, top + height);
            });

            const parent = elements[0].parentNode;

            const container = CanvasAPI.create('div', {
                'data-editor-element': '',
                id: generateElementId(),
                'data-type': 'container',
                'data-name': 'Container',
                'data-container': 'true'
            });
            CanvasAPI.setStyle(container, 'position', 'absolute');
            CanvasAPI.setStyle(container, 'left', minLeft + 'px');
            CanvasAPI.setStyle(container, 'top', minTop + 'px');
            CanvasAPI.setStyle(container, 'width', (maxRight - minLeft) + 'px');
            CanvasAPI.setStyle(container, 'height', (maxBottom - minTop) + 'px');

            CanvasAPI.insertBefore(container, elements[0], parent);

            elements.forEach(el => {
                const left = (parseFloat(CanvasAPI.getStyle(el, 'left')) || 0) - minLeft;
                const top  = (parseFloat(CanvasAPI.getStyle(el, 'top'))  || 0) - minTop;
                CanvasAPI.setStyle(el, 'left', left + 'px');
                CanvasAPI.setStyle(el, 'top', top + 'px');
                CanvasAPI.append(el, container);
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
