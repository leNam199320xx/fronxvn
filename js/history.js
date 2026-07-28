/**
 * History - Backward-compatible facade
 */
import { HistoryManager } from './history/history-manager.js';

export class History extends HistoryManager {
    constructor(editor) {
        super(editor);
    }
}
