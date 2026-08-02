/**
 * Overlay - Backward-compatible facade
 */
import { OverlayManager } from '../../core/overlay/overlay-manager.js';

export class Overlay extends OverlayManager {
    constructor(editor) {
        super(editor);
    }
}

