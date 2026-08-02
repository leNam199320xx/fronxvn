import { createLayoutTab } from '../../studio/inspector/layout-tab.js';
import { createSpacingTab } from '../../studio/inspector/spacing-tab.js';
import { createTypographyTab } from '../../studio/inspector/typography-tab.js';
import { createBackgroundTab } from '../../studio/inspector/background-tab.js';
import { createBorderTab } from '../../studio/inspector/border-tab.js';
import { createEffectsTab } from '../../studio/inspector/effects-tab.js';
import { createTransformTab } from '../../studio/inspector/transform-tab.js';
import { createResponsiveTab } from '../../studio/inspector/responsive-tab.js';
import { DEFAULT_COLOR_FALLBACK } from '../utilities/config.js';
import { enableInputs, clearInputs, removeMultiSelectNotice } from './property-utils.js';

export function renderPanel(panel, editor, eventBus) {
    panel.panel.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'panel-section';

    const header = document.createElement('div');
    header.className = 'panel-section-header';
    header.innerHTML = 'Properties <span class="arrow">▼</span>';

    const body = document.createElement('div');
    body.className = 'panel-section-body';

    panel.layoutTab = createLayoutTab({ editor, eventBus });
    panel.spacingTab = createSpacingTab({ editor, eventBus });
    panel.typographyTab = createTypographyTab({ editor, eventBus });
    panel.backgroundTab = createBackgroundTab({ editor, eventBus });
    panel.borderTab = createBorderTab({ editor, eventBus });
    panel.effectsTab = createEffectsTab({ editor, eventBus });
    panel.transformTab = createTransformTab({ editor, eventBus });
    panel.responsiveTab = createResponsiveTab({ editor, eventBus });

    const orderedTabs = [
        panel.layoutTab,
        panel.spacingTab,
        panel.typographyTab,
        panel.backgroundTab,
        panel.borderTab,
        panel.effectsTab,
        panel.transformTab
    ];

    orderedTabs.forEach(tab => {
        const sections = Array.isArray(tab.sections) ? tab.sections : [tab.section];
        sections.forEach(section => {
            body.appendChild(section);
        });
    });

    body.appendChild(panel.responsiveTab.cssSection);

    header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        body.classList.toggle('collapsed');
    });

    section.appendChild(header);
    section.appendChild(body);
    panel.panel.appendChild(section);

    panel._propInputs = panel.panel.querySelectorAll('[data-prop]');
}

export function updatePanelValues(panel) {
    if (!panel.selectedElement) return;

    removeMultiSelectNotice(panel.panel);
    enableInputs(panel.panel);

    [
        panel.layoutTab,
        panel.spacingTab,
        panel.typographyTab,
        panel.backgroundTab,
        panel.borderTab,
        panel.effectsTab,
        panel.transformTab
    ].forEach(tab => {
        if (typeof tab.update === 'function') {
            tab.update(panel.selectedElement);
        }
    });

    if (panel.responsiveTab) {
        panel.responsiveTab.update(panel.selectedElement);
    }
}

export function clearPanelValues(panel) {
    removeMultiSelectNotice(panel.panel);
    clearInputs(panel.panel, DEFAULT_COLOR_FALLBACK);
}

export function showMultiSelectPlaceholder(panel, count) {
    const existing = panel.panel.querySelector('.multi-select-notice');
    if (!existing) {
        if (panel._propInputs) {
            panel._propInputs.forEach(input => {
                input.value = '';
                input.placeholder = '—';
                input.disabled = true;
            });
        }
        const notice = document.createElement('div');
        notice.className = 'multi-select-notice';
        notice.style.cssText = `
            padding: 10px 12px;
            font-size: 11px;
            color: var(--text-secondary);
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-tertiary);
        `;
        notice.textContent = `${count} elements selected`;
        panel.panel.insertBefore(notice, panel.panel.firstChild);
    } else {
        existing.textContent = `${count} elements selected`;
    }
}


