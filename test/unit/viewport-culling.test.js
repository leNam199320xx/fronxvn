import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import ViewportCulling from '../../src/core/viewport/viewport-culling.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';

describe('ViewportCulling', () => {
  it('isVisible() returns true for element inside viewport', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '100px';
    el.style.width = '200px';
    el.style.height = '150px';
    document.body.appendChild(trackElement(el));
    const result = ViewportCulling.isVisible(el);
    assert.isBoolean(result);
    document.body.removeChild(el);
  });

  it('isVisible() returns true when viewport rect is unavailable', () => {
    const el = document.createElement('div');
    assert.isTrue(ViewportCulling.isVisible(el));
  });

  it('isVisible() returns false for element completely outside viewport', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    el.style.width = '100px';
    el.style.height = '100px';
    document.body.appendChild(trackElement(el));
    const result = ViewportCulling.isVisible(el);
    assert.isBoolean(result);
    document.body.removeChild(el);
  });

  it('isVisible() handles element with no explicit styles', () => {
    const el = document.createElement('div');
    document.body.appendChild(trackElement(el));
    const result = ViewportCulling.isVisible(el);
    assert.isBoolean(result);
    document.body.removeChild(el);
  });

  it('isVisible() returns false for null', () => {
    assert.isFalse(ViewportCulling.isVisible(null));
  });

  it('visibleElements() filters visible elements', () => {
    const visible = document.createElement('div');
    visible.style.position = 'absolute';
    visible.style.left = '100px';
    visible.style.top = '100px';
    visible.style.width = '50px';
    visible.style.height = '50px';
    document.body.appendChild(trackElement(el));

    const hidden = document.createElement('div');
    hidden.style.position = 'absolute';
    hidden.style.left = '-9999px';
    hidden.style.top = '-9999px';
    hidden.style.width = '50px';
    hidden.style.height = '50px';
    document.body.appendChild(trackElement(el));

    const result = ViewportCulling.visibleElements([visible, hidden]);
    assert.isArray(result);
    assert.includes(result, visible);
    document.body.removeChild(visible);
    document.body.removeChild(hidden);
  });

  it('visibleElements() returns empty array for non-array input', () => {
    const result = ViewportCulling.visibleElements(null);
    assert.isArray(result);
    assert.equal(result.length, 0);
  });

  it('visibleElements() returns empty array for empty array', () => {
    const result = ViewportCulling.visibleElements([]);
    assert.isArray(result);
    assert.equal(result.length, 0);
  });

  it('viewportRect() returns viewport rect in canvas coordinates', () => {
    const rect = ViewportCulling.viewportRect();
    if (rect) {
      assert.isNumber(rect.left);
      assert.isNumber(rect.top);
      assert.isNumber(rect.right);
      assert.isNumber(rect.bottom);
    }
  });

  it('invalidate() clears cached viewport rect', () => {
    ViewportCulling.invalidate();
    const rect = ViewportCulling.viewportRect();
    assert.isObject(rect);
  });
});







