import eventBus from '../event-bus.js';
import CanvasAPI from '../canvas/canvas-api.js';
import { EXPORT_COPY_RESET_DELAY } from '../config.js';
import { serializeElementCSS, parseCSSText } from '../property/property-parser.js';
import { emitElementUpdated } from '../property/property-utils.js';

export function createResponsiveTab({ editor, eventBus }) {
    const panel = document.getElementById('panel-left');
    let selectedElement = null;

    function showBreakpointBadge(bp) {
        let badge = panel.querySelector('.bp-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'bp-badge';
            panel.insertBefore(badge, panel.firstChild);
        }
        const labels = { desktop: null, tablet: '📱 Tablet', mobile: '📲 Mobile' };
        const label = labels[bp];
        if (label) {
            badge.textContent = label;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    function createCSSEditorSection() {
        const section = document.createElement('div');
        section.className = 'panel-section';
        section.dataset.section = 'css-editor';

        const header = document.createElement('div');
        header.className = 'panel-section-header collapsed';
        header.innerHTML = `CSS <span class="arrow">▶</span>`;

        const body = document.createElement('div');
        body.className = 'panel-section-body collapsed';
        body.style.padding = '0';

        const toolbar = document.createElement('div');
        toolbar.className = 'css-editor-toolbar';

        const btnCopy = document.createElement('button');
        btnCopy.className = 'css-editor-btn';
        btnCopy.textContent = 'Copy';
        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(textarea.value);
            btnCopy.textContent = 'Copied!';
            setTimeout(() => { btnCopy.textContent = 'Copy'; }, EXPORT_COPY_RESET_DELAY);
        });

        const btnApply = document.createElement('button');
        btnApply.className = 'css-editor-btn css-editor-btn-primary';
        btnApply.textContent = 'Apply';
        btnApply.title = 'Apply CSS (Ctrl+Enter)';

        toolbar.appendChild(btnCopy);
        toolbar.appendChild(btnApply);

        const textarea = document.createElement('textarea');
        textarea.className = 'css-editor-textarea';
        textarea.placeholder = '/* Write raw CSS here */\ncolor: red;\nfont-size: 16px;';
        textarea.spellcheck = false;
        textarea.id = 'css-editor-textarea';

        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                applyCSSFromEditor(textarea.value);
            }
            e.stopPropagation();
        });

        btnApply.addEventListener('click', () => applyCSSFromEditor(textarea.value));

        const errorEl = document.createElement('div');
        errorEl.className = 'css-editor-error';
        errorEl.style.display = 'none';

        body.appendChild(toolbar);
        body.appendChild(textarea);
        body.appendChild(errorEl);

        header.addEventListener('click', () => {
            const collapsed = header.classList.toggle('collapsed');
            body.classList.toggle('collapsed', collapsed);
            const arrow = header.querySelector('.arrow');
            if (arrow) arrow.textContent = collapsed ? '▶' : '▼';
            if (!collapsed && selectedElement) {
                textarea.value = serializeElementCSS(selectedElement);
            }
        });

        section.appendChild(header);
        section.appendChild(body);

        return { section, textarea, errorEl };
    }

    function applyCSSFromEditor(css) {
        if (!selectedElement) return;
        const { errorEl } = cssEditor;
        if (errorEl) errorEl.style.display = 'none';
        const beforeCSS = serializeElementCSS(selectedElement);
        const { applied, errors } = parseCSSText(css);

        if (errors.length > 0 && errorEl) {
            errorEl.textContent = errors.join(' | ');
            errorEl.style.display = 'block';
        }

        if (selectedElement.getAttribute) {
            selectedElement.removeAttribute('style');
        }

        Object.entries(applied).forEach(([prop, value]) => {
            try {
                CanvasAPI.setStyle(selectedElement, prop, value);
                if (editor.breakpointManager) {
                    const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
                    editor.breakpointManager.setStyle(selectedElement, camelProp, value);
                }
            } catch (e) {
                if (errorEl) {
                    errorEl.textContent = (errorEl.textContent || '') + ` | Invalid: ${prop}`;
                    errorEl.style.display = 'block';
                }
            }
        });

        eventBus.emit('history:push', {
            type: 'css-bulk',
            element: selectedElement,
            before: beforeCSS,
            after: css
        });

        emitElementUpdated(eventBus, selectedElement);
    }

    function updateCSSEditor(section) {
        if (!cssEditor) return;
        const body = cssEditor.section.querySelector('.panel-section-body');
        if (!body || body.classList.contains('collapsed')) return;
        const { textarea } = cssEditor;
        if (textarea && selectedElement) {
            textarea.value = serializeElementCSS(selectedElement);
        }
    }

    const cssEditor = createCSSEditorSection();

    return {
        cssSection: cssEditor.section,
        cssEditor,
        showBreakpointBadge,
        updateCSSEditor,
        update(el) {
            selectedElement = el;
            updateCSSEditor(cssEditor);
        }
    };
}
