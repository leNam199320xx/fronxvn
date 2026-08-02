/**
 * Selection - Backward-compatible facade
 */
import { SelectionManager } from '../../core/selection/selection-manager.js';

export class Selection extends SelectionManager {
    constructor(editor) {
        super(editor);
    }
}

