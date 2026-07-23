/**
 * ElementPanel - Right sidebar hiển thị thư viện phần tử
 * Click để thêm vào phần tử đang chọn hoặc canvas
 */
import eventBus from './event-bus.js';
import { ELEMENT_ID_RANDOM_LENGTH } from './config.js';

export class ElementPanel {
    constructor(editor) {
        this.editor = editor;
        this.container = document.querySelector('[data-tab-content="elements"]');
        this.selectedElement = null;

        this._bindEvents();
        this._render();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('element:selected', (el) => {
            this.selectedElement = el;
            this._updateDisabledState();
        });

        eventBus.on('element:deselected', () => {
            this.selectedElement = null;
            this._updateDisabledState();
        });
    }

    /** Danh sách phần tử */
    _getElements() {
        return [
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
    }

    /** Render element library */
    _render() {
        const grid = document.createElement('div');
        grid.className = 'element-library-grid';

        this._getElements().forEach(item => {
            const el = document.createElement('div');
            el.className = 'element-library-item';
            el.dataset.type = item.type;
            el.innerHTML = `<span class="el-icon">${item.icon}</span>${item.label}`;
            el.addEventListener('click', () => this._addElement(item));
            grid.appendChild(el);
        });

        this.container.appendChild(grid);
    }

    /** Thêm element vào canvas */
    _addElement(item) {
        // Kiểm tra xem có thể thêm vào không
        if (this.selectedElement && this.selectedElement.dataset.container !== 'true') {
            return; // Không thể thêm con vào element không phải container
        }

        const el = this._createElement(item);
        const parent = this.selectedElement || this.editor.canvas;

        // Nếu parent là flex/grid -> children dùng position relative
        const parentDisplay = parent.style.display;
        if (['flex', 'grid'].includes(parentDisplay)) {
            el.style.position = 'relative';
            el.style.left = '';
            el.style.top = '';
        }

        parent.appendChild(el);

        // Emit events
        eventBus.emit('history:push', {
            type: 'add',
            element: el,
            parent: parent
        });

        eventBus.emit('element:added', el);
        eventBus.emit('layer:refresh');

        // Chọn element mới
        this.editor.selection.select(el);
    }

    /** Tạo DOM element */
    _createElement(item) {
        const el = document.createElement(item.tag);
        el.setAttribute('data-editor-element', '');
        el.dataset.type = item.type;

        if (item.container) {
            el.dataset.container = 'true';
        }

        // Default styles
        el.style.position = 'absolute';
        el.style.left = '50px';
        el.style.top = '50px';

        // Styles theo loại
        switch (item.type) {
            case 'section':
                el.style.width = '800px';
                el.style.height = '400px';
                el.style.backgroundColor = '#f5f5f5';
                el.style.border = '1px dashed #ccc';
                break;
            case 'container':
                el.style.width = '600px';
                el.style.height = '300px';
                el.style.backgroundColor = '#ffffff';
                el.style.border = '1px solid #ddd';
                break;
            case 'row':
                el.style.width = '100%';
                el.style.height = '100px';
                el.style.display = 'flex';
                el.style.backgroundColor = 'rgba(0,120,212,0.05)';
                el.style.border = '1px dashed #0078d4';
                break;
            case 'column':
                el.style.width = '200px';
                el.style.height = '200px';
                el.style.backgroundColor = 'rgba(0,120,212,0.05)';
                el.style.border = '1px dashed #0078d4';
                break;
            case 'div':
                el.style.width = '200px';
                el.style.height = '150px';
                el.style.backgroundColor = '#f0f0f0';
                el.style.border = '1px solid #ddd';
                break;
            case 'card':
                el.style.width = '300px';
                el.style.height = 'auto';
                el.style.backgroundColor = '#ffffff';
                el.style.border = '1px solid #e0e0e0';
                el.style.borderRadius = '8px';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                el.style.overflow = 'hidden';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                // Header
                const cardHeader = document.createElement('div');
                cardHeader.style.cssText = 'padding: 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; font-size: 16px;';
                cardHeader.textContent = 'Card Header';
                cardHeader.setAttribute('data-editor-element', '');
                cardHeader.dataset.type = 'div';
                cardHeader.dataset.name = 'Card Header';
                cardHeader.dataset.container = 'true';
                cardHeader.style.position = 'relative';
                // Body
                const cardBody = document.createElement('div');
                cardBody.style.cssText = 'padding: 16px; flex: 1; font-size: 14px; color: #555;';
                cardBody.textContent = 'Card body content goes here. You can add any content inside.';
                cardBody.setAttribute('data-editor-element', '');
                cardBody.dataset.type = 'div';
                cardBody.dataset.name = 'Card Body';
                cardBody.dataset.container = 'true';
                cardBody.style.position = 'relative';
                // Footer
                const cardFooter = document.createElement('div');
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
                break;
            case 'text':
                el.style.width = '200px';
                el.style.height = 'auto';
                el.textContent = 'Text content';
                el.style.fontSize = '14px';
                break;
            case 'heading':
                el.style.width = '400px';
                el.style.height = 'auto';
                el.textContent = 'Heading';
                el.style.fontSize = '32px';
                el.style.fontWeight = 'bold';
                break;
            case 'paragraph':
                el.style.width = '400px';
                el.style.height = 'auto';
                el.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
                el.style.fontSize = '16px';
                el.style.lineHeight = '1.5';
                break;
            case 'button':
                el.style.width = '120px';
                el.style.height = '40px';
                el.textContent = 'Button';
                el.style.backgroundColor = '#0078d4';
                el.style.color = '#ffffff';
                el.style.border = 'none';
                el.style.borderRadius = '4px';
                el.style.fontSize = '14px';
                el.style.cursor = 'pointer';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                break;
            case 'link':
                el.textContent = 'Link text';
                el.style.color = '#0078d4';
                el.style.textDecoration = 'underline';
                el.style.fontSize = '14px';
                el.href = '#';
                break;
            case 'image':
                el.style.width = '300px';
                el.style.height = '200px';
                el.style.backgroundColor = '#e0e0e0';
                el.style.border = '1px solid #ccc';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.alt = 'Image';
                break;
            case 'input':
                el.type = 'text';
                el.placeholder = 'Input...';
                el.style.width = '200px';
                el.style.height = '36px';
                el.style.padding = '8px';
                el.style.border = '1px solid #ccc';
                el.style.borderRadius = '4px';
                el.style.fontSize = '14px';
                break;
            case 'textarea':
                el.placeholder = 'Textarea...';
                el.style.width = '300px';
                el.style.height = '100px';
                el.style.padding = '8px';
                el.style.border = '1px solid #ccc';
                el.style.borderRadius = '4px';
                el.style.fontSize = '14px';
                break;
            case 'checkbox': {
                // Wrapper div chứa checkbox + label
                const cbWrapper = el;
                cbWrapper.style.width = '200px';
                cbWrapper.style.height = 'auto';
                cbWrapper.style.display = 'flex';
                cbWrapper.style.alignItems = 'center';
                cbWrapper.style.gap = '8px';
                cbWrapper.style.fontSize = '14px';
                // Thay tag input bằng div wrapper
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.style.width = '16px';
                cb.style.height = '16px';
                cb.style.margin = '0';
                const cbLabel = document.createElement('span');
                cbLabel.textContent = 'Checkbox label';
                cbLabel.style.color = '#333';
                el.appendChild(cb);
                el.appendChild(cbLabel);
                break;
            }
            case 'radio': {
                // Wrapper div chứa radio + label
                const rdWrapper = el;
                rdWrapper.style.width = '200px';
                rdWrapper.style.height = 'auto';
                rdWrapper.style.display = 'flex';
                rdWrapper.style.alignItems = 'center';
                rdWrapper.style.gap = '8px';
                rdWrapper.style.fontSize = '14px';
                const rd = document.createElement('input');
                rd.type = 'radio';
                rd.style.width = '16px';
                rd.style.height = '16px';
                rd.style.margin = '0';
                const rdLabel = document.createElement('span');
                rdLabel.textContent = 'Radio label';
                rdLabel.style.color = '#333';
                el.appendChild(rd);
                el.appendChild(rdLabel);
                break;
            }
            case 'table': {
                el.style.width = '400px';
                el.style.height = 'auto';
                el.style.borderCollapse = 'collapse';
                el.style.fontSize = '14px';
                // Tạo bảng mẫu 3 cột x 4 dòng (1 header + 3 body)
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                for (let c = 1; c <= 3; c++) {
                    const th = document.createElement('th');
                    th.textContent = `Header ${c}`;
                    th.style.cssText = 'padding: 10px 12px; border: 1px solid #ddd; background: #f5f5f5; font-weight: 600; text-align: left;';
                    headerRow.appendChild(th);
                }
                thead.appendChild(headerRow);
                el.appendChild(thead);

                const tbody = document.createElement('tbody');
                for (let r = 1; r <= 3; r++) {
                    const row = document.createElement('tr');
                    for (let c = 1; c <= 3; c++) {
                        const td = document.createElement('td');
                        td.textContent = `Row ${r}, Col ${c}`;
                        td.style.cssText = 'padding: 8px 12px; border: 1px solid #ddd;';
                        row.appendChild(td);
                    }
                    tbody.appendChild(row);
                }
                el.appendChild(tbody);
                break;
            }
            case 'list':
                el.style.width = '250px';
                el.style.height = 'auto';
                el.style.padding = '0';
                el.style.margin = '0';
                el.style.listStyle = 'none';
                el.style.fontSize = '14px';
                // 3 item mẫu có style
                const items = ['List Item 1', 'List Item 2', 'List Item 3'];
                items.forEach((text, i) => {
                    const li = document.createElement('li');
                    li.textContent = text;
                    li.style.cssText = `padding: 10px 16px; border-bottom: 1px solid #eee; color: #333;${i === 0 ? ' background: #f8f9fa;' : ''}`;
                    el.appendChild(li);
                });
                break;
            case 'form':
                el.style.width = '400px';
                el.style.height = '300px';
                el.style.padding = '20px';
                el.style.border = '1px solid #ddd';
                el.style.borderRadius = '8px';
                el.style.backgroundColor = '#fafafa';
                break;
            case 'video':
                el.style.width = '400px';
                el.style.height = '225px';
                el.style.backgroundColor = '#000';
                break;
            case 'audio':
                el.style.width = '300px';
                el.style.height = '50px';
                el.style.backgroundColor = '#f0f0f0';
                el.style.border = '1px solid #ccc';
                el.style.borderRadius = '4px';
                break;
            case 'icon':
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.fontSize = '24px';
                el.textContent = '★';
                break;
            case 'svg':
                el.style.width = '100px';
                el.style.height = '100px';
                el.style.border = '1px dashed #ccc';
                break;
            case 'select':
                el.style.width = '200px';
                el.style.height = '36px';
                el.style.padding = '4px 8px';
                el.style.border = '1px solid #ccc';
                el.style.borderRadius = '4px';
                el.innerHTML = '<option>Option 1</option><option>Option 2</option><option>Option 3</option>';
                break;
            default:
                el.style.width = '200px';
                el.style.height = '100px';
                el.style.backgroundColor = '#f0f0f0';
        }

        // Tạo ID unique
        el.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;
        el.dataset.name = item.label;

        return el;
    }

    /** Cập nhật trạng thái disabled */
    _updateDisabledState() {
        const items = this.container.querySelectorAll('.element-library-item');
        items.forEach(item => {
            if (this.selectedElement && this.selectedElement.dataset.container !== 'true') {
                item.classList.add('disabled');
            } else {
                item.classList.remove('disabled');
            }
        });
    }
}
