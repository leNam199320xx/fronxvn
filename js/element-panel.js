/**
 * ElementPanel - Right sidebar hiển thị thư viện phần tử
 * Click để thêm vào phần tử đang chọn hoặc canvas
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
import { generateElementId } from './core/ids.js';
import { ELEMENT_TYPES, FACTORIES } from './element-registry.js';

export class ElementPanel {
    constructor(editor) {
        this.editor = editor;
        this.container = document.querySelector('#panel-right');
        this.selectedElement = null;
        this._items = null;

        this._bindEvents();
        this._render();
    }

    init() {}

    refresh() {
        this._render();
    }

    destroy() {}

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
        return ELEMENT_TYPES;
    }

    /** Render element library */
    _render() {
        this.container.innerHTML = '';

        const section = document.createElement('div');
        section.className = 'panel-section';

        const header = document.createElement('div');
        header.className = 'panel-section-header';
        header.innerHTML = 'Elements <span class="arrow">▼</span>';

        const body = document.createElement('div');
        body.className = 'panel-section-body';

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

        body.appendChild(grid);

        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });

        section.appendChild(header);
        section.appendChild(body);
        this.container.appendChild(section);

        this._items = this.container.querySelectorAll('.element-library-item');
    }

    /** Thêm element vào canvas */
    _addElement(item) {
        if (this.selectedElement && this.selectedElement.dataset.container !== 'true') {
            return;
        }

        const el = this._createElement(item);
        const parent = this.selectedElement || this.editor.canvas;

        const parentDisplay = parent.style.display;
        if (['flex', 'grid'].includes(parentDisplay)) {
            el.style.position = 'relative';
            el.style.left = '';
            el.style.top = '';
        }

        parent.appendChild(el);

        eventBus.emit('history:push', {
            type: 'add',
            element: el,
            parent: parent
        });

        eventBus.emit('element:added', el);
        eventBus.emit('layer:refresh');

        this.editor.selection.select(el);
    }

    /** Tạo DOM element */
    _createElement(item) {
        const el = CanvasAPI.createElement(item.tag);
        el.setAttribute('data-editor-element', '');
        el.dataset.type = item.type;

        if (item.container) {
            el.dataset.container = 'true';
        }

        el.style.position = 'absolute';
        el.style.left = '50px';
        el.style.top = '50px';

        const factory = FACTORIES[item.type];
        if (factory) {
            factory(el);
        }

        el.id = generateElementId();
        el.dataset.name = item.label;

        return el;
    }

    /** Cập nhật trạng thái disabled */
    _updateDisabledState() {
        const isContainer = this.selectedElement && this.selectedElement.dataset.container === 'true';
        if (this._items) {
            for (let i = 0; i < this._items.length; i++) {
                const item = this._items[i];
                if (isContainer) {
                    item.classList.add('disabled');
                } else {
                    item.classList.remove('disabled');
                }
            }
        }
    }
}
