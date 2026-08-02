export function filterByCategory(builtins, userTemplates, activeCategory) {
    if (activeCategory === 'saved') {
        return userTemplates.map(t => ({ ...t, _isUser: true }));
    } else if (activeCategory === 'all') {
        return [
            ...builtins,
            ...userTemplates.map(t => ({ ...t, _isUser: true }))
        ];
    } else {
        return builtins.filter(t => t.category === activeCategory);
    }
}
