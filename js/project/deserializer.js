import eventBus from '../event-bus.js';
import { buildLegacyPage } from './migration.js';
import { showNotification } from '../ui/toast.js';

export function deserializeProject(editor, project) {
    if (!project) return;

    if (project.meta) {
        editor.projectMeta = project.meta;
        eventBus.emit('project:meta-updated', editor.projectMeta);
    }

    if (editor.themeManager && project.theme) {
        editor.themeManager.loadTheme(project.theme);
    }

    if (editor.componentManager && Array.isArray(project.components)) {
        editor.componentManager.loadComponents(project.components);
    }

    if (Array.isArray(project.pages) && project.pages.length > 0) {
        editor.pageManager.loadPages(project.pages);
    } else if (Array.isArray(project.elements)) {
        const legacyPage = buildLegacyPage(project.elements, project.meta);
        editor.pageManager.loadPages([legacyPage]);
    } else {
        showNotification('Unrecognized project format. Loading empty project.', 'error');
        editor.pageManager.loadPages([]);
    }
}
