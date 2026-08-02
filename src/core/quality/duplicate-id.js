import { createIssue } from './utils.js';

export function checkDuplicateIds(elements, issues) {
    const seen = new Map();
    elements.forEach(el => {
        if (!el.id) return;
        if (seen.has(el.id)) {
            seen.get(el.id).push(el);
        } else {
            seen.set(el.id, [el]);
        }
    });

    seen.forEach((els, id) => {
        if (els.length < 2) return;
        els.forEach(el => {
            issues.push(createIssue({
                id: 'duplicate-id',
                severity: 'error',
                element: el,
                message: `Duplicate id="${id}" found on ${els.length} elements`,
                suggestion: 'Each id must be unique within the page.',
                autofix: null
            }));
        });
    });
}

