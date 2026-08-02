import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import CanvasHost from '../../src/core/canvas/canvas-host.js';

describe('CanvasHost', () => {
  it('is a singleton instance', () => {
    assert.isTrue(CanvasHost instanceof Object);
  });

  it('init() resolves with the host instance', async () => {
    const result = await CanvasHost.init();
    assert.equal(result, CanvasHost);
  });

  it('init() returns the same root on subsequent calls', async () => {
    const r1 = await CanvasHost.init();
    const r2 = await CanvasHost.init();
    assert.equal(r1, r2);
  });

  it('getRoot() returns the canvas element', () => {
    const root = CanvasHost.getRoot();
    assert.notNull(root);
    assert.equal(root.id, 'canvas');
  });

  it('getDocument() returns document', () => {
    assert.equal(CanvasHost.getDocument(), document);
  });

  it('getWindow() returns window', () => {
    assert.equal(CanvasHost.getWindow(), window);
  });

  it('getBody() returns document.body', () => {
    assert.equal(CanvasHost.getBody(), document.body);
  });

  it('getIframe() returns null', () => {
    assert.null(CanvasHost.getIframe());
  });

  it('_disposeResizeObserver() is a no-op', () => {
    assert.doesNotThrow(() => CanvasHost._disposeResizeObserver());
  });
});


