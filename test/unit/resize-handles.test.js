import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import { ResizeHandles } from '../../src/core/overlay/resize-handles.js';

describe('ResizeHandles', () => {
  it('constructor creates 8 resize handles', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    assert.equal(Object.keys(handles.handles).length, 8);
    assert.includes(Object.keys(handles.handles), 'nw');
    assert.includes(Object.keys(handles.handles), 'n');
    assert.includes(Object.keys(handles.handles), 'ne');
    assert.includes(Object.keys(handles.handles), 'e');
    assert.includes(Object.keys(handles.handles), 'se');
    assert.includes(Object.keys(handles.handles), 's');
    assert.includes(Object.keys(handles.handles), 'sw');
    assert.includes(Object.keys(handles.handles), 'w');
  });

  it('each handle has correct class names', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    assert.includes(handles.handles['nw'].className, 'resize-handle');
    assert.includes(handles.handles['nw'].className, 'nw');
    assert.includes(handles.handles['se'].className, 'resize-handle');
    assert.includes(handles.handles['se'].className, 'se');
  });

  it('each handle has display:none initially', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    Object.values(handles.handles).forEach(h => {
      assert.equal(h.style.display, 'none');
    });
  });

  it('each handle is appended to selectionBox', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    assert.equal(selectionBox.children.length, 8);
  });

  it('setVisible(true) shows all handles', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    handles.setVisible(true);
    Object.values(handles.handles).forEach(h => {
      assert.equal(h.style.display, 'block');
    });
  });

  it('setVisible(false) hides all handles', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    handles.setVisible(true);
    handles.setVisible(false);
    Object.values(handles.handles).forEach(h => {
      assert.equal(h.style.display, 'none');
    });
  });

  it('init() does nothing', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    assert.doesNotThrow(() => handles.init());
  });

  it('refresh() does nothing', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    assert.doesNotThrow(() => handles.refresh());
  });

  it('destroy() does nothing', () => {
    const selectionBox = document.createElement('div');
    const handles = new ResizeHandles(selectionBox);
    assert.doesNotThrow(() => handles.destroy());
  });
});


