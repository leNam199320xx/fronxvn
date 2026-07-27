import { DEFAULT_COLOR_FALLBACK } from '../config.js';
import { toHex } from '../core/color.js';

export function createFieldRow(field, onChange) {
    const row = document.createElement('div');
    row.className = 'prop-row';

    if (field.type === 'group') {
        field.fields.forEach((sub, idx) => {
            if (idx > 0) {
                const spacer = document.createElement('div');
                spacer.style.width = '8px';
                spacer.style.flexShrink = '0';
                row.appendChild(spacer);
            }
            const label = document.createElement('label');
            label.className = 'prop-label';
            label.textContent = sub.label;
            row.appendChild(label);

            if (sub.type === 'select') {
                const select = document.createElement('select');
                select.className = 'prop-select';
                select.dataset.prop = sub.prop;
                sub.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    select.appendChild(option);
                });
                select.addEventListener('change', () => onChange(sub.prop, select.value));
                row.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'prop-input' + (sub.short ? ' prop-input-short' : '');
                input.dataset.prop = sub.prop;
                input.placeholder = sub.placeholder || '';
                input.addEventListener('change', () => onChange(sub.prop, input.value));
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') onChange(sub.prop, input.value);
                    if (sub.numeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                        e.preventDefault();
                        let val = parseFloat(input.value) || 0;
                        val += e.key === 'ArrowUp' ? 1 : -1;
                        input.value = val + (sub.unit || '');
                        onChange(sub.prop, input.value);
                    }
                });
                row.appendChild(input);
            }
        });
        return row;
    }

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
        select.addEventListener('change', () => onChange(field.prop, select.value));
        row.appendChild(select);
    } else if (field.type === 'color') {
        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'prop-color';
        input.dataset.prop = field.prop;
        input.value = DEFAULT_COLOR_FALLBACK;
        input.addEventListener('input', () => onChange(field.prop, input.value));
        row.appendChild(input);

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'prop-input';
        textInput.dataset.prop = field.prop + '-text';
        textInput.placeholder = DEFAULT_COLOR_FALLBACK;
        textInput.addEventListener('change', () => {
            input.value = textInput.value;
            onChange(field.prop, textInput.value);
        });
        row.appendChild(textInput);
    } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'prop-input' + (field.short ? ' prop-input-short' : '');
        input.dataset.prop = field.prop;
        input.placeholder = field.placeholder || '';
        input.addEventListener('change', () => onChange(field.prop, input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onChange(field.prop, input.value);
            }
            if (field.numeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                let val = parseFloat(input.value) || 0;
                val += e.key === 'ArrowUp' ? 1 : -1;
                input.value = val + (field.unit || '');
                onChange(field.prop, input.value);
            }
        });
        row.appendChild(input);
    }

    return row;
}

export function createSection(id, title, fields, onChange) {
    const el = document.createElement('div');
    el.className = 'panel-section';
    el.dataset.section = id;

    const header = document.createElement('div');
    header.className = 'panel-section-header';
    header.innerHTML = `${title} <span class="arrow">▼</span>`;

    const body = document.createElement('div');
    body.className = 'panel-section-body';

    fields.forEach(field => {
        body.appendChild(createFieldRow(field, onChange));
    });

    header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        body.classList.toggle('collapsed');
    });

    el.appendChild(header);
    el.appendChild(body);
    return el;
}
