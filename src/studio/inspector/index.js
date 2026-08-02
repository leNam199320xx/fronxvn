import eventBus from '../../core/events/event-bus.js';
import RenderPipeline from '../../core/render/render-pipeline.js';
import { bindPropertyPanelEvents } from '../../core/property/property-bindings.js';
import { renderPanel, updatePanelValues, clearPanelValues, showMultiSelectPlaceholder } from '../../core/property/property-renderer.js';

export class PropertyPanel {
    constructor(editor) {
        this.editor = editor;
        this.panel = document.getElementById('panel-left');
        this.selectedElement = null;
        this._propInputs = null;

        bindPropertyPanelEvents(this, eventBus);
        renderPanel(this, this.editor, eventBus);
        this._registerPipeline();
    }

    init() {}

    refresh() {
        renderPanel(this, this.editor, eventBus);
    }

    destroy() {}

    _registerPipeline() {
        RenderPipeline.on('pipeline-property', () => renderPanel(this, this.editor, eventBus));
    }

    _updateCSSEditor() {
        if (this.responsiveTab) {
            this.responsiveTab.updateCSSEditor();
        }
    }
}

