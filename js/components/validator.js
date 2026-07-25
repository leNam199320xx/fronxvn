export function validateComponentData(data) {
    const errors = [];
    if (!data) {
        return { valid: false, errors: ['No data provided'] };
    }
    if (!Array.isArray(data)) {
        return { valid: false, errors: ['Data must be an array'] };
    }
    data.forEach((item, index) => {
        if (!item.id) {
            errors.push(`Item ${index}: missing id`);
        }
        if (!item.html) {
            errors.push(`Item ${index}: missing html`);
        }
    });
    return { valid: errors.length === 0, errors };
}

export function isValidComponentId(id) {
    return typeof id === 'string' && id.length > 0;
}
