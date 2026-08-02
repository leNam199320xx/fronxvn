import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';

describe('Editor (bootstrap)', () => {
  it('CanvasAPI.init() resolves', async () => {
    assert.doesNotThrow(async () => {
      await CanvasAPI.init();
    });
  });

  it('CanvasAPI.getRoot() returns canvas element', () => {
    const root = CanvasAPI.getRoot();
    assert.notNull(root);
    assert.equal(root.id, 'canvas');
  });

  it('canvas-wrapper exists in DOM', () => {
    const wrapper = document.getElementById('canvas-wrapper');
    assert.notNull(wrapper);
  });

  it('canvas-container exists in DOM', () => {
    const container = document.getElementById('canvas-container');
    assert.notNull(container);
  });

  it('overlay-layer exists in DOM', () => {
    const layer = document.getElementById('overlay-layer');
    assert.notNull(layer);
  });

  it('canvas-inner exists in DOM', () => {
    const inner = document.getElementById('canvas-inner');
    assert.notNull(inner);
  });

  it('canvas element has show-grid class', () => {
    const canvas = document.getElementById('canvas');
    assert.includes(canvas.className, 'show-grid');
  });

  it('index.html has editor.css link', () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    let found = false;
    links.forEach(link => {
      if (link.href.includes('editor.css')) found = true;
    });
    assert.isTrue(found);
  });

  it('index.html has module script', () => {
    const scripts = document.querySelectorAll('script[type="module"]');
    assert.greaterThan(scripts.length, 0);
  });
});


