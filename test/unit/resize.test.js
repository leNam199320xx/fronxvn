import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { Resize } from '../../src/studio/layout/resize.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('Resize', () => {
  let editor;

  beforeEach(() => {
    editor = {
      selection: {
        getSelected: () => null
      },
      isPanning: false,
      gridEnabled: false,
      snapToGrid: (v) => v,
      breakpointManager: {
        setStyle: () => {}
      }
    };
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('init() does nothing', () => {
    const resize = new Resize(editor);
    assert.doesNotThrow(() => resize.init());
  });

  it('refresh() does nothing', () => {
    const resize = new Resize(editor);
    assert.doesNotThrow(() => resize.refresh());
  });

  it('destroy() does nothing', () => {
    const resize = new Resize(editor);
    assert.doesNotThrow(() => resize.destroy());
  });

  it('ignores middle button mousedown', () => {
    const resize = new Resize(editor);
    eventBus.emit('pointer:mousedown', { button: 1, target: document.createElement('div') });
    assert.isFalse(resize.isResizing);
  });

  it('ignores mousedown on non-resize-handle', () => {
    const resize = new Resize(editor);
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: document.createElement('div'),
      clientX: 100,
      clientY: 100
    });
    assert.isFalse(resize.isResizing);
  });

  it('_startResize() sets isResizing to true', () => {
    const resize = new Resize(editor);
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '200px';
    el.style.height = '150px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelected = () => el;
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.dataset.handle = 'se';
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: handle,
      clientX: 300,
      clientY: 250
    });
    assert.isTrue(resize.isResizing);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_startResize() stores start rect', () => {
    const resize = new Resize(editor);
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '200px';
    el.style.height = '150px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelected = () => el;
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.dataset.handle = 'se';
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: handle,
      clientX: 300,
      clientY: 250
    });
    assert.equal(resize.startRect.left, 100);
    assert.equal(resize.startRect.top, 100);
    assert.equal(resize.startRect.width, 200);
    assert.equal(resize.startRect.height, 150);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_getCursor() returns correct cursor for handle', () => {
    const resize = new Resize(editor);
    assert.equal(resize._getCursor('se'), 'se-resize');
    assert.equal(resize._getCursor('n'), 'n-resize');
    assert.equal(resize._getCursor('w'), 'w-resize');
    assert.equal(resize._getCursor('invalid'), 'default');
  });
});






