import eventBus from '../event-bus.js';
import { BUILTIN_TEMPLATES, CATEGORIES } from './builtins.js';
import { loadUserTemplates, saveUserTemplates } from './storage.js';
import { regenPageIds } from './insert.js';
import { showPreview } from './preview.js';
import { getFilteredItems } from './search.js';
import { filterByCategory } from './categories.js';
import { generateElementThumbnail } from './thumbnail.js';
import { validateTemplateData } from './validator.js';
import { serializeElement, deserializeElement, showNotification, generateId } from './utils.js';
import { DEFAULT_ELEMENT_POSITION } from '../config.js';


export class TemplateManager {
    constructor(editor) {
        this.editor    = editor;
        this.container = document.querySelector('[data-tab-content="templates"]');

        this._builtins = BUILTIN_TEMPLATES;
        this._userTemplates = loadUserTemplates();
        this._activeCategory = 'all';
        this._searchQuery = '';

        this._bindEvents();
        this._render();
    }

    _bindEvents() {
        eventBus.on('template:save', () => this._saveSelectionAsUserTemplate());
    }

    _render() {
        if (!this.container) {
            return;
        }

        this.container.innerHTML = '';

        const toolbar = document.createElement('div');
        toolbar.className = 'tpl-toolbar';

        const search = document.createElement('input');
        search.type = 'text';
        search.placeholder = 'Search templates…';
        search.className = 'tpl-search';
        search.value = this._searchQuery;
        search.addEventListener('input', () => {
            this._searchQuery = search.value;
            this._renderGrid(grid);
        });
        toolbar.appendChild(search);

        const btnSave = document.createElement('button');
        btnSave.className = 'tpl-save-btn';
        btnSave.textContent = '+ Save';
        btnSave.title = 'Save selected element as template';
        btnSave.addEventListener('click', () => this._saveSelectionAsUserTemplate());
        toolbar.appendChild(btnSave);

        this.container.appendChild(toolbar);

        const filterBar = document.createElement('div');
        filterBar.className = 'tpl-filter-bar';

        const allCategories = [
            ...CATEGORIES,
            { id: 'saved', label: 'Saved' }
        ];

        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'tpl-filter-btn' + (this._activeCategory === cat.id ? ' active' : '');
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

        const grid = document.createElement('div');
        grid.className = 'tpl-grid';
        this._renderGrid(grid);
        this.container.appendChild(grid);
    }

    _renderGrid(grid) {
        grid.innerHTML = '';

        const items = getFilteredItems(this._builtins, this._userTemplates, this._activeCategory, this._searchQuery);

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

    _getFilteredItems() {
        return getFilteredItems(this._builtins, this._userTemplates, this._activeCategory, this._searchQuery);
    }

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
        desc.className = 'tpl-card-desc';
        desc.textContent = tpl.description || '';
        card.appendChild(desc);

        const actions = document.createElement('div');
        actions.className = 'tpl-card-actions';

        const btnNew = document.createElement('button');
        btnNew.className = 'tpl-btn tpl-btn-primary';
        btnNew.textContent = 'New Project';
        btnNew.title = 'Replace current project with this template';
        btnNew.addEventListener('click', (e) => { e.stopPropagation(); this._insertAsNewProject(tpl); });

        const btnInsert = document.createElement('button');
        btnInsert.className = 'tpl-btn';
        btnInsert.textContent = 'Insert Pages';
        btnInsert.title = 'Append pages to current project';
        btnInsert.addEventListener('click', (e) => { e.stopPropagation(); this._insertPages(tpl); });

        const btnPreview = document.createElement('button');
        btnPreview.className = 'tpl-btn tpl-btn-icon';
        btnPreview.textContent = '👁';
        btnPreview.title = 'Preview template';
        btnPreview.addEventListener('click', (e) => { e.stopPropagation(); showPreview(tpl, (t) => this._insertAsNewProject(t), (t) => this._insertPages(t)); });

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
        btnInsert.className = 'tpl-btn tpl-btn-primary';
        btnInsert.textContent = 'Insert';
        btnInsert.addEventListener('click', (e) => { e.stopPropagation(); this._insertUserTemplate(tpl); });

        const btnDelete = document.createElement('button');
        btnDelete.className = 'tpl-btn tpl-btn-danger';
        btnDelete.textContent = '✕';
        btnDelete.title = 'Delete template';
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

    _insertAsNewProject(tpl) {
        const hasContent = this.editor.canvas.querySelector('[data-editor-element]');

        if (hasContent) {
            const ok = confirm(
                `Replace current project with "${tpl.name}"?\n\nUnsaved changes will be lost.`
            );
            if (!ok) return;
        }

        const pages = regenPageIds(tpl.pages_data);

        this.editor.pageManager.loadPages(pages);

        eventBus.emit('project:meta-updated', {
            title: tpl.pages_data[0]?.meta?.title || tpl.name,
            description: tpl.description || ''
        });

        showNotification(`"${tpl.name}" loaded as new project.`);
    }

    _insertPages(tpl) {
        const pages = regenPageIds(tpl.pages_data);

        const currentPages = this.editor.pageManager.getPages();
        const merged = [...currentPages, ...pages];

        this.editor.pageManager.loadPages(merged);
        showNotification(`${pages.length} page(s) from "${tpl.name}" inserted.`);
    }

    _insertUserTemplate(tpl) {
        const el = deserializeElement(tpl.data);
        const selected = this.editor.selection.getSelected();
        const parent = (selected?.dataset.container === 'true') ? selected : this.editor.canvas;

        if (['flex', 'grid'].includes(parent.style.display)) {
            el.style.position = 'relative';
            el.style.left = '';
            el.style.top = '';
        } else if (!el.style.position || el.style.position === 'static') {
            el.style.position = 'absolute';
            el.style.left = DEFAULT_ELEMENT_POSITION;
            el.style.top = DEFAULT_ELEMENT_POSITION;
        } else {
            el.style.left = DEFAULT_ELEMENT_POSITION;
            el.style.top = DEFAULT_ELEMENT_POSITION;
        }

        parent.appendChild(el);
        eventBus.emit('history:push', { type: 'add', element: el, parent });
        eventBus.emit('element:added', el);
        eventBus.emit('layer:refresh');
        this.editor.selection.select(el);
        showNotification(`"${tpl.name}" inserted.`);
    }

    _saveSelectionAsUserTemplate() {
        const el = this.editor.selection.getSelected();
        if (!el) {
            showNotification('Select an element first.');
            return;
        }

        const name = prompt('Template name:', el.dataset.name || el.dataset.type || 'My Template');
        if (name === null) return;

        const tpl = {
            id:        generateId('tpl', 5),
            name:      name || 'My Template',
            _isUser:   true,
            timestamp: Date.now(),
            type:      el.dataset.type || el.tagName.toLowerCase(),
            data:      serializeElement(el)
        };

        this._userTemplates.unshift(tpl);
        saveUserTemplates(this._userTemplates);
        this._render();
        showNotification(`"${tpl.name}" saved.`);
    }

    _deleteUserTemplate(id) {
        this._userTemplates = this._userTemplates.filter(t => t.id !== id);
        saveUserTemplates(this._userTemplates);
        this._render();
    }

    _loadUserTemplates() {
        return loadUserTemplates();
    }

    _saveUserTemplates() {
        saveUserTemplates(this._userTemplates);
    }

    _regenPageIds(pagesData) {
        return regenPageIds(pagesData);
    }

    _serializeElement(el) {
        return serializeElement(el);
    }

    _deserializeElement(data) {
        return deserializeElement(data);
    }

    _showNotification(message) {
        showNotification(message);
    }
}
