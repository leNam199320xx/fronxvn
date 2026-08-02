import eventBus from '../events/event-bus.js';
import { showNotification } from '../../studio/panels/ui/toast.js';

export function loadFromFile(editor, onProjectLoaded, scheduleAutoSave) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const project = JSON.parse(event.target.result);
                onProjectLoaded(project);
                scheduleAutoSave();
            } catch (err) {
                console.error('[ProjectManager] Failed to load project:', err);
                showNotification('Invalid project file.', 'error');
            }
        };
        reader.readAsText(file);
    });
    input.click();
}

