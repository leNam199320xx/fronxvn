/**
 * GroupManager - Quản lý Group / Ungroup elements
 * - Ctrl+G: Gom nhiều elements thành 1 group container
 * - Ctrl+Shift+G: Giải tán group, trả elements về parent
 * - Hỗ trợ undo/redo qua history
 */
import eventBus from './event-bus.js';
import { ELEMENT_ID_RANDOM_LENGTH } from './config.js';

export class GroupManager {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

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
            const left   = parseFloat(el.style.left)   || 0;
            const top    = parseFloat(el.style.top)    || 0;
            const width  = parseFloat(el.style.width)  || el.offsetWidth;
            const height = parseFloat(el.style.height) || el.offsetHeight;

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
            left: parseFloat(el.style.left) || 0,
            top:  parseFloat(el.style.top)  || 0
        }));

        // Tạo GroupElement
        const groupEl = document.createElement('div');
        groupEl.setAttribute('data-editor-element', '');
        groupEl.dataset.type      = 'group';
        groupEl.dataset.container = 'true';
        groupEl.dataset.name      = 'Group';
        groupEl.id = `el-${Date.now()}-${Math.random().toString(36).substring(2, 2 + ELEMENT_ID_RANDOM_LENGTH)}`;
        groupEl.style.position = 'absolute';
        groupEl.style.left     = groupLeft   + 'px';
        groupEl.style.top      = groupTop    + 'px';
        groupEl.style.width    = groupWidth  + 'px';
        groupEl.style.height   = groupHeight + 'px';

        // Chèn GroupElement vào DOM trước element đầu tiên
        parent.insertBefore(groupEl, elements[0]);

        // Di chuyển elements vào GroupElement với tọa độ tương đối
        elements.forEach(el => {
            const pos = positions.find(p => p.el === el);
            el.style.left = (pos.left - groupLeft) + 'px';
            el.style.top  = (pos.top  - groupTop)  + 'px';
            groupEl.appendChild(el);
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
        if (!el || el.dataset.type !== 'group') return;

        const parent    = el.parentNode;
        const groupLeft = parseFloat(el.style.left) || 0;
        const groupTop  = parseFloat(el.style.top)  || 0;

        const children = Array.from(el.querySelectorAll(':scope > [data-editor-element]'));

        // Lưu tọa độ tương đối trong group trước khi di chuyển
        const positions = children.map(child => ({
            el:      child,
            relLeft: parseFloat(child.style.left) || 0,
            relTop:  parseFloat(child.style.top)  || 0
        }));

        // Di chuyển children ra parent với tọa độ tuyệt đối
        children.forEach(child => {
            const pos = positions.find(p => p.el === child);
            child.style.left = (pos.relLeft + groupLeft) + 'px';
            child.style.top  = (pos.relTop  + groupTop)  + 'px';
            parent.insertBefore(child, el);

            // Sync vào breakpoint store
            const bpMgr = this.editor.breakpointManager;
            bpMgr.setStyle(child, 'left', child.style.left);
            bpMgr.setStyle(child, 'top',  child.style.top);
        });

        // Xóa GroupElement
        el.remove();

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
