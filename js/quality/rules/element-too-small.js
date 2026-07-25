import { createIssue } from '../utils.js';
import { QUALITY_MIN_ELEMENT_SIZE } from '../../config.js';

export function checkElementTooSmall(el, issues) {
    const w = parseFloat(el.style.width) || el.offsetWidth;
    const h = parseFloat(el.style.height) || el.offsetHeight;
    if (w >= QUALITY_MIN_ELEMENT_SIZE && h >= QUALITY_MIN_ELEMENT_SIZE) return;

    issues.push(createIssue({
        id: 'element-too-small',
        severity: 'warning',
        element: el,
        message: `"${el.dataset.name || el.id}" is very small (${Math.round(w)}×${Math.round(h)}px)`,
        suggestion: 'Elements smaller than 20×20px may be hard to interact with.',
        autofix: null
    }));
}
