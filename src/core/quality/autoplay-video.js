import { createIssue } from './utils.js';

export function checkAutoplayVideo(editor, eventBus, el, issues) {
    if (el.tagName.toLowerCase() !== 'video') return;
    if (!el.hasAttribute('autoplay')) return;
    if (el.hasAttribute('muted')) return;

    issues.push(createIssue({
        id: 'autoplay-video',
        severity: 'warning',
        element: el,
        message: `<video> "${el.dataset.name || el.id}" has autoplay without muted`,
        suggestion: 'Add the muted attribute to allow autoplay in most browsers.',
        autofix: () => {
            el.setAttribute('muted', '');
            eventBus.emit('element:updated', el);
        }
    }));
}

