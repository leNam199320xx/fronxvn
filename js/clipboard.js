/**
 * Clipboard - Copy, Paste, Cut, Duplicate
 * Giữ nguyên style khi paste/duplicate
 */
import eventBus from './event-bus.js';

export class Clipboard {
    constructor(editor) {
        this.editor = editor;
        this.clipboardData = null; // Lưu HTML clone

        this._bindEvents();
    }

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
        // Lưu clone của tất cả selected elements
        this.clipboardData = elements.map(el => el.cloneNode(true));
    }

    /** Cut element */
    cut() {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;

        this.clipboardData = elements.map(el => el.cloneNode(true));

        elements.forEach(el => {
            const parent = el.parentNode;
            eventBus.emit('history:push', {
                type: 'delete',
                element: el,
                parent: parent,
                nextSibling: el.nextSibling
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

        const target = this.editor.selection.getSelected();
        const parent = (target && target.dataset.container === 'true') ? target : this.editor.canvas;

        const newElements = this.clipboardData.map(template => {
            const clone = template.cloneNode(true);
            clone.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const left = (parseFloat(clone.style.left) || 0) + 20;
            const top = (parseFloat(clone.style.top) || 0) + 20;
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

        const newElements = elements.map(el => {
            const clone = el.cloneNode(true);
            clone.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const left = (parseFloat(clone.style.left) || 0) + 20;
            const top = (parseFloat(clone.style.top) || 0) + 20;
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
