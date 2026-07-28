import CanvasAPI from '../canvas/canvas-api.js';

export class SelectionHitTest {
    constructor() {}

    init() {}

    refresh() {}

    destroy() {}

    getElementFromEvent(e, root) {
        const target = e.target;
        const el = CanvasAPI.closest(target, '[data-editor-element]');
        if (el && CanvasAPI.contains(root, el)) {
            return el;
        }
        return null;
    }
}
