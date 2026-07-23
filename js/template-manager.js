/**
 * TemplateManager — Template Marketplace
 *
 * Hai loại template:
 *   1. Built-in  — shipped với editor, từ js/templates/
 *   2. User      — do user tạo từ canvas, lưu localStorage
 *
 * Insert modes:
 *   - "New Project"   — loadPages() thay toàn bộ project (confirm nếu có nội dung)
 *   - "Insert Pages"  — append pages vào project hiện tại
 *
 * UI: grid cards, filter bar (All / Landing / Portfolio / Blog / Business / Saved),
 *     search input, preview modal.
 */
import eventBus from './event-bus.js';
import { ELEMENT_ID_RANDOM_LENGTH } from './config.js';
import { BUILTIN_TEMPLATES, CATEGORIES } from './templates/index.js';

const STORAGE_KEY = 'editor-user-templates';

export class TemplateManager {
    constructor(editor) {
        this.editor    = editor;
        this.container = document.querySelector('[data-tab-content="templates"]');

        /** Built-in templates */
        this._builtins = BUILTIN_TEMPLATES;

        /** User-saved templates (element fragments, stored in localStorage) */
        this._userTemplates = this._loadUserTemplates();

        /** Active filter */
        this._activeCategory = 'all';

        /** Search query */
        this._searchQuery = '';

        this._bindEvents();
        this._render();
    }

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    _bindEvents() {
        eventBus.on('template:save', () => this._saveSelectionAsUserTemplate());
    }

    // ─────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────

    _render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // ── Header toolbar ────────────────────────────────────────────────────
        const toolbar = document.createElement('div');
        toolbar.className = 'tpl-toolbar';

        // Search
        const search = document.createElement('input');
        search.type        = 'text';
        search.placeholder = 'Search templates…';
        search.className   = 'tpl-search';
        search.value       = this._searchQuery;
        search.addEventListener('input', () => {
            this._searchQuery = search.value;
            this._renderGrid(grid);
        });
        toolbar.appendChild(search);

        // Save selection button
        const btnSave = document.createElement('button');
        btnSave.className   = 'tpl-save-btn';
        btnSave.textContent = '+ Save';
        btnSave.title       = 'Save selected element as template';
        btnSave.addEventListener('click', () => this._saveSelectionAsUserTemplate());
        toolbar.appendChild(btnSave);

        this.container.appendChild(toolbar);

        // ── Filter bar ────────────────────────────────────────────────────────
        const filterBar = document.createElement('div');
        filterBar.className = 'tpl-filter-bar';

        const allCategories = [
            ...CATEGORIES,
            { id: 'saved', label: 'Saved' }
        ];

        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className   = 'tpl-filter-btn' + (this._activeCategory === cat.id ? ' active' : '');
            btn.textContent = cat.label;
            btn.dataset.cat = cat.id;
            btn.addEventListener('click', () => {
                this._activeCategory = cat.id;
                filterBar.querySelectorAll('.tpl-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._renderGrid(grid);
            });
            filterBar.appendChild(btn);
        });

        this.container.appendChild(filterBar);

        // ── Grid ──────────────────────────────────────────────────────────────
        const grid = document.createElement('div');
        grid.className = 'tpl-grid';
        this._renderGrid(grid);
        this.container.appendChild(grid);
    }

    /**
     * Render/re-render grid of template cards into container.
     * @param {HTMLElement} grid
     */
    _renderGrid(grid) {
        grid.innerHTML = '';

        const items = this._getFilteredItems();

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tpl-empty';
            empty.innerHTML = `<span>📋</span><p>No templates found</p>`;
            grid.appendChild(empty);
            return;
        }

        items.forEach(item => {
            grid.appendChild(
                item._isUser
                    ? this._buildUserCard(item)
                    : this._buildBuiltinCard(item)
            );
        });
    }

    // ─────────────────────────────────────────────
    //  Filtering
    // ─────────────────────────────────────────────

    _getFilteredItems() {
        const q = this._searchQuery.toLowerCase().trim();

        let items = [];

        if (this._activeCategory === 'saved') {
            items = this._userTemplates.map(t => ({ ...t, _isUser: true }));
        } else if (this._activeCategory === 'all') {
            items = [
                ...this._builtins,
                ...this._userTemplates.map(t => ({ ...t, _isUser: true }))
            ];
        } else {
            items = this._builtins.filter(t => t.category === this._activeCategory);
        }

        if (q) {
            items = items.filter(t =>
                t.name.toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q)
            );
        }

        return items;
    }

    // ─────────────────────────────────────────────
    //  Cards
    // ─────────────────────────────────────────────

    _buildBuiltinCard(tpl) {
        const card = document.createElement('div');
        card.className = 'tpl-card';

        const thumb = document.createElement('div');
        thumb.className = 'tpl-thumb';
        if (tpl.thumbnail) thumb.style.backgroundImage = `url("${tpl.thumbnail}")`;
        card.appendChild(thumb);

        const info = document.createElement('div');
        info.className = 'tpl-card-info';
        info.innerHTML = `
            <span class="tpl-card-name">${tpl.name}</span>
            <span class="tpl-card-pages">${tpl.pages} page${tpl.pages !== 1 ? 's' : ''}</span>
        `;
        card.appendChild(info);

        const desc = document.createElement('p');
        desc.className   = 'tpl-card-desc';
        desc.textContent = tpl.description || '';
        card.appendChild(desc);

        const actions = document.createElement('div');
        actions.className = 'tpl-card-actions';

        const btnNew = document.createElement('button');
        btnNew.className   = 'tpl-btn tpl-btn-primary';
        btnNew.textContent = 'New Project';
        btnNew.title       = 'Replace current project with this template';
        btnNew.addEventListener('click', (e) => { e.stopPropagation(); this._insertAsNewProject(tpl); });

        const btnInsert = document.createElement('button');
        btnInsert.className   = 'tpl-btn';
        btnInsert.textContent = 'Insert Pages';
        btnInsert.title       = 'Append pages to current project';
        btnInsert.addEventListener('click', (e) => { e.stopPropagation(); this._insertPages(tpl); });

        const btnPreview = document.createElement('button');
        btnPreview.className   = 'tpl-btn tpl-btn-icon';
        btnPreview.textContent = '👁';
        btnPreview.title       = 'Preview template';
        btnPreview.addEventListener('click', (e) => { e.stopPropagation(); this._showPreview(tpl); });

        actions.appendChild(btnNew);
        actions.appendChild(btnInsert);
        actions.appendChild(btnPreview);
        card.appendChild(actions);

        return card;
    }

    _buildUserCard(tpl) {
        const card = document.createElement('div');
        card.className = 'tpl-card tpl-card-user';

        const thumb = document.createElement('div');
        thumb.className = 'tpl-thumb';
        card.appendChild(thumb);

        const info = document.createElement('div');
        info.className = 'tpl-card-info';
        info.innerHTML = `<span class="tpl-card-name">${tpl.name}</span><span class="tpl-card-pages">element</span>`;
        card.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'tpl-card-actions';

        const btnInsert = document.createElement('button');
        btnInsert.className   = 'tpl-btn tpl-btn-primary';
        btnInsert.textContent = 'Insert';
        btnInsert.addEventListener('click', (e) => { e.stopPropagation(); this._insertUserTemplate(tpl); });

        const btnDelete = document.createElement('button');
        btnDelete.className   = 'tpl-btn tpl-btn-danger';
        btnDelete.textContent = '✕';
        btnDelete.title       = 'Delete template';
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete template "${tpl.name}"?`)) {
                this._deleteUserTemplate(tpl.id);
            }
        });

        actions.appendChild(btnInsert);
        actions.appendChild(btnDelete);
        card.appendChild(actions);

        return card;
    }

    // ─────────────────────────────────────────────
    //  Insert modes (A3)
    // ─────────────────────────────────────────────

    /**
     * New Project — replace current project with template.
     * Confirm if canvas has content.
     * @param {BuiltinTemplate} tpl
     */
    _insertAsNewProject(tpl) {
        const hasContent = this.editor.canvas.querySelector('[data-editor-element]');

        if (hasContent) {
            const ok = confirm(
                `Replace current project with "${tpl.name}"?\n\nUnsaved changes will be lost.`
            );
            if (!ok) return;
        }

        // Regen IDs để tránh duplicate khi load nhiều lần
        const pages = this._regenPageIds(tpl.pages_data);

        this.editor.pageManager.loadPages(pages);

        // Auto-save ngay
        eventBus.emit('project:meta-updated', {
            title: tpl.pages_data[0]?.meta?.title || tpl.name,
            description: tpl.description || ''
        });

        this._showNotification(`"${tpl.name}" loaded as new project.`);
    }

    /**
     * Insert Pages — append template pages to current project.
     * @param {BuiltinTemplate} tpl
     */
    _insertPages(tpl) {
        const pages = this._regenPageIds(tpl.pages_data);

        // Lấy pages hiện tại, append thêm
        const currentPages = this.editor.pageManager.getPages();
        const merged = [...currentPages, ...pages];

        this.editor.pageManager.loadPages(merged);
        this._showNotification(`${pages.length} page(s) from "${tpl.name}" inserted.`);
    }

    /**
     * Insert user template (element fragment) lên canvas.
     * @param {object} tpl
     */
    _insertUserTemplate(tpl) {
        const el = this._deserializeElement(tpl.data);
        el.style.left = '50px';
        el.style.top  = '50px';

        const selected = this.editor.selection.getSelected();
        const parent   = (selected?.dataset.container === 'true') ? selected : this.editor.canvas;

        if (['flex', 'grid'].includes(parent.style.display)) {
            el.style.position = 'relative';
            el.style.left = '';
            el.style.top  = '';
        }

        parent.appendChild(el);
        eventBus.emit('history:push', { type: 'add', element: el, parent });
        eventBus.emit('element:added', el);
        eventBus.emit('layer:refresh');
        this.editor.selection.select(el);
        this._showNotification(`"${tpl.name}" inserted.`);
    }

    // ─────────────────────────────────────────────
    //  Preview Modal
    // ─────────────────────────────────────────────

    _showPreview(tpl) {
        const modal = document.createElement('div');
        modal.className = 'tpl-preview-modal';

        const box = document.createElement('div');
        box.className = 'tpl-preview-box';

        const header = document.createElement('div');
        header.className = 'tpl-preview-header';
        header.innerHTML = `
            <div>
                <strong>${tpl.name}</strong>
                <span class="tpl-preview-meta">${tpl.pages} page${tpl.pages !== 1 ? 's' : ''} · ${tpl.category}</span>
            </div>
            <button class="tpl-preview-close">✕</button>
        `;
        header.querySelector('.tpl-preview-close').addEventListener('click', () => modal.remove());

        const body = document.createElement('div');
        body.className = 'tpl-preview-body';

        // Thumbnail large
        const img = document.createElement('div');
        img.className = 'tpl-preview-thumb';
        if (tpl.thumbnail) img.style.backgroundImage = `url("${tpl.thumbnail}")`;
        body.appendChild(img);

        // Description
        const desc = document.createElement('p');
        desc.className   = 'tpl-preview-desc';
        desc.textContent = tpl.description || '';
        body.appendChild(desc);

        // Page list
        if (tpl.pages_data) {
            const pageList = document.createElement('div');
            pageList.className = 'tpl-preview-pages';
            pageList.innerHTML = `<strong>Pages:</strong> ${tpl.pages_data.map(p => p.name).join(', ')}`;
            body.appendChild(pageList);
        }

        const footer = document.createElement('div');
        footer.className = 'tpl-preview-footer';

        const btnNew = document.createElement('button');
        btnNew.className   = 'tpl-btn tpl-btn-primary';
        btnNew.textContent = 'New Project';
        btnNew.addEventListener('click', () => { modal.remove(); this._insertAsNewProject(tpl); });

        const btnInsert = document.createElement('button');
        btnInsert.className   = 'tpl-btn';
        btnInsert.textContent = 'Insert Pages';
        btnInsert.addEventListener('click', () => { modal.remove(); this._insertPages(tpl); });

        footer.appendChild(btnNew);
        footer.appendChild(btnInsert);

        box.appendChild(header);
        box.appendChild(body);
        box.appendChild(footer);
        modal.appendChild(box);
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    // ─────────────────────────────────────────────
    //  User Templates (save / delete)
    // ─────────────────────────────────────────────

    _saveSelectionAsUserTemplate() {
        const el = this.editor.selection.getSelected();
        if (!el) {
            this._showNotification('Select an element first.');
            return;
        }

        const name = prompt('Template name:', el.dataset.name || el.dataset.type || 'My Template');
        if (name === null) return;

        const tpl = {
            id:        `tpl-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`,
            name:      name || 'My Template',
            _isUser:   true,
            timestamp: Date.now(),
            type:      el.dataset.type || el.tagName.toLowerCase(),
            data:      this._serializeElement(el)
        };

        this._userTemplates.unshift(tpl);
        this._saveUserTemplates();
        this._render();
        this._showNotification(`"${tpl.name}" saved.`);
    }

    _deleteUserTemplate(id) {
        this._userTemplates = this._userTemplates.filter(t => t.id !== id);
        this._saveUserTemplates();
        this._render();
    }

    _loadUserTemplates() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    }

    _saveUserTemplates() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._userTemplates));
        } catch (e) {
            console.warn('[TemplateManager] Failed to save user templates:', e);
        }
    }

    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────

    /**
     * Regen IDs on all pages_data to avoid duplicate IDs across inserts.
     * @param {object[]} pagesData
     * @returns {object[]}
     */
    _regenPageIds(pagesData) {
        return pagesData.map(page => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = page.html;
            // Regen all element IDs
            tempDiv.querySelectorAll('[data-editor-element]').forEach(el => {
                el.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;
            });
            return {
                ...page,
                id:   `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                html: tempDiv.innerHTML,
                historyState: { undoStack: [], redoStack: [] }
            };
        });
    }

    _serializeElement(el) {
        const obj = {
            tag:       el.tagName.toLowerCase(),
            type:      el.dataset.type || '',
            name:      el.dataset.name || '',
            container: el.dataset.container === 'true',
            style:     {},
            attributes: {},
            innerHTML: '',
            children:  []
        };

        const style = el.style;
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            obj.style[prop] = style.getPropertyValue(prop);
        }

        ['href', 'src', 'alt', 'placeholder', 'type', 'value'].forEach(attr => {
            if (el.hasAttribute(attr)) obj.attributes[attr] = el.getAttribute(attr);
        });

        const editorChildren = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
        if (editorChildren.length > 0) {
            editorChildren.forEach(child => obj.children.push(this._serializeElement(child)));
        } else {
            obj.innerHTML = el.innerHTML || '';
        }

        return obj;
    }

    _deserializeElement(data) {
        const el = document.createElement(data.tag || 'div');
        el.setAttribute('data-editor-element', '');
        el.id = `el-${Date.now()}-${Math.random().toString(36).substr(2, ELEMENT_ID_RANDOM_LENGTH)}`;

        if (data.type)      el.dataset.type = data.type;
        if (data.name)      el.dataset.name = data.name;
        if (data.container) el.dataset.container = 'true';

        if (data.style) {
            Object.entries(data.style).forEach(([prop, val]) => el.style.setProperty(prop, val));
        }
        if (data.attributes) {
            Object.entries(data.attributes).forEach(([attr, val]) => el.setAttribute(attr, val));
        }

        if (data.children?.length > 0) {
            data.children.forEach(c => el.appendChild(this._deserializeElement(c)));
        } else if (data.innerHTML) {
            el.innerHTML = data.innerHTML;
        }

        return el;
    }

    _showNotification(message) {
        const notif = document.createElement('div');
        notif.className   = 'editor-notification';
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }
}
