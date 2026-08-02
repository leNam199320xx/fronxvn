import { TOOLBAR_ITEMS, TOOLBAR_GROUPS } from './toolbar-registry.js';
import { commandManager } from '../../core/commands/register-command.js';

export class ToolbarRenderer {
    constructor(container) {
        this.container = container;
    }

    render() {
        const toolbar = this.container;
        const coordsDisplay = document.getElementById('coords-display');

        toolbar.innerHTML = '';

        TOOLBAR_GROUPS.forEach((groupName, index) => {
            if (index > 0) {
                const separator = document.createElement('div');
                separator.className = 'toolbar-separator';
                toolbar.appendChild(separator);
            }

            const groupEl = document.createElement('div');
            groupEl.className = 'toolbar-group';

            if (groupName === 'viewport') {
                groupEl.id = 'viewport-switcher';
            }

            const items = Object.values(TOOLBAR_ITEMS).filter(item => item.group === groupName);

            items.forEach((item) => {
                if (item.visible === false) return;

                if (item.type === 'display' || item.type === 'project-name') {
                    const el = document.createElement('span');
                    el.id = item.id;
                    if (item.className) el.className = item.className;
                    if (item.value) el.textContent = item.value;
                    if (item.tooltip) el.title = item.tooltip;
                    groupEl.appendChild(el);
                    return;
                }

                const btn = document.createElement('button');
                btn.id = item.id;
                btn.title = item.tooltip || '';

                if (item.className) btn.className = item.className;
                if (item.class) btn.classList.add(item.class);

                if (item.enabled === false) {
                    btn.disabled = true;
                }

                if (item.icon) {
                    btn.textContent = item.icon;
                } else if (item.label) {
                    btn.textContent = item.label;
                }

                if (item.id.startsWith('btn-bp-')) {
                    btn.dataset.bp = item.id.replace('btn-bp-', '');
                }

                btn.addEventListener('click', () => {
                    if (item.enabled !== false && item.command) {
                        commandManager.execute(item.command);
                    }
                });

                groupEl.appendChild(btn);
            });

            toolbar.appendChild(groupEl);
        });

        if (coordsDisplay) {
            toolbar.appendChild(coordsDisplay);
        }
    }
}
