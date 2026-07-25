import {
    AUTOSAVE_STORAGE_KEY,
    AUTOSAVE_DELAY_MS,
    AUTOLOAD_DELAY_MS,
    PROJECT_VERSION,
    ELEMENT_ID_RANDOM_LENGTH
} from '../config.js';
import { defaultProjectMeta } from './utils.js';
import { storageGet, storageSet, storageRemove } from './storage.js';

export function serializeEditorState(editor) {
    return {
        version: PROJECT_VERSION,
        timestamp: Date.now(),
        meta: editor.projectMeta || defaultProjectMeta(),
        theme: editor.themeManager ? editor.themeManager.getTheme() : {},
        components: editor.componentManager ? editor.componentManager.getComponents() : [],
        pages: editor.pageManager.getPages()
    };
}

export function serializeElement(el) {
    const obj = {
        id: el.id,
        tag: el.tagName.toLowerCase(),
        type: el.dataset.type || '',
        name: el.dataset.name || '',
        container: el.dataset.container === 'true',
        locked: el.dataset.locked === 'true',
        hidden: el.dataset.hidden === 'true',
        originalDisplay: el.dataset.originalDisplay || '',
        bpStyles: el.__bpStyles || null,
        style: {},
        attributes: {},
        text: '',
        children: []
    };

    const style = el.style;
    for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        obj.style[prop] = style.getPropertyValue(prop);
    }

    ['href', 'src', 'alt', 'placeholder', 'type', 'value'].forEach(attr => {
        if (el.hasAttribute(attr)) {
            obj.attributes[attr] = el.getAttribute(attr);
        }
    });

    const childEls = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
    if (childEls.length === 0) {
        obj.text = el.innerHTML || '';
    }

    childEls.forEach(child => {
        obj.children.push(serializeElement(child));
    });

    return obj;
}
