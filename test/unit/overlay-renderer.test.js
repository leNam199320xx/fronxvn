import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { OverlayRenderer } from '../../src/core/overlay/overlay-renderer.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';

describe('OverlayRenderer', () => {
  let overlay;

  beforeEach(() => {
    overlay = {
      layer: document.createElement('div'),
      selectionBox: document.createElement('div'),
      hoverBox: document.createElement('div'),
      elementLabel: document.createElement('div'),
      dimensionLabel: document.createElement('div'),
      positionLabel: document.createElement('div'),
      multiBadge: document.createElement('div'),
      rubberBand: document.createElement('div'),
      moveHandle: document.createElement('div'),
      selectedElements: [],
      _isResizing: false,
      _isMoving: false,
      _hideLabelTimer: null,
      _cachedLayerRect: null,
      handles: {}
    };
    overlay.layer.style.position = 'absolute';
    overlay.layer.style.left = '0px';
    overlay.layer.style.top = '0px';
    overlay.layer.style.width = '100px';
    overlay.layer.style.height = '100px';
    document.body.appendChild(trackElement(el));
  });

  afterEach(() => {
    document.body.removeChild(overlay.layer);
  });

  it('_showOverlay() makes selection box visible', () => {
    const renderer = new OverlayRenderer(overlay);
    overlay.selectedElements = [];
    renderer._showOverlay();
    assert.equal(overlay.selectionBox.style.display, 'block');
  });

  it('_hideOverlay() hides all overlay elements', () => {
    const renderer = new OverlayRenderer(overlay);
    overlay.selectionBox.style.display = 'block';
    renderer._hideOverlay();
    assert.equal(overlay.selectionBox.style.display, 'none');
  });

  it('_showHover() shows hover box for element', () => {
    const renderer = new OverlayRenderer(overlay);
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '50px';
    el.style.top = '50px';
    el.style.width = '100px';
    el.style.height = '80px';
    overlay.layer.appendChild(el);
    renderer._showHover(el);
    assert.equal(overlay.hoverBox.style.display, 'block');
    overlay.layer.removeChild(el);
  });

  it('_showHover() hides hover box when element is selected', () => {
    const renderer = new OverlayRenderer(overlay);
    const el = document.createElement('div');
    overlay.selectedElements = [el];
    renderer._showHover(el);
    assert.equal(overlay.hoverBox.style.display, 'none');
  });

  it('_getElementScreenRect() returns correct offset', () => {
    const renderer = new OverlayRenderer(overlay);
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = '50px';
    el.style.top = '60px';
    el.style.width = '100px';
    el.style.height = '80px';
    overlay.layer.appendChild(el);
    const rect = renderer._getElementScreenRect(el);
    assert.isNumber(rect.left);
    assert.isNumber(rect.top);
    assert.isNumber(rect.width);
    assert.isNumber(rect.height);
    overlay.layer.removeChild(el);
  });

  it('_updateElementLabel() positions label at bottom-right of box', () => {
    const renderer = new OverlayRenderer(overlay);
    const el = document.createElement('div');
    el.dataset.name = 'my-div';
    el.tagName = 'DIV';
    renderer._updateElementLabel(el, 10, 20, 100, 80);
    assert.equal(overlay.elementLabel.style.left, '110px');
    assert.equal(overlay.elementLabel.style.top, '100px');
    assert.equal(overlay.elementLabel.style.display, 'block');
    assert.equal(overlay.elementLabel.textContent, 'my-div');
  });

  it('_updateElementLabel() uses tagName when no data-name or data-type', () => {
    const renderer = new OverlayRenderer(overlay);
    const el = document.createElement('div');
    el.tagName = 'DIV';
    renderer._updateElementLabel(el, 10, 20, 100, 80);
    assert.equal(overlay.elementLabel.textContent, 'div');
  });

  it('_setHandlesVisible() toggles handle visibility', () => {
    const renderer = new OverlayRenderer(overlay);
    renderer._setHandlesVisible(true);
    assert.equal(overlay.moveHandle.style.display, 'flex');
    renderer._setHandlesVisible(false);
    assert.equal(overlay.moveHandle.style.display, 'none');
  });
});






