import { createIssue } from './utils.js';
import { QUALITY_MAX_NESTING_DEPTH } from '../utilities/config.js';

export function checkDeepNesting(editor, el, issues) {
    let depth = 0;
    let node = el;
    while (node && node !== editor.canvas) {
        if (node.dataset && node.dataset.editorElement !== undefined) depth++;
        node = node.parentElement;
    }
    if (depth <= QUALITY_MAX_NESTING_DEPTH) return;

    issues.push(createIssue({
        id: 'deep-nesting',
        severity: 'info',
        element: el,
        message: `"${el.dataset.name || el.id}" is nested ${depth} levels deep`,
        suggestion: 'Deep nesting can affect readability and performance.',
        autofix: null
    }));
}



