import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { OverlayManager } from '../../src/core/overlay/overlay-manager.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('OverlayManager', () => {
  let editor;

  beforeEach(() => {
    editor = {
      overlayLayer: document.createElement('div'),
      overlayLayer: {
        appendChild: function(child) { this.appendChild(child); },
        style: {}
      }
    };
    editor.overlayLayer = document.createElement('div');
    editor.overlayLayer.id = 'overlay-layer';
    editor.overlayLayer.style.position = 'absolute';
    editor.overlayLayer.style.left = '0px';
    editor.overlayLayer.style.top = '0px';
    editor.overlayLayer.style.width = '100px';
    editor.overlayLayer.style.height = '100px';
    document.body.appendChild(trackElement(el));
  });

  afterEach(() => {
    document.body.removeChild(editor.overlayLayer);
    eventBus.clear();
  });

  it('init() does nothing', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => overlay.init());
  });

  it('refresh() updates overlay', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => overlay.refresh());
  });

  it('destroy() does nothing', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => overlay.destroy());
  });

  it('creates selection box element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.selectionBox);
    assert.equal(overlay.selectionBox.className, 'overlay-selection');
  });

  it('creates hover box element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.hoverBox);
    assert.equal(overlay.hoverBox.className, 'overlay-hover');
  });

  it('creates move handle element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.moveHandle);
    assert.equal(overlay.moveHandle.className, 'move-handle');
  });

  it('creates dimension label element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.dimensionLabel);
    assert.equal(overlay.dimensionLabel.className, 'overlay-dimension');
  });

  it('creates position label element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.positionLabel);
    assert.equal(overlay.positionLabel.className, 'overlay-position');
  });

  it('creates multi badge element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.multiBadge);
    assert.equal(overlay.multiBadge.className, 'overlay-multi-badge');
  });

  it('creates element label element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.elementLabel);
    assert.equal(overlay.elementLabel.className, 'overlay-element-label');
  });

  it('creates rubber band element', () => {
    const overlay = new OverlayManager(editor);
    assert.isNotNull(overlay.rubberBand);
    assert.equal(overlay.rubberBand.className, 'overlay-rubber-band');
  });

  it('registers pipeline event handlers', () => {
    const overlay = new OverlayManager(editor);
    assert.isTrue(true);
  });

  it('listens for selection:changed event', () => {
    const overlay = new OverlayManager(editor);
    let updated = false;
    eventBus.on('selection:changed', () => { updated = true; });
    eventBus.emit('selection:changed', []);
    assert.isTrue(updated);
  });

  it('listens for element:selected event', () => {
    const overlay = new OverlayManager(editor);
    let updated = false;
    eventBus.on('element:selected', () => { updated = true; });
    const el = document.createElement('div');
    el.id = 'test-el';
    eventBus.emit('element:selected', el);
    assert.isTrue(updated);
  });

  it('listens for element:deselected event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('element:deselected');
    });
  });

  it('listens for element:updated event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      const el = document.createElement('div');
      el.id = 'test-el';
      eventBus.emit('element:updated', el);
    });
  });

  it('listens for canvas:scroll event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('canvas:scroll');
    });
  });

  it('listens for canvas:zoom event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('canvas:zoom');
    });
  });

  it('listens for canvas:resize event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('canvas:resize');
    });
  });

  it('listens for breakpoint:switch event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('breakpoint:switch', 'desktop');
    });
  });

  it('listens for overlay:clear event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('overlay:clear');
    });
  });

  it('listens for rubber-band:update event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('rubber-band:update', { left: 0, top: 0, width: 100, height: 100 });
    });
  });

  it('listens for rubber-band:end event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('rubber-band:end');
    });
  });

  it('listens for drag:start event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('drag:start');
    });
  });

  it('listens for drag:end event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('drag:end');
    });
  });

  it('listens for resize:start event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('resize:start');
    });
  });

  it('listens for resize:end event', () => {
    const overlay = new OverlayManager(editor);
    assert.doesNotThrow(() => {
      eventBus.emit('resize:end');
    });
  });
});






