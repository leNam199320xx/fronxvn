import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { Rotate } from '../../src/studio/layout/rotate.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('Rotate', () => {
  let editor;

  beforeEach(() => {
    editor = {
      selection: {
        getSelected: () => null
      },
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
    const rotate = new Rotate(editor);
    assert.doesNotThrow(() => rotate.init());
  });

  it('refresh() does nothing', () => {
    const rotate = new Rotate(editor);
    assert.doesNotThrow(() => rotate.refresh());
  });

  it('destroy() does nothing', () => {
    const rotate = new Rotate(editor);
    assert.doesNotThrow(() => rotate.destroy());
  });

  it('ignores mousedown on non-rotation-handle', () => {
    const rotate = new Rotate(editor);
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: document.createElement('div'),
      clientX: 100,
      clientY: 100
    });
    assert.isFalse(rotate.isRotating);
  });

  it('_startRotate() sets isRotating to true', () => {
    const rotate = new Rotate(editor);
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '200px';
    el.style.height = '150px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelected = () => el;
    const handle = document.createElement('div');
    handle.className = 'rotation-handle';
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: handle,
      clientX: 250,
      clientY: 100
    });
    assert.isTrue(rotate.isRotating);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_startRotate() emits rotate:start event', () => {
    const rotate = new Rotate(editor);
    let emitted = false;
    eventBus.on('rotate:start', () => { emitted = true; });
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '200px';
    el.style.height = '150px';
    CanvasAPI.getRoot().appendChild(trackElement(el));
    editor.selection.getSelected = () => el;
    const handle = document.createElement('div');
    handle.className = 'rotation-handle';
    eventBus.emit('pointer:mousedown', {
      button: 0,
      target: handle,
      clientX: 250,
      clientY: 100
    });
    assert.isTrue(emitted);
    CanvasAPI.getRoot().removeChild(el);
  });

  it('_getRotation() parses rotate from transform', () => {
    const rotate = new Rotate(editor);
    const el = document.createElement('div');
    el.style.transform = 'rotate(45deg)';
    assert.equal(rotate._getRotation(el), 45);
  });

  it('_getRotation() returns 0 for no rotation', () => {
    const rotate = new Rotate(editor);
    const el = document.createElement('div');
    el.style.transform = '';
    assert.equal(rotate._getRotation(el), 0);
  });

  it('_getRotation() returns 0 for no transform', () => {
    const rotate = new Rotate(editor);
    const el = document.createElement('div');
    assert.equal(rotate._getRotation(el), 0);
  });
});






