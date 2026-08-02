import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { RotateHandle } from '../../src/core/overlay/rotate-handle.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('RotateHandle', () => {
  let overlay;

  beforeEach(() => {
    overlay = {
      renderer: {
        _showRealtimeLabels: () => {},
        _scheduleHideLabels: () => {}
      }
    };
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('constructor creates rotation line element', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.isNotNull(handle.rotationLine);
    assert.equal(handle.rotationLine.className, 'rotation-line');
  });

  it('constructor creates rotation handle element', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.isNotNull(handle.rotationHandle);
    assert.equal(handle.rotationHandle.className, 'rotation-handle');
  });

  it('both elements are appended to selectionBox', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.equal(selectionBox.children.length, 2);
  });

  it('both elements have display:none initially', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.equal(handle.rotationLine.style.display, 'none');
    assert.equal(handle.rotationHandle.style.display, 'none');
  });

  it('setVisible(true) shows both elements', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    handle.setVisible(true);
    assert.equal(handle.rotationLine.style.display, 'block');
    assert.equal(handle.rotationHandle.style.display, 'block');
  });

  it('setVisible(false) hides both elements', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    handle.setVisible(true);
    handle.setVisible(false);
    assert.equal(handle.rotationLine.style.display, 'none');
    assert.equal(handle.rotationHandle.style.display, 'none');
  });

  it('init() does nothing', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.doesNotThrow(() => handle.init());
  });

  it('refresh() does nothing', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.doesNotThrow(() => handle.refresh());
  });

  it('destroy() does nothing', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.doesNotThrow(() => handle.destroy());
  });

  it('listens for rotate:start event', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    assert.isFalse(handle.isRotating);
    eventBus.emit('rotate:start');
    assert.isTrue(handle.isRotating);
  });

  it('listens for rotate:end event', () => {
    const selectionBox = document.createElement('div');
    const handle = new RotateHandle(selectionBox, overlay);
    handle.isRotating = true;
    eventBus.emit('rotate:end');
    assert.isFalse(handle.isRotating);
  });
});



