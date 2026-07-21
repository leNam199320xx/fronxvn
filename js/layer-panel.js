/**
 * LayerPanel - Hiển thị cây DOM dạng layer
 * Cho phép: expand, collapse, rename, drag đổi thứ tự, chọn, xóa, duplicate
 */
import eventBus from './event-bus.js';

export class LayerPanel {
    constructor(editor) {
        this.editor = editor;
        this.container = document.querySelector('[data-tab-content="layers"]');
        this.selectedElements = [];   // Mảng thay vì single
        this.expandedMap = new Map();

        this._bindEvents();
        this._render();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('element:selected', (el) => {
            this.selectedElements = [el];
            this._highlightLayers();
        });

        eventBus.on('selection:changed', (elements) => {
            this.selectedElements = elements || [];
            this._highlightLayers();
        });

        eventBus.on('element:deselected', () => {
            this.selectedElements = [];
            this._highlightLayers();
        });

        eventBus.on('element:added', () => this._render());
        eventBus.on('element:deleted', () => this._render());
        eventBus.on('layer:refresh', () => this._render());
    }

    /** Render layer tree */
    _render() {
        this.container.innerHTML = '';

        const tree = document.createElement('div');
        tree.className = 'layer-tree';

        // Render canvas children
        const children = Array.from(this.editor.canvas.querySelectorAll(':scope > [data-editor-element]'));
        children.forEach(el => {
            this._renderNode(el, tree, 0);
        });

        this.container.appendChild(tree);
    }

    /** Render một node */
    _renderNode(el, parent, depth) {
        const isHidden = el.dataset.hidden === 'true';

        const item = document.createElement('div');
        item.className = 'layer-item';
        if (this.selectedElements.includes(el)) {
            item.classList.add('selected');
        }
        if (isHidden) {
            item.classList.add('hidden');
        }
        item.dataset.elementId = el.id;

        // Indent
        const indent = document.createElement('span');
        indent.className = 'layer-indent';
        indent.style.width = (depth * 16) + 'px';
        item.appendChild(indent);

        // Toggle (nếu có children)
        const children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
        const toggle = document.createElement('span');
        toggle.className = 'layer-toggle';
        if (children.length > 0) {
            const expanded = this.expandedMap.get(el.id) !== false;
            toggle.textContent = expanded ? '▼' : '▶';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = this.expandedMap.get(el.id) !== false;
                this.expandedMap.set(el.id, !isExpanded);
                this._render();
            });
        }
        item.appendChild(toggle);

        // Icon
        const icon = document.createElement('span');
        icon.className = 'layer-icon';
        icon.textContent = this._getIcon(el.dataset.type);
        item.appendChild(icon);

        // Name
        const name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = el.dataset.name || el.dataset.type || el.tagName.toLowerCase();
        item.appendChild(name);

        // Actions: visibility toggle + lock indicator
        const actions = document.createElement('span');
        actions.className = 'layer-actions';

        // Visibility button
        const btnVis = document.createElement('span');
        btnVis.className = 'layer-btn-vis';
        btnVis.title = isHidden ? 'Show' : 'Hide';
        btnVis.textContent = isHidden ? '○' : '●';
        btnVis.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleVisibility(el);
        });
        actions.appendChild(btnVis);

        item.appendChild(actions);

        // Click để chọn (Shift+Click để multi-select)
        item.addEventListener('click', (e) => {
            if (e.shiftKey) {
                this.editor.selection.toggleSelection(el);
            } else {
                eventBus.emit('layer:select', el);
            }
        });

        // Double click để rename
        item.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this._startRename(el, name);
        });

        // Drag
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', el.id);
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.style.borderBottom = '2px solid #0078d4';
        });
        item.addEventListener('dragleave', () => {
            item.style.borderBottom = '';
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.style.borderBottom = '';
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedEl = document.getElementById(draggedId);
            if (draggedEl && draggedEl !== el) {
                el.parentNode.insertBefore(draggedEl, el.nextSibling);
                eventBus.emit('layer:refresh');
                eventBus.emit('element:updated', draggedEl);
            }
        });

        parent.appendChild(item);

        // Render children nếu expanded
        if (children.length > 0 && this.expandedMap.get(el.id) !== false) {
            children.forEach(child => {
                this._renderNode(child, parent, depth + 1);
            });
        }
    }

    /**
     * Toggle visibility của element
     * Lưu display gốc vào data-original-display
     */
    _toggleVisibility(el) {
        const isHidden = el.dataset.hidden === 'true';
        if (isHidden) {
            // Show: khôi phục display gốc
            el.dataset.hidden = 'false';
            const original = el.dataset.originalDisplay || '';
            el.style.display = original;
            if (!original) el.style.removeProperty('display');
        } else {
            // Hide: lưu display hiện tại rồi set visibility=hidden (giữ layout)
            const currentDisplay = el.style.display || '';
            el.dataset.originalDisplay = currentDisplay;
            el.dataset.hidden = 'true';
            el.style.display = 'none';
        }
        eventBus.emit('element:updated', el);
        this._render();
    }

    /** Bắt đầu rename */
    _startRename(el, nameSpan) {
        const input = document.createElement('input');
        input.className = 'layer-name-input';
        input.value = el.dataset.name || el.dataset.type || '';

        nameSpan.replaceWith(input);
        input.focus();
        input.select();

        const finish = () => {
            el.dataset.name = input.value || el.dataset.type;
            this._render();
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = el.dataset.name || el.dataset.type;
                input.blur();
            }
        });
    }

    /** Highlight các layer items đang được chọn */
    _highlightLayers() {
        this.container.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('selected');
            const isSelected = this.selectedElements.some(
                el => item.dataset.elementId === el.id
            );
            if (isSelected) {
                item.classList.add('selected');
            }
        });
    }

    /** Get icon cho type */
    _getIcon(type) {
        const icons = {
            section: '☐', container: '▣', row: '▤', column: '▥',
            div: '□', card: '▧', text: 'T', heading: 'H',
            paragraph: '¶', button: '▢', link: '🔗', image: '🖼',
            icon: '★', svg: '◇', video: '▶', audio: '♫',
            input: '▁', textarea: '▂', select: '▾', checkbox: '☑',
            radio: '◉', table: '⊞', list: '≡', form: '📋'
        };
        return icons[type] || '□';
    }
}
