/**
 * GroupManager - Quản lý Group / Ungroup elements
 * - Ctrl+G: Gom nhiều elements thành 1 group container
 * - Ctrl+Shift+G: Giải tán group, trả elements về parent
 * - Hỗ trợ undo/redo qua history
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
import { generateElementId } from './core/ids.js';

export class GroupManager {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {}

    /** Bind events */
    _bindEvents() {
        eventBus.on('group:group',   () => this.group());
        eventBus.on('group:ungroup', () => this.ungroup());
    }

    /**
     * Gom các elements đang chọn thành 1 GroupElement
     * Guard: cần ít nhất 2 elements
     */
    group() {
        const elements = this.editor.selection.getSelectedAll();
        if (elements.length < 2) return;

        // Xác định parent chung (dùng parent của element đầu tiên)
        const parent = elements[0].parentNode;

        // Tính bounding box bao quanh tất cả elements
        let groupLeft   = Infinity;
        let groupTop    = Infinity;
        let groupRight  = -Infinity;
        let groupBottom = -Infinity;

        elements.forEach(el => {
            const left   = parseFloat(CanvasAPI.getStyle(el, 'left'))   || 0;
            const top    = parseFloat(CanvasAPI.getStyle(el, 'top'))    || 0;
            const width  = parseFloat(CanvasAPI.getStyle(el, 'width'))  || el.offsetWidth;
            const height = parseFloat(CanvasAPI.getStyle(el, 'height')) || el.offsetHeight;

            groupLeft   = Math.min(groupLeft,  left);
            groupTop    = Math.min(groupTop,   top);
            groupRight  = Math.max(groupRight,  left + width);
            groupBottom = Math.max(groupBottom, top + height);
        });

        const groupWidth  = groupRight  - groupLeft;
        const groupHeight = groupBottom - groupTop;

        // Lưu vị trí ban đầu của các elements trước khi di chuyển
        const positions = elements.map(el => ({
            el,
            left: parseFloat(CanvasAPI.getStyle(el, 'left')) || 0,
            top:  parseFloat(CanvasAPI.getStyle(el, 'top'))  || 0
        }));

        // Tạo GroupElement
        const groupEl = CanvasAPI.createElement('div', {
            'data-editor-element': '',
            'data-type': 'group',
            'data-container': 'true',
            'data-name': 'Group'
        });
        groupEl.id = generateElementId();
        CanvasAPI.setStyle(groupEl, 'position', 'absolute');
        CanvasAPI.setStyle(groupEl, 'left', groupLeft + 'px');
        CanvasAPI.setStyle(groupEl, 'top', groupTop + 'px');
        CanvasAPI.setStyle(groupEl, 'width', groupWidth + 'px');
        CanvasAPI.setStyle(groupEl, 'height', groupHeight + 'px');

        // Chèn GroupElement vào DOM trước element đầu tiên
        CanvasAPI.insertBefore(groupEl, elements[0], parent);

        // Di chuyển elements vào GroupElement với tọa độ tương đối
        elements.forEach(el => {
            const pos = positions.find(p => p.el === el);
            CanvasAPI.setStyle(el, 'left', (pos.left - groupLeft) + 'px');
            CanvasAPI.setStyle(el, 'top', (pos.top - groupTop) + 'px');
            CanvasAPI.append(el, groupEl);
        });

        // Ghi vào breakpoint store
        const bpMgr = this.editor.breakpointManager;
        bpMgr.setStyle(groupEl, 'left',   groupLeft   + 'px');
        bpMgr.setStyle(groupEl, 'top',    groupTop    + 'px');
        bpMgr.setStyle(groupEl, 'width',  groupWidth  + 'px');
        bpMgr.setStyle(groupEl, 'height', groupHeight + 'px');

        // Push history
        eventBus.emit('history:push', {
            type: 'group',
            groupEl,
            children:    elements,
            parent,
            positions,
            groupLeft,
            groupTop,
            groupWidth,
            groupHeight
        });

        eventBus.emit('element:added', groupEl);
        eventBus.emit('layer:refresh');
        this.editor.selection.select(groupEl);
    }

    /**
     * Giải tán GroupElement, trả elements con về parent
     * Guard: element đang chọn phải có data-type="group"
     */
    ungroup() {
        const el = this.editor.selection.getSelected();
        if (!el || CanvasAPI.getAttribute(el, 'data-type') !== 'group') return;

        const parent    = el.parentNode;
        const groupLeft = parseFloat(CanvasAPI.getStyle(el, 'left')) || 0;
        const groupTop  = parseFloat(CanvasAPI.getStyle(el, 'top'))  || 0;

        const children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));

        // Lưu tọa độ tương đối trong group trước khi di chuyển
        const positions = children.map(child => ({
            el:      child,
            relLeft: parseFloat(CanvasAPI.getStyle(child, 'left')) || 0,
            relTop:  parseFloat(CanvasAPI.getStyle(child, 'top'))  || 0
        }));

        // Di chuyển children ra parent với tọa độ tuyệt đối
        children.forEach(child => {
            const pos = positions.find(p => p.el === child);
            CanvasAPI.setStyle(child, 'left', (pos.relLeft + groupLeft) + 'px');
            CanvasAPI.setStyle(child, 'top', (pos.relTop + groupTop) + 'px');
            CanvasAPI.insertBefore(child, el, parent);

            // Sync vào breakpoint store
            const bpMgr = this.editor.breakpointManager;
            bpMgr.setStyle(child, 'left', CanvasAPI.getStyle(child, 'left'));
            bpMgr.setStyle(child, 'top', CanvasAPI.getStyle(child, 'top'));
        });

        // Xóa GroupElement
        CanvasAPI.remove(el);

        // Push history
        eventBus.emit('history:push', {
            type: 'ungroup',
            groupEl: el,
            children,
            parent,
            positions,
            groupLeft,
            groupTop
        });

        eventBus.emit('element:deleted', el);
        eventBus.emit('layer:refresh');
        this.editor.selection.setSelection(children);
    }
}
