import DirtyState, { DIRTY } from '../dirty-state.js';
import { updatePanelValues, clearPanelValues, showMultiSelectPlaceholder } from './property-renderer.js';

export function bindPropertyPanelEvents(panel, eventBus) {
    eventBus.on('element:selected', (el) => {
        panel.selectedElement = el;
        DirtyState.mark(DIRTY.PROPERTIES);
        updatePanelValues(panel);
    });

    eventBus.on('selection:changed', (elements) => {
        if (elements.length === 1) {
            panel.selectedElement = elements[0];
            DirtyState.mark(DIRTY.PROPERTIES);
            updatePanelValues(panel);
        } else if (elements.length === 0) {
            panel.selectedElement = null;
            clearPanelValues(panel);
        } else {
            panel.selectedElement = null;
            showMultiSelectPlaceholder(panel, elements.length);
        }
    });

    eventBus.on('element:deselected', () => {
        panel.selectedElement = null;
        clearPanelValues(panel);
    });

    eventBus.on('element:updated', (el) => {
        if (el === panel.selectedElement) {
            DirtyState.mark(DIRTY.PROPERTIES);
            updatePanelValues(panel);
        }
    });

    eventBus.on('element:transform', (el) => {
        if (el === panel.selectedElement) {
            DirtyState.mark(DIRTY.PROPERTIES);
            updatePanelValues(panel);
        }
    });

    eventBus.on('breakpoint:changed', (bp) => {
        if (panel.responsiveTab) {
            panel.responsiveTab.showBreakpointBadge(bp);
        }
        if (panel.selectedElement) {
            DirtyState.mark(DIRTY.PROPERTIES);
            updatePanelValues(panel);
        }
    });

    eventBus.on('page:switched', () => {
        panel.selectedElement = null;
        clearPanelValues(panel);
    });
}

