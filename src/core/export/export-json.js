export function exportJSON(editor) {
    const canvas = editor.canvas;
    const elements = Array.from(canvas.querySelectorAll(':scope > [data-editor-element]'));
    const data = {
        meta: editor.projectMeta || {},
        elements: elements.map(el => elementToJSON(el))
    };
    return JSON.stringify(data, null, 2);
}

export function elementToJSON(el) {
    const obj = {
        id: el.id,
        type: el.dataset.type || el.tagName.toLowerCase(),
        name: el.dataset.name || '',
        tag: el.tagName.toLowerCase(),
        container: el.dataset.container === 'true',
        hidden: el.dataset.hidden === 'true',
        style: {},
        text: '',
        children: []
    };

    const style = el.style;
    for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        obj.style[prop] = style.getPropertyValue(prop);
    }

    const childEls = el.querySelectorAll(':scope > [data-editor-element]');
    if (childEls.length === 0) {
        obj.text = el.textContent || '';
    }

    Array.from(childEls).forEach(child => {
        obj.children.push(elementToJSON(child));
    });

    return obj;
}
