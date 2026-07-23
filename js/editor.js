/**
 * Editor - Module chính khởi tạo và điều phối toàn bộ ứng dụng
 * Quản lý Canvas: grid, scroll, zoom, tọa độ chuột
 */
import eventBus from './event-bus.js';
import {
    ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP,
    GRID_SIZE, GRID_ENABLED_DEFAULT
} from './config.js';
import { Selection } from './selection.js';
import { Overlay } from './overlay.js';
import { Drag } from './drag.js';
import { Resize } from './resize.js';
import { Rotate } from './rotate.js';
import { PropertyPanel } from './property-panel.js';
import { ElementPanel } from './element-panel.js';
import { LayerPanel } from './layer-panel.js';
import { History } from './history.js';
import { ContextMenu } from './context-menu.js';
import { Clipboard } from './clipboard.js';
import { Alignment } from './alignment.js';
import { PageManager } from './page-manager.js';
import { ExportManager } from './export.js';
import { ProjectManager } from './project.js';
import { TemplateManager } from './template-manager.js';
import { BreakpointManager } from './breakpoint-manager.js';
import { GroupManager } from './group-manager.js';
import { QualityEngine } from './quality-engine.js';
import { QualityPanel } from './quality-panel.js';
import { ComponentManager } from './component-manager.js';
import { ComponentPanel } from './component-panel.js';
import { ThemeManager } from './theme-manager.js';

class Editor {
    constructor() {
        // DOM references
        this.canvasWrapper = document.getElementById('canvas-wrapper');
        this.canvasContainer = document.getElementById('canvas-container');
        this.canvas = document.getElementById('canvas');
        this.overlayLayer = document.getElementById('overlay-layer');
        this.coordsDisplay = document.getElementById('coords-display');
        this.zoomDisplay = document.getElementById('zoom-display');

        // State
        this.zoom = ZOOM_DEFAULT;
        this.minZoom = ZOOM_MIN;
        this.maxZoom = ZOOM_MAX;
        this.zoomStep = ZOOM_STEP;
        this.gridEnabled = GRID_ENABLED_DEFAULT;
        this.gridSize = GRID_SIZE;

        // Pan state
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this._panMouseActive = false;

        // Project metadata (SEO, OG tags...)
        this.projectMeta = {
            title: '',
            description: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            canonical: ''
        };

        // Khởi tạo
        this._initCanvas();
        this._initToolbar();
        this._initTabs();
        this._initModules();
        this._bindEvents();
    }

    /** Khởi tạo canvas */
    _initCanvas() {
        this._updateZoomDisplay();
    }

    /** Khởi tạo các module con */
    _initModules() {
        this.history = new History(this);
        this.selection = new Selection(this);
        this.overlay = new Overlay(this);
        this.drag = new Drag(this);
        this.resize = new Resize(this);
        this.rotate = new Rotate(this);
        this.propertyPanel = new PropertyPanel(this);
        this.elementPanel = new ElementPanel(this);
        this.layerPanel = new LayerPanel(this);
        this.contextMenu = new ContextMenu(this);
        this.clipboard = new Clipboard(this);
        this.alignment = new Alignment(this);
        this.exportManager = new ExportManager(this);
        this.projectManager = new ProjectManager(this);
        this.templateManager = new TemplateManager(this);
        this.breakpointManager = new BreakpointManager(this);
        this.groupManager = new GroupManager(this);

        // PageManager phải được khởi tạo sau tất cả module khác
        // vì nó dùng this.history, this.selection, v.v.
        this.pageManager = new PageManager(this);

        // QualityEngine + QualityPanel — khởi tạo sau PageManager
        this.qualityEngine = new QualityEngine(this);
        this.qualityPanel  = new QualityPanel(this);

        // ComponentManager + ComponentPanel — khởi tạo sau QualityEngine
        this.componentManager = new ComponentManager(this);
        this.componentPanel   = new ComponentPanel(this);

        // ThemeManager — khởi tạo sau tất cả modules
        this.themeManager = new ThemeManager(this);
    }

    /** Khởi tạo toolbar */
    _initToolbar() {
        // Zoom controls
        document.getElementById('btn-zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('btn-zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-reset').addEventListener('click', () => this.zoomReset());

        // Grid toggle
        const btnGrid = document.getElementById('btn-toggle-grid');
        btnGrid.addEventListener('click', () => {
            this.gridEnabled = !this.gridEnabled;
            this.canvas.classList.toggle('show-grid', this.gridEnabled);
            btnGrid.classList.toggle('active', this.gridEnabled);
            eventBus.emit('canvas:grid-toggle', this.gridEnabled);
        });

        // Undo/Redo
        document.getElementById('btn-undo').addEventListener('click', () => {
            eventBus.emit('history:undo');
        });
        document.getElementById('btn-redo').addEventListener('click', () => {
            eventBus.emit('history:redo');
        });

        // Alignment buttons
        document.getElementById('btn-align-left').addEventListener('click', () => eventBus.emit('align', 'left'));
        document.getElementById('btn-align-center').addEventListener('click', () => eventBus.emit('align', 'center'));
        document.getElementById('btn-align-right').addEventListener('click', () => eventBus.emit('align', 'right'));
        document.getElementById('btn-align-top').addEventListener('click', () => eventBus.emit('align', 'top'));
        document.getElementById('btn-align-middle').addEventListener('click', () => eventBus.emit('align', 'middle'));
        document.getElementById('btn-align-bottom').addEventListener('click', () => eventBus.emit('align', 'bottom'));
        document.getElementById('btn-full-width').addEventListener('click', () => eventBus.emit('align', 'full-width'));
        document.getElementById('btn-full-height').addEventListener('click', () => eventBus.emit('align', 'full-height'));

        // Export/Save/Load
        document.getElementById('btn-export').addEventListener('click', () => eventBus.emit('export:show'));
        document.getElementById('btn-save').addEventListener('click', () => eventBus.emit('project:save'));
        document.getElementById('btn-load').addEventListener('click', () => eventBus.emit('project:load'));

        // Viewport / Breakpoint switcher
        const bpButtons = document.querySelectorAll('#viewport-switcher [data-bp]');
        const viewportLabel = document.getElementById('viewport-label');
        bpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const bp = btn.dataset.bp;
                bpButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                viewportLabel.textContent = { desktop: 'Desktop', tablet: 'Tablet (768px)', mobile: 'Mobile (375px)' }[bp];
                // Update canvas-wrapper class for visual indicator
                this.canvasWrapper.classList.remove('bp-tablet', 'bp-mobile');
                if (bp !== 'desktop') this.canvasWrapper.classList.add(`bp-${bp}`);
                eventBus.emit('breakpoint:switch', bp);
            });
        });

        // Listen for breakpoint changes (e.g. from other sources)
        eventBus.on('breakpoint:changed', (bp) => {
            bpButtons.forEach(b => b.classList.toggle('active', b.dataset.bp === bp));
            viewportLabel.textContent = { desktop: 'Desktop', tablet: 'Tablet (768px)', mobile: 'Mobile (375px)' }[bp];
        });
    }

    /** Khởi tạo tab switching cho right panel */
    _initTabs() {
        const tabs = document.querySelectorAll('.panel-tab');
        const contents = document.querySelectorAll('.panel-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.querySelector(`[data-tab-content="${tabName}"]`).classList.add('active');
            });
        });
    }

    /** Bindcác sự kiện chính */
    _bindEvents() {
        // Tọa độ chuột trên canvas
        this.canvasWrapper.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.round((e.clientX - rect.left) / this.zoom);
            const y = Math.round((e.clientY - rect.top) / this.zoom);
            this.coordsDisplay.textContent = `X: ${x}  Y: ${y}`;
            eventBus.emit('canvas:mousemove', { x, y, clientX: e.clientX, clientY: e.clientY });
        });

        // Zoom bằng Ctrl + Scroll
        this.canvasWrapper.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        }, { passive: false });

        // Scroll event
        this.canvasContainer.addEventListener('scroll', () => {
            eventBus.emit('canvas:scroll', {
                scrollLeft: this.canvasContainer.scrollLeft,
                scrollTop: this.canvasContainer.scrollTop
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            eventBus.emit('canvas:resize');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this._handleKeydown(e));

        // Space key: kích hoạt PanMode
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                const t = e.target;
                // Không kích hoạt khi đang focus vào input/textarea/contenteditable
                if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
                e.preventDefault();
                if (!this.isPanning) {
                    this.isPanning = true;
                    this.canvasWrapper.style.cursor = 'grab';
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isPanning = false;
                this._panMouseActive = false;
                this.canvasWrapper.style.cursor = '';
            }
        });

        // Pan: mousedown trên canvasWrapper khi đang PanMode (Space) hoặc middle-click
        this.canvasWrapper.addEventListener('mousedown', (e) => {
            if (this.isPanning && e.button === 0) {
                e.preventDefault();
                e.stopPropagation();
                this._panMouseActive = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.canvasWrapper.style.cursor = 'grabbing';
            }
            // Middle-click pan
            if (e.button === 1) {
                e.preventDefault();
                this.isPanning = true;
                this._panMouseActive = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.canvasWrapper.style.cursor = 'grabbing';
            }
        }, true); // capture phase để ưu tiên hơn drag handler

        // Pan: mousemove trên document khi đang pan
        document.addEventListener('mousemove', (e) => {
            if (this._panMouseActive) {
                const dx = e.clientX - this.panStartX;
                const dy = e.clientY - this.panStartY;
                this.canvasContainer.scrollLeft -= dx;
                this.canvasContainer.scrollTop -= dy;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
            }
        });

        // Pan: mouseup trên document để kết thúc pan
        document.addEventListener('mouseup', (e) => {
            if (this._panMouseActive && e.button === 0) {
                this._panMouseActive = false;
                if (this.isPanning) this.canvasWrapper.style.cursor = 'grab';
            }
            // Middle-click release
            if (this._panMouseActive && e.button === 1) {
                this.isPanning = false;
                this._panMouseActive = false;
                this.canvasWrapper.style.cursor = '';
            }
        });
    }

    /** Xử lý phím tắt */
    _handleKeydown(e) {
        const target = e.target;
        // Không xử lý khi đang focus input
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        // Ctrl+G: Group
        if (ctrl && !shift && e.key === 'g') {
            e.preventDefault();
            eventBus.emit('group:group');
            return;
        }
        // Ctrl+Shift+G: Ungroup
        if (ctrl && shift && (e.key === 'g' || e.key === 'G')) {
            e.preventDefault();
            eventBus.emit('group:ungroup');
            return;
        }

        // Ctrl+Z: Undo
        if (ctrl && !shift && e.key === 'z') {
            e.preventDefault();
            eventBus.emit('history:undo');
            return;
        }
        // Ctrl+Shift+Z: Redo
        if (ctrl && shift && e.key === 'Z') {
            e.preventDefault();
            eventBus.emit('history:redo');
            return;
        }
        // Ctrl+C: Copy
        if (ctrl && e.key === 'c') {
            e.preventDefault();
            eventBus.emit('clipboard:copy');
            return;
        }
        // Ctrl+V: Paste
        if (ctrl && e.key === 'v') {
            e.preventDefault();
            eventBus.emit('clipboard:paste');
            return;
        }
        // Ctrl+X: Cut
        if (ctrl && e.key === 'x') {
            e.preventDefault();
            eventBus.emit('clipboard:cut');
            return;
        }
        // Ctrl+D: Duplicate
        if (ctrl && e.key === 'd') {
            e.preventDefault();
            eventBus.emit('clipboard:duplicate');
            return;
        }
        // Ctrl+L: Lock/Unlock toggle
        if (ctrl && !shift && e.key === 'l') {
            e.preventDefault();
            eventBus.emit('element:lock-toggle');
            return;
        }
        // Ctrl+H: Hide/Show toggle
        if (ctrl && !shift && e.key === 'h') {
            e.preventDefault();
            eventBus.emit('element:hide-toggle');
            return;
        }
        // Ctrl+Shift+]: Bring to Front
        if (ctrl && shift && e.key === ']') {
            e.preventDefault();
            eventBus.emit('element:bring-front');
            return;
        }
        // Ctrl+]: Move Forward
        if (ctrl && !shift && e.key === ']') {
            e.preventDefault();
            eventBus.emit('element:move-forward');
            return;
        }
        // Ctrl+[: Move Backward
        if (ctrl && !shift && e.key === '[') {
            e.preventDefault();
            eventBus.emit('element:move-backward');
            return;
        }
        // Ctrl+Shift+[: Send to Back
        if (ctrl && shift && e.key === '[') {
            e.preventDefault();
            eventBus.emit('element:send-back');
            return;
        }
        // Delete / Backspace
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            eventBus.emit('element:delete');
            return;
        }
        // Arrow keys: di chuyển phần tử
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const amount = shift ? 10 : 1;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -amount;
            if (e.key === 'ArrowDown') dy = amount;
            if (e.key === 'ArrowLeft') dx = -amount;
            if (e.key === 'ArrowRight') dx = amount;
            eventBus.emit('element:move-by', { dx, dy });
            return;
        }
    }

    /** Zoom in */
    zoomIn() {
        this.setZoom(this.zoom + this.zoomStep);
    }

    /** Zoom out */
    zoomOut() {
        this.setZoom(this.zoom - this.zoomStep);
    }

    /** Reset zoom */
    zoomReset() {
        this.setZoom(1);
    }

    /** Set zoom level */
    setZoom(level) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.zoom = Math.round(this.zoom * 100) / 100;
        this.canvasContainer.style.transform = `scale(${this.zoom})`;
        this.canvasContainer.style.transformOrigin = '0 0';
        this._updateZoomDisplay();
        eventBus.emit('canvas:zoom', this.zoom);
    }

    /** Cập nhật hiển thị zoom */
    _updateZoomDisplay() {
        this.zoomDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    /**
     * Lấy vị trí element trên canvas (relative to canvas)
     * @param {HTMLElement} el
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getElementRect(el) {
        const x = parseFloat(el.style.left) || 0;
        const y = parseFloat(el.style.top) || 0;
        const width = parseFloat(el.style.width) || el.offsetWidth;
        const height = parseFloat(el.style.height) || el.offsetHeight;
        return { x, y, width, height };
    }

    /**
     * Lấy tọa độ chuột relative to canvas
     * @param {MouseEvent} e
     * @returns {{x: number, y: number}}
     */
    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom,
            y: (e.clientY - rect.top) / this.zoom
        };
    }

    /**
     * Lấy tất cả các element trên canvas
     * @returns {HTMLElement[]}
     */
    getElements() {
        return Array.from(this.canvas.querySelectorAll('[data-editor-element]'));
    }

    /**
     * Snap giá trị theo grid
     * @param {number} value
     * @returns {number}
     */
    snapToGrid(value) {
        if (!this.gridEnabled) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    }
}

// Khởi tạo editor khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new Editor();
});
