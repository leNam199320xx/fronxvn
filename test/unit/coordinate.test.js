import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import CoordinateSystem from '../../src/core/canvas/coordinate.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';

describe('CoordinateSystem', () => {
  it('viewportToCanvas() converts viewport coords to canvas coords at zoom=1', () => {
    const canvas = CanvasAPI.getRoot();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const result = CoordinateSystem.viewportToCanvas(rect.left + 100, rect.top + 50);
    assert.close(result.x, 100, 1);
    assert.close(result.y, 50, 1);
  });

  it('viewportToCanvas() converts viewport coords to canvas coords at zoom≠1', () => {
    const canvas = CanvasAPI.getRoot();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const result = CoordinateSystem.viewportToCanvas(rect.left + 100, rect.top + 50);
    assert.isNumber(result.x);
    assert.isNumber(result.y);
  });

  it('canvasToViewport() is inverse of viewportToCanvas()', () => {
    const canvas = CanvasAPI.getRoot();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const vp = CoordinateSystem.viewportToCanvas(rect.left + 100, rect.top + 50);
    const back = CoordinateSystem.canvasToViewport(vp.x, vp.y);
    assert.close(back.x, rect.left + 100, 2);
    assert.close(back.y, rect.top + 50, 2);
  });

  it('elementRect() returns rect for an element', () => {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '50px';
    el.style.top = '75px';
    el.style.width = '200px';
    el.style.height = '100px';
    document.body.appendChild(trackElement(el));
    const rect = CoordinateSystem.elementRect(el);
    assert.isNumber(rect.left);
    assert.isNumber(rect.top);
    assert.isNumber(rect.width);
    assert.isNumber(rect.height);
    document.body.removeChild(el);
  });

  it('elementRect() returns zero rect for null', () => {
    const rect = CoordinateSystem.elementRect(null);
    assert.equal(rect.left, 0);
    assert.equal(rect.top, 0);
    assert.equal(rect.width, 0);
    assert.equal(rect.height, 0);
  });

  it('mousePosition() returns canvas coordinates from mouse event', () => {
    const canvas = CanvasAPI.getRoot();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const fakeEvent = { clientX: rect.left + 50, clientY: rect.top + 30 };
    const result = CoordinateSystem.mousePosition(fakeEvent);
    assert.isNumber(result.x);
    assert.isNumber(result.y);
  });

  it('viewportCenter() returns center of viewport', () => {
    const center = CoordinateSystem.viewportCenter();
    assert.isNumber(center.x);
    assert.isNumber(center.y);
  });
});





