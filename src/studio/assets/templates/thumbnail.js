import { THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, THUMBNAIL_BG, THUMBNAIL_INNER_FILL, THUMBNAIL_STROKE, THUMBNAIL_STROKE_WIDTH, THUMBNAIL_FONT_SIZE, THUMBNAIL_TEXT_COLOR } from '../../../core/utilities/config.js';

export function generateElementThumbnail(elements) {
    const name = elements[0]?.dataset?.name || 'Component';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}">
        <rect width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" fill="${THUMBNAIL_BG}" rx="4"/>
        <rect x="8" y="8" width="${THUMBNAIL_WIDTH - 16}" height="${THUMBNAIL_HEIGHT - 16}" fill="${THUMBNAIL_INNER_FILL}" rx="2" stroke="${THUMBNAIL_STROKE}" stroke-width="${THUMBNAIL_STROKE_WIDTH}"/>
        <text x="${THUMBNAIL_WIDTH / 2}" y="${THUMBNAIL_HEIGHT / 2}" font-family="sans-serif" font-size="${THUMBNAIL_FONT_SIZE}" fill="${THUMBNAIL_TEXT_COLOR}" text-anchor="middle">${name}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}


