import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { SELECTION_EDIT_OUTLINE } from '../config.js';
import { SelectionState } from './selection-state.js';
import { SelectionHitTest } from './selection-hit-test.js';
import { SelectionEvents } from './selection-events.js';

export class SelectionManager {
    constructor(editor) {
        this.editor = editor;
        this.selectionState = new SelectionState();
        this.hitTest = new SelectionHitTest();
        this.hoveredElement = null;
        this.isEditing = false;
        this._textBefore = undefined;

        new SelectionEvents(this);
    }

    init() {}

    refresh() {}

    destroy() {}

    select(el) {
        this.selectionState.select(el);
    }

    toggleSelection(el) {
        this.selectionState.toggleSelection(el);
    }

    addToSelection(el) {
        this.selectionState.addToSelection(el);
    }

    removeFromSelection(el) {
        this.selectionState.removeFromSelection(el);
    }

    setSelection(elements) {
        this.selectionState.setSelection(elements);
    }

    deselectAll() {
        this.selectionState.deselectAll();
    }

    deselect() {
        this.selectionState.deselect();
    }

    getSelected() {
        return this.selectionState.getSelected();
    }

    getSelectedAll() {
        return this.selectionState.getSelectedAll();
    }

    isSelected(el) {
        return this.selectionState.isSelected(el);
    }

    _handleMouseDown(e) {
        const el = this.hitTest.getElementFromEvent(e, this.editor.canvas);

        if (el) {
            if (e.shiftKey) {
                this.selectionState.toggleSelection(el);
            } else {
                this.selectionState.select(el);
            }
        } else {
            if (!e.shiftKey) {
                this.selectionState.deselectAll();
            }
        }
    }

    _handleHover(e) {
        const el = this.hitTest.getElementFromEvent(e, this.editor.canvas);
        if (el !== this.hoveredElement) {
            this.hoveredElement = el;
            eventBus.emit('element:hovered', el);
        }
    }

    _handleDoubleClick(e) {
        const el = this.hitTest.getElementFromEvent(e, this.editor.canvas);
        if (!el) return;

        const tag = el.tagName.toLowerCase();
        const type = el.dataset.type || '';
        if (tag === 'img' || type === 'image') {
            this._openImagePicker(el);
            return;
        }

        const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'li', 'label'];
        if (textTags.includes(tag) ||
            ['text', 'heading', 'paragraph', 'button', 'link'].includes(type)) {
            this._startEditing(el);
        }
    }

    _openImagePicker(el) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                const before = CanvasAPI.getAttribute(el, 'src') || CanvasAPI.getStyle(el, 'background-image');

                if (CanvasAPI.getAttribute(el, 'src')) {
                    CanvasAPI.setAttribute(el, 'src', dataUrl);
                } else {
                    CanvasAPI.setStyle(el, 'background-image', `url("${dataUrl}")`);
                }

                const after = CanvasAPI.getAttribute(el, 'src') || CanvasAPI.getStyle(el, 'background-image');

                eventBus.emit('history:push', {
                    type: 'style',
                    element: el,
                    prop: CanvasAPI.getAttribute(el, 'src') ? 'src' : 'background-image',
                    before,
                    after
                });
                eventBus.emit('element:updated', el);
            };
            reader.readAsDataURL(file);
        });

        input.click();
    }

    _startEditing(el) {
        this.isEditing = true;
        this._textBefore = CanvasAPI.getHTML(el);
        CanvasAPI.setAttribute(el, 'contenteditable', 'true');
        el.focus();
        CanvasAPI.setStyle(el, 'cursor', 'text');
        CanvasAPI.setStyle(el, 'outline', SELECTION_EDIT_OUTLINE);

        const range = CanvasAPI.getDocument().createRange();
        range.selectNodeContents(el);
        const sel = CanvasAPI.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        const onBlur = () => {
            this._stopEditing(el);
            el.removeEventListener('blur', onBlur);
        };
        el.addEventListener('blur', onBlur);

        const onKeydown = (e) => {
            if (e.key === 'Escape') {
                el.blur();
                el.removeEventListener('keydown', onKeydown);
            }
        };
        el.addEventListener('keydown', onKeydown);

        eventBus.emit('element:editing-start', el);
    }

    _stopEditing(el) {
        this.isEditing = false;
        CanvasAPI.setAttribute(el, 'contenteditable', 'false');
        CanvasAPI.setStyle(el, 'cursor', '');
        CanvasAPI.setStyle(el, 'outline', '');
        CanvasAPI.getSelection().removeAllRanges();

        if (this._textBefore !== undefined && CanvasAPI.getHTML(el) !== this._textBefore) {
            eventBus.emit('history:push', {
                type: 'text-edit',
                element: el,
                before: this._textBefore,
                after: CanvasAPI.getHTML(el)
            });
        }
        this._textBefore = undefined;

        eventBus.emit('element:editing-stop', el);
        eventBus.emit('element:updated', el);
    }
}
