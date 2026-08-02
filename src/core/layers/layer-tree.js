import { LayerRenderer } from './layer-renderer.js';

export class LayerTree {
    constructor(panel) {
        this.panel = panel;
        this.renderer = new LayerRenderer(panel);
    }

    init() {}

    refresh() {
        this._render();
    }

    destroy() {}

    _render() {
        this.renderer._render();
    }
}
