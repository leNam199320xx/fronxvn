/**
 * Alignment - Căn chỉnh phần tử theo parent hoặc theo nhau (multi-select)
 * Left, Right, Top, Bottom, Center (horizontal), Middle (vertical)
 * Full Width, Full Height
 *
 * Multi-select:
 * - align left/right/top/bottom/center/middle -> relative to the bounding box của selection
 * - full-width/full-height -> áp dụng cho từng element theo parent riêng
 */
import eventBus from './event-bus.js';

export class Alignment {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    /** Bind events */
    _bindEvents() {
        eventBus.on('align', (direction) => this.align(direction));
    }

    /**
     * Lấy kích thước parent thực tế của element
     */
    _getParentDimensions(el) {
        const parent = el.parentNode;
        if (parent === this.editor.canvas) {
            return {
                width: this.editor.canvas.offsetWidth,
                height: this.editor.canvas.offsetHeight
            };
        }
        return {
            width: parseFloat(parent.style.width) || parent.offsetWidth,
            height: parseFloat(parent.style.height) || parent.offsetHeight
        };
    }

    /**
     * Tính bounding box của một mảng elements (canvas coordinates)
     */
    _getBoundingBox(elements) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        elements.forEach(el => {
            const x = parseFloat(el.style.left) || 0;
            const y = parseFloat(el.style.top) || 0;
            const w = parseFloat(el.style.width) || el.offsetWidth;
            const h = parseFloat(el.style.height) || el.offsetHeight;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    /** Căn chỉnh */
    align(direction) {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length === 0) return;

        if (elements.length === 1) {
            this._alignSingle(elements[0], direction);
        } else {
            this._alignMulti(elements, direction);
        }
    }

    /** Căn chỉnh 1 element theo parent */
    _alignSingle(el, direction) {
        const { width: parentWidth, height: parentHeight } = this._getParentDimensions(el);
        const elWidth = parseFloat(el.style.width) || el.offsetWidth;
        const elHeight = parseFloat(el.style.height) || el.offsetHeight;

        const beforeLeft = parseFloat(el.style.left) || 0;
        const beforeTop = parseFloat(el.style.top) || 0;
        const beforeWidth = parseFloat(el.style.width) || el.offsetWidth;
        const beforeHeight = parseFloat(el.style.height) || el.offsetHeight;

        switch (direction) {
            case 'left':   el.style.left = '0px'; break;
            case 'center': el.style.left = Math.round((parentWidth - elWidth) / 2) + 'px'; break;
            case 'right':  el.style.left = (parentWidth - elWidth) + 'px'; break;
            case 'top':    el.style.top = '0px'; break;
            case 'middle': el.style.top = Math.round((parentHeight - elHeight) / 2) + 'px'; break;
            case 'bottom': el.style.top = (parentHeight - elHeight) + 'px'; break;
            case 'full-width':
                el.style.left = '0px';
                el.style.width = parentWidth + 'px';
                break;
            case 'full-height':
                el.style.top = '0px';
                el.style.height = parentHeight + 'px';
                break;
        }

        const afterLeft = parseFloat(el.style.left) || 0;
        const afterTop = parseFloat(el.style.top) || 0;
        const afterWidth = parseFloat(el.style.width) || el.offsetWidth;
        const afterHeight = parseFloat(el.style.height) || el.offsetHeight;

        if (afterLeft !== beforeLeft || afterTop !== beforeTop) {
            eventBus.emit('history:push', {
                type: 'move',
                element: el,
                before: { left: beforeLeft, top: beforeTop },
                after: { left: afterLeft, top: afterTop }
            });
        }
        if (afterWidth !== beforeWidth || afterHeight !== beforeHeight) {
            eventBus.emit('history:push', {
                type: 'resize',
                element: el,
                before: { left: beforeLeft, top: beforeTop, width: beforeWidth, height: beforeHeight },
                after: { left: afterLeft, top: afterTop, width: afterWidth, height: afterHeight }
            });
        }

        eventBus.emit('element:updated', el);
        eventBus.emit('element:transform', el);
    }

    /** Căn chỉnh nhiều element — relative to their bounding box */
    _alignMulti(elements, direction) {
        const bbox = this._getBoundingBox(elements);

        elements.forEach(el => {
            const elWidth = parseFloat(el.style.width) || el.offsetWidth;
            const elHeight = parseFloat(el.style.height) || el.offsetHeight;
            const beforeLeft = parseFloat(el.style.left) || 0;
            const beforeTop = parseFloat(el.style.top) || 0;

            let newLeft = beforeLeft;
            let newTop = beforeTop;

            switch (direction) {
                case 'left':
                    newLeft = bbox.x;
                    break;
                case 'center':
                    newLeft = bbox.x + Math.round((bbox.width - elWidth) / 2);
                    break;
                case 'right':
                    newLeft = bbox.x + bbox.width - elWidth;
                    break;
                case 'top':
                    newTop = bbox.y;
                    break;
                case 'middle':
                    newTop = bbox.y + Math.round((bbox.height - elHeight) / 2);
                    break;
                case 'bottom':
                    newTop = bbox.y + bbox.height - elHeight;
                    break;
                case 'full-width':
                    // full-width trong multi -> căn theo parent của từng element
                    this._alignSingle(el, 'full-width');
                    return;
                case 'full-height':
                    this._alignSingle(el, 'full-height');
                    return;
            }

            if (newLeft !== beforeLeft || newTop !== beforeTop) {
                el.style.left = newLeft + 'px';
                el.style.top = newTop + 'px';

                eventBus.emit('history:push', {
                    type: 'move',
                    element: el,
                    before: { left: beforeLeft, top: beforeTop },
                    after: { left: newLeft, top: newTop }
                });
            }

            eventBus.emit('element:updated', el);
            eventBus.emit('element:transform', el);
        });
    }
}
