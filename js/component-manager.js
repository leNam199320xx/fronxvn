/**
 * ComponentManager — Quản lý Component System
 *
 * Luồng hoạt động:
 *   1. User chọn elements → "Save as Component" → tạo ComponentDefinition
 *   2. User click component trong ComponentPanel → insertComponent() → tạo instance trên canvas
 *   3. User "Edit Definition" → updateDefinition() → sync tất cả instances
 *   4. User "Detach Instance" → detachInstance() → tách khỏi definition, thành plain HTML
 *
 * Data model:
 *   ComponentDefinition { id, name, html, bpStyles, thumbnail, createdAt }
 *   Instance trên canvas: data-component-id, data-instance-id gắn lên root element
 */
import eventBus from './event-bus.js';
import { COMPONENT_ID_RANDOM_LENGTH, ELEMENT_ID_RANDOM_LENGTH } from './config.js';

export class ComponentManager {
    constructor(editor) {
        this.editor = editor;

        /** @type {ComponentDefinition[]} */
        this._components = [];

        this._bindEvents();
    }

    // ─────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────

    /**
     * Lưu elements đang chọn thành một ComponentDefinition mới.
     * @param {string} [name] - tên component; nếu bỏ qua sẽ dùng tên mặc định
     * @returns {ComponentDefinition|null}
     */
    saveComponent(name) {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) {
            console.warn('[ComponentManager] saveComponent: nothing selected');
            return null;
        }

        // Serialize thành HTML (giống page-manager._saveCurrentPageState)
        const tempDiv = document.createElement('div');
        elements.forEach(el => tempDiv.appendChild(el.cloneNode(true)));

        // Thu thập bpStyles
        const bpStyles = {};
        elements.forEach(el => {
            el.querySelectorAll('[data-editor-element]').forEach(node => {
                if (node.id && node.__bpStyles) bpStyles[node.id] = node.__bpStyles;
            });
            if (el.id && el.__bpStyles) bpStyles[el.id] = el.__bpStyles;
        });

        const compName = (name || '').trim() || `Component ${this._components.length + 1}`;
        const id = this._generateId();

        /** @type {ComponentDefinition} */
        const def = {
            id,
            name: compName,
            html: tempDiv.innerHTML,
            bpStyles,
            thumbnail: this._generateThumbnail(elements),
            createdAt: Date.now()
        };

        this._components.push(def);

        eventBus.emit('component:saved', def);
        eventBus.emit('component:list-changed', this._components);

        return def;
    }

    /**
     * Chèn một instance của component lên canvas.
     * @param {string} componentId
     * @param {{ x?: number, y?: number }} [opts]
     * @returns {HTMLElement|null} root element của instance
     */
    insertComponent(componentId, opts = {}) {
        const def = this._findDef(componentId);
        if (!def) {
            console.warn(`[ComponentManager] insertComponent: component "${componentId}" not found`);
            return null;
        }

        const instanceId = this._generateInstanceId();
        const root = this._instantiate(def, instanceId);

        // Vị trí đặt instance
        const x = opts.x ?? 60;
        const y = opts.y ?? 60;
        root.style.left = x + 'px';
        root.style.top  = y + 'px';

        const parent = this.editor.canvas;
        parent.appendChild(root);

        eventBus.emit('history:push', {
            type: 'component:insert',
            element: root,
            parent,
            componentId,
            instanceId
        });

        eventBus.emit('element:added', root);
        eventBus.emit('layer:refresh');
        this.editor.selection.select(root);

        return root;
    }

    /**
     * Cập nhật definition từ element instance đang chọn.
     * Tìm tất cả instances khác trên tất cả pages và sync HTML.
     * @param {string} componentId
     */
    updateDefinition(componentId) {
        const def = this._findDef(componentId);
        if (!def) return;

        // Lấy instance đang chọn
        const sel = this.editor.selection.getSelected();
        if (!sel || sel.dataset.componentId !== componentId) {
            console.warn('[ComponentManager] updateDefinition: selected element is not an instance of this component');
            return;
        }

        // Serialize instance hiện tại thành HTML mới cho definition
        const clone = sel.cloneNode(true);
        // Xóa instance attrs trên clone để không lưu vào definition
        clone.removeAttribute('data-component-id');
        clone.removeAttribute('data-instance-id');

        // Bao trong div tạm để lấy innerHTML
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(clone);
        def.html = tempDiv.innerHTML;

        // Thu thập bpStyles mới
        const bpStyles = {};
        sel.querySelectorAll('[data-editor-element]').forEach(node => {
            if (node.id && node.__bpStyles) bpStyles[node.id] = node.__bpStyles;
        });
        if (sel.id && sel.__bpStyles) bpStyles[sel.id] = sel.__bpStyles;
        def.bpStyles = bpStyles;

        def.thumbnail = this._generateThumbnail([sel]);

        // Sync tất cả instances khác trên canvas hiện tại
        this._syncInstances(componentId, def, sel);

        eventBus.emit('component:updated', def);
        eventBus.emit('component:list-changed', this._components);
        eventBus.emit('layer:refresh');
    }

    /**
     * Tách instance khỏi definition — chuyển thành plain HTML element.
     * @param {HTMLElement} instanceEl - root element của instance
     */
    detachInstance(instanceEl) {
        if (!instanceEl) return;

        const componentId = instanceEl.dataset.componentId;
        const instanceId  = instanceEl.dataset.instanceId;

        instanceEl.removeAttribute('data-component-id');
        instanceEl.removeAttribute('data-instance-id');

        // Xóa attrs khỏi tất cả con
        instanceEl.querySelectorAll('[data-component-id]').forEach(el => {
            el.removeAttribute('data-component-id');
            el.removeAttribute('data-instance-id');
        });

        eventBus.emit('history:push', {
            type: 'component:detach',
            element: instanceEl,
            componentId,
            instanceId
        });

        eventBus.emit('element:updated', instanceEl);
        eventBus.emit('layer:refresh');
    }

    /**
     * Xóa một ComponentDefinition.
     * Các instances hiện có trên canvas được detach tự động.
     * @param {string} componentId
     */
    deleteComponent(componentId) {
        const idx = this._components.findIndex(c => c.id === componentId);
        if (idx === -1) return;

        // Detach tất cả instances còn đang trên canvas
        this.editor.canvas
            .querySelectorAll(`[data-component-id="${componentId}"]`)
            .forEach(el => this.detachInstance(el));

        this._components.splice(idx, 1);

        eventBus.emit('component:deleted', componentId);
        eventBus.emit('component:list-changed', this._components);
    }

    /**
     * Đổi tên component.
     * @param {string} componentId
     * @param {string} newName
     */
    renameComponent(componentId, newName) {
        const def = this._findDef(componentId);
        if (!def) return;
        const trimmed = (newName || '').trim();
        if (!trimmed) return;
        def.name = trimmed;
        eventBus.emit('component:list-changed', this._components);
    }

    /**
     * Trả về mảng plain object (không bao gồm DOM refs) để serialize vào JSON.
     * @returns {object[]}
     */
    getComponents() {
        return this._components.map(def => ({
            id:        def.id,
            name:      def.name,
            html:      def.html,
            bpStyles:  def.bpStyles  || {},
            thumbnail: def.thumbnail || '',
            createdAt: def.createdAt || Date.now()
        }));
    }

    /**
     * Khôi phục components từ JSON.
     * @param {object[]} data
     */
    loadComponents(data) {
        if (!Array.isArray(data)) return;
        this._components = data.map(d => ({
            id:        d.id        || this._generateId(),
            name:      d.name      || 'Component',
            html:      d.html      || '',
            bpStyles:  d.bpStyles  || {},
            thumbnail: d.thumbnail || '',
            createdAt: d.createdAt || Date.now()
        }));
        eventBus.emit('component:list-changed', this._components);
    }

    /**
     * Trả về definition theo id.
     * @param {string} id
     * @returns {ComponentDefinition|undefined}
     */
    getDefinition(id) {
        return this._findDef(id);
    }

    // ─────────────────────────────────────────────
    //  Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Tạo DOM element từ definition với data-component-id và data-instance-id.
     * @param {ComponentDefinition} def
     * @param {string} instanceId
     * @returns {HTMLElement}
     */
    _instantiate(def, instanceId) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = def.html;

        // Lấy root element đầu tiên
        const roots = Array.from(tempDiv.children);
        let root;

        if (roots.length === 1) {
            root = roots[0];
        } else {
            // Nhiều roots → bọc trong wrapper div
            root = document.createElement('div');
            root.setAttribute('data-editor-element', '');
            root.dataset.type      = 'container';
            root.dataset.name      = def.name;
            root.dataset.container = 'true';
            root.style.position    = 'absolute';
            roots.forEach(r => root.appendChild(r));
        }

        // Gán attrs instance
        root.dataset.componentId = def.id;
        root.dataset.instanceId  = instanceId;
        root.dataset.name        = def.name;

        // Sinh id mới cho root và tất cả con để tránh duplicate
        this._regenIds(root);

        // Restore bpStyles
        if (def.bpStyles) {
            Object.entries(def.bpStyles).forEach(([id, styles]) => {
                // bpStyles được map theo id gốc — sau regen id sẽ không khớp
                // nên chúng ta chỉ restore lên root nếu id match
                const el = root.id === id ? root : root.querySelector(`#${CSS.escape(id)}`);
                if (el) el.__bpStyles = JSON.parse(JSON.stringify(styles));
            });
        }

        return root;
    }

    /**
     * Sinh id mới cho element và tất cả con cháu.
     * @param {HTMLElement} el
     */
    _regenIds(el) {
        el.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;
        el.querySelectorAll('[data-editor-element]').forEach(child => {
            child.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;
        });
    }

    /**
     * Sync HTML của definition xuống tất cả instances trên canvas hiện tại.
     * @param {string} componentId
     * @param {ComponentDefinition} def
     * @param {HTMLElement} [skip] - instance không cần sync (vừa được edit)
     */
    _syncInstances(componentId, def, skip) {
        this.editor.canvas
            .querySelectorAll(`[data-component-id="${componentId}"]`)
            .forEach(inst => {
                if (inst === skip) return;

                const instanceId = inst.dataset.instanceId;
                const parent     = inst.parentNode;
                const nextSibling = inst.nextSibling;

                // Tạo instance mới từ definition cập nhật
                const newInst = this._instantiate(def, instanceId);

                // Giữ nguyên vị trí và kích thước
                newInst.style.left   = inst.style.left;
                newInst.style.top    = inst.style.top;
                newInst.style.width  = inst.style.width  || newInst.style.width;
                newInst.style.height = inst.style.height || newInst.style.height;

                // Replace trong DOM
                if (nextSibling) {
                    parent.insertBefore(newInst, nextSibling);
                } else {
                    parent.appendChild(newInst);
                }
                inst.remove();

                eventBus.emit('element:updated', newInst);
            });
    }

    /**
     * Tạo thumbnail data URL đơn giản (SVG placeholder với tên component).
     * @param {HTMLElement[]} elements
     * @returns {string}
     */
    _generateThumbnail(elements) {
        const name = elements[0]?.dataset?.name || 'Component';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
            <rect width="120" height="80" fill="#1e1e2e" rx="4"/>
            <rect x="8" y="8" width="104" height="64" fill="#2a2a3e" rx="2" stroke="#444" stroke-width="1"/>
            <text x="60" y="44" font-family="sans-serif" font-size="10" fill="#888" text-anchor="middle">${name}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /** @param {string} id */
    _findDef(id) {
        return this._components.find(c => c.id === id);
    }

    _generateId() {
        return `comp-${Date.now()}-${Math.random().toString(36).substr(2, COMPONENT_ID_RANDOM_LENGTH)}`;
    }

    _generateInstanceId() {
        return `inst-${Date.now()}-${Math.random().toString(36).substr(2, COMPONENT_ID_RANDOM_LENGTH)}`;
    }

    // ─────────────────────────────────────────────
    //  EventBus bindings
    // ─────────────────────────────────────────────

    _bindEvents() {
        eventBus.on('component:save',         ()           => this.saveComponent());
        eventBus.on('component:insert',       (id)         => this.insertComponent(id));
        eventBus.on('component:update-def',   (id)         => this.updateDefinition(id));
        eventBus.on('component:detach',       ()           => {
            const el = this.editor.selection.getSelected();
            if (el) this.detachInstance(el);
        });
        eventBus.on('component:delete',       (id)         => this.deleteComponent(id));
        eventBus.on('component:rename',       ({ id, name }) => this.renameComponent(id, name));
    }
}

/**
 * @typedef {Object} ComponentDefinition
 * @property {string} id
 * @property {string} name
 * @property {string} html
 * @property {Object} bpStyles
 * @property {string} thumbnail  - data URL (SVG placeholder hoặc PNG từ thumbnail generator)
 * @property {number} createdAt
 */
