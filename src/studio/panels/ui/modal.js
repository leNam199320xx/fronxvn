import {
    EXPORT_MODAL_ZINDEX,
    EXPORT_DIALOG_BORDER_RADIUS,
    EXPORT_DIALOG_WIDTH,
    EXPORT_DIALOG_MAX_HEIGHT,
    EXPORT_DIALOG_BG,
    EXPORT_DIALOG_BORDER,
    EXPORT_DIALOG_BOX_SHADOW,
    EXPORT_MODAL_BG,
    EXPORT_HEADER_PADDING,
    EXPORT_HEADER_BORDER_BOTTOM,
    EXPORT_HEADER_COLOR,
    EXPORT_HEADER_FONT_SIZE,
    EXPORT_HEADER_FONT_WEIGHT,
    EXPORT_CLOSE_BTN_COLOR,
    EXPORT_CLOSE_BTN_FONT_SIZE,
    EXPORT_BODY_PADDING
} from '../../../core/utilities/config.js';

export function createModal({ title, content, width, maxHeight, onClose, className }) {
    const modal = document.createElement('div');
    modal.className = className || 'ui-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: ${EXPORT_MODAL_BG}; z-index: ${EXPORT_MODAL_ZINDEX};
        display: flex; align-items: center; justify-content: center;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: ${EXPORT_DIALOG_BG}; border: 1px solid ${EXPORT_DIALOG_BORDER};
        border-radius: ${EXPORT_DIALOG_BORDER_RADIUS};
        width: ${width || EXPORT_DIALOG_WIDTH}; max-height: ${maxHeight || EXPORT_DIALOG_MAX_HEIGHT};
        display: flex; flex-direction: column;
        box-shadow: ${EXPORT_DIALOG_BOX_SHADOW};
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        padding: ${EXPORT_HEADER_PADDING}; border-bottom: ${EXPORT_HEADER_BORDER_BOTTOM};
        display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
    `;

    const titleEl = document.createElement('span');
    titleEl.textContent = title || '';
    titleEl.style.cssText = `
        font-size: ${EXPORT_HEADER_FONT_SIZE}; font-weight: ${EXPORT_HEADER_FONT_WEIGHT};
        color: ${EXPORT_HEADER_COLOR};
    `;
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
        background: none; border: none; color: ${EXPORT_CLOSE_BTN_COLOR};
        font-size: ${EXPORT_CLOSE_BTN_FONT_SIZE}; cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => {
        modal.remove();
        if (typeof onClose === 'function') onClose();
    });
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = `padding: ${EXPORT_BODY_PADDING}; flex: 1; overflow: auto; min-height: 0;`;
    if (content) {
        body.appendChild(content);
    }

    dialog.appendChild(header);
    dialog.appendChild(body);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (typeof onClose === 'function') onClose();
        }
    });

    return { modal, dialog, body, header, closeBtn };
}


