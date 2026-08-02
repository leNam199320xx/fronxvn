import { createIssue } from './utils.js';

export function checkEmptyLink(editor, eventBus, el, issues) {
    if (el.tagName.toLowerCase() !== 'a') return;
    const hasHref = el.hasAttribute('href') && el.getAttribute('href').trim() !== '';
    const hasText = el.textContent.trim() || el.querySelector('img[alt]');
    if (hasHref && hasText) return;

    issues.push(createIssue({
        id: 'empty-link',
        severity: 'error',
        element: el,
        message: `<a> "${el.dataset.name || el.id}" ${!hasHref ? 'has no href' : 'has no text content'}`,
        suggestion: !hasHref
            ? 'Add a href attribute with a valid URL.'
            : 'Add descriptive text or an image with alt attribute inside the link.',
        autofix: !hasHref ? () => {
            el.setAttribute('href', '#');
            eventBus.emit('element:updated', el);
        } : null
    }));
}

