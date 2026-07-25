import { createIssue } from '../utils.js';

export function checkEmptyHeading(el, issues) {
    if (!/^h[1-6]$/.test(el.tagName.toLowerCase())) return;
    if (el.textContent.trim()) return;

    issues.push(createIssue({
        id: 'empty-heading',
        severity: 'warning',
        element: el,
        message: `<${el.tagName.toLowerCase()}> "${el.dataset.name || el.id}" is empty`,
        suggestion: 'Add text content to heading elements.',
        autofix: null
    }));
}
