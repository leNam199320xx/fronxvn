export function validateProject(project) {
    if (!project || typeof project !== 'object') {
        return 'Project data is empty or invalid.';
    }
    if (!Array.isArray(project.pages) && !Array.isArray(project.elements)) {
        return 'Unrecognized project format. Expected pages[] or elements[].';
    }
    return null;
}
