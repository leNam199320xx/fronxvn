/**
 * Clipboard - Copy, Paste, Cut, Duplicate
 * Giữ nguyên style khi paste/duplicate
 */
import eventBus from './event-bus.js';
import { PASTE_OFFSET } from './config.js';
import { generateElementId } from './core/ids.js';

import debug from './debug.js';

export class Clipboard {
    constructor(editor) {
        this.editor = editor;
        this.clipboardData = null;

        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    /** Bind events */
    _bindEvents() {
        eventBus.on('clipboard:copy', () => this.copy());
        eventBus.on('clipboard:cut', () => this.cut());
        eventBus.on('clipboard:paste', () => this.paste());
        eventBus.on('clipboard:duplicate', () => this.duplicate());
        eventBus.on('element:delete', () => this.delete());
    }

    /** Copy element */
    copy() {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;
        debug.action('clipboard', 'copy', { count: elements.length });
        this.clipboardData = elements.map(el => el.cloneNode(true));
    }

    /** Cut element */
    cut() {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;
        debug.action('clipboard', 'cut', { count: elements.length });

        this.clipboardData = elements.map(el => el.cloneNode(true));

        elements.forEach(el => {
            const parent = el.parentNode;
            const nextSibling = el.nextSibling;
            eventBus.emit('history:push', {
                type: 'delete',
                element: el,
                parent: parent,
                nextSibling: nextSibling
            });
            el.remove();
            eventBus.emit('element:deleted', el);
        });

        this.editor.selection.deselectAll();
        eventBus.emit('layer:refresh');
    }

    /** Paste element */
    paste() {
        if (!this.clipboardData || this.clipboardData.length === 0) return;
        debug.action('clipboard', 'paste', { count: this.clipboardData.length });

        const target = this.editor.selection.getSelected();
        const parent = (target && target.dataset.container === 'true') ? target : this.editor.canvas;

        const newElements = this.clipboardData.map(template => {
            const clone = template.cloneNode(true);
            clone.id = generateElementId();
            const left = (parseFloat(clone.style.left) || 0) + PASTE_OFFSET;
            const top  = (parseFloat(clone.style.top)  || 0) + PASTE_OFFSET;
            clone.style.left = left + 'px';
            clone.style.top = top + 'px';
            parent.appendChild(clone);

            eventBus.emit('history:push', { type: 'add', element: clone, parent });
            eventBus.emit('element:added', clone);
            return clone;
        });

        eventBus.emit('layer:refresh');
        if (newElements.length === 1) {
            this.editor.selection.select(newElements[0]);
        } else {
            this.editor.selection.setSelection(newElements);
        }
    }

    /** Duplicate element */
    duplicate() {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;
        debug.action('clipboard', 'duplicate', { count: elements.length });

        const newElements = elements.map(el => {
            const clone = el.cloneNode(true);
            clone.id = generateElementId();
            const left = (parseFloat(clone.style.left) || 0) + PASTE_OFFSET;
            const top  = (parseFloat(clone.style.top)  || 0) + PASTE_OFFSET;
            clone.style.left = left + 'px';
            clone.style.top = top + 'px';
            const parent = el.parentNode;
            parent.appendChild(clone);

            eventBus.emit('history:push', { type: 'add', element: clone, parent });
            eventBus.emit('element:added', clone);
            return clone;
        });

        eventBus.emit('layer:refresh');
        if (newElements.length === 1) {
            this.editor.selection.select(newElements[0]);
        } else {
            this.editor.selection.setSelection(newElements);
        }
    }

    /** Delete element */
    delete() {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;
        debug.action('clipboard', 'delete', { count: elements.length });

        elements.forEach(el => {
            const parent = el.parentNode;
            eventBus.emit('history:push', {
                type: 'delete',
                element: el,
                parent,
                nextSibling: el.nextSibling
            });
            el.remove();
            eventBus.emit('element:deleted', el);
        });

        this.editor.selection.deselectAll();
        eventBus.emit('layer:refresh');
    }
}
