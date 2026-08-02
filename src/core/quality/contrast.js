import { createIssue } from './utils.js';
import { relativeLuminance } from './utils.js';
import { QUALITY_WCAG_CONTRAST_AA } from '../utilities/config.js';

export function checkLowContrast(el, issues) {
    const textTags = ['p', 'span', 'h1','h2','h3','h4','h5','h6', 'a', 'button', 'label', 'li'];
    if (!textTags.includes(el.tagName.toLowerCase())) return;
    if (!el.textContent.trim()) return;

    const style = window.getComputedStyle(el);
    const fgColor = style.color;
    const bgColor = style.backgroundColor;

    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return;

    const fgLum = relativeLuminance(fgColor);
    const bgLum = relativeLuminance(bgColor);
    if (fgLum === null || bgLum === null) return;

    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    if (ratio >= QUALITY_WCAG_CONTRAST_AA) return;

    issues.push(createIssue({
        id: 'low-contrast',
        severity: 'warning',
        element: el,
        message: `"${el.dataset.name || el.id}" has low contrast ratio (${ratio.toFixed(1)}:1, min 4.5:1)`,
        suggestion: 'Increase contrast between text and background color for WCAG AA compliance.',
        autofix: null
    }));
}



