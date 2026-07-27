import { DEFAULT_COLOR_FALLBACK } from '../config.js';

export function toHex(color) {
    if (!color) return DEFAULT_COLOR_FALLBACK;
    if (/^#[0-9a-fA-F]{3,6}$/.test(color)) {
        return color.length === 4
            ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
            : color;
    }
    try {
        const tmp = document.createElement('canvas');
        tmp.width = tmp.height = 1;
        const ctx = tmp.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch {
        return DEFAULT_COLOR_FALLBACK;
    }
}
