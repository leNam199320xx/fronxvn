export const XY_GROUP = {
    label: 'X-Y',
    type: 'group',
    fields: [
        { label: 'X', prop: 'left', type: 'text', numeric: true, unit: 'px', placeholder: '0px', short: true },
        { label: 'Y', prop: 'top', type: 'text', numeric: true, unit: 'px', placeholder: '0px', short: true }
    ]
};

export const WH_GROUP = {
    label: 'W-H',
    type: 'group',
    fields: [
        { label: 'W', prop: 'width', type: 'text', numeric: true, unit: 'px', placeholder: 'auto', short: true },
        { label: 'H', prop: 'height', type: 'text', numeric: true, unit: 'px', placeholder: 'auto', short: true }
    ]
};

export const MIN_MAX_GROUP = {
    label: 'Min-Max',
    type: 'group',
    fields: [
        { label: 'Min W', prop: 'minWidth', type: 'text', placeholder: 'none', short: true },
        { label: 'Max W', prop: 'maxWidth', type: 'text', placeholder: 'none', short: true }
    ]
};

export const MIN_MAX_H_GROUP = {
    label: 'Min-Max H',
    type: 'group',
    fields: [
        { label: 'Min H', prop: 'minHeight', type: 'text', placeholder: 'none', short: true },
        { label: 'Max H', prop: 'maxHeight', type: 'text', placeholder: 'none', short: true }
    ]
};
