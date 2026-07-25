import { createIssue } from '../utils.js';

export function checkAltMissing(editor, eventBus, el, issues) {
    if (el.tagName.toLowerCase() !== 'img') return;
    if (el.hasAttribute('alt')) return;

    issues.push(createIssue({
        id: 'alt-missing',
        severity: 'error',
        element: el,
        message: `<img> "${el.dataset.name || el.id}" is missing alt attribute`,
        suggestion: 'Add alt="" for decorative images, or alt="description" for informative images.',
        autofix: () => {
            el.setAttribute('alt', '');
            eventBus.emit('element:updated', el);
        }
    }));
}
