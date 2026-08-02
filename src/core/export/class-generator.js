export function getClassName(el) {
    const base = (el.dataset.name || el.dataset.type || el.tagName.toLowerCase())
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const suffix = (el.id || '').split('-').pop() || '';
    return suffix ? `${base}-${suffix}` : base;
}
