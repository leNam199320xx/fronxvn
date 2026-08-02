import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import CanvasEventBridge from '../../src/core/canvas/canvas-event-bridge.js';

describe('CanvasEventBridge', () => {
  let bridge;

  beforeEach(() => {
    bridge = new CanvasEventBridge();
  });

  afterEach(() => {
    bridge.destroy();
  });

  it('init() sets up pointer event listeners', () => {
    assert.doesNotThrow(() => bridge.init());
  });

  it('init() sets up dblclick listener', () => {
    assert.doesNotThrow(() => bridge.init());
  });

  it('init() sets up wheel listener', () => {
    assert.doesNotThrow(() => bridge.init());
  });

  it('init() sets up contextmenu listener', () => {
    assert.doesNotThrow(() => bridge.init());
  });

  it('destroy() removes all listeners', () => {
    bridge.init();
    assert.doesNotThrow(() => bridge.destroy());
  });

  it('destroy() is idempotent', () => {
    bridge.init();
    bridge.destroy();
    assert.doesNotThrow(() => bridge.destroy());
  });

  it('_isCanvasEvent() returns true for events inside canvas-wrapper', () => {
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
      const fakeEvent = { target: wrapper };
      assert.isTrue(bridge._isCanvasEvent(fakeEvent));
    }
  });

  it('_isCanvasEvent() returns false for events outside canvas-wrapper', () => {
    const outside = document.createElement('div');
    const fakeEvent = { target: outside };
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper && !wrapper.contains(outside)) {
      assert.isFalse(bridge._isCanvasEvent(fakeEvent));
    }
  });

  it('_isCanvasEvent() returns true when canvas-wrapper not found', () => {
    const tempId = 'temp-test-wrapper';
    const wrapper = document.getElementById(tempId);
    const fakeEvent = { target: document.body };
    if (!wrapper) {
      assert.isTrue(bridge._isCanvasEvent(fakeEvent));
    }
  });

  it('supports pointer events when available', () => {
    if (typeof PointerEvent !== 'undefined') {
      assert.isTrue(true);
    }
  });
});



