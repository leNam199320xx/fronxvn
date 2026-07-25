import { QUALITY_PENALTY_ERROR, QUALITY_PENALTY_WARNING, QUALITY_PENALTY_INFO } from '../config.js';
import { QUALITY_WCAG_LUMINANCE_THRESHOLD, QUALITY_WCAG_LUMINANCE_R, QUALITY_WCAG_LUMINANCE_G, QUALITY_WCAG_LUMINANCE_B } from '../config.js';

export const PENALTY = { error: QUALITY_PENALTY_ERROR, warning: QUALITY_PENALTY_WARNING, info: QUALITY_PENALTY_INFO };

export function createIssue({ id, severity, element, message, suggestion, autofix }) {
    return { id, severity, element, message, suggestion, autofix };
}

export function parseColor(color) {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

export function relativeLuminance(cssColor) {
    const rgb = parseColor(cssColor);
    if (!rgb) return null;
    const [r, g, b] = rgb.map(c => {
        const s = c / 255;
        return s <= QUALITY_WCAG_LUMINANCE_THRESHOLD ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return QUALITY_WCAG_LUMINANCE_R * r + QUALITY_WCAG_LUMINANCE_G * g + QUALITY_WCAG_LUMINANCE_B * b;
}
