/**
 * TemplateManager - Quản lý lưu và load template
 * Cho phép lưu element/nhóm element thành template để tái sử dụng
 * Template được lưu trong localStorage
 */
import eventBus from './event-bus.js';

export class TemplateManager {
    constructor(editor) {
        this.editor = editor;
        this.container = document.querySelector('[data-tab-content="templates"]');
        this.storageKey = 'editor-templates';
        this.templates = this._loadFromStorage();

        this._bindEvents();
        this._render();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('template:save', () => this._saveCurrentAsTemplate());
    }

    /** Load templates từ localStorage */
    _loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load templates:', e);
            return [];
        }
    }

    /** Lưu templates vào localStorage */
    _saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
        } catch (e) {
            console.error('Failed to save templates:', e);
        }
    }

    /** Render template panel */
    _render() {
        this.container.innerHTML = '';

        // Header với nút Save Template
        const header = document.createElement('div');
        header.style.cssText = 'padding: 8px 12px; border-bottom: 1px solid var(--border-color); display: flex; gap: 4px;';

        const btnSave = document.createElement('button');
        btnSave.textContent = '+ Save Selection as Template';
        btnSave.style.cssText = `
            flex: 1; padding: 6px 8px; background: var(--accent); border: none; 
            color: white; border-radius: 4px; cursor: pointer; font-size: 11px;
        `;
        btnSave.addEventListener('click', () => this._saveCurrentAsTemplate());

        const btnImport = document.createElement('button');
        btnImport.textContent = '↓';
        btnImport.title = 'Import templates from file';
        btnImport.style.cssText = `
            padding: 6px 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); 
            color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 11px;
        `;
        btnImport.addEventListener('click', () => this._importTemplates());

        const btnExport = document.createElement('button');
        btnExport.textContent = '↑';
        btnExport.title = 'Export templates to file';
        btnExport.style.cssText = `
            padding: 6px 8px; background: var(--bg-tertiary); border: 1px solid var(--border-color); 
            color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 11px;
        `;
        btnExport.addEventListener('click', () => this._exportTemplates());

        header.appendChild(btnSave);
        header.appendChild(btnImport);
        header.appendChild(btnExport);
        this.container.appendChild(header);

        // Template list
        const list = document.createElement('div');
        list.className = 'template-list';
        list.style.cssText = 'flex: 1; overflow-y: auto; padding: 8px;';

        if (this.templates.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding: 20px; text-align: center; color: var(--text-secondary); font-size: 12px;';
            empty.innerHTML = 'No templates saved yet.<br><br>Select an element and click<br>"Save Selection as Template"<br>to create one.';
            list.appendChild(empty);
        } else {
            this.templates.forEach((template, index) => {
                const item = this._createTemplateItem(template, index);
                list.appendChild(item);
            });
        }

        this.container.appendChild(list);
    }

    /** Tạo item template trong list */
    _createTemplateItem(template, index) {
        const item = document.createElement('div');
        item.className = 'template-item';
        item.style.cssText = `
            padding: 10px 12px; margin-bottom: 4px; background: var(--bg-tertiary);
            border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;
            transition: all 0.15s ease;
        `;

        // Hover effect
        item.addEventListener('mouseenter', () => {
            item.style.borderColor = 'var(--accent)';
            item.style.background = 'rgba(0, 120, 212, 0.1)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.borderColor = 'var(--border-color)';
            item.style.background = 'var(--bg-tertiary)';
        });

        // Info
        const info = document.createElement('div');
        info.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';

        const name = document.createElement('span');
        name.style.cssText = 'font-size: 12px; font-weight: 600; color: var(--text-primary);';
        name.textContent = template.name;

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 4px;';

        // Rename button
        const btnRename = document.createElement('button');
        btnRename.textContent = '✎';
        btnRename.title = 'Rename';
        btnRename.style.cssText = 'background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 12px; padding: 2px 4px;';
        btnRename.addEventListener('click', (e) => {
            e.stopPropagation();
            this._renameTemplate(index);
        });

        // Delete button
        const btnDelete = document.createElement('button');
        btnDelete.textContent = '✕';
        btnDelete.title = 'Delete';
        btnDelete.style.cssText = 'background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 12px; padding: 2px 4px;';
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            this._deleteTemplate(index);
        });

        actions.appendChild(btnRename);
        actions.appendChild(btnDelete);
        info.appendChild(name);
        info.appendChild(actions);

        // Description
        const desc = document.createElement('div');
        desc.style.cssText = 'font-size: 10px; color: var(--text-secondary);';
        const date = new Date(template.timestamp);
        desc.textContent = `${template.type} • ${date.toLocaleDateString()} ${date.toLocaleTimeString().slice(0, 5)}`;

        item.appendChild(info);
        item.appendChild(desc);

        // Click để insert template
        item.addEventListener('click', () => this._insertTemplate(template));

        return item;
    }

    /** Lưu element đang chọn thành template */
    _saveCurrentAsTemplate() {
        const el = this.editor.selection.getSelected();
        if (!el) {
            this._showNotification('Please select an element to save as template.');
            return;
        }

        // Prompt tên template
        const name = prompt('Template name:', el.dataset.name || el.dataset.type || 'My Template');
        if (!name) return;

        const template = {
            id: `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: name,
            type: el.dataset.type || el.tagName.toLowerCase(),
            timestamp: Date.now(),
            data: this._serializeElement(el)
        };

        this.templates.unshift(template);
        this._saveToStorage();
        this._render();

        this._showNotification(`Template "${name}" saved!`);
    }

    /** Insert template vào canvas */
    _insertTemplate(template) {
        const el = this._deserializeElement(template.data);

        // Offset vị trí
        el.style.left = '50px';
        el.style.top = '50px';

        // Target: element đang chọn (nếu là container) hoặc canvas
        const selected = this.editor.selection.getSelected();
        const parent = (selected && selected.dataset.container === 'true') ? selected : this.editor.canvas;

        // Nếu parent flex/grid -> relative
        if (['flex', 'grid'].includes(parent.style.display)) {
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

        this._showNotification(`Template "${template.name}" inserted.`);
    }

    /** Rename template */
    _renameTemplate(index) {
        const template = this.templates[index];
        const name = prompt('New name:', template.name);
        if (!name) return;

        template.name = name;
        this._saveToStorage();
        this._render();
    }

    /** Delete template */
    _deleteTemplate(index) {
        const template = this.templates[index];
        if (!confirm(`Delete template "${template.name}"?`)) return;

        this.templates.splice(index, 1);
        this._saveToStorage();
        this._render();
    }

    /** Export tất cả templates ra file JSON */
    _exportTemplates() {
        if (this.templates.length === 0) {
            this._showNotification('No templates to export.');
            return;
        }

        const json = JSON.stringify(this.templates, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `templates-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /** Import templates từ file JSON */
    _importTemplates() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (!Array.isArray(imported)) {
                        throw new Error('Invalid format');
                    }
                    // Merge với templates hiện có, tránh trùng id
                    const existingIds = new Set(this.templates.map(t => t.id));
                    const newTemplates = imported.filter(t => !existingIds.has(t.id));
                    this.templates = [...newTemplates, ...this.templates];
                    this._saveToStorage();
                    this._render();
                    this._showNotification(`Imported ${newTemplates.length} template(s).`);
                } catch (err) {
                    console.error('Failed to import templates:', err);
                    this._showNotification('Invalid template file.');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    /** Serialize element thành JSON (recursive) */
    _serializeElement(el) {
        const obj = {
            tag: el.tagName.toLowerCase(),
            type: el.dataset.type || '',
            name: el.dataset.name || '',
            container: el.dataset.container === 'true',
            style: {},
            attributes: {},
            innerHTML: '',
            children: []
        };

        // Style
        const style = el.style;
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            obj.style[prop] = style.getPropertyValue(prop);
        }

        // Attributes
        ['href', 'src', 'alt', 'placeholder', 'type', 'value'].forEach(attr => {
            if (el.hasAttribute(attr)) {
                obj.attributes[attr] = el.getAttribute(attr);
            }
        });

        // Children (editor elements)
        const editorChildren = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
        if (editorChildren.length > 0) {
            editorChildren.forEach(child => {
                obj.children.push(this._serializeElement(child));
            });
        } else {
            // Lưu innerHTML cho non-editor content (text, input children, etc.)
            obj.innerHTML = el.innerHTML || '';
        }

        return obj;
    }

    /** Deserialize JSON thành element (recursive) */
    _deserializeElement(data) {
        const el = document.createElement(data.tag || 'div');
        el.setAttribute('data-editor-element', '');
        el.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        if (data.type) el.dataset.type = data.type;
        if (data.name) el.dataset.name = data.name;
        if (data.container) el.dataset.container = 'true';

        // Style
        if (data.style) {
            Object.entries(data.style).forEach(([prop, value]) => {
                el.style.setProperty(prop, value);
            });
        }

        // Attributes
        if (data.attributes) {
            Object.entries(data.attributes).forEach(([attr, value]) => {
                el.setAttribute(attr, value);
            });
        }

        // Children hoặc innerHTML
        if (data.children && data.children.length > 0) {
            data.children.forEach(childData => {
                const child = this._deserializeElement(childData);
                el.appendChild(child);
            });
        } else if (data.innerHTML) {
            el.innerHTML = data.innerHTML;
        }

        return el;
    }

    /** Hiển thị notification tạm */
    _showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: #333; color: #fff; padding: 10px 20px; border-radius: 6px;
            font-size: 12px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeIn 0.2s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }
}
