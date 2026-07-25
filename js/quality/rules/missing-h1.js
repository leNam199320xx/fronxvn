import { createIssue } from '../utils.js';

export function checkMissingH1(elements, issues) {
    const hasH1 = elements.some(el => el.tagName.toLowerCase() === 'h1' && el.textContent.trim());
    if (hasH1) return;

    issues.push(createIssue({
        id: 'missing-h1',
        severity: 'warning',
        element: null,
        message: 'Page has no <h1> heading',
        suggestion: 'Every page should have exactly one <h1> heading for SEO and accessibility.',
        autofix: null
    }));
}
