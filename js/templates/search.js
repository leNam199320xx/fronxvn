export function getFilteredItems(builtins, userTemplates, activeCategory, searchQuery) {
    const q = searchQuery.toLowerCase().trim();

    let items = [];

    if (activeCategory === 'saved') {
        items = userTemplates.map(t => ({ ...t, _isUser: true }));
    } else if (activeCategory === 'all') {
        items = [
            ...builtins,
            ...userTemplates.map(t => ({ ...t, _isUser: true }))
        ];
    } else {
        items = builtins.filter(t => t.category === activeCategory);
    }

    if (q) {
        items = items.filter(t =>
            t.name.toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }

    return items;
}
