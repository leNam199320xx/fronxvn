import { downloadBlob } from '../core/download.js';
import { serializeEditorState } from './serializer.js';

export function saveToFile(editor) {
    const project = serializeEditorState(editor);
    const json = JSON.stringify(project, null, 2);
    downloadBlob(json, `project-${Date.now()}.json`);
}
