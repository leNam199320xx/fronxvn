import {
    EXPORT_BTN_PADDING,
    EXPORT_BTN_BORDER_RADIUS,
    EXPORT_BTN_FONT_SIZE
} from '../../../core/utilities/config.js';

export function createButton(text, bg, color) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
        padding: ${EXPORT_BTN_PADDING}; background: ${bg}; border: none; color: ${color};
        border-radius: ${EXPORT_BTN_BORDER_RADIUS}; cursor: pointer; font-size: ${EXPORT_BTN_FONT_SIZE};
    `;
    return btn;
}


