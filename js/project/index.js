import eventBus from '../event-bus.js';
import {
    AUTOSAVE_STORAGE_KEY,
    AUTOSAVE_DELAY_MS,
    AUTOLOAD_DELAY_MS
} from '../config.js';
import { autoSave, autoLoad } from './autosave.js';
import { saveToFile } from './save.js';
import { loadFromFile } from './load.js';
import { serializeEditorState } from './serializer.js';
import { deserializeProject } from './deserializer.js';
import { storageRemove } from './storage.js';

export class ProjectManager {
    constructor(editor) {
        this.editor = editor;
        this.autoSaveKey   = AUTOSAVE_STORAGE_KEY;
        this.autoSaveDelay = AUTOSAVE_DELAY_MS;
        this._autoSaveTimer = null;

        this._bindEvents();

        setTimeout(() => this._autoLoad(), AUTOLOAD_DELAY_MS);
    }

    init() {}

    refresh() {}

    destroy() {}

    /** Bind events */
    _bindEvents() {
        eventBus.on('project:save', () => this.saveToFile());
        eventBus.on('project:load', () => this.loadFromFile());

        eventBus.on('element:added',   () => this._scheduleAutoSave());
        eventBus.on('element:deleted', () => this._scheduleAutoSave());
        eventBus.on('element:updated', () => this._scheduleAutoSave());
        eventBus.on('history:changed', () => this._scheduleAutoSave());
        eventBus.on('page:added',      () => this._scheduleAutoSave());
        eventBus.on('page:deleted',    () => this._scheduleAutoSave());
        eventBus.on('page:renamed',    () => this._scheduleAutoSave());
        eventBus.on('page:switched',   () => this._scheduleAutoSave());
        eventBus.on('component:saved',        () => this._scheduleAutoSave());
        eventBus.on('component:updated',      () => this._scheduleAutoSave());
        eventBus.on('component:deleted',      () => this._scheduleAutoSave());
        eventBus.on('component:list-changed', () => this._scheduleAutoSave());
        eventBus.on('project:schedule-save',  () => this._scheduleAutoSave());
        eventBus.on('theme:changed',          () => this._scheduleAutoSave());
    }

    /** Debounce auto-save */
    _scheduleAutoSave() {
        clearTimeout(this._autoSaveTimer);
        this._autoSaveTimer = setTimeout(() => this._autoSave(), this.autoSaveDelay);
    }

    /** Auto-save into localStorage */
    _autoSave() {
        autoSave(() => serializeEditorState(this.editor), this.autoSaveKey);
    }

    /** Auto-load from localStorage; if none, create default page */
    _autoLoad() {
        autoLoad(
            this.autoSaveKey,
            (project) => this._loadProject(project),
            () => this.editor.pageManager.loadPages([])
        );
    }

    /** Get current project data (v2.2 format) */
    _getProjectData() {
        return serializeEditorState(this.editor);
    }

    /** Save project to JSON file and download */
    saveToFile() {
        saveToFile(this.editor);
    }

    /** Load project from JSON file */
    loadFromFile() {
        loadFromFile(
            this.editor,
            (project) => this._loadProject(project),
            () => this._autoSave()
        );
    }

    /** Load project data — supports v2.1 (pages[]), v2.0 (pages[]) and v1.0 (elements[]) */
    _loadProject(project) {
        if (!project) return;
        deserializeProject(this.editor, project);
    }

    /** Clear auto-save (reset project) */
    clearAutoSave() {
        this._clearAutoSaveTimer();
        storageRemove(this.autoSaveKey);
    }

    _clearAutoSaveTimer() {
        if (this._autoSaveTimer) {
            clearTimeout(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
    }
}
