/**
 * Editor - Module chính khởi tạo và điều phối toàn bộ ứng dụng
 * Quản lý Canvas: grid, scroll, zoom, tọa độ chuột
 */
import eventBus from './event-bus.js';
import CanvasAPI from './canvas/canvas-api.js';
import CoordinateSystem from './canvas/coordinate.js';
import RenderScheduler, { PRIORITY } from './core/render-scheduler.js';
import Benchmark from './core/benchmark.js';
import RenderProfiler from './core/render-profiler.js';
import {
    ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP,
    GRID_SIZE, GRID_ENABLED_DEFAULT,
    ARROW_NUDGE, ARROW_NUDGE_SHIFT,
    HISTORY_MAX_SIZE, PASTE_OFFSET,
    AUTOSAVE_DELAY_MS, AUTOLOAD_DELAY_MS,
    AUTOSAVE_STORAGE_KEY, PROJECT_VERSION,
    CANVAS_INNER_PADDING,
    BREAKPOINT_LABEL_TABLET, BREAKPOINT_LABEL_MOBILE
} from './config.js';
import { Selection } from './selection.js';
import { Overlay } from './overlay.js';
import { Drag } from './drag.js';
import { Resize } from './resize.js';
import { Rotate } from './rotate.js';
import { PropertyPanel } from './property-panel/index.js';
import { ElementPanel } from './element-panel.js';
import { LayerPanel } from './layer-panel.js';
import { History } from './history.js';
import { ContextMenu } from './ui/context-menu.js';
import { Clipboard } from './clipboard.js';
import { Alignment } from './alignment.js';
import { PageManager } from './page-manager/index.js';
import { ExportManager } from './export/index.js';
import { ProjectManager } from './project/index.js';
import { TemplateManager } from './templates/index.js';
import { BreakpointManager } from './breakpoint-manager.js';
import { GroupManager } from './group-manager.js';
import { QualityEngine } from './quality/index.js';
import { QualityPanel } from './quality-panel.js';
import { ComponentManager } from './components/index.js';
import { ComponentPanel } from './component-panel.js';
import { ThemeManager } from './theme-manager.js';
import { showNotification } from './ui/toast.js';

class Editor {
    constructor() {
        // DOM references
        this.canvasWrapper = document.getElementById('canvas-wrapper');
        this.canvasContainer = document.getElementById('canvas-container');
        this.canvas = CanvasAPI.getRoot();
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
        this._initModules();
        this._initTabs();
        this._bindEvents();
        this._initProjectName();

        // Căn giữa canvas sau khi tất cả modules load xong
        requestAnimationFrame(() => {
            this.setZoom(this.zoom); // trigger inner min-height
            this._centerCanvas();
        });
    }

    /** Khởi tạo canvas */
    _initCanvas() {
        this._updateZoomDisplay();
    }

    /** Scroll canvas-container để canvas nằm ở giữa viewport */
    _centerCanvas() {
        const container = this.canvasContainer;
        const canvas    = this.canvas;
        if (!container || !canvas) return;

        // scrollLeft/Top để canvas nằm giữa container
        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const innerW     = container.scrollWidth;
        const innerH     = container.scrollHeight;

        // Chỉ scroll nếu nội dung lớn hơn container
        if (innerW > containerW) {
            container.scrollLeft = (innerW - containerW) / 2;
        }
        if (innerH > containerH) {
            container.scrollTop  = (innerH - containerH) / 2;
        }
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

        // New Project
        document.getElementById('btn-new-project').addEventListener('click', () => {
            if (!confirm('Create new project? Unsaved changes will be lost.')) return;
            const name = prompt('Project name:', 'My Project');
            if (name === null) return;
            const projectName = (name || 'My Project').trim();
            this.projectManager.clearAutoSave();
            this.history.clear();
            this.pageManager.loadPages([]);
            this.canvas.innerHTML = '';
            this.projectMeta.title = projectName;
            document.title = `${projectName} — HTML Visual Editor`;
            eventBus.emit('selection:deselect-all');
            eventBus.emit('overlay:clear');
            eventBus.emit('layer:refresh');
            eventBus.emit('project:meta-updated', { title: projectName });
            showNotification(`New project "${projectName}" created.`);
        });

        // Viewport / Breakpoint switcher
        const bpButtons = document.querySelectorAll('#viewport-switcher [data-bp]');
        const viewportLabel = document.getElementById('viewport-label');
        bpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const bp = btn.dataset.bp;
                bpButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                viewportLabel.textContent = { desktop: 'Desktop', tablet: BREAKPOINT_LABEL_TABLET, mobile: BREAKPOINT_LABEL_MOBILE }[bp];
                this.canvasWrapper.classList.remove('bp-tablet', 'bp-mobile');
                if (bp !== 'desktop') this.canvasWrapper.classList.add(`bp-${bp}`);
                this.canvas.classList.remove('bp-tablet', 'bp-mobile');
                if (bp !== 'desktop') this.canvas.classList.add(`bp-${bp}`);
                eventBus.emit('breakpoint:switch', bp);
            });
        });

        // Listen for breakpoint changes (e.g. from other sources)
        eventBus.on('breakpoint:changed', (bp) => {
            bpButtons.forEach(b => b.classList.toggle('active', b.dataset.bp === bp));
            viewportLabel.textContent = { desktop: 'Desktop', tablet: BREAKPOINT_LABEL_TABLET, mobile: BREAKPOINT_LABEL_MOBILE }[bp];
            this.canvas.classList.remove('bp-tablet', 'bp-mobile');
            if (bp !== 'desktop') this.canvas.classList.add(`bp-${bp}`);
        });

        // Fullscreen
        const btnFullscreen = document.getElementById('btn-fullscreen');
        const editorMain = document.querySelector('.editor-main');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                    editorMain?.classList.add('fullscreen');
                    btnFullscreen.classList.add('active');
                } else {
                    document.exitFullscreen().catch(() => {});
                    editorMain?.classList.remove('fullscreen');
                    btnFullscreen.classList.remove('active');
                }
            });
        }

        // Vertical toolbars
        this._initVerticalToolbars();
    }

    /** Khởi tạo vertical icon toolbars + floating panels */
    _initVerticalToolbars() {
        const leftToolbar = document.getElementById('toolbar-left');
        const rightToolbar = document.getElementById('toolbar-right');
        const panelLeft = document.getElementById('panel-left');
        const panelRight = document.getElementById('panel-right');

        if (!leftToolbar || !rightToolbar) return;

        const leftIcons = leftToolbar.querySelectorAll('.toolbar-icon');
        const rightIcons = rightToolbar.querySelectorAll('.toolbar-icon');

        const panelBody = panelRight;
        const panelHeader = panelRight ? panelRight.querySelector('.panel-section-header') : null;

        const renderers = {
            elements: () => this.elementPanel._render(),
            templates: () => this.templateManager._render(),
            layers: () => this.layerPanel._render(),
            theme: () => this.themeManager._render(),
            quality: () => this.qualityPanel._render(),
            components: () => this.componentPanel._render()
        };

        const switchRightPanel = (icons) => {
            icons.forEach(icon => {
                icon.addEventListener('click', () => {
                    const isActive = icon.classList.contains('active');
                    icons.forEach(i => i.classList.remove('active'));
                    panelRight.classList.remove('visible');

                    if (!isActive) {
                        icon.classList.add('active');
                        panelRight.classList.add('visible');
                        const source = icon.dataset.panel;
                        if (panelHeader && source) {
                            const label = icon.getAttribute('title') || source;
                            panelHeader.innerHTML = `${label} <span class="arrow">▼</span>`;
                        }
                        if (panelBody && renderers[source]) {
                            panelBody.innerHTML = '';
                            renderers[source]();
                        }
                        eventBus.emit('toolbar:panel:open', { panel: 'right', source: icon.dataset.panel });
                    } else {
                        eventBus.emit('toolbar:panel:close', { panel: 'right' });
                    }
                });
            });
        };

        // Left toolbar: properties shows/hides left panel, layers/components open right panel
        leftIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const panel = icon.dataset.panel;
                if (panel === 'properties') {
                    const isActive = icon.classList.contains('active');
                    if (isActive) {
                        icon.classList.remove('active');
                        panelLeft.classList.remove('visible');
                    } else {
                        leftIcons.forEach(i => i.classList.remove('active'));
                        icon.classList.add('active');
                        panelLeft.classList.add('visible');
                    }
                } else if (renderers[panel]) {
                    rightIcons.forEach(i => i.classList.remove('active'));
                    icon.classList.add('active');
                    panelRight.classList.add('visible');
                    if (panelHeader) {
                        const label = icon.getAttribute('title') || panel;
                        panelHeader.innerHTML = `${label} <span class="arrow">▼</span>`;
                    }
                    if (panelBody) {
                        panelBody.innerHTML = '';
                        renderers[panel]();
                    }
                }
            });
        });

        switchRightPanel(rightIcons);

        // Sync initial visibility from active toolbar icons
        const activeLeftIcon = leftToolbar.querySelector('.toolbar-icon.active');
        if (activeLeftIcon) {
            const panel = activeLeftIcon.dataset.panel;
            if (panel === 'properties') {
                panelLeft.classList.add('visible');
            } else if (renderers[panel]) {
                panelRight.classList.add('visible');
                if (panelHeader) {
                    panelHeader.innerHTML = `${activeLeftIcon.getAttribute('title') || panel} <span class="arrow">▼</span>`;
                }
                if (panelBody) {
                    panelBody.innerHTML = '';
                    renderers[panel]();
                }
            }
        }

        // Close panels when clicking canvas
        eventBus.on('pointer:mousedown', () => {
            leftIcons.forEach(i => i.classList.remove('active'));
            rightIcons.forEach(i => i.classList.remove('active'));
            panelLeft.classList.remove('visible');
            panelRight.classList.remove('visible');
        });
    }

    /** Hiển thị tên project trên toolbar, cho phép click để rename */
    _initProjectName() {
        const projectNameEl = document.getElementById('project-name');
        if (!projectNameEl) return;

        const updateName = (name) => {
            projectNameEl.textContent = name || 'Untitled Project';
            this.projectMeta.title = name || 'Untitled Project';
            document.title = `${this.projectMeta.title} — HTML Visual Editor`;
        };

        updateName(this.projectMeta.title || 'My Project');

        projectNameEl.addEventListener('click', () => {
            const current = this.projectMeta.title || '';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'project-name-input';
            input.value = current;
            input.placeholder = 'Project name';

            projectNameEl.replaceWith(input);
            input.focus();
            input.select();

            const commit = () => {
                const newName = input.value.trim() || 'Untitled Project';
                updateName(newName);
                eventBus.emit('project:meta-updated', { title: newName });
                input.replaceWith(projectNameEl);
                projectNameEl.textContent = newName;
            };

            input.addEventListener('blur', commit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                }
                if (e.key === 'Escape') {
                    input.value = current;
                    input.blur();
                }
            });
        });

        eventBus.on('project:meta-updated', (meta) => {
            if (meta && meta.title) {
                updateName(meta.title);
                projectNameEl.textContent = meta.title;
            }
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
                const target = document.querySelector(`[data-tab-content="${tabName}"]`);
                if (target) target.classList.add('active');
                eventBus.emit('tab:switch', tabName);
            });
        });
    }

    /** Bindcác sự kiện chính */
    _bindEvents() {
        eventBus.on('pointer:mousemove', (data) => {
            const { x, y } = CoordinateSystem.mousePosition(data);
            const rx = Math.round(x);
            const ry = Math.round(y);
            RenderScheduler.schedule('coords-display', () => {
                this.coordsDisplay.textContent = `X: ${rx}  Y: ${ry}`;
            }, PRIORITY.NORMAL);
            eventBus.emit('canvas:mousemove', { x: rx, y: ry, clientX: data.clientX, clientY: data.clientY });
        });

        eventBus.on('wheel', (data) => {
            if (data.ctrlKey) {
                if (data.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        });

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
                const iframeCE = e._isIframeContentEditable;
                if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable || iframeCE) return;
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

        eventBus.on('pointer:mousedown', (data) => {
            if (this.isPanning && data.button === 0) {
                this._panMouseActive = true;
                this.panStartX = data.clientX;
                this.panStartY = data.clientY;
                this.canvasWrapper.style.cursor = 'grabbing';
            }
            if (data.button === 1) {
                this.isPanning = true;
                this._panMouseActive = true;
                this.panStartX = data.clientX;
                this.panStartY = data.clientY;
                this.canvasWrapper.style.cursor = 'grabbing';
            }
        });

        eventBus.on('pointer:mousemove', (data) => {
            if (this._panMouseActive) {
                const dx = data.clientX - this.panStartX;
                const dy = data.clientY - this.panStartY;
                this.canvasContainer.scrollLeft -= dx;
                this.canvasContainer.scrollTop -= dy;
                this.panStartX = data.clientX;
                this.panStartY = data.clientY;
            }
        });

        eventBus.on('pointer:mouseup', (data) => {
            if (this._panMouseActive && data.button === 0) {
                this._panMouseActive = false;
                if (this.isPanning) this.canvasWrapper.style.cursor = 'grab';
            }
            if (this._panMouseActive && data.button === 1) {
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
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || e._isIframeContentEditable) {
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
            const amount = shift ? ARROW_NUDGE_SHIFT : ARROW_NUDGE;
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
        this.setZoom(ZOOM_DEFAULT);
    }

    /** Set zoom level */
    setZoom(level) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.zoom = Math.round(this.zoom * 100) / 100;

        // Scale canvas trực tiếp, transform-origin: center center
        this.canvas.style.transform       = `scale(${this.zoom})`;
        this.canvas.style.transformOrigin = 'center center';

        // Cập nhật kích thước inner wrapper để scroll area bao đủ canvas sau scale
        const inner = document.getElementById('canvas-inner');
        if (inner) {
            const scaledW = this.canvas.offsetWidth  * this.zoom;
            const scaledH = this.canvas.offsetHeight * this.zoom;
            inner.style.minWidth  = `${scaledW + CANVAS_INNER_PADDING}px`;
            inner.style.minHeight = `${scaledH + CANVAS_INNER_PADDING}px`;
        }

        this._updateZoomDisplay();
        this._centerCanvas();
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
        return CoordinateSystem.mousePosition(e);
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
document.addEventListener('DOMContentLoaded', async () => {
    await CanvasAPI.init();
    window.editor = new Editor();
    window.benchmark = Benchmark;
    window.profiler = RenderProfiler;
});
