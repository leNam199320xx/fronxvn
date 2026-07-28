/**
 * Selection - Backward-compatible facade
 */
import { SelectionManager } from './selection/selection-manager.js';

export class Selection extends SelectionManager {
    constructor(editor) {
        super(editor);
    }
}
