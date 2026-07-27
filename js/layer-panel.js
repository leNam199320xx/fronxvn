/**
 * LayerPanel - Hiển thị cây DOM dạng layer
 * Cho phép: expand, collapse, rename, drag đổi thứ tự, chọn, xóa, duplicate
 */
import eventBus from './event-bus.js';
import { LAYER_INDENT_PER_LEVEL, SELECTION_EDIT_OUTLINE } from './config.js';
import { inlineRename } from './ui/utils.js';
import DirtyState, { DIRTY } from '../core/dirty-state.js';
import RenderPipeline from '../core/render-pipeline.js';

import debug from './debug.js';

export class LayerPanel {
    constructor(editor) {
        this.editor = editor;
        this.container = document.querySelector('#panel-right');
        this.selectedElements = [];   // Mảng thay vì single
        this.expandedMap = new Map();
        this._layerItems = null;

        this._bindEvents();
        this._registerPipeline();
    }

    _registerPipeline() {
        RenderPipeline.on('pipeline-layer', () => this._render());
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

        eventBus.on('element:added', () => DirtyState.mark(DIRTY.LAYER));
        eventBus.on('element:deleted', (el) => {
            this.expandedMap.delete(el.id);
            DirtyState.mark(DIRTY.LAYER);
        });
        eventBus.on('layer:refresh', () => DirtyState.mark(DIRTY.LAYER));

        eventBus.on('tab:switch', (tabName) => {
            if (tabName === 'layers') {
                RenderPipeline.flushStage('pipeline-layer');
            }
        });
    }

    /** Render layer tree */
    _render() {
        debug.action('layer-panel', 'render', { canvasChildren: this.editor.canvas.children.length });
        this.container.innerHTML = '';

        const section = document.createElement('div');
        section.className = 'panel-section';

        const header = document.createElement('div');
        header.className = 'panel-section-header';
        header.innerHTML = 'Layers <span class="arrow">▼</span>';

        const body = document.createElement('div');
        body.className = 'panel-section-body';

        const tree = document.createElement('div');
        tree.className = 'layer-tree';

        const children = Array.from(this.editor.canvas.querySelectorAll(':scope > [data-editor-element]'));
        children.forEach(el => {
            this._renderNode(el, tree, 0);
        });

        body.appendChild(tree);

        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });

        section.appendChild(header);
        section.appendChild(body);
        this.container.appendChild(section);

        this._layerItems = this.container.querySelectorAll('.layer-item');
    }

    /** Render một node */
    _renderNode(el, parent, depth) {
        const isHidden    = el.dataset.hidden === 'true';
        const isComponent = !!el.dataset.componentId;

        const item = document.createElement('div');
        item.className = 'layer-item';
        if (this.selectedElements.includes(el)) item.classList.add('selected');
        if (isHidden)    item.classList.add('hidden');
        if (isComponent) item.classList.add('is-component');
        item.dataset.elementId = el.id;

        // Indent
        const indent = document.createElement('span');
        indent.className = 'layer-indent';
        indent.style.width = (depth * LAYER_INDENT_PER_LEVEL) + 'px';
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
                RenderPipeline.flushStage('pipeline-layer');
            });
        }
        item.appendChild(toggle);

        // Icon
        const icon = document.createElement('span');
        icon.className = 'layer-icon';
        // Component instance dùng icon riêng
        icon.textContent = el.dataset.componentId ? '⬡' : this._getIcon(el.dataset.type);
        item.appendChild(icon);

        // Name
        const name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = el.dataset.name || el.dataset.type || el.tagName.toLowerCase();
        item.appendChild(name);

        // Component badge
        if (el.dataset.componentId) {
            const badge = document.createElement('span');
            badge.className = 'layer-comp-badge';
            badge.title = 'Component instance';
            badge.textContent = '⬡';
            item.appendChild(badge);
        }

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
            item.style.borderBottom = SELECTION_EDIT_OUTLINE;
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
                debug.action('layer-panel', 'reorder', { from: draggedEl.id, to: el.id });
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
        debug.action('layer-panel', `toggleVisibility ${isHidden ? 'show' : 'hide'}`, { id: el.id });
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
        RenderPipeline.flushStage('pipeline-layer');
    }

    /** Bắt đầu rename */
    _startRename(el, nameSpan) {
        debug.action('layer-panel', 'startRename', { id: el.id, name: el.dataset.name || el.dataset.type });
        inlineRename(nameSpan, el.dataset.name || el.dataset.type || '', {
            inputClassName: 'layer-name-input',
            onCommit: (newName) => {
                el.dataset.name = newName || el.dataset.type;
                RenderPipeline.flushStage('pipeline-layer');
            }
        });
    }

    /** Highlight các layer items đang được chọn */
    _highlightLayers() {
        const layerItems = this.container.querySelectorAll('.layer-item');
        if (layerItems.length === 0) return;
        const selectedIds = new Set(this.selectedElements.map(el => el && el.id).filter(Boolean));
        for (let i = 0; i < layerItems.length; i++) {
            const item = layerItems[i];
            if (selectedIds.has(item.dataset.elementId)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        }
    }

    /** Get icon cho type */
    _getIcon(type) {
        const icons = {
            section: '☐', container: '▣', row: '▤', column: '▥',
            div: '□', card: '▧', text: 'T', heading: 'H',
            paragraph: '¶', button: '▢', link: '🔗', image: '🖼',
            icon: '★', svg: '◇', video: '▶', audio: '♫',
            input: '▁', textarea: '▂', select: '▾', checkbox: '☑',
            radio: '◉', table: '⊞', list: '≡', form: '📋',
            group: '⊡'
        };
        return icons[type] || '□';
    }
}
