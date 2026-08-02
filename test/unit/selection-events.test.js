import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { SelectionEvents } from '../../src/core/selection/selection-events.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('SelectionEvents', () => {
  let selection;

  beforeEach(() => {
    selection = {
      isEditing: false,
      _handleMouseDown: () => {},
      _handleHover: () => {},
      _handleDoubleClick: () => {},
      selectionState: {
        isSelected: () => false,
        removeFromSelection: () => {},
        select: () => {},
        deselectAll: () => {}
      }
    };
  });

  afterEach(() => {
    eventBus.clear();
  });

  it('init() does nothing', () => {
    const events = new SelectionEvents(selection);
    assert.doesNotThrow(() => events.init());
  });

  it('refresh() does nothing', () => {
    const events = new SelectionEvents(selection);
    assert.doesNotThrow(() => events.refresh());
  });

  it('destroy() does nothing', () => {
    const events = new SelectionEvents(selection);
    assert.doesNotThrow(() => events.destroy());
  });

  it('binds pointer:mousedown event', () => {
    let called = false;
    selection._handleMouseDown = () => { called = true; };
    const events = new SelectionEvents(selection);
    eventBus.emit('pointer:mousedown', { target: document.createElement('div') });
    assert.isTrue(called);
  });

  it('binds pointer:mousemove event', () => {
    let called = false;
    selection._handleHover = () => { called = true; };
    const events = new SelectionEvents(selection);
    eventBus.emit('pointer:mousemove', { target: document.createElement('div') });
    assert.isTrue(called);
  });

  it('binds pointer:dblclick event', () => {
    let called = false;
    selection._handleDoubleClick = () => { called = true; };
    const events = new SelectionEvents(selection);
    eventBus.emit('pointer:dblclick', {});
    assert.isTrue(called);
  });

  it('ignores mousedown when editing', () => {
    let called = false;
    selection.isEditing = true;
    selection._handleMouseDown = () => { called = true; };
    const events = new SelectionEvents(selection);
    eventBus.emit('pointer:mousedown', { target: document.createElement('div') });
    assert.isFalse(called);
  });

  it('ignores resize handle clicks', () => {
    let called = false;
    selection._handleMouseDown = () => { called = true; };
    const events = new SelectionEvents(selection);
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    eventBus.emit('pointer:mousedown', { target: handle });
    assert.isFalse(called);
  });

  it('ignores move handle clicks', () => {
    let called = false;
    selection._handleMouseDown = () => { called = true; };
    const events = new SelectionEvents(selection);
    const handle = document.createElement('div');
    handle.className = 'move-handle';
    eventBus.emit('pointer:mousedown', { target: handle });
    assert.isFalse(called);
  });

  it('ignores rotation handle clicks', () => {
    let called = false;
    selection._handleMouseDown = () => { called = true; };
    const events = new SelectionEvents(selection);
    const handle = document.createElement('div');
    handle.className = 'rotation-handle';
    eventBus.emit('pointer:mousedown', { target: handle });
    assert.isFalse(called);
  });
});



