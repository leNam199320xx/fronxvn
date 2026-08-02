import { LAYER_INDENT_PER_LEVEL } from '../utilities/config.js';

export class LayerRenderer {
    constructor(panel) {
        this.panel = panel;
    }

    init() {}

    refresh() {
        this._render();
    }

    destroy() {}

    _render() {
        const panel = this.panel;
        const container = panel.container;
        container.innerHTML = '';

        const section = document.createElement('div');
        section.className = 'panel-section';

        const header = document.createElement('div');
        header.className = 'panel-section-header';
        header.innerHTML = 'Layers <span class="arrow">▼</span>';

        const body = document.createElement('div');
        body.className = 'panel-section-body';

        const tree = document.createElement('div');
        tree.className = 'layer-tree';

        const children = Array.from(panel.editor.canvas.querySelectorAll(':scope > [data-editor-element]'));
        children.forEach(el => {
            this._renderNode(el, tree, 0);
        });

        body.appendChild(tree);

        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });

        section.appendChild(header);
        section.appendChild(body);
        container.appendChild(section);

        panel._layerItems = container.querySelectorAll('.layer-item');
    }

    _renderNode(el, parent, depth) {
        const panel = this.panel;
        const isHidden    = el.dataset.hidden === 'true';
        const isComponent = !!el.dataset.componentId;

        const item = document.createElement('div');
        item.className = 'layer-item';
        if (panel.selectedElements.includes(el)) item.classList.add('selected');
        if (isHidden)    item.classList.add('hidden');
        if (isComponent) item.classList.add('is-component');
        item.dataset.elementId = el.id;

        const indent = document.createElement('span');
        indent.className = 'layer-indent';
        indent.style.width = (depth * LAYER_INDENT_PER_LEVEL) + 'px';
        item.appendChild(indent);

        const children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));
        const toggle = document.createElement('span');
        toggle.className = 'layer-toggle';
        if (children.length > 0) {
            const expanded = panel.expandedMap.get(el.id) !== false;
            toggle.textContent = expanded ? '▼' : '▶';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = panel.expandedMap.get(el.id) !== false;
                panel.expandedMap.set(el.id, !isExpanded);
                panel._render();
            });
        }
        item.appendChild(toggle);

        const icon = document.createElement('span');
        icon.className = 'layer-icon';
        icon.textContent = el.dataset.componentId ? '⬡' : this._getIcon(el.dataset.type);
        item.appendChild(icon);

        const name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = el.dataset.name || el.dataset.type || el.tagName.toLowerCase();
        item.appendChild(name);

        if (el.dataset.componentId) {
            const badge = document.createElement('span');
            badge.className = 'layer-comp-badge';
            badge.title = 'Component instance';
            badge.textContent = '⬡';
            item.appendChild(badge);
        }

        const actions = document.createElement('span');
        actions.className = 'layer-actions';

        const btnVis = document.createElement('span');
        btnVis.className = 'layer-btn-vis';
        btnVis.title = isHidden ? 'Show' : 'Hide';
        btnVis.textContent = isHidden ? '○' : '●';
        btnVis.addEventListener('click', (e) => {
            e.stopPropagation();
            panel._toggleVisibility(el);
        });
        actions.appendChild(btnVis);

        item.appendChild(actions);

        this.panel.layerEvents.attachNodeEvents(item, el);

        parent.appendChild(item);

        if (children.length > 0 && panel.expandedMap.get(el.id) !== false) {
            children.forEach(child => {
                this._renderNode(child, parent, depth + 1);
            });
        }
    }

    _getIcon(type) {
        const icons = {
            section: '☐', container: '▣', row: '▤', column: '▥',
            div: '□', card: '▧', text: 'T', heading: 'H',
            paragraph: '¶', button: '▢', link: '🔗', image: '🖼',
            icon: '★', svg: '◇', video: '▶', audio: '♫',
            input: '▁', textarea: '▂', select: '▾', checkbox: '☑',
            radio: '◉', table: '⊞', list: '≡', form: '📋',
            group: '⊡'
        };
        return icons[type] || '□';
    }
}


