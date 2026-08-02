import eventBus from '../events/event-bus.js';
import DirtyState, { DIRTY } from '../dirty-state.js';
import RenderPipeline from '../render/render-pipeline.js';
import { LayerDrag } from './layer-drag.js';

export class LayerEvents {
    constructor(panel) {
        this.panel = panel;
        this.drag = new LayerDrag(panel);
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    _bindEvents() {
        eventBus.on('element:selected', (el) => {
            this.panel.selectedElements = [el];
            this.panel._highlightLayers();
        });

        eventBus.on('selection:changed', (elements) => {
            this.panel.selectedElements = elements || [];
            this.panel._highlightLayers();
        });

        eventBus.on('element:deselected', () => {
            this.panel.selectedElements = [];
            this.panel._highlightLayers();
        });

        eventBus.on('element:added', () => DirtyState.mark(DIRTY.LAYER));
        eventBus.on('element:deleted', (el) => {
            this.panel.expandedMap.delete(el.id);
            DirtyState.mark(DIRTY.LAYER);
        });
        eventBus.on('layer:refresh', () => DirtyState.mark(DIRTY.LAYER));

        eventBus.on('tab:switch', (tabName) => {
            if (tabName === 'layers') {
                RenderPipeline.flushStage('pipeline-layer');
            }
        });
    }

    attachNodeEvents(item, el) {
        item.addEventListener('click', (e) => {
            if (e.shiftKey) {
                this.panel.editor.selection.toggleSelection(el);
            } else {
                eventBus.emit('layer:select', el);
            }
        });

        item.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const nameSpan = item.querySelector('.layer-name');
            this.panel._startRename(el, nameSpan);
        });

        this.drag.attach(item, el);
    }
}

