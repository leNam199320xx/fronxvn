import { escapeAttr } from './utils.js';
import {
    SEO_PANEL_COLOR,
    SEO_PANEL_FONT_SIZE,
    SEO_ROW_MARGIN_BOTTOM,
    SEO_LABEL_COLOR,
    SEO_LABEL_FONT_SIZE,
    SEO_TEXTAREA_HEIGHT,
    SEO_INPUT_PADDING,
    SEO_INPUT_BORDER_COLOR,
    SEO_INPUT_FOCUS_BORDER_COLOR,
    EXPORT_DIALOG_BORDER_RADIUS
} from '../utilities/config.js';

export function buildHead(meta, title) {
    let head = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`;
    head += `    <meta charset="UTF-8">\n`;
    head += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    head += `    <title>${title}</title>\n`;
    if (meta.description) {
        head += `    <meta name="description" content="${escapeAttr(meta.description)}">\n`;
    }
    if (meta.canonical) {
        head += `    <link rel="canonical" href="${escapeAttr(meta.canonical)}">\n`;
    }
    if (meta.ogTitle || meta.ogDescription || meta.ogImage) {
        if (meta.ogTitle)       head += `    <meta property="og:title" content="${escapeAttr(meta.ogTitle)}">\n`;
        if (meta.ogDescription) head += `    <meta property="og:description" content="${escapeAttr(meta.ogDescription)}">\n`;
        if (meta.ogImage)       head += `    <meta property="og:image" content="${escapeAttr(meta.ogImage)}">\n`;
        head += `    <meta property="og:type" content="website">\n`;
    }
    head += `    <link rel="stylesheet" href="style.css">\n`;
    head += `</head>\n<body>\n`;
    return head;
}

export function buildSeoPanel(editor) {
    const panel = document.createElement('div');
    panel.style.cssText = `color: ${SEO_PANEL_COLOR}; font-size: ${SEO_PANEL_FONT_SIZE};`;
    const meta = editor.projectMeta || {};
    const fields = [
        { key: 'title',         label: 'Page Title',         placeholder: 'My Website' },
        { key: 'description',   label: 'Meta Description',   placeholder: 'Description (max 160 chars)', multiline: true },
        { key: 'canonical',     label: 'Canonical URL',      placeholder: 'https://example.com/page' },
        { key: 'ogTitle',       label: 'OG Title',           placeholder: 'Open Graph title' },
        { key: 'ogDescription', label: 'OG Description',     placeholder: 'Open Graph description', multiline: true },
        { key: 'ogImage',       label: 'OG Image URL',       placeholder: 'https://example.com/og.jpg' }
    ];
    fields.forEach(f => {
        const row = document.createElement('div');
        row.style.cssText = `margin-bottom: ${SEO_ROW_MARGIN_BOTTOM};`;
        const label = document.createElement('label');
        label.style.cssText = `display: block; margin-bottom: 4px; color: ${SEO_LABEL_COLOR}; font-size: ${SEO_LABEL_FONT_SIZE}; text-transform: uppercase; letter-spacing: 0.5px;`;
        label.textContent = f.label;
        let input;
        if (f.multiline) {
            input = document.createElement('textarea');
            input.style.cssText = `
                width: 100%; height: ${SEO_TEXTAREA_HEIGHT}; background: #1e1e1e; border: 1px solid ${SEO_INPUT_BORDER_COLOR};
                color: #ccc; font-size: ${SEO_PANEL_FONT_SIZE}; padding: ${SEO_INPUT_PADDING}; border-radius: ${EXPORT_DIALOG_BORDER_RADIUS};
                outline: none; resize: vertical; font-family: inherit; box-sizing: border-box;
            `;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.style.cssText = `
                width: 100%; background: #1e1e1e; border: 1px solid ${SEO_INPUT_BORDER_COLOR};
                color: #ccc; font-size: ${SEO_PANEL_FONT_SIZE}; padding: ${SEO_INPUT_PADDING}; border-radius: ${EXPORT_DIALOG_BORDER_RADIUS};
                outline: none; box-sizing: border-box;
            `;
        }
        input.placeholder = f.placeholder;
        input.value = meta[f.key] || '';
        input.addEventListener('input', () => {
            editor.projectMeta[f.key] = input.value;
        });
        input.addEventListener('focus', () => input.style.borderColor = SEO_INPUT_FOCUS_BORDER_COLOR);
        input.addEventListener('blur', () => input.style.borderColor = SEO_INPUT_BORDER_COLOR);
        row.appendChild(label);
        row.appendChild(input);
        panel.appendChild(row);
    });
    return panel;
}


