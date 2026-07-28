/**
 * LayerPanel - Hiển thị cây DOM dạng layer
 * Cho phép: expand, collapse, rename, drag đổi thứ tự, chọn, xóa, duplicate
 */
import eventBus from './event-bus.js';
import { inlineRename } from './ui/utils.js';
import DirtyState, { DIRTY } from './core/dirty-state.js';
import RenderPipeline from './core/render-pipeline.js';
import { LayerTree } from './layers/layer-tree.js';
import { LayerEvents } from './layers/layer-events.js';

import debug from './debug.js';

export class LayerPanel {
    constructor(editor) {
        this.editor = editor;
        this.container = document.querySelector('#panel-right');
        this.selectedElements = [];
        this.expandedMap = new Map();
        this._layerItems = null;

        this.layerTree = new LayerTree(this);
        this.layerEvents = new LayerEvents(this);

        this._registerPipeline();
    }

    init() {}

    refresh() {
        this._render();
    }

    destroy() {}

    _registerPipeline() {
        RenderPipeline.on('pipeline-layer', () => this._render());
    }

    _render() {
        debug.action('layer-panel', 'render', { canvasChildren: this.editor.canvas.children.length });
        this.layerTree._render();
    }

    _toggleVisibility(el) {
        const isHidden = el.dataset.hidden === 'true';
        debug.action('layer-panel', `toggleVisibility ${isHidden ? 'show' : 'hide'}`, { id: el.id });
        if (isHidden) {
            el.dataset.hidden = 'false';
            const original = el.dataset.originalDisplay || '';
            el.style.display = original;
            if (!original) el.style.removeProperty('display');
        } else {
            const currentDisplay = el.style.display || '';
            el.dataset.originalDisplay = currentDisplay;
            el.dataset.hidden = 'true';
            el.style.display = 'none';
        }
        eventBus.emit('element:updated', el);
        RenderPipeline.flushStage('pipeline-layer');
    }

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
}
