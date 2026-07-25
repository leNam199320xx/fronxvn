export function slugify(name) {
    return (name || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'page';
}

export function resolveFilenames(pages) {
    const seen = new Map();
    return pages.map((page, i) => {
        if (i === 0) return 'index.html';
        const base = slugify(page.name);
        const count = seen.get(base) || 0;
        seen.set(base, count + 1);
        return count === 0 ? `${base}.html` : `${base}-${count + 1}.html`;
    });
}
