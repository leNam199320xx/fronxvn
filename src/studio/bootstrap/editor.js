/**
 * Editor - Module chính khởi tạo và điều phối toàn bộ ứng dụng
 * Quản lý Canvas: grid, scroll, zoom, tọa độ chuột
 */
import eventBus from '../../core/events/event-bus.js';
import CanvasAPI from '../../core/canvas/canvas-api.js';
import CoordinateSystem from '../../core/canvas/coordinate.js';
import RenderScheduler, { PRIORITY } from '../../core/render/render-scheduler.js';
import Benchmark from '../../core/render/benchmark.js';
import RenderProfiler from '../../core/render/render-profiler.js';
import { KeyboardShortcuts } from '../../studio/layout/keyboard-shortcuts.js';
import { Selection } from '../../studio/layout/selection.js';
import { Overlay } from '../../studio/layout/overlay.js';
import { Drag } from '../../studio/layout/drag.js';
import { Resize } from '../../studio/layout/resize.js';
import { Rotate } from '../../studio/layout/rotate.js';
import { PropertyPanel } from '../../studio/inspector/index.js';
import { ElementPanel } from '../../studio/panels/element-panel.js';
import { LayerPanel } from '../../studio/panels/layer-panel.js';
import { History } from '../../studio/layout/history.js';
import { ContextMenu } from '../../studio/panels/ui/context-menu.js';
import { Clipboard } from '../../studio/layout/clipboard.js';
import { Alignment } from '../../studio/layout/alignment.js';
import { PageManager } from '../../core/page-manager/index.js';
import { ExportManager } from '../../core/export/index.js';
import { ProjectManager } from '../../core/project/index.js';
import { TemplateManager } from '../../studio/assets/templates/index.js';
import { BreakpointManager } from '../../studio/layout/breakpoint-manager.js';
import { GroupManager } from '../../studio/layout/group-manager.js';
import { QualityEngine } from '../../core/quality/index.js';
import { QualityPanel } from '../../studio/panels/quality-panel.js';
import { ComponentManager } from '../../core/components/index.js';
import { ComponentPanel } from '../../studio/panels/component-panel.js';
import { ThemeManager } from '../../studio/panels/theme-panel.js';
import { showNotification } from '../../studio/panels/ui/toast.js';
import { ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, GRID_ENABLED_DEFAULT, GRID_SIZE, CANVAS_INNER_PADDING } from '../../core/utilities/config.js';

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

        this.componentManager = new ComponentManager(this);
        this.componentPanel   = new ComponentPanel(this);

        this.themeManager = new ThemeManager(this);

        this.keyboardShortcuts = new KeyboardShortcuts(this);
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
            if (this.projectManager._clearAutoSaveTimer) {
                this.projectManager._clearAutoSaveTimer();
            }
            this.history.clear();
            this.pageManager.loadPages([]);
            this.canvas.innerHTML = '';
            this.projectMeta.title = projectName;
            document.title = `${projectName} — HTML Visual Editor`;
            this.selection.deselectAll();
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
        this._onPointerMouseMove = (data) => {
            const { x, y } = CoordinateSystem.mousePosition(data);
            const rx = Math.round(x);
            const ry = Math.round(y);
            RenderScheduler.schedule('coords-display', () => {
                this.coordsDisplay.textContent = `X: ${rx}  Y: ${ry}`;
            }, PRIORITY.NORMAL);
            eventBus.emit('canvas:mousemove', { x: rx, y: ry, clientX: data.clientX, clientY: data.clientY });
        };

        this._onWheel = (data) => {
            if (data.ctrlKey) {
                if (data.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        };

        // Scroll event
        this._onCanvasScroll = () => {
            if (!this.canvasContainer) return;
            eventBus.emit('canvas:scroll', {
                scrollLeft: this.canvasContainer.scrollLeft,
                scrollTop: this.canvasContainer.scrollTop
            });
        };

        // Window resize
        this._onWindowResize = () => {
            eventBus.emit('canvas:resize');
        };

        // Space key: kích hoạt PanMode
        this._onKeyDown = (e) => {
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
        };

        this._onKeyUp = (e) => {
            if (e.code === 'Space') {
                this.isPanning = false;
                this._panMouseActive = false;
                this.canvasWrapper.style.cursor = '';
            }
        };

        eventBus.on('pointer:mousemove', this._onPointerMouseMove);
        eventBus.on('wheel', this._onWheel);

        this.canvasContainer.addEventListener('scroll', this._onCanvasScroll);
        window.addEventListener('resize', this._onWindowResize);
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);

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

    /** Release DOM event listeners and canvas resources. */
    _cleanupResources() {
        if (this._onPointerMouseMove) {
            eventBus.off('pointer:mousemove', this._onPointerMouseMove);
        }
        if (this._onWheel) {
            eventBus.off('wheel', this._onWheel);
        }
        if (this._onCanvasScroll) {
            this.canvasContainer.removeEventListener('scroll', this._onCanvasScroll);
        }
        if (this._onWindowResize) {
            window.removeEventListener('resize', this._onWindowResize);
        }
        if (this._onKeyDown) {
            document.removeEventListener('keydown', this._onKeyDown);
        }
        if (this._onKeyUp) {
            document.removeEventListener('keyup', this._onKeyUp);
        }
        CanvasAPI.dispose();
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
        if (!this.zoomDisplay) return;
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

