export function generateId(prefix, length = 5) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, length)}`;
}

export function generateElementId() {
    return `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

export function generatePageId() {
    const ts = Date.now();
    const random = Math.random().toString(36).slice(2, 2 + 5);
    return `page-${ts}-${random}`;
}
