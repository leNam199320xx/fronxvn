import * as assert from '../assert.js';
import { describe, it, beforeEach } from '../assert.js';
import { SelectionHitTest } from '../../src/core/selection/selection-hit-test.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';

describe('SelectionHitTest', () => {
  let hitTest;

  beforeEach(() => {
    hitTest = new SelectionHitTest();
  });

  it('init() does nothing', () => {
    assert.doesNotThrow(() => hitTest.init());
  });

  it('refresh() does nothing', () => {
    assert.doesNotThrow(() => hitTest.refresh());
  });

  it('destroy() does nothing', () => {
    assert.doesNotThrow(() => hitTest.destroy());
  });

  it('getElementFromEvent() returns element with data-editor-element', () => {
    const canvas = CanvasAPI.getRoot();
    const el = document.createElement('div');
    el.setAttribute('data-editor-element', '');
    canvas.appendChild(trackElement(el));
    const fakeEvent = { target: el };
    const result = hitTest.getElementFromEvent(fakeEvent, canvas);
    assert.equal(result, el);
    canvas.removeChild(el);
  });

  it('getElementFromEvent() returns null for non-editor element', () => {
    const canvas = CanvasAPI.getRoot();
    const el = document.createElement('div');
    canvas.appendChild(trackElement(el));
    const fakeEvent = { target: el };
    const result = hitTest.getElementFromEvent(fakeEvent, canvas);
    assert.null(result);
  });

  it('getElementFromEvent() returns null when target is not in root', () => {
    const canvas = CanvasAPI.getRoot();
    const outside = document.createElement('div');
    const fakeEvent = { target: outside };
    const result = hitTest.getElementFromEvent(fakeEvent, canvas);
    assert.null(result);
  });

  it('getElementFromEvent() returns null for null target', () => {
    const canvas = CanvasAPI.getRoot();
    const fakeEvent = { target: null };
    const result = hitTest.getElementFromEvent(fakeEvent, canvas);
    assert.null(result);
  });

  it('closest() traverses up to find data-editor-element', () => {
    const canvas = CanvasAPI.getRoot();
    const wrapper = document.createElement('div');
    const el = document.createElement('div');
    el.setAttribute('data-editor-element', '');
    wrapper.appendChild(el);
    canvas.appendChild(trackElement());
    const fakeEvent = { target: el };
    const result = hitTest.getElementFromEvent(fakeEvent, canvas);
    assert.equal(result, el);
    canvas.removeChild(wrapper);
  });
});





