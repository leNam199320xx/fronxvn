import eventBus from '../events/event-bus.js';
import { findPage } from './utils.js';
import { RENAME_INPUT_MIN_WIDTH, RENAME_INPUT_CHAR_WIDTH } from '../utilities/config.js';
import { inlineRename } from '../../studio/panels/ui/utils.js';

export function showTabContextMenu(pages, activePageId, editor, eventBus, pageId, x, y) {
    eventBus.emit('context-menu:hide');
    hideTabContextMenu();

    const menu = document.createElement('div');
    menu.id = 'page-tab-context-menu';
    menu.className = 'page-tab-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const isOnlyPage = pages.length <= 1;

    const items = [
        { label: 'Rename',    action: () => { hideTabContextMenu(); activateInlineRenameById(pages, activePageId, editor, pageId); } },
        { label: 'Duplicate', action: () => { hideTabContextMenu(); eventBus.emit('page:duplicate', pageId); }, disabled: isOnlyPage },
        { label: 'Delete',    action: () => { hideTabContextMenu(); eventBus.emit('page:delete', pageId); }, disabled: isOnlyPage }
    ];

    items.forEach(({ label, action, disabled }) => {
        const item = document.createElement('div');
        item.className = 'page-tab-context-item' + (disabled ? ' disabled' : '');
        item.textContent = label;
        if (!disabled) {
            item.addEventListener('click', (e) => { e.stopPropagation(); action(); });
        }
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const outsideClickHandler = (e) => {
        if (!menu.contains(e.target)) {
            hideTabContextMenu();
            document.removeEventListener('click', outsideClickHandler, true);
        }
    };
    setTimeout(() => document.addEventListener('click', outsideClickHandler, true), 0);
}

export function hideTabContextMenu() {
    const menu = document.getElementById('page-tab-context-menu');
    if (menu) menu.remove();
}

export function activateInlineRenameById(pages, activePageId, editor, pageId) {
    const tabBar = document.getElementById('page-tab-bar');
    if (!tabBar) return;
    const tab = tabBar.querySelector(`[data-page-id="${pageId}"]`);
    const page = findPage(pages, pageId);
    if (tab && page) {
        activateInlineRename(tab, page, editor);
    }
}

export function activateInlineRename(tab, page, editor) {
    const nameSpan = tab.querySelector('.page-tab-name');
    if (!nameSpan) return;

    inlineRename(nameSpan, page.name, {
        inputClassName: 'page-tab-rename-input',
        onCommit: (newName) => {
            eventBus.emit('page:rename', { pageId: page.id, newName });
        }
    });
}


