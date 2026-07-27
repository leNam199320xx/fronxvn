/**
 * Selection - Quản lý việc chọn phần tử trên canvas
 * - Click để chọn
 * - Shift+Click để thêm/bớt khỏi selection
 * - Click vùng trống để bỏ chọn
 * - Hover highlight
 * - Double click để chỉnh text
 * - Rubber-band selection (kéo vùng chọn) — được trigger bởi drag.js
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
import { SELECTION_EDIT_OUTLINE } from './config.js';
import DirtyState, { DIRTY } from '../core/dirty-state.js';
import RenderPipeline from '../core/render-pipeline.js';

import debug from './debug.js';

export class Selection {
    constructor(editor) {
        this.editor = editor;
        this.selectedElements = [];  // Mảng các element đang chọn
        this.hoveredElement = null;
        this.isEditing = false;

        this._bindEvents();
    }

    /** Bind các sự kiện */
    _bindEvents() {
        eventBus.on('pointer:mousedown', (data) => {
            if (this.isEditing) return;
            const target = data.target;
            if (CanvasAPI.closest(target, '.resize-handle') ||
                CanvasAPI.closest(target, '.move-handle') ||
                CanvasAPI.closest(target, '.rotation-handle')) {
                return;
            }
            this._handleMouseDown(data);
        });

        eventBus.on('pointer:mousemove', (data) => {
            if (this.isEditing) return;
            this._handleHover(data);
        });

        eventBus.on('pointer:dblclick', (data) => {
            this._handleDoubleClick(data);
        });

        // Lắng nghe sự kiện xóa element
        eventBus.on('element:deleted', (el) => {
            if (this.selectedElements.includes(el)) {
                this.removeFromSelection(el);
            }
        });

        // Lắng nghe select từ layer panel
        eventBus.on('layer:select', (el) => {
            this.select(el);
        });

        // Lắng nghe page switch — xóa toàn bộ selection
        eventBus.on('selection:deselect-all', () => {
            this.deselectAll();
        });
    }

    /** Xử lý mousedown */
    _handleMouseDown(e) {
        const el = this._getElementFromEvent(e);

        if (el) {
            if (e.shiftKey) {
                this.toggleSelection(el);
            } else {
                this.select(el);
            }
        } else {
            if (!e.shiftKey) {
                this.deselectAll();
            }
        }
    }

    /** Xử lý hover */
    _handleHover(e) {
        const el = this._getElementFromEvent(e);
        if (el !== this.hoveredElement) {
            this.hoveredElement = el;
            eventBus.emit('element:hovered', el);
        }
    }

    /** Xử lý double click để edit text hoặc mở file picker cho image */
    _handleDoubleClick(e) {
        const el = this._getElementFromEvent(e);
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

    /**
     * Mở file picker để đổi ảnh cho element.
     * @param {HTMLElement} el - img element hoặc container có background-image
     */
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

    /** Bắt đầu chỉnh sửa text */
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

    /** Kết thúc chỉnh sửa text */
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

    /**
     * Chọn 1 element (replace toàn bộ selection cũ)
     * @param {HTMLElement} el
     */
    select(el) {
        if (this.selectedElements.length === 1 && this.selectedElements[0] === el) return;
        debug.action('selection', 'select', { id: el.id, type: el.dataset.type });
        this.selectedElements = [el];
        DirtyState.mark(DIRTY.SELECTION);
        eventBus.emit('selection:changed', this.selectedElements);
        eventBus.emit('element:selected', el);
    }

    /**
     * Thêm hoặc bỏ element khỏi multi-selection
     * @param {HTMLElement} el
     */
    toggleSelection(el) {
        const idx = this.selectedElements.indexOf(el);
        debug.action('selection', 'toggleSelection', { id: el.id, type: el.dataset.type, adding: idx === -1 });
        if (idx === -1) {
            this.selectedElements.push(el);
        } else {
            this.selectedElements.splice(idx, 1);
        }

        DirtyState.mark(DIRTY.SELECTION);

        if (this.selectedElements.length === 1) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', this.selectedElements[0]);
        } else if (this.selectedElements.length === 0) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', this.selectedElements[0]);
        }
    }

    /**
     * Thêm một element vào selection (dùng cho rubber-band)
     * @param {HTMLElement} el
     */
    addToSelection(el) {
        if (!this.selectedElements.includes(el)) {
            debug.action('selection', 'addToSelection', { id: el.id, type: el.dataset.type });
            this.selectedElements.push(el);
            DirtyState.mark(DIRTY.SELECTION);
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', el);
        }
    }

    /**
     * Bỏ một element khỏi selection
     * @param {HTMLElement} el
     */
    removeFromSelection(el) {
        debug.action('selection', 'removeFromSelection', { id: el.id, type: el.dataset.type });
        this.selectedElements = this.selectedElements.filter(e => e !== el);
        DirtyState.mark(DIRTY.SELECTION);
        if (this.selectedElements.length === 0) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('selection:changed', this.selectedElements);
        }
    }

    /**
     * Set toàn bộ selection cùng lúc (dùng sau rubber-band)
     * @param {HTMLElement[]} elements
     */
    setSelection(elements) {
        debug.action('selection', 'setSelection', { count: elements.length });
        this.selectedElements = [...elements];
        DirtyState.mark(DIRTY.SELECTION);
        if (this.selectedElements.length === 0) {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('selection:changed', this.selectedElements);
            eventBus.emit('element:selected', this.selectedElements[0]);
        }
    }

    /** Bỏ chọn tất cả */
    deselectAll() {
        if (this.selectedElements.length === 0) return;
        debug.action('selection', 'deselectAll', { count: this.selectedElements.length });
        this.selectedElements = [];
        DirtyState.mark(DIRTY.SELECTION);
        eventBus.emit('selection:changed', this.selectedElements);
        eventBus.emit('element:deselected');
    }

    /**
     * @deprecated dùng deselectAll()
     */
    deselect() {
        this.deselectAll();
    }

    /** Lấy element từ event */
    _getElementFromEvent(e) {
        const target = e.target;
        const el = CanvasAPI.closest(target, '[data-editor-element]');
        if (el && CanvasAPI.contains(this.editor.canvas, el)) {
            return el;
        }
        return null;
    }

    /**
     * Lấy element đang chọn (primary — backward compat)
     * @returns {HTMLElement|null}
     */
    getSelected() {
        return this.selectedElements[0] || null;
    }

    /**
     * Lấy tất cả elements đang chọn
     * @returns {HTMLElement[]}
     */
    getSelectedAll() {
        return this.selectedElements;
    }

    /**
     * Kiểm tra element có đang được chọn không
     * @param {HTMLElement} el
     * @returns {boolean}
     */
    isSelected(el) {
        return this.selectedElements.includes(el);
    }
}
