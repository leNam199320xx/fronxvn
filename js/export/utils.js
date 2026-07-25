import { EXPORT_INDENT } from '../config.js';
import { downloadBlob } from '../core/download.js';

export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function escapeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');
}

export function repeatIndent(level) {
    return EXPORT_INDENT.repeat(level);
}
