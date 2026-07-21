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
        const wrapper = this.editor.canvasWrapper;

        // Mousedown trên canvas
        wrapper.addEventListener('mousedown', (e) => {
            if (this.isEditing) return;
            // Bỏ qua nếu click vào overlay handle
            if (e.target.closest('.resize-handle') ||
                e.target.closest('.move-handle') ||
                e.target.closest('.rotation-handle')) {
                return;
            }
            this._handleMouseDown(e);
        });

        // Hover
        wrapper.addEventListener('mousemove', (e) => {
            if (this.isEditing) return;
            this._handleHover(e);
        });

        // Double click để edit text
        wrapper.addEventListener('dblclick', (e) => {
            this._handleDoubleClick(e);
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
    }

    /** Xử lý mousedown */
    _handleMouseDown(e) {
        const el = this._getElementFromEvent(e);

        if (el) {
            if (e.shiftKey) {
                // Shift+Click: toggle element trong/ngoài selection
                this.toggleSelection(el);
            } else {
                // Click thường: chọn 1 element (bỏ selection cũ)
                this.select(el);
            }
        } else {
            // Click vùng trống -> bỏ chọn (rubber-band được xử lý bởi drag.js)
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

    /** Xử lý double click để edit text */
    _handleDoubleClick(e) {
        const el = this._getElementFromEvent(e);
        if (!el) return;

        const tag = el.tagName.toLowerCase();
        const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'li', 'label'];
        if (textTags.includes(tag) ||
            ['text', 'heading', 'paragraph', 'button', 'link'].includes(el.dataset.type)) {
            this._startEditing(el);
        }
    }

    /** Bắt đầu chỉnh sửa text */
    _startEditing(el) {
        this.isEditing = true;
        el.contentEditable = 'true';
        el.focus();
        el.style.cursor = 'text';
        el.style.outline = '2px solid #0078d4';

        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
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
        el.contentEditable = 'false';
        el.style.cursor = '';
        el.style.outline = '';
        window.getSelection().removeAllRanges();
        eventBus.emit('element:editing-stop', el);
        eventBus.emit('element:updated', el);
    }

    /**
     * Chọn 1 element (replace toàn bộ selection cũ)
     * @param {HTMLElement} el
     */
    select(el) {
        if (this.selectedElements.length === 1 && this.selectedElements[0] === el) return;
        this.selectedElements = [el];
        eventBus.emit('element:selected', el);
        eventBus.emit('selection:changed', this.selectedElements);
    }

    /**
     * Thêm hoặc bỏ element khỏi multi-selection
     * @param {HTMLElement} el
     */
    toggleSelection(el) {
        const idx = this.selectedElements.indexOf(el);
        if (idx === -1) {
            this.selectedElements.push(el);
        } else {
            this.selectedElements.splice(idx, 1);
        }

        if (this.selectedElements.length === 1) {
            eventBus.emit('element:selected', this.selectedElements[0]);
        } else if (this.selectedElements.length === 0) {
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('element:selected', this.selectedElements[0]);
        }
        eventBus.emit('selection:changed', this.selectedElements);
    }

    /**
     * Thêm một element vào selection (dùng cho rubber-band)
     * @param {HTMLElement} el
     */
    addToSelection(el) {
        if (!this.selectedElements.includes(el)) {
            this.selectedElements.push(el);
        }
    }

    /**
     * Bỏ một element khỏi selection
     * @param {HTMLElement} el
     */
    removeFromSelection(el) {
        this.selectedElements = this.selectedElements.filter(e => e !== el);
        if (this.selectedElements.length === 0) {
            eventBus.emit('element:deselected');
        }
        eventBus.emit('selection:changed', this.selectedElements);
    }

    /**
     * Set toàn bộ selection cùng lúc (dùng sau rubber-band)
     * @param {HTMLElement[]} elements
     */
    setSelection(elements) {
        this.selectedElements = [...elements];
        if (this.selectedElements.length === 0) {
            eventBus.emit('element:deselected');
        } else {
            eventBus.emit('element:selected', this.selectedElements[0]);
        }
        eventBus.emit('selection:changed', this.selectedElements);
    }

    /** Bỏ chọn tất cả */
    deselectAll() {
        if (this.selectedElements.length === 0) return;
        this.selectedElements = [];
        eventBus.emit('element:deselected');
        eventBus.emit('selection:changed', []);
    }

    /**
     * @deprecated dùng deselectAll()
     */
    deselect() {
        this.deselectAll();
    }

    /** Lấy element từ event */
    _getElementFromEvent(e) {
        const el = e.target.closest('[data-editor-element]');
        if (el && this.editor.canvas.contains(el)) {
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
