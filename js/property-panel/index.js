import eventBus from '../event-bus.js';
import { createLayoutTab } from './layout-tab.js';
import { createSpacingTab } from './spacing-tab.js';
import { createTypographyTab } from './typography-tab.js';
import { createBackgroundTab } from './background-tab.js';
import { createBorderTab } from './border-tab.js';
import { createEffectsTab } from './effects-tab.js';
import { createTransformTab } from './transform-tab.js';
import { createResponsiveTab } from './responsive-tab.js';
import { DEFAULT_COLOR_FALLBACK } from '../config.js';

export class PropertyPanel {
    constructor(editor) {
        this.editor = editor;
        this.panel = document.getElementById('panel-left');
        this.selectedElement = null;

        this._bindEvents();
        this._render();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('element:selected', (el) => {
            this.selectedElement = el;
            this._updateValues();
        });

        eventBus.on('selection:changed', (elements) => {
            if (elements.length === 1) {
                this.selectedElement = elements[0];
                this._updateValues();
            } else if (elements.length === 0) {
                this.selectedElement = null;
                this._clearValues();
            } else {
                this.selectedElement = null;
                this._showMultiSelectPlaceholder(elements.length);
            }
        });

        eventBus.on('element:deselected', () => {
            this.selectedElement = null;
            this._clearValues();
        });

        eventBus.on('element:updated', (el) => {
            if (el === this.selectedElement) {
                this._updateValues();
            }
        });

        eventBus.on('element:transform', (el) => {
            if (el === this.selectedElement) {
                this._updateValues();
            }
        });

        eventBus.on('breakpoint:changed', (bp) => {
            if (this.responsiveTab) {
                this.responsiveTab.showBreakpointBadge(bp);
            }
            if (this.selectedElement) this._updateValues();
        });

        eventBus.on('page:switched', () => {
            this.selectedElement = null;
            this._clearValues();
        });
    }

    /** Render panel content */
    _render() {
        this.panel.innerHTML = '';

        this.layoutTab = createLayoutTab({ editor: this.editor, eventBus });
        this.spacingTab = createSpacingTab({ editor: this.editor, eventBus });
        this.typographyTab = createTypographyTab({ editor: this.editor, eventBus });
        this.backgroundTab = createBackgroundTab({ editor: this.editor, eventBus });
        this.borderTab = createBorderTab({ editor: this.editor, eventBus });
        this.effectsTab = createEffectsTab({ editor: this.editor, eventBus });
        this.transformTab = createTransformTab({ editor: this.editor, eventBus });
        this.responsiveTab = createResponsiveTab({ editor: this.editor, eventBus });

        const orderedTabs = [
            this.layoutTab,
            this.spacingTab,
            this.typographyTab,
            this.backgroundTab,
            this.borderTab,
            this.effectsTab,
            this.transformTab
        ];

        orderedTabs.forEach(tab => {
            const sections = Array.isArray(tab.sections) ? tab.sections : [tab.section];
            sections.forEach(section => {
                this.panel.appendChild(section);
            });
        });

        this.panel.appendChild(this.responsiveTab.cssSection);
    }

    /** Update values from selected element */
    _updateValues() {
        if (!this.selectedElement) return;

        const notice = this.panel.querySelector('.multi-select-notice');
        if (notice) notice.remove();

        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            input.placeholder = input.dataset.placeholder || '';
        });

        [
            this.layoutTab,
            this.spacingTab,
            this.typographyTab,
            this.backgroundTab,
            this.borderTab,
            this.effectsTab,
            this.transformTab
        ].forEach(tab => {
            if (typeof tab.update === 'function') {
                tab.update(this.selectedElement);
            }
        });

        if (this.responsiveTab) {
            this.responsiveTab.update(this.selectedElement);
        }
    }

    /** Clear values */
    _clearValues() {
        const notice = this.panel.querySelector('.multi-select-notice');
        if (notice) notice.remove();

        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            if (input.type === 'color') {
                input.value = DEFAULT_COLOR_FALLBACK;
            } else {
                input.value = '';
            }
        });
    }

    /** Update CSS editor textarea when element changes */
    _updateCSSEditor() {
        if (this.responsiveTab) {
            this.responsiveTab.updateCSSEditor();
        }
    }

    /** Show multi-select placeholder */
    _showMultiSelectPlaceholder(count) {
        const existing = this.panel.querySelector('.multi-select-notice');
        if (!existing) {
            this.panel.querySelectorAll('[data-prop]').forEach(input => {
                input.value = '';
                input.placeholder = '—';
                input.disabled = true;
            });
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
            this.panel.insertBefore(notice, this.panel.firstChild);
        } else {
            existing.textContent = `${count} elements selected`;
        }
    }
}
