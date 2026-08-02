import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { Drag } from '../../src/studio/layout/drag.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('Drag', () => {
  let editor;

  beforeEach(() => {
    editor = {
      selection: {
        getSelected: () => null,
        getSelectedAll: () => [],
        isSelected: () => false
      },
      gridEnabled: false,
      snapToGrid: (v) => v,
      getElements: () => [],
      overlayLayer: document.createElement('div'),
      canvas: CanvasAPI.getRoot(),
      isPanning: false,
      breakpointManager: {
        setStyle: () => {}
      }
    };
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('init() does nothing', () => {
    const drag = new Drag(editor);
    assert.doesNotThrow(() => drag.init());
  });

  it('refresh() does nothing', () => {
    const drag = new Drag(editor);
    assert.doesNotThrow(() => drag.refresh());
  });

  it('destroy() does nothing', () => {
    const drag = new Drag(editor);
    assert.doesNotThrow(() => drag.destroy());
  });

  it('ignores middle button mousedown', () => {
    const drag = new Drag(editor);
    let dragStarted = false;
    eventBus.on('drag:start', () => { dragStarted = true; });
    eventBus.emit('pointer:mousedown', { button: 1, target: document.createElement('div') });
    assert.isFalse(dragStarted);
  });

  it('_startDrag() sets isDragging to true', () => {
    const drag = new Drag(editor);
    const el = document.createElement('div');
    el.setAttribute('data-editor-element', '');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '50px';
    el.style.height = '50px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelectedAll = () => [el];
    editor.selection.isSelected = () => true;
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: el,
      clientX: 110,
      clientY: 110,
      shiftKey: false
    });
    assert.isTrue(drag.isDragging);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_startRubberBand() sets isRubberBanding to true', () => {
    const drag = new Drag(editor);
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: document.createElement('div'),
      clientX: 100,
      clientY: 100,
      shiftKey: false
    });
    assert.isTrue(drag.isRubberBanding);
  });

  it('_startDrag() emits drag:start event', () => {
    const drag = new Drag(editor);
    let emitted = false;
    eventBus.on('drag:start', () => { emitted = true; });
    const el = document.createElement('div');
    el.setAttribute('data-editor-element', '');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '50px';
    el.style.height = '50px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelectedAll = () => [el];
    editor.selection.isSelected = () => true;
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: el,
      clientX: 110,
      clientY: 110,
      shiftKey: false
    });
    assert.isTrue(emitted);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_handleDragMove() applies drag delta', () => {
    const drag = new Drag(editor);
    const el = document.createElement('div');
    el.setAttribute('data-editor-element', '');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '50px';
    el.style.height = '50px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelectedAll = () => [el];
    editor.selection.isSelected = () => true;
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: el,
      clientX: 110,
      clientY: 110,
      shiftKey: false
    });
    eventBus.emit('pointer:mousemove', {
      clientX: 120,
      clientY: 120,
      button: 0
    });
    assert.isTrue(drag.isDragging);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_handleDragUp() emits drag:end event', () => {
    const drag = new Drag(editor);
    let emitted = false;
    eventBus.on('drag:end', () => { emitted = true; });
    const el = document.createElement('div');
    el.setAttribute('data-editor-element', '');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '50px';
    el.style.height = '50px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelectedAll = () => [el];
    editor.selection.isSelected = () => true;
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: el,
      clientX: 110,
      clientY: 110,
      shiftKey: false
    });
    eventBus.emit('pointer:mouseup', { button: 0 });
    assert.isTrue(emitted);
    CanvasAPI.getRoot().removeChild(el);
  });
});






