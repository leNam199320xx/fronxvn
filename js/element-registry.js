import CanvasAPI from './canvas/canvas-api.js';
import { generateElementId } from './core/ids.js';

function applyStyles(el, styles) {
    Object.entries(styles).forEach(([prop, value]) => {
        el.style[prop] = value;
    });
}

function addTextChild(el, text, styles = {}) {
    const span = CanvasAPI.createElement('span');
    span.textContent = text;
    applyStyles(span, styles);
    el.appendChild(span);
}

function addDivChild(el, text, styles = {}) {
    const div = CanvasAPI.createElement('div');
    div.textContent = text;
    applyStyles(div, styles);
    el.appendChild(div);
}

export function createSection(el) {
    applyStyles(el, { width: '800px', height: '400px', backgroundColor: '#f5f5f5', border: '1px dashed #ccc' });
}

export function createContainer(el) {
    applyStyles(el, { width: '600px', height: '300px', backgroundColor: '#ffffff', border: '1px solid #ddd' });
}

export function createRow(el) {
    applyStyles(el, { width: '100%', height: '100px', display: 'flex', backgroundColor: 'rgba(0,120,212,0.05)', border: '1px dashed #0078d4' });
}

export function createColumn(el) {
    applyStyles(el, { width: '200px', height: '200px', backgroundColor: 'rgba(0,120,212,0.05)', border: '1px dashed #0078d4' });
}

export function createDiv(el) {
    applyStyles(el, { width: '200px', height: '150px', backgroundColor: '#f0f0f0', border: '1px solid #ddd' });
}

export function createCard(el) {
    applyStyles(el, { width: '300px', height: 'auto', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' });

    const cardHeader = CanvasAPI.createElement('div');
    cardHeader.style.cssText = 'padding: 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; font-size: 16px;';
    cardHeader.textContent = 'Card Header';
    cardHeader.setAttribute('data-editor-element', '');
    cardHeader.dataset.type = 'div';
    cardHeader.dataset.name = 'Card Header';
    cardHeader.dataset.container = 'true';
    cardHeader.style.position = 'relative';

    const cardBody = CanvasAPI.createElement('div');
    cardBody.style.cssText = 'padding: 16px; flex: 1; font-size: 14px; color: #555;';
    cardBody.textContent = 'Card body content goes here. You can add any content inside.';
    cardBody.setAttribute('data-editor-element', '');
    cardBody.dataset.type = 'div';
    cardBody.dataset.name = 'Card Body';
    cardBody.dataset.container = 'true';
    cardBody.style.position = 'relative';

    const cardFooter = CanvasAPI.createElement('div');
    cardFooter.style.cssText = 'padding: 12px 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;';
    cardFooter.textContent = 'Card Footer';
    cardFooter.setAttribute('data-editor-element', '');
    cardFooter.dataset.type = 'div';
    cardFooter.dataset.name = 'Card Footer';
    cardFooter.dataset.container = 'true';
    cardFooter.style.position = 'relative';

    el.appendChild(cardHeader);
    el.appendChild(cardBody);
    el.appendChild(cardFooter);
}

export function createText(el) {
    applyStyles(el, { width: '200px', height: 'auto' });
    el.textContent = 'Text content';
    el.style.fontSize = '14px';
}

export function createHeading(el) {
    applyStyles(el, { width: '400px', height: 'auto' });
    el.textContent = 'Heading';
    el.style.fontSize = '32px';
    el.style.fontWeight = 'bold';
}

export function createParagraph(el) {
    applyStyles(el, { width: '400px', height: 'auto' });
    el.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    el.style.fontSize = '16px';
    el.style.lineHeight = '1.5';
}

export function createButton(el) {
    applyStyles(el, { width: '120px', height: '40px' });
    el.textContent = 'Button';
    applyStyles(el, { backgroundColor: '#0078d4', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' });
}

export function createLink(el) {
    el.textContent = 'Link text';
    applyStyles(el, { color: '#0078d4', textDecoration: 'underline', fontSize: '14px' });
    el.href = '#';
}

export function createImage(el) {
    applyStyles(el, { width: '300px', height: '200px', backgroundColor: '#e0e0e0', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    el.alt = 'Image';
}

export function createInput(el) {
    el.type = 'text';
    el.placeholder = 'Input...';
    applyStyles(el, { width: '200px', height: '36px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' });
}

export function createTextarea(el) {
    el.placeholder = 'Textarea...';
    applyStyles(el, { width: '300px', height: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' });
}

export function createCheckbox(el) {
    applyStyles(el, { width: '200px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' });
    const cb = CanvasAPI.createElement('input');
    cb.type = 'checkbox';
    applyStyles(cb, { width: '16px', height: '16px', margin: '0' });
    const cbLabel = CanvasAPI.createElement('span');
    cbLabel.textContent = 'Checkbox label';
    cbLabel.style.color = '#333';
    el.appendChild(cb);
    el.appendChild(cbLabel);
}

export function createRadio(el) {
    applyStyles(el, { width: '200px', height: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' });
    const rd = CanvasAPI.createElement('input');
    rd.type = 'radio';
    applyStyles(rd, { width: '16px', height: '16px', margin: '0' });
    const rdLabel = CanvasAPI.createElement('span');
    rdLabel.textContent = 'Radio label';
    rdLabel.style.color = '#333';
    el.appendChild(rd);
    el.appendChild(rdLabel);
}

export function createTable(el) {
    applyStyles(el, { width: '400px', height: 'auto', borderCollapse: 'collapse', fontSize: '14px' });
    const thead = CanvasAPI.createElement('thead');
    const headerRow = CanvasAPI.createElement('tr');
    for (let c = 1; c <= 3; c++) {
        const th = CanvasAPI.createElement('th');
        th.textContent = `Header ${c}`;
        th.style.cssText = 'padding: 10px 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: 600; text-align: left;';
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    el.appendChild(thead);

    const tbody = CanvasAPI.createElement('tbody');
    for (let r = 1; r <= 3; r++) {
        const row = CanvasAPI.createElement('tr');
        for (let c = 1; c <= 3; c++) {
            const td = CanvasAPI.createElement('td');
            td.textContent = `Row ${r}, Col ${c}`;
            td.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd;';
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    el.appendChild(tbody);
}

export function createList(el) {
    applyStyles(el, { width: '250px', height: 'auto', padding: '0', margin: '0', listStyle: 'none', fontSize: '14px' });
    const items = ['List Item 1', 'List Item 2', 'List Item 3'];
    items.forEach((text, i) => {
        const li = CanvasAPI.createElement('li');
        li.textContent = text;
        li.style.cssText = `padding: 10px 16px; border-bottom: 1px solid #eee; color: #333;${i === 0 ? ' background: #f8f9fa;' : ''}`;
        el.appendChild(li);
    });
}

export function createForm(el) {
    applyStyles(el, { width: '400px', height: '300px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' });
}

export function createVideo(el) {
    applyStyles(el, { width: '400px', height: '225px', backgroundColor: '#000' });
}

export function createAudio(el) {
    applyStyles(el, { width: '300px', height: '50px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' });
}

export function createIcon(el) {
    applyStyles(el, { width: '24px', height: '24px', fontSize: '24px' });
    el.textContent = '★';
}

export function createSvg(el) {
    applyStyles(el, { width: '100px', height: '100px', border: '1px dashed #ccc' });
}

export function createSelect(el) {
    applyStyles(el, { width: '200px', height: '36px', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' });
    el.innerHTML = '<option>Option 1</option><option>Option 2</option><option>Option 3</option>';
}

export const FACTORIES = {
    section: createSection,
    container: createContainer,
    row: createRow,
    column: createColumn,
    div: createDiv,
    card: createCard,
    text: createText,
    heading: createHeading,
    paragraph: createParagraph,
    button: createButton,
    link: createLink,
    image: createImage,
    input: createInput,
    textarea: createTextarea,
    checkbox: createCheckbox,
    radio: createRadio,
    table: createTable,
    list: createList,
    form: createForm,
    video: createVideo,
    audio: createAudio,
    icon: createIcon,
    svg: createSvg,
    select: createSelect
};

export const ELEMENT_TYPES = [
    { type: 'section', label: 'Section', icon: '☐', tag: 'section', container: true },
    { type: 'container', label: 'Container', icon: '▣', tag: 'div', container: true },
    { type: 'row', label: 'Row', icon: '▤', tag: 'div', container: true },
    { type: 'column', label: 'Column', icon: '▥', tag: 'div', container: true },
    { type: 'div', label: 'Div', icon: '□', tag: 'div', container: true },
    { type: 'card', label: 'Card', icon: '▧', tag: 'div', container: true },
    { type: 'text', label: 'Text', icon: 'T', tag: 'span', container: false },
    { type: 'heading', label: 'Heading', icon: 'H', tag: 'h2', container: false },
    { type: 'paragraph', label: 'Paragraph', icon: '¶', tag: 'p', container: false },
    { type: 'button', label: 'Button', icon: '▢', tag: 'button', container: false },
    { type: 'link', label: 'Link', icon: '🔗', tag: 'a', container: false },
    { type: 'image', label: 'Image', icon: '🖼', tag: 'img', container: false },
    { type: 'icon', label: 'Icon', icon: '★', tag: 'i', container: false },
    { type: 'svg', label: 'SVG', icon: '◇', tag: 'svg', container: false },
    { type: 'video', label: 'Video', icon: '▶', tag: 'video', container: false },
    { type: 'audio', label: 'Audio', icon: '♫', tag: 'audio', container: false },
    { type: 'input', label: 'Input', icon: '▁', tag: 'input', container: false },
    { type: 'textarea', label: 'Textarea', icon: '▂', tag: 'textarea', container: false },
    { type: 'select', label: 'Select', icon: '▾', tag: 'select', container: false },
    { type: 'checkbox', label: 'Checkbox', icon: '☑', tag: 'div', container: false },
    { type: 'radio', label: 'Radio', icon: '◉', tag: 'div', container: false },
    { type: 'table', label: 'Table', icon: '⊞', tag: 'table', container: true },
    { type: 'list', label: 'List', icon: '≡', tag: 'ul', container: true },
    { type: 'form', label: 'Form', icon: '📋', tag: 'form', container: true }
];
