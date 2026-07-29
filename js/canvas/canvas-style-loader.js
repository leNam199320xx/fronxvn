/**
 * CanvasStyleLoader - Loads external stylesheets into the canvas iframe.
 * - Decouples CSS from CanvasHost
 * - Supports multiple stylesheets and themes
 * - Caches fetched content to avoid redundant network requests
 */
const PATHS = Object.freeze({
    reset: './js/canvas/styles/reset.css',
    editor: './js/canvas/styles/editor.css',
    'future-theme-light': './js/canvas/styles/future-theme-light.css',
    'future-theme-dark': './js/canvas/styles/future-theme-dark.css'
});

const cache = new Map();

function resolveUrl(path) {
    try {
        return new URL(path, document.baseURI).href;
    } catch {
        return path;
    }
}

async function fetchCss(path) {
    if (cache.has(path)) {
        return cache.get(path);
    }
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`[CanvasStyleLoader] Failed to load ${path}: ${res.status}`);
    }
    const text = await res.text();
    cache.set(path, text);
    return text;
}

function applyStyle(doc, name, css) {
    const id = `canvas-style-${name}`;
    let el = doc.getElementById(id);
    if (!el) {
        el = doc.createElement('style');
        el.id = id;
        doc.head.appendChild(el);
    }
    el.textContent = css;
}

export class CanvasStyleLoader {
    /**
     * Load one or more stylesheets into the target document.
     * @param {Document} doc
     * @param {string[]} names - Style names from PATHS
     */
    static async load(doc, names = ['reset', 'editor']) {
        for (const name of names) {
            const path = PATHS[name];
            if (!path) continue;
            const css = await fetchCss(resolveUrl(path));
            applyStyle(doc, name, css);
        }
    }

    /**
     * Inject a single named stylesheet into the target document.
     * @param {Document} doc
     * @param {string} name
     */
    static async inject(doc, name) {
        const path = PATHS[name];
        if (!path) return;
        const css = await fetchCss(resolveUrl(path));
        applyStyle(doc, name, css);
    }

    /**
     * Clear the internal stylesheet cache.
     * Next load/inject will re-fetch from network.
     */
    static reload() {
        cache.clear();
    }
}
