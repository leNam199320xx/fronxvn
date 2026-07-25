export function inlineRename(inputTarget, initialValue, { onCommit, onCancel, inputClassName, placeholder } = {}) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = inputClassName || 'ui-rename-input';
    input.value = initialValue || '';
    if (placeholder) input.placeholder = placeholder;

    const commit = () => {
        const value = input.value;
        if (inputTarget && inputTarget.parentNode) {
            inputTarget.parentNode.replaceChild(input, inputTarget);
        }
        if (typeof onCommit === 'function') onCommit(value);
    };

    const cancel = () => {
        if (inputTarget && inputTarget.parentNode) {
            inputTarget.parentNode.replaceChild(input, inputTarget);
        }
        if (typeof onCancel === 'function') onCancel();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        e.stopPropagation();
    });

    if (inputTarget && inputTarget.parentNode) {
        inputTarget.parentNode.replaceChild(input, inputTarget);
    }
    input.focus();
    input.select();

    return { input, commit, cancel };
}
