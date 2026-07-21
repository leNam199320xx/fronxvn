/**
 * PageManager - Quản lý đa trang trong project
 * Mỗi trang là một canvas độc lập với lịch sử undo/redo riêng.
 * Giao tiếp với các module khác chỉ thông qua EventBus.
 */
import eventBus from './event-bus.js';
import { TAB_NAME_MAX_LENGTH, PAGE_ID_RANDOM_LENGTH } from './config.js';

export class PageManager {
    constructor(editor) {
        this.editor = editor;

        /** @type {Array<PageObject>} */
        this._pages = [];

        /** @type {string|null} */
        this._activePageId = null;

        this._bindEvents();
    }

    // ─────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────

    /**
     * Tạo trang mới với canvas trống, tự động switch sang trang mới.
     * @returns {PageObject} trang vừa tạo
     */
    addPage() {
        const page = this._createEmptyPage();
        this._pages.push(page);
        this.switchPage(page.id);
        eventBus.emit('page:added', { pageId: page.id });
        return page;
    }

    /**
     * Chuyển sang trang theo id.
     * Nếu đang là active page thì không làm gì.
     * @param {string} pageId
     */
    switchPage(pageId) {
        if (pageId === this._activePageId) return;

        const fromPage = this._findPage(this._activePageId);
        const toPage   = this._findPage(pageId);
        if (!toPage) {
            console.warn(`[PageManager] switchPage: page "${pageId}" not found.`);
            return;
        }

        try {
            // (a+b) Serialize trạng thái canvas và history của trang hiện tại
            if (fromPage) {
                this._saveCurrentPageState(fromPage);
            }

            // (c) Clear canvas
            this._clearCanvas();

            // (d) Clear selection
            eventBus.emit('selection:deselect-all');

            // (e) Clear overlay/guides
            eventBus.emit('overlay:clear');

            // (f+g) Restore canvas và history của trang đích
            this._restorePageState(toPage);

            // (h) Cập nhật active page
            this._activePageId = pageId;
            this._renderTabBar();

            // Emit các sự kiện sau khi switch thành công
            eventBus.emit('page:switched', { pageId, pageName: toPage.name });
            eventBus.emit('layer:refresh');
            eventBus.emit('history:changed', {
                canUndo: (toPage.historyState.undoStack.length > 0),
                canRedo: (toPage.historyState.redoStack.length > 0)
            });
        } catch (err) {
            console.error('[PageManager] switchPage failed:', err);
            // Revert: cố restore lại trang nguồn
            if (fromPage) {
                try { this._restorePageState(fromPage); } catch (_) {}
            }
            eventBus.emit('page:switch-error', {
                error: err,
                fromPageId: this._activePageId,
                toPageId: pageId
            });
        }
    }

    /**
     * Xóa trang theo id.
     * Không làm gì nếu chỉ còn 1 trang.
     * @param {string} pageId
     */
    deletePage(pageId) {
        if (this._pages.length <= 1) return;

        const idx = this._pages.findIndex(p => p.id === pageId);
        if (idx === -1) return;

        // Nếu xóa active page → switch sang trang liền kề trước
        if (pageId === this._activePageId) {
            const newIdx = idx > 0 ? idx - 1 : 1; // trang trước hoặc trang sau
            this.switchPage(this._pages[newIdx].id);
        }

        // Giải phóng history state
        this._pages[idx].historyState = null;
        this._pages.splice(idx, 1);

        this._renderTabBar();
        eventBus.emit('page:deleted', { pageId });
    }

    /**
     * Nhân bản trang theo id.
     * Chèn bản sao ngay sau trang gốc và tự động switch sang bản sao.
     * @param {string} pageId
     */
    duplicatePage(pageId) {
        const srcIdx = this._pages.findIndex(p => p.id === pageId);
        if (srcIdx === -1) return;

        // Nếu nhân bản active page, serialize trạng thái mới nhất trước
        if (pageId === this._activePageId) {
            this._saveCurrentPageState(this._pages[srcIdx]);
        }

        const src = this._pages[srcIdx];
        const newPage = {
            id: this._generatePageId(),
            name: `${src.name} Copy`,
            html: src.html,
            bpStyles: JSON.parse(JSON.stringify(src.bpStyles || {})),
            historyState: { undoStack: [], redoStack: [] },
            meta: JSON.parse(JSON.stringify(src.meta || {}))
        };

        // Chèn ngay sau trang gốc
        this._pages.splice(srcIdx + 1, 0, newPage);

        this.switchPage(newPage.id);
    }

    /**
     * Đổi tên trang.
     * Bỏ qua nếu tên mới sau trim là rỗng.
     * @param {string} pageId
     * @param {string} newName
     */
    renamePage(pageId, newName) {
        const trimmed = (newName || '').trim();
        if (!trimmed) return;

        const page = this._findPage(pageId);
        if (!page) return;

        page.name = trimmed;
        this._renderTabBar();
        eventBus.emit('page:renamed', { pageId, newName: trimmed });
    }

    // ─────────────────────────────────────────────
    //  Serialization (dùng bởi ProjectManager, ExportManager)
    // ─────────────────────────────────────────────

    /**
     * Trả về mảng page objects (đã serialize active page).
     * Không bao gồm historyState DOM refs trong kết quả.
     * @returns {Array<Object>}
     */
    getPages() {
        // Serialize trạng thái canvas của active page trước
        const activePage = this._findPage(this._activePageId);
        if (activePage) {
            this._saveCurrentPageState(activePage);
        }

        return this._pages.map(p => ({
            id: p.id,
            name: p.name,
            html: p.html,
            bpStyles: p.bpStyles || {},
            meta: p.meta || {}
        }));
    }

    /**
     * Khôi phục project từ mảng page objects.
     * Clear toàn bộ state hiện tại trước khi load.
     * @param {Array<Object>} pagesArray
     */
    loadPages(pagesArray) {
        if (!Array.isArray(pagesArray) || pagesArray.length === 0) {
            console.warn('[PageManager] loadPages: empty or invalid pages array, creating default page.');
            this._pages = [];
            this._activePageId = null;
            const defaultPage = this._createEmptyPage();
            this._pages.push(defaultPage);
            this._activePageId = defaultPage.id;
            this._clearCanvas();
            this._renderTabBar();
            eventBus.emit('history:changed', { canUndo: false, canRedo: false });
            return;
        }

        // Giải phóng history state cũ
        this._pages.forEach(p => { p.historyState = null; });

        this._pages = pagesArray.map(data => ({
            id: data.id || this._generatePageId(),
            name: data.name || 'Page',
            html: data.html || '',
            bpStyles: data.bpStyles || {},
            historyState: { undoStack: [], redoStack: [] },
            meta: data.meta || {}
        }));

        this._activePageId = null;

        // Clear history của editor
        if (this.editor.history) {
            this.editor.history.clear();
        }

        // Activate trang đầu tiên
        this._clearCanvas();
        this._activePageId = this._pages[0].id;
        this._restorePageState(this._pages[0]);
        this._renderTabBar();

        eventBus.emit('page:switched', {
            pageId: this._pages[0].id,
            pageName: this._pages[0].name
        });
        eventBus.emit('layer:refresh');
        eventBus.emit('history:changed', { canUndo: false, canRedo: false });
    }

    // ─────────────────────────────────────────────
    //  Tab Bar
    // ─────────────────────────────────────────────

    /**
     * Re-render toàn bộ Tab Bar từ this._pages.
     */
    _renderTabBar() {
        let tabBar = document.getElementById('page-tab-bar');
        if (!tabBar) {
            tabBar = document.createElement('div');
            tabBar.id = 'page-tab-bar';
            // Insert giữa .editor-toolbar và #canvas-wrapper
            const toolbar = document.querySelector('.editor-toolbar');
            const canvasWrapper = document.getElementById('canvas-wrapper');
            if (toolbar && toolbar.parentNode) {
                toolbar.parentNode.insertBefore(tabBar, canvasWrapper);
            } else {
                document.body.prepend(tabBar);
            }
        }

        tabBar.innerHTML = '';

        this._pages.forEach(page => {
            const tab = this._buildTabElement(page);
            tabBar.appendChild(tab);
        });

        // Nút "+" thêm trang mới
        const addBtn = document.createElement('button');
        addBtn.id = 'page-tab-add';
        addBtn.className = 'page-tab-add';
        addBtn.title = 'Thêm trang';
        addBtn.textContent = '+';
        addBtn.addEventListener('click', () => eventBus.emit('page:add'));
        tabBar.appendChild(addBtn);
    }

    /**
     * Tạo DOM element cho một tab.
     * @param {PageObject} page
     * @returns {HTMLElement}
     */
    _buildTabElement(page) {
        const tab = document.createElement('div');
        tab.className = 'page-tab' + (page.id === this._activePageId ? ' active' : '');
        tab.dataset.pageId = page.id;

        // Tên tab — cắt ngắn nếu > 20 ký tự
        const nameSpan = document.createElement('span');
        nameSpan.className = 'page-tab-name';
        nameSpan.title = page.name;
        nameSpan.textContent = page.name.length > TAB_NAME_MAX_LENGTH
            ? page.name.slice(0, TAB_NAME_MAX_LENGTH) + '…'
            : page.name;
        tab.appendChild(nameSpan);

        // Click → switch trang
        tab.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT') return; // đang rename
            eventBus.emit('page:switch', page.id);
        });

        // Double-click → inline rename
        tab.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this._activateInlineRename(tab, page);
        });

        // Right-click → context menu
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._showTabContextMenu(page.id, e.clientX, e.clientY);
        });

        return tab;
    }

    // ─────────────────────────────────────────────
    //  Context Menu
    // ─────────────────────────────────────────────

    /**
     * Hiển thị context menu cho tab.
     * @param {string} pageId
     * @param {number} x - clientX
     * @param {number} y - clientY
     */
    _showTabContextMenu(pageId, x, y) {
        // Đóng context menu đang mở (element context menu)
        eventBus.emit('context-menu:hide');

        // Xóa context menu tab cũ nếu có
        this._hideTabContextMenu();

        const menu = document.createElement('div');
        menu.id = 'page-tab-context-menu';
        menu.className = 'page-tab-context-menu';
        menu.style.left = `${x}px`;
        menu.style.top  = `${y}px`;

        const isOnlyPage = this._pages.length <= 1;

        const items = [
            { label: 'Rename',    action: () => { this._hideTabContextMenu(); this._activateInlineRenameById(pageId); } },
            { label: 'Duplicate', action: () => { this._hideTabContextMenu(); eventBus.emit('page:duplicate', pageId); } },
            { label: 'Delete',    action: () => { this._hideTabContextMenu(); eventBus.emit('page:delete', pageId); }, disabled: isOnlyPage }
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

        // Click outside → đóng menu
        const outsideClickHandler = (e) => {
            if (!menu.contains(e.target)) {
                this._hideTabContextMenu();
                document.removeEventListener('click', outsideClickHandler, true);
            }
        };
        // Timeout nhỏ để tránh ngay lập tức bị đóng bởi click hiện tại
        setTimeout(() => document.addEventListener('click', outsideClickHandler, true), 0);
    }

    /** Ẩn và xóa context menu tab. */
    _hideTabContextMenu() {
        const menu = document.getElementById('page-tab-context-menu');
        if (menu) menu.remove();
    }

    // ─────────────────────────────────────────────
    //  Inline Rename
    // ─────────────────────────────────────────────

    /**
     * Kích hoạt chỉnh sửa tên inline trên tab của pageId.
     * @param {string} pageId
     */
    _activateInlineRenameById(pageId) {
        const tabBar = document.getElementById('page-tab-bar');
        if (!tabBar) return;
        const tab = tabBar.querySelector(`[data-page-id="${pageId}"]`);
        const page = this._findPage(pageId);
        if (tab && page) this._activateInlineRename(tab, page);
    }

    /**
     * Thay thế span tên tab bằng input để chỉnh sửa trực tiếp.
     * @param {HTMLElement} tab
     * @param {PageObject} page
     */
    _activateInlineRename(tab, page) {
        const nameSpan = tab.querySelector('.page-tab-name');
        if (!nameSpan) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'page-tab-rename-input';
        input.value = page.name;
        input.style.width = Math.max(60, page.name.length * 8) + 'px';

        const commit = () => {
            const newName = input.value;
            tab.replaceChild(nameSpan, input);
            this.renamePage(page.id, newName);
        };

        const cancel = () => {
            tab.replaceChild(nameSpan, input);
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')  { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            e.stopPropagation(); // ngăn phím tắt của editor
        });

        input.addEventListener('blur', () => commit());

        tab.replaceChild(input, nameSpan);
        input.focus();
        input.select();
    }

    // ─────────────────────────────────────────────
    //  Internal helpers
    // ─────────────────────────────────────────────

    /**
     * Serialize trạng thái canvas và history hiện tại vào page object.
     * @param {PageObject} page
     */
    _saveCurrentPageState(page) {
        if (!page) return;

        // Serialize canvas innerHTML
        page.html = this.editor.canvas.innerHTML;

        // Serialize bpStyles của tất cả elements trên canvas
        const bpStyles = {};
        this.editor.canvas.querySelectorAll('[data-editor-element]').forEach(el => {
            if (el.id && el.__bpStyles) {
                bpStyles[el.id] = el.__bpStyles;
            }
        });
        page.bpStyles = bpStyles;

        // Lưu history stacks (in-memory reference, không serialize DOM refs sang JSON)
        if (this.editor.history) {
            page.historyState = {
                undoStack: [...this.editor.history.undoStack],
                redoStack: [...this.editor.history.redoStack]
            };
        }
    }

    /**
     * Khôi phục trạng thái canvas và history từ page object.
     * @param {PageObject} page
     */
    _restorePageState(page) {
        // Restore canvas innerHTML
        this.editor.canvas.innerHTML = page.html || '';

        // Restore __bpStyles lên các elements
        if (page.bpStyles) {
            Object.entries(page.bpStyles).forEach(([id, styles]) => {
                const el = this.editor.canvas.querySelector(`#${CSS.escape(id)}`);
                if (el) el.__bpStyles = styles;
            });
        }

        // Swap history stacks
        if (this.editor.history && page.historyState) {
            this.editor.history.undoStack = page.historyState.undoStack || [];
            this.editor.history.redoStack = page.historyState.redoStack || [];
        }
    }

    /** Xóa toàn bộ nội dung canvas. */
    _clearCanvas() {
        this.editor.canvas.innerHTML = '';
    }

    /**
     * Tìm page theo id.
     * @param {string} id
     * @returns {PageObject|undefined}
     */
    _findPage(id) {
        return this._pages.find(p => p.id === id);
    }

    /**
     * Sinh id trang duy nhất theo format page-{timestamp}-{random5chars}.
     * @returns {string}
     */
    _generatePageId() {
        const ts     = Date.now();
        const random = Math.random().toString(36).slice(2, 2 + PAGE_ID_RANDOM_LENGTH);
        return `page-${ts}-${random}`;
    }

    /**
     * Sinh tên trang mặc định "Page N".
     * @returns {string}
     */
    _generatePageName() {
        return `Page ${this._pages.length + 1}`;
    }

    /**
     * Tạo một Page object trống.
     * @returns {PageObject}
     */
    _createEmptyPage() {
        return {
            id: this._generatePageId(),
            name: this._generatePageName(),
            html: '',
            bpStyles: {},
            historyState: { undoStack: [], redoStack: [] },
            meta: {
                title: '',
                description: '',
                ogTitle: '',
                ogDescription: '',
                ogImage: '',
                canonical: ''
            }
        };
    }

    // ─────────────────────────────────────────────
    //  Event bindings
    // ─────────────────────────────────────────────

    _bindEvents() {
        eventBus.on('page:add',       ()         => this.addPage());
        eventBus.on('page:switch',    (pageId)   => this.switchPage(pageId));
        eventBus.on('page:delete',    (pageId)   => this.deletePage(pageId));
        eventBus.on('page:duplicate', (pageId)   => this.duplicatePage(pageId));
        eventBus.on('page:rename',    ({ pageId, newName }) => this.renamePage(pageId, newName));
    }
}

/**
 * @typedef {Object} PageObject
 * @property {string} id
 * @property {string} name
 * @property {string} html
 * @property {Object} bpStyles
 * @property {{ undoStack: Array, redoStack: Array }} historyState
 * @property {Object} meta
 */
