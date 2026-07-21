/**
 * PropertyPanel - Left panel hiển thị và chỉnh sửa CSS của phần tử đang chọn
 * Bao gồm: Layout, Margin, Padding, Typography, Background, Border, Shadow, Effect, Transform
 */
import eventBus from './event-bus.js';

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
                // Multi-select: hiển thị panel nhưng disabled
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

        // Khi switch breakpoint -> cập nhật badge + reload values
        eventBus.on('breakpoint:changed', (bp) => {
            this._updateBreakpointBadge(bp);
            if (this.selectedElement) this._updateValues();
        });
    }

    /** Render panel content */
    _render() {
        this.panel.innerHTML = '';

        // Các section
        const sections = [
            { id: 'layout', title: 'Layout', fields: this._getLayoutFields() },
            { id: 'margin', title: 'Margin', fields: this._getMarginFields() },
            { id: 'padding', title: 'Padding', fields: this._getPaddingFields() },
            { id: 'typography', title: 'Typography', fields: this._getTypographyFields() },
            { id: 'background', title: 'Background', fields: this._getBackgroundFields() },
            { id: 'border', title: 'Border', fields: this._getBorderFields() },
            { id: 'shadow', title: 'Shadow', fields: this._getShadowFields() },
            { id: 'effect', title: 'Effect', fields: this._getEffectFields() },
            { id: 'transform', title: 'Transform', fields: this._getTransformFields() }
        ];

        sections.forEach(section => {
            const sectionEl = this._createSection(section);
            this.panel.appendChild(sectionEl);
        });
    }

    /** Tạo một section */
    _createSection(section) {
        const el = document.createElement('div');
        el.className = 'panel-section';
        el.dataset.section = section.id;

        const header = document.createElement('div');
        header.className = 'panel-section-header';
        header.innerHTML = `${section.title} <span class="arrow">▼</span>`;
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });

        const body = document.createElement('div');
        body.className = 'panel-section-body';

        section.fields.forEach(field => {
            const row = this._createField(field);
            body.appendChild(row);
        });

        el.appendChild(header);
        el.appendChild(body);
        return el;
    }

    /** Tạo một field */
    _createField(field) {
        const row = document.createElement('div');
        row.className = 'prop-row';

        const label = document.createElement('label');
        label.className = 'prop-label';
        label.textContent = field.label;
        row.appendChild(label);

        if (field.type === 'select') {
            const select = document.createElement('select');
            select.className = 'prop-select';
            select.dataset.prop = field.prop;
            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });
            select.addEventListener('change', () => this._applyProperty(field.prop, select.value));
            row.appendChild(select);
        } else if (field.type === 'color') {
            const input = document.createElement('input');
            input.type = 'color';
            input.className = 'prop-color';
            input.dataset.prop = field.prop;
            input.value = '#000000';
            input.addEventListener('input', () => this._applyProperty(field.prop, input.value));
            row.appendChild(input);

            // Thêm input text cho giá trị hex
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'prop-input';
            textInput.dataset.prop = field.prop + '-text';
            textInput.placeholder = '#000000';
            textInput.addEventListener('change', () => {
                input.value = textInput.value;
                this._applyProperty(field.prop, textInput.value);
            });
            row.appendChild(textInput);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'prop-input' + (field.short ? ' prop-input-short' : '');
            input.dataset.prop = field.prop;
            input.placeholder = field.placeholder || '';
            input.addEventListener('change', () => this._applyProperty(field.prop, input.value));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this._applyProperty(field.prop, input.value);
                }
                // Tăng/giảm giá trị bằng arrow key
                if (field.numeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                    e.preventDefault();
                    let val = parseFloat(input.value) || 0;
                    val += e.key === 'ArrowUp' ? 1 : -1;
                    input.value = val + (field.unit || '');
                    this._applyProperty(field.prop, input.value);
                }
            });
            row.appendChild(input);
        }

        return row;
    }

    /** Áp dụng CSS property */
    _applyProperty(prop, value) {
        if (!this.selectedElement) return;

        const before = this.selectedElement.style[prop];

        // Xử lý đặc biệt cho left, top, width, height
        if (['left', 'top', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'gap'].includes(prop)) {
            if (value && !isNaN(parseFloat(value)) && !value.includes('px') && !value.includes('%') && !value.includes('auto')) {
                value = value + 'px';
            }
        }

        // Xử lý font-size, letter-spacing, line-height
        if (['fontSize', 'letterSpacing', 'lineHeight'].includes(prop)) {
            if (value && !isNaN(parseFloat(value)) && !value.includes('px') && !value.includes('em') && !value.includes('%')) {
                value = value + 'px';
            }
        }

        this.selectedElement.style[prop] = value;

        // Lưu style vào breakpoint hiện tại
        const bpManager = this.editor.breakpointManager;
        if (bpManager) {
            bpManager.setStyle(this.selectedElement, prop, value);
        }

        // Khi thay đổi display -> cập nhật children positioning
        if (prop === 'display') {
            this._handleDisplayChange(this.selectedElement, value);
        }

        // Khi thay đổi position -> cập nhật element
        if (prop === 'position') {
            this._handlePositionChange(this.selectedElement, value);
        }

        // Lưu history
        eventBus.emit('history:push', {
            type: 'style',
            element: this.selectedElement,
            prop: prop,
            before: before,
            after: value
        });

        eventBus.emit('element:updated', this.selectedElement);
    }

    /**
     * Xử lý khi thay đổi display mode
     * Với flex/grid: children chuyển sang position relative để tham gia flow
     * Với block/none: children giữ position absolute
     */
    _handleDisplayChange(el, displayValue) {
        const isFlowLayout = ['flex', 'grid'].includes(displayValue);
        const children = el.querySelectorAll(':scope > [data-editor-element]');

        children.forEach(child => {
            if (isFlowLayout) {
                // Chuyển children sang relative để flex/grid hoạt động
                child.style.position = 'relative';
                // Reset left/top vì trong flow layout không cần
                child.style.left = '';
                child.style.top = '';
            } else {
                // Quay lại absolute positioning
                child.style.position = 'absolute';
                // Đặt lại vị trí mặc định nếu chưa có
                if (!child.style.left) child.style.left = '0px';
                if (!child.style.top) child.style.top = '0px';
            }
        });

        // Refresh layer panel vì children thay đổi
        eventBus.emit('layer:refresh');
    }

    /**
     * Xử lý khi thay đổi position
     * Nếu element chuyển sang relative/static mà parent là flex/grid -> xóa left/top
     */
    _handlePositionChange(el, positionValue) {
        if (['relative', 'static', ''].includes(positionValue)) {
            const parent = el.parentNode;
            if (parent && parent !== this.editor.canvas) {
                const parentDisplay = parent.style.display;
                if (['flex', 'grid'].includes(parentDisplay)) {
                    el.style.left = '';
                    el.style.top = '';
                }
            }
        }
    }

    /** Cập nhật giá trị từ element đang chọn */
    _updateValues() {
        if (!this.selectedElement) return;

        // Xóa multi-select notice nếu có
        const notice = this.panel.querySelector('.multi-select-notice');
        if (notice) notice.remove();

        // Re-enable tất cả inputs
        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            input.placeholder = input.dataset.placeholder || '';
        });

        const style = this.selectedElement.style;
        const computed = window.getComputedStyle(this.selectedElement);

        // Cập nhật tất cả input/select
        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            const prop = input.dataset.prop;
            if (prop.endsWith('-text')) return; // Skip text companion

            let value = style[prop] || '';

            if (input.type === 'color') {
                value = value || computed[prop];
                input.value = this._toHex(value) || '#000000';
                // Cập nhật text input đi kèm
                const textInput = this.panel.querySelector(`[data-prop="${prop}-text"]`);
                if (textInput) textInput.value = input.value;
            } else if (input.tagName === 'SELECT') {
                input.value = value || computed[prop] || '';
            } else {
                input.value = value || '';
            }
        });
    }

    /** Xóa giá trị khi bỏ chọn */
    _clearValues() {
        // Xóa multi-select notice nếu có
        const notice = this.panel.querySelector('.multi-select-notice');
        if (notice) notice.remove();

        this.panel.querySelectorAll('[data-prop]').forEach(input => {
            input.disabled = false;
            if (input.type === 'color') {
                input.value = '#000000';
            } else {
                input.value = '';
            }
        });
    }

    /** Cập nhật badge breakpoint ở đầu panel */
    _updateBreakpointBadge(bp) {
        let badge = this.panel.querySelector('.bp-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'bp-badge';
            this.panel.insertBefore(badge, this.panel.firstChild);
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

    /** Hiển thị placeholder khi multi-select */
    _showMultiSelectPlaceholder(count) {
        // Xóa tất cả sections và thay bằng thông báo
        const existing = this.panel.querySelector('.multi-select-notice');
        if (!existing) {
            this.panel.querySelectorAll('[data-prop]').forEach(input => {
                input.value = '';
                input.placeholder = '—';
                input.disabled = true;
            });
            // Đặt thông báo ở đầu panel
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

    /** Chuyển màu sang hex */
    _toHex(color) {
        if (!color) return '#000000';
        if (color.startsWith('#')) return color;
        if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                const [r, g, b] = match.map(Number);
                return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
            }
        }
        return '#000000';
    }

    /** Field definitions */
    _getLayoutFields() {
        return [
            { label: 'Position', prop: 'position', type: 'select', options: ['', 'static', 'relative', 'absolute', 'fixed', 'sticky'] },
            { label: 'X (Left)', prop: 'left', type: 'text', numeric: true, unit: 'px', placeholder: '0px' },
            { label: 'Y (Top)', prop: 'top', type: 'text', numeric: true, unit: 'px', placeholder: '0px' },
            { label: 'Width', prop: 'width', type: 'text', numeric: true, unit: 'px', placeholder: 'auto' },
            { label: 'Height', prop: 'height', type: 'text', numeric: true, unit: 'px', placeholder: 'auto' },
            { label: 'Min W', prop: 'minWidth', type: 'text', placeholder: 'none' },
            { label: 'Max W', prop: 'maxWidth', type: 'text', placeholder: 'none' },
            { label: 'Min H', prop: 'minHeight', type: 'text', placeholder: 'none' },
            { label: 'Max H', prop: 'maxHeight', type: 'text', placeholder: 'none' },
            { label: 'Display', prop: 'display', type: 'select', options: ['', 'block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
            { label: 'Direction', prop: 'flexDirection', type: 'select', options: ['', 'row', 'row-reverse', 'column', 'column-reverse'] },
            { label: 'Justify', prop: 'justifyContent', type: 'select', options: ['', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
            { label: 'Align', prop: 'alignItems', type: 'select', options: ['', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline'] },
            { label: 'Wrap', prop: 'flexWrap', type: 'select', options: ['', 'nowrap', 'wrap', 'wrap-reverse'] },
            { label: 'Gap', prop: 'gap', type: 'text', numeric: true, unit: 'px', placeholder: '0' },
            { label: 'Overflow', prop: 'overflow', type: 'select', options: ['', 'visible', 'hidden', 'scroll', 'auto'] },
            { label: 'Z-Index', prop: 'zIndex', type: 'text', numeric: true, placeholder: 'auto' }
        ];
    }

    _getMarginFields() {
        return [
            { label: 'Top', prop: 'marginTop', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
            { label: 'Right', prop: 'marginRight', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
            { label: 'Bottom', prop: 'marginBottom', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
            { label: 'Left', prop: 'marginLeft', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true }
        ];
    }

    _getPaddingFields() {
        return [
            { label: 'Top', prop: 'paddingTop', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
            { label: 'Right', prop: 'paddingRight', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
            { label: 'Bottom', prop: 'paddingBottom', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true },
            { label: 'Left', prop: 'paddingLeft', type: 'text', numeric: true, unit: 'px', placeholder: '0', short: true }
        ];
    }

    _getTypographyFields() {
        return [
            { label: 'Font', prop: 'fontFamily', type: 'text', placeholder: 'Arial' },
            { label: 'Size', prop: 'fontSize', type: 'text', numeric: true, unit: 'px', placeholder: '16px' },
            { label: 'Weight', prop: 'fontWeight', type: 'select', options: ['', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
            { label: 'Line H', prop: 'lineHeight', type: 'text', placeholder: 'normal' },
            { label: 'Spacing', prop: 'letterSpacing', type: 'text', numeric: true, unit: 'px', placeholder: '0' },
            { label: 'Align', prop: 'textAlign', type: 'select', options: ['', 'left', 'center', 'right', 'justify'] },
            { label: 'Transform', prop: 'textTransform', type: 'select', options: ['', 'none', 'uppercase', 'lowercase', 'capitalize'] },
            { label: 'Decoration', prop: 'textDecoration', type: 'select', options: ['', 'none', 'underline', 'overline', 'line-through'] },
            { label: 'Color', prop: 'color', type: 'color' }
        ];
    }

    _getBackgroundFields() {
        return [
            { label: 'BG Color', prop: 'backgroundColor', type: 'color' },
            { label: 'BG Image', prop: 'backgroundImage', type: 'text', placeholder: "url(...) or linear-gradient(...)" },
            { label: 'BG Size', prop: 'backgroundSize', type: 'select', options: ['', 'auto', 'cover', 'contain', '100% 100%'] },
            { label: 'BG Pos', prop: 'backgroundPosition', type: 'text', placeholder: 'center' },
            { label: 'BG Repeat', prop: 'backgroundRepeat', type: 'select', options: ['', 'repeat', 'no-repeat', 'repeat-x', 'repeat-y'] }
        ];
    }

    _getBorderFields() {
        return [
            { label: 'Width', prop: 'borderWidth', type: 'text', numeric: true, unit: 'px', placeholder: '0' },
            { label: 'Style', prop: 'borderStyle', type: 'select', options: ['', 'none', 'solid', 'dashed', 'dotted', 'double', 'groove'] },
            { label: 'Color', prop: 'borderColor', type: 'color' },
            { label: 'Radius', prop: 'borderRadius', type: 'text', numeric: true, unit: 'px', placeholder: '0' }
        ];
    }

    _getShadowFields() {
        return [
            { label: 'Box Shadow', prop: 'boxShadow', type: 'text', placeholder: '0 2px 4px rgba(0,0,0,0.2)' }
        ];
    }

    _getEffectFields() {
        return [
            { label: 'Opacity', prop: 'opacity', type: 'text', numeric: true, placeholder: '1' },
            { label: 'Filter', prop: 'filter', type: 'text', placeholder: 'blur(0px)' }
        ];
    }

    _getTransformFields() {
        return [
            { label: 'Rotate', prop: 'rotate', type: 'text', placeholder: '0deg' },
            { label: 'Scale', prop: 'scale', type: 'text', placeholder: '1' },
            { label: 'Translate', prop: 'translate', type: 'text', placeholder: '0px 0px' },
            { label: 'Skew', prop: 'skew', type: 'text', placeholder: '0deg' }
        ];
    }
}
