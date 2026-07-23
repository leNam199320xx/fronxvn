/**
 * ComponentPanel — Tab "Components" trong right panel.
 * Hiển thị grid thumbnail các components, click để insert instance.
 * Hỗ trợ: rename, delete, update definition, empty state.
 */
import eventBus from './event-bus.js';

export class ComponentPanel {
    constructor(editor) {
        this.editor     = editor;
        this.container  = document.querySelector('[data-tab-content="components"]');
        this._components = [];

        this._render();
        this._bindEvents();
    }

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    _bindEvents() {
        eventBus.on('component:list-changed', (list) => {
            this._components = list;
            this._render();
        });
    }

    // ─────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────

    _render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        // ── Header ───────────────────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'comp-panel-header';
        header.innerHTML = `
            <span class="comp-panel-title">Components <span class="comp-count">${this._components.length}</span></span>
            <button class="comp-save-btn" title="Save selected elements as component">+ Save</button>
        `;
        header.querySelector('.comp-save-btn').addEventListener('click', () => {
            const name = prompt('Component name:', `Component ${this._components.length + 1}`);
            if (name === null) return; // cancelled
            this.editor.componentManager.saveComponent(name || '');
        });
        this.container.appendChild(header);

        // ── Empty state ───────────────────────────────────────────────────────
        if (this._components.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'comp-empty';
            empty.innerHTML = `
                <span>⬡</span>
                <p>No components yet</p>
                <small>Select elements on canvas, then click "+ Save"</small>
            `;
            this.container.appendChild(empty);
            return;
        }

        // ── Grid ─────────────────────────────────────────────────────────────
        const grid = document.createElement('div');
        grid.className = 'comp-grid';

        this._components.forEach(def => {
            grid.appendChild(this._buildCard(def));
        });

        this.container.appendChild(grid);
    }

    /**
     * Tạo card DOM cho một ComponentDefinition.
     * @param {import('./component-manager.js').ComponentDefinition} def
     * @returns {HTMLElement}
     */
    _buildCard(def) {
        const card = document.createElement('div');
        card.className = 'comp-card';
        card.dataset.componentId = def.id;
        card.title = `Click to insert "${def.name}"`;

        // Thumbnail
        const thumb = document.createElement('div');
        thumb.className = 'comp-thumb';
        if (def.thumbnail) {
            thumb.style.backgroundImage = `url("${def.thumbnail}")`;
        }
        card.appendChild(thumb);

        // Name (double-click to rename)
        const nameEl = document.createElement('div');
        nameEl.className = 'comp-name';
        nameEl.textContent = def.name;
        nameEl.title = def.name;
        nameEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this._activateRename(nameEl, def);
        });
        card.appendChild(nameEl);

        // Actions row
        const actions = document.createElement('div');
        actions.className = 'comp-actions';

        const btnUpdate = document.createElement('button');
        btnUpdate.className = 'comp-btn';
        btnUpdate.title = 'Update definition from selected instance';
        btnUpdate.textContent = '↑ Update';
        btnUpdate.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editor.componentManager.updateDefinition(def.id);
        });

        const btnDelete = document.createElement('button');
        btnDelete.className = 'comp-btn comp-btn-delete';
        btnDelete.title = 'Delete component (instances will be detached)';
        btnDelete.textContent = '✕';
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete component "${def.name}"? All instances will be detached.`)) {
                this.editor.componentManager.deleteComponent(def.id);
            }
        });

        actions.appendChild(btnUpdate);
        actions.appendChild(btnDelete);
        card.appendChild(actions);

        // Click card → insert instance
        card.addEventListener('click', () => {
            // Offset ngẫu nhiên nhỏ để tránh stack lên nhau
            const offset = Math.floor(Math.random() * 40);
            this.editor.componentManager.insertComponent(def.id, { x: 60 + offset, y: 60 + offset });
        });

        return card;
    }

    // ─────────────────────────────────────────────
    //  Inline rename
    // ─────────────────────────────────────────────

    _activateRename(nameEl, def) {
        const input = document.createElement('input');
        input.type  = 'text';
        input.className = 'comp-rename-input';
        input.value = def.name;

        const commit = () => {
            const newName = input.value.trim() || def.name;
            nameEl.textContent = newName;
            nameEl.replaceWith(nameEl); // ensure DOM is clean
            this.editor.componentManager.renameComponent(def.id, newName);
            input.replaceWith(nameEl);
        };

        const cancel = () => input.replaceWith(nameEl);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')  { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            e.stopPropagation();
        });
        input.addEventListener('blur', () => commit());

        nameEl.replaceWith(input);
        input.focus();
        input.select();
    }
}
