/**
 * ProjectManager - Save/Load project dưới dạng JSON
 * Hỗ trợ:
 * - Auto-save vào localStorage (mỗi khi có thay đổi)
 * - Auto-load khi mở lại trang
 * - Save/Load file JSON thủ công
 * - Format v2.0 với pages[] (backward compatible với v1.0 elements[])
 */
import eventBus from './event-bus.js';
import {
    AUTOSAVE_STORAGE_KEY,
    AUTOSAVE_DELAY_MS,
    AUTOLOAD_DELAY_MS,
    PROJECT_VERSION,
    ELEMENT_ID_RANDOM_LENGTH
} from './config.js';
export class ProjectManager {
    constructor(editor) {
        this.editor = editor;
        this.autoSaveKey   = AUTOSAVE_STORAGE_KEY;
        this.autoSaveDelay = AUTOSAVE_DELAY_MS;
        this._autoSaveTimer = null;

        this._bindEvents();

        // Auto-load (hoặc tạo trang mặc định) khi khởi tạo
        setTimeout(() => this._autoLoad(), AUTOLOAD_DELAY_MS);
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('project:save', () => this.saveToFile());
        eventBus.on('project:load', () => this.loadFromFile());

        // Auto-save khi có thay đổi
        eventBus.on('element:added',   () => this._scheduleAutoSave());
        eventBus.on('element:deleted', () => this._scheduleAutoSave());
        eventBus.on('element:updated', () => this._scheduleAutoSave());
        eventBus.on('history:changed', () => this._scheduleAutoSave());
        // Auto-save khi có thay đổi về trang
        eventBus.on('page:added',   () => this._scheduleAutoSave());
        eventBus.on('page:deleted', () => this._scheduleAutoSave());
        eventBus.on('page:renamed', () => this._scheduleAutoSave());
        eventBus.on('page:switched', () => this._scheduleAutoSave());
        // Auto-save khi có thay đổi về component
        eventBus.on('component:saved',        () => this._scheduleAutoSave());
        eventBus.on('component:updated',      () => this._scheduleAutoSave());
        eventBus.on('component:deleted',      () => this._scheduleAutoSave());
        eventBus.on('component:list-changed', () => this._scheduleAutoSave());
        // Auto-save khi theme thay đổi
        eventBus.on('project:schedule-save',  () => this._scheduleAutoSave());
        eventBus.on('theme:changed',          () => this._scheduleAutoSave());
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
            console.warn('[ProjectManager] Auto-save failed (storage full?):', e);
        }
    }

    /** Auto-load từ localStorage; nếu không có thì tạo trang mặc định */
    _autoLoad() {
        try {
            const data = localStorage.getItem(this.autoSaveKey);
            if (data) {
                const project = JSON.parse(data);
                if (project) {
                    this._loadProject(project);
                    return;
                }
            }
        } catch (e) {
            console.warn('[ProjectManager] Auto-load failed:', e);
        }

        // Không có autosave → tạo trang mặc định qua PageManager
        this.editor.pageManager.loadPages([]);
    }

    /** Lấy project data hiện tại (format v2.2) */
    _getProjectData() {
        return {
            version: PROJECT_VERSION,
            timestamp: Date.now(),
            meta: this.editor.projectMeta || {
                title: '',
                description: '',
                ogTitle: '',
                ogDescription: '',
                ogImage: '',
                canonical: ''
            },
            theme: this.editor.themeManager
                ? this.editor.themeManager.getTheme()
                : {},
            components: this.editor.componentManager
                ? this.editor.componentManager.getComponents()
                : [],
            pages: this.editor.pageManager.getPages()
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
                    this._autoSave();
                } catch (err) {
                    console.error('[ProjectManager] Failed to load project:', err);
                    alert('Invalid project file.');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    /** Load project data — hỗ trợ v2.1 (components[]+pages[]), v2.0 (pages[]) và v1.0 (elements[]) */
    _loadProject(project) {
        if (!project) return;

        // Khôi phục meta
        if (project.meta) {
            this.editor.projectMeta = project.meta;
            eventBus.emit('project:meta-updated', this.editor.projectMeta);
        }

        // Khôi phục theme (v2.2)
        if (this.editor.themeManager && project.theme) {
            this.editor.themeManager.loadTheme(project.theme);
        }

        // Khôi phục components (v2.1)
        if (this.editor.componentManager && Array.isArray(project.components)) {
            this.editor.componentManager.loadComponents(project.components);
        }

        // ── Format v2.0/v2.1: có pages[] ──
        if (Array.isArray(project.pages) && project.pages.length > 0) {
            this.editor.pageManager.loadPages(project.pages);
            return;
        }

        // ── Format v1.0: backward compat (có elements[]) ──
        if (Array.isArray(project.elements)) {
            const html = this._elementsToHtml(project.elements);
            const bpStyles = this._extractBpStyles(project.elements);
            const legacyPage = {
                id: 'page-legacy-0001',
                name: 'Page 1',
                html,
                bpStyles,
                meta: project.meta || {}
            };
            this.editor.pageManager.loadPages([legacyPage]);
            return;
        }

        // ── Format không hợp lệ ──
        console.warn('[ProjectManager] _loadProject: unrecognized format, loading empty project.');
        this.editor.pageManager.loadPages([]);
    }

    /** Xóa auto-save (reset project) */
    clearAutoSave() {
        localStorage.removeItem(this.autoSaveKey);
    }

    // ─────────────────────────────────────────────
    //  Backward compat helpers (v1.0 → v2.0)
    // ─────────────────────────────────────────────

    /**
     * Chuyển đổi mảng element objects (v1.0) thành innerHTML string.
     * @param {Array} elements
     * @returns {string}
     */
    _elementsToHtml(elements) {
        const tempContainer = document.createElement('div');
        elements.forEach(data => {
            const el = this._deserializeElement(data);
            tempContainer.appendChild(el);
        });
        return tempContainer.innerHTML;
    }

    /**
     * Extract bpStyles từ mảng element objects (v1.0).
     * @param {Array} elements
     * @returns {Object}
     */
    _extractBpStyles(elements) {
        const bpStyles = {};
        const collect = (elData) => {
            if (elData.id && elData.bpStyles) {
                bpStyles[elData.id] = elData.bpStyles;
            }
            if (Array.isArray(elData.children)) {
                elData.children.forEach(collect);
            }
        };
        elements.forEach(collect);
        return bpStyles;
    }

    // ─────────────────────────────────────────────
    //  Serialize / Deserialize element (dùng cho backward compat)
    // ─────────────────────────────────────────────

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
        el.id = data.id || `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;

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
