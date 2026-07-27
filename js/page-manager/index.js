import eventBus from '../event-bus.js';
import { TAB_NAME_MAX_LENGTH } from '../config.js';
import {
    addPage,
    deletePage,
    duplicatePage,
    renamePage
} from './page-crud.js';
import { renderTabBar } from './page-tabs.js';
import { switchPage } from './page-switch.js';
import {
    savePageData,
    restorePageData,
    loadPagesData
} from './page-storage.js';
import { saveHistoryToPage, restoreHistoryFromPage } from './page-history.js';
import { restorePageFromSnapshot, generatePageId } from './utils.js';
import { clearCanvas } from './page-storage.js';

import debug from '../debug.js';

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

    addPage(opts = {}) {
        debug.action('page-manager', 'addPage', opts);
        return addPage(this._pages, this._activePageId, this.editor, eventBus, opts);
    }

    switchPage(pageId) {
        debug.action('page-manager', 'switchPage', { pageId });
        if (pageId === this._activePageId) return;
        const fromPage = this._pages.find(p => p.id === this._activePageId);
        const toPage = this._pages.find(p => p.id === pageId);
        if (!toPage) {
            console.warn(`[PageManager] switchPage: page "${pageId}" not found.`);
            return;
        }

        if (fromPage) {
            savePageData(this.editor, fromPage);
            saveHistoryToPage(this.editor, fromPage);
        }

        clearCanvas(this.editor);
        eventBus.emit('selection:deselect-all');
        eventBus.emit('overlay:clear');

        restorePageData(this.editor, toPage);
        restoreHistoryFromPage(this.editor, toPage);

        this._activePageId = pageId;
        renderTabBar(this._pages, this._activePageId, this.editor, eventBus);

        eventBus.emit('page:switched', { pageId, pageName: toPage.name });
        eventBus.emit('layer:refresh');
        eventBus.emit('history:changed', {
            canUndo: (toPage.historyState.undoStack.length > 0),
            canRedo: (toPage.historyState.redoStack.length > 0)
        });
    }

    deletePage(pageId, opts = {}) {
        debug.action('page-manager', 'deletePage', { pageId });
        deletePage(this._pages, this._activePageId, this.editor, eventBus, pageId, opts);
    }

    duplicatePage(pageId) {
        debug.action('page-manager', 'duplicatePage', { pageId });
        duplicatePage(this._pages, this._activePageId, this.editor, eventBus, pageId);
    }

    renamePage(pageId, newName, opts = {}) {
        debug.action('page-manager', 'renamePage', { pageId, newName });
        renamePage(this._pages, this._activePageId, this.editor, eventBus, pageId, newName, opts);
    }

    getPages() {
        const activePage = this._pages.find(p => p.id === this._activePageId);
        if (activePage) {
            savePageData(this.editor, activePage);
            saveHistoryToPage(this.editor, activePage);
        }

        return this._pages.map(p => ({
            id: p.id,
            name: p.name,
            html: p.html,
            bpStyles: p.bpStyles || {},
            meta: p.meta || {}
        }));
    }

    loadPages(pagesArray) {
        if (!Array.isArray(pagesArray) || pagesArray.length === 0) {
            console.warn('[PageManager] loadPages: empty or invalid pages array, creating default page.');
            this._pages = [];
            this._activePageId = null;
            const defaultPage = this._createEmptyPage();
            this._pages.push(defaultPage);
            this._activePageId = defaultPage.id;
            clearCanvas(this.editor);
            renderTabBar(this._pages, this._activePageId, this.editor, eventBus);
            eventBus.emit('history:changed', { canUndo: false, canRedo: false });
            return;
        }

        this._pages.forEach(p => { p.historyState = null; });

        const loadedPages = loadPagesData(pagesArray);
        if (!loadedPages) {
            this._pages = [];
            this._activePageId = null;
            const defaultPage = this._createEmptyPage();
            this._pages.push(defaultPage);
            this._activePageId = defaultPage.id;
            clearCanvas(this.editor);
            renderTabBar(this._pages, this._activePageId, this.editor, eventBus);
            eventBus.emit('history:changed', { canUndo: false, canRedo: false });
            return;
        }

        this._pages = loadedPages;

        if (this.editor.history) {
            this.editor.history.clear();
        }

        clearCanvas(this.editor);
        this._activePageId = this._pages[0].id;
        restorePageData(this.editor, this._pages[0]);
        restoreHistoryFromPage(this.editor, this._pages[0]);
        renderTabBar(this._pages, this._activePageId, this.editor, eventBus);

        eventBus.emit('page:switched', {
            pageId: this._pages[0].id,
            pageName: this._pages[0].name
        });
        eventBus.emit('layer:refresh');
        eventBus.emit('history:changed', { canUndo: false, canRedo: false });
    }

    // ─────────────────────────────────────────────
    //  Event bindings
    // ─────────────────────────────────────────────

    _bindEvents() {
        eventBus.on('page:add',       ()                    => this.addPage());
        eventBus.on('page:switch',    (pageId)              => this.switchPage(pageId));
        eventBus.on('page:delete',    (pageId)              => this.deletePage(pageId));
        eventBus.on('page:duplicate', (pageId)              => this.duplicatePage(pageId));
        eventBus.on('page:rename',    ({ pageId, newName }) => this.renamePage(pageId, newName));
    }

    // ─────────────────────────────────────────────
    //  Internal helpers
    // ─────────────────────────────────────────────

    _createEmptyPage() {
        return {
            id: generatePageId(),
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

    _generatePageName() {
        return `Page ${this._pages.length + 1}`;
    }

    _restorePageFromSnapshot(snapshot, insertIdx) {
        const page = restorePageFromSnapshot(snapshot, insertIdx, this._pages);
        renderTabBar(this._pages, this._activePageId, this.editor, eventBus);
        this.switchPage(page.id);
        eventBus.emit('page:added', { pageId: page.id });
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
