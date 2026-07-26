import { TAB_NAME_MAX_LENGTH } from '../config.js';
import { findPage } from './utils.js';
import { showTabContextMenu, activateInlineRename } from './page-context.js';
import debug from '../debug.js';

export function renderTabBar(pages, activePageId, editor, eventBus) {
    debug.action('page-tabs', 'renderTabBar', { count: pages.length, active: activePageId });
    let tabBar = document.getElementById('page-tab-bar');
    if (!tabBar) {
        tabBar = document.createElement('div');
        tabBar.id = 'page-tab-bar';
        const toolbar = document.querySelector('.editor-toolbar');
        const canvasWrapper = document.getElementById('canvas-wrapper');
        if (toolbar && toolbar.parentNode) {
            toolbar.parentNode.insertBefore(tabBar, canvasWrapper);
        } else {
            document.body.prepend(tabBar);
        }
    }

    tabBar.innerHTML = '';

    pages.forEach(page => {
        const tab = buildTabElement(page, activePageId, editor, pages, eventBus);
        tabBar.appendChild(tab);
    });

    const addBtn = document.createElement('button');
    addBtn.id = 'page-tab-add';
    addBtn.className = 'page-tab-add';
    addBtn.title = 'Thêm trang';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => eventBus.emit('page:add'));
    tabBar.appendChild(addBtn);
}

export function buildTabElement(page, activePageId, editor, pages, eventBus) {
    const tab = document.createElement('div');
    tab.className = 'page-tab' + (page.id === activePageId ? ' active' : '');
    tab.dataset.pageId = page.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'page-tab-name';
    nameSpan.title = page.name;
    nameSpan.textContent = page.name.length > TAB_NAME_MAX_LENGTH
        ? page.name.slice(0, TAB_NAME_MAX_LENGTH) + '…'
        : page.name;
    tab.appendChild(nameSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'page-tab-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete page';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        eventBus.emit('page:delete', page.id);
    });
    tab.appendChild(deleteBtn);

    tab.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT') return;
        eventBus.emit('page:switch', page.id);
    });

    tab.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        activateInlineRename(tab, page, editor);
    });

    tab.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showTabContextMenu(pages, activePageId, editor, eventBus, page.id, e.clientX, e.clientY);
    });

    return tab;
}
