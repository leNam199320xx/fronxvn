/**
 * ProjectManager - Save/Load project dưới dạng JSON
 * Hỗ trợ:
 * - Auto-save vào localStorage (mỗi khi có thay đổi)
 * - Auto-load khi mở lại trang
 * - Save/Load file JSON thủ công
 */
import eventBus from './event-bus.js';

export class ProjectManager {
    constructor(editor) {
        this.editor = editor;
        this.autoSaveKey = 'editor-project-autosave';
        this.autoSaveDelay = 1000; // debounce 1s
        this._autoSaveTimer = null;

        this._bindEvents();

        // Auto-load project từ localStorage khi khởi tạo
        setTimeout(() => this._autoLoad(), 100);
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('project:save', () => this.saveToFile());
        eventBus.on('project:load', () => this.loadFromFile());

        // Auto-save khi có thay đổi
        eventBus.on('element:added', () => this._scheduleAutoSave());
        eventBus.on('element:deleted', () => this._scheduleAutoSave());
        eventBus.on('element:updated', () => this._scheduleAutoSave());
        eventBus.on('history:changed', () => this._scheduleAutoSave());
    }

    /** Debounce auto-save */
    _scheduleAutoSave() {
        clearTimeout(this._autoSaveTimer);
        this._autoSaveTimer = setTimeout(() => this._autoSave(), this.autoSaveDelay);
    }

    /** Auto-save vào localStorage */
    _autoSave() {
        try {
            const project = this._getProjectData();
            localStorage.setItem(this.autoSaveKey, JSON.stringify(project));
        } catch (e) {
            console.warn('Auto-save failed:', e);
        }
    }

    /** Auto-load từ localStorage */
    _autoLoad() {
        try {
            const data = localStorage.getItem(this.autoSaveKey);
            if (!data) return;

            const project = JSON.parse(data);
            if (project && project.elements && project.elements.length > 0) {
                this._loadProject(project);
            }
        } catch (e) {
            console.warn('Auto-load failed:', e);
        }
    }

    /** Lấy project data hiện tại */
    _getProjectData() {
        const canvas = this.editor.canvas;
        const elements = Array.from(canvas.querySelectorAll(':scope > [data-editor-element]'));

        return {
            version: '1.0',
            timestamp: Date.now(),
            meta: this.editor.projectMeta || {
                title: '',
                description: '',
                ogTitle: '',
                ogDescription: '',
                ogImage: '',
                canonical: ''
            },
            canvas: {
                width: canvas.style.width || '2000px',
                height: canvas.style.height || '2000px'
            },
            elements: elements.map(el => this._serializeElement(el))
        };
    }

    /** Lưu project thành file JSON và download */
    saveToFile() {
        const project = this._getProjectData();
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /** Load project từ file JSON */
    loadFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const project = JSON.parse(event.target.result);
                    this._loadProject(project);
                    // Lưu lại vào auto-save
                    this._autoSave();
                } catch (err) {
                    console.error('Failed to load project:', err);
                    alert('Invalid project file.');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    /** Load project data vào canvas */
    _loadProject(project) {
        const canvas = this.editor.canvas;

        // Xóa tất cả elements hiện tại
        canvas.querySelectorAll('[data-editor-element]').forEach(el => el.remove());

        // Bỏ chọn
        this.editor.selection.deselectAll();

        // Khôi phục meta
        if (project.meta) {
            this.editor.projectMeta = project.meta;
        }

        // Tạo lại elements
        if (project.elements) {
            project.elements.forEach(data => {
                const el = this._deserializeElement(data);
                canvas.appendChild(el);
            });
        }

        // Xóa history
        this.editor.history.clear();

        eventBus.emit('layer:refresh');
        eventBus.emit('project:meta-updated', this.editor.projectMeta);
    }

    /** Xóa auto-save (reset project) */
    clearAutoSave() {
        localStorage.removeItem(this.autoSaveKey);
    }

    /** Serialize element thành object */
    _serializeElement(el) {
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

        // Text/innerHTML
        const childEls = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
        if (childEls.length === 0) {
            obj.text = el.innerHTML || '';
        }

        // Children
        childEls.forEach(child => {
            obj.children.push(this._serializeElement(child));
        });

        return obj;
    }

    /** Deserialize object thành element */
    _deserializeElement(data) {
        const el = document.createElement(data.tag || 'div');
        el.setAttribute('data-editor-element', '');
        el.id = data.id || `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        if (data.type) el.dataset.type = data.type;
        if (data.name) el.dataset.name = data.name;
        if (data.container) el.dataset.container = 'true';
        if (data.locked) {
            el.dataset.locked = 'true';
            el.style.pointerEvents = 'none';
        }
        if (data.hidden) {
            el.dataset.hidden = 'true';
            el.dataset.originalDisplay = data.originalDisplay || '';
            // Không set display:none — element sẽ có style.display=none từ style object
        }

        // Restore breakpoint styles
        if (data.bpStyles) {
            el.__bpStyles = data.bpStyles;
        }

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

        // Text hoặc innerHTML
        if (data.text && (!data.children || data.children.length === 0)) {
            el.innerHTML = data.text;
        }

        // Children
        if (data.children) {
            data.children.forEach(childData => {
                const child = this._deserializeElement(childData);
                el.appendChild(child);
            });
        }

        return el;
    }
}
