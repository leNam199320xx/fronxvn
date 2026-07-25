import { createIssue } from '../utils.js';

export function checkLabelMissing(editor, eventBus, el, issues) {
    const tag = el.tagName.toLowerCase();
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time'];
    if (tag !== 'input') return;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    if (!inputTypes.includes(type)) return;
    if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;

    if (el.id) {
        const label = editor.canvas.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) return;
    }

    issues.push(createIssue({
        id: 'label-missing',
        severity: 'error',
        element: el,
        message: `<input> "${el.dataset.name || el.id}" has no associated label`,
        suggestion: 'Add aria-label attribute or associate a <label> element using the for attribute.',
        autofix: () => {
            el.setAttribute('aria-label', el.getAttribute('placeholder') || 'Input');
            eventBus.emit('element:updated', el);
        }
    }));
}
