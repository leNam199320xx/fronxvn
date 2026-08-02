export function createTabBar({ tabs, active, onChange, className }) {
    const container = document.createElement('div');
    container.className = className || 'ui-tab-bar';

    const tabElements = [];
    tabs.forEach(({ id, label }) => {
        const tab = document.createElement('div');
        tab.className = 'ui-tab';
        tab.dataset.tabId = id;
        tab.textContent = label;
        tab.style.cssText = `
            padding: 10px 20px; cursor: pointer; color: #969696;
            border-bottom: 2px solid transparent; font-size: 12px; user-select: none;
        `;
        if (id === active) {
            tab.style.color = '#0078d4';
            tab.style.borderBottomColor = '#0078d4';
        }
        tab.addEventListener('click', () => {
            tabElements.forEach(t => {
                t.style.color = '#969696';
                t.style.borderBottomColor = 'transparent';
            });
            tab.style.color = '#0078d4';
            tab.style.borderBottomColor = '#0078d4';
            if (typeof onChange === 'function') onChange(id);
        });
        container.appendChild(tab);
        tabElements.push(tab);
    });

    return { container, tabElements };
}
