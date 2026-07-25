export { ContextMenu } from '../context-menu.js';

export function showContextMenu(items, x, y, onClose) {
    const menu = document.createElement('div');
    menu.className = 'ui-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    items.forEach(({ label, action, disabled }) => {
        if (label === 'separator') {
            const sep = document.createElement('div');
            sep.className = 'context-menu-separator';
            menu.appendChild(sep);
            return;
        }
        const item = document.createElement('div');
        item.className = 'context-menu-item' + (disabled ? ' disabled' : '');
        item.innerHTML = `
            <span class="item-label">${label}</span>
        `;
        if (!disabled && typeof action === 'function') {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                action();
                if (typeof onClose === 'function') onClose();
            });
        }
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const outsideClickHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', outsideClickHandler, true);
            if (typeof onClose === 'function') onClose();
        }
    };
    setTimeout(() => document.addEventListener('click', outsideClickHandler, true), 0);

    return menu;
}
