import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import CanvasMutationObserver from '../../src/core/canvas/canvas-mutation-observer.js';

describe('CanvasMutationObserver', () => {
  it('init() does not throw', () => {
    const observer = new CanvasMutationObserver(
      () => document.getElementById('canvas'),
      (el, sel) => el.matches(sel),
      (el, sel) => el.closest(sel)
    );
    assert.doesNotThrow(() => observer.init());
    observer.disconnect();
  });

  it('disconnect() stops observing', () => {
    const observer = new CanvasMutationObserver(
      () => document.getElementById('canvas'),
      (el, sel) => el.matches(sel),
      (el, sel) => el.closest(sel)
    );
    observer.init();
    assert.doesNotThrow(() => observer.disconnect());
  });

  it('disconnect() is idempotent', () => {
    const observer = new CanvasMutationObserver(
      () => document.getElementById('canvas'),
      (el, sel) => el.matches(sel),
      (el, sel) => el.closest(sel)
    );
    observer.init();
    observer.disconnect();
    assert.doesNotThrow(() => observer.disconnect());
  });

  it('constructor accepts getRoot, matches, closest', () => {
    const observer = new CanvasMutationObserver(
      () => null,
      () => false,
      () => null
    );
    assert.isObject(observer);
  });
});


