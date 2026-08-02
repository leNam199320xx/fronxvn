import * as assert from '../assert.js';
import { describe, it, beforeEach, afterEach } from '../assert.js';
import { KeyboardShortcuts } from '../../src/studio/layout/keyboard-shortcuts.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('KeyboardShortcuts', () => {
  let shortcuts;

  beforeEach(() => {
    shortcuts = new KeyboardShortcuts({});
  });

  afterEach(() => {
    shortcuts.destroy();
    eventBus.clear();
  });

  it('init() does nothing', () => {
    assert.doesNotThrow(() => shortcuts.init());
  });

  it('refresh() does nothing', () => {
    assert.doesNotThrow(() => shortcuts.refresh());
  });

  it('destroy() removes keydown listener', () => {
    assert.doesNotThrow(() => shortcuts.destroy());
  });

  it('ignores keydown when target is INPUT', () => {
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: input });
    assert.doesNotThrow(() => shortcuts._handleKeydown(event));
  });

  it('ignores keydown when target is TEXTAREA', () => {
    const textarea = document.createElement('textarea');
    const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: textarea });
    assert.doesNotThrow(() => shortcuts._handleKeydown(event));
  });

  it('ignores keydown when target is contenteditable', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
    Object.defineProperty(event, 'target', { value: div });
    assert.doesNotThrow(() => shortcuts._handleKeydown(event));
  });

  it('handles ctrl+g for group', () => {
    let emitted = false;
    eventBus.on('group:group', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+shift+g for ungroup', () => {
    let emitted = false;
    eventBus.on('group:ungroup', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'G', ctrlKey: true, shiftKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+z for undo', () => {
    let emitted = false;
    eventBus.on('history:undo', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+shift+z for redo', () => {
    let emitted = false;
    eventBus.on('history:redo', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'Z', ctrlKey: true, shiftKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+c for copy', () => {
    let emitted = false;
    eventBus.on('clipboard:copy', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+v for paste', () => {
    let emitted = false;
    eventBus.on('clipboard:paste', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+x for cut', () => {
    let emitted = false;
    eventBus.on('clipboard:cut', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+d for duplicate', () => {
    let emitted = false;
    eventBus.on('clipboard:duplicate', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+l for lock toggle', () => {
    let emitted = false;
    eventBus.on('element:lock-toggle', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'l', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+h for hide toggle', () => {
    let emitted = false;
    eventBus.on('element:hide-toggle', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+] for bring front', () => {
    let emitted = false;
    eventBus.on('element:bring-front', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: ']', ctrlKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles ctrl+shift+] for send back', () => {
    let emitted = false;
    eventBus.on('element:send-back', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: '[', ctrlKey: true, shiftKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles Delete key for element delete', () => {
    let emitted = false;
    eventBus.on('element:delete', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles Backspace key for element delete', () => {
    let emitted = false;
    eventBus.on('element:delete', () => { emitted = true; });
    const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('handles arrow keys for element move', () => {
    let emitted = false;
    eventBus.on('element:move-by', (data) => {
      emitted = true;
      assert.isObject(data);
      assert.isNumber(data.dx);
      assert.isNumber(data.dy);
    });
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.isTrue(emitted);
  });

  it('shift+arrow moves by larger amount', () => {
    let lastDx = 0, lastDy = 0;
    eventBus.on('element:move-by', (data) => {
      lastDx = data.dx;
      lastDy = data.dy;
    });
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true });
    Object.defineProperty(event, 'target', { value: document.body });
    shortcuts._handleKeydown(event);
    assert.greaterThan(lastDx, 0);
  });
});



