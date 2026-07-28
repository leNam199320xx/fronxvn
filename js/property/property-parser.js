export function serializeElementCSS(el) {
    const lines = [];
    const style = el.style;
    for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        const value = style.getPropertyValue(prop);
        if (value) lines.push(`${prop}: ${value};`);
    }
    return lines.join('\n');
}

export function parseCSSText(css) {
    const errors = [];
    const applied = {};
    css.split('\n').forEach((line, lineNum) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('/*')) return;
        const clean = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
        const colonIdx = clean.indexOf(':');
        if (colonIdx === -1) {
            errors.push(`Line ${lineNum + 1}: missing ":"`);
            return;
        }
        const prop = clean.slice(0, colonIdx).trim();
        const value = clean.slice(colonIdx + 1).trim();
        if (!prop) {
            errors.push(`Line ${lineNum + 1}: empty property`);
            return;
        }
        applied[prop] = value;
    });
    return { applied, errors };
}
