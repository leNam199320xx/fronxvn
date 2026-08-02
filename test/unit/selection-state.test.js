import * as assert from '../assert.js';
import { describe, it, beforeEach } from '../assert.js';
import { SelectionState } from '../../src/core/selection/selection-state.js';

describe('SelectionState', () => {
  let state;

  beforeEach(() => {
    state = new SelectionState();
  });

  it('select() sets single element', () => {
    const el = document.createElement('div');
    el.id = 'test-el';
    state.select(el);
    assert.length(state.selectedElements, 1);
    assert.equal(state.selectedElements[0], el);
  });

  it('select() does nothing for null', () => {
    assert.doesNotThrow(() => state.select(null));
  });

  it('select() does nothing for same element', () => {
    const el = document.createElement('div');
    state.select(el);
    const before = state.selectedElements.length;
    state.select(el);
    assert.equal(state.selectedElements.length, before);
  });

  it('toggleSelection() adds element when not selected', () => {
    const el = document.createElement('div');
    state.toggleSelection(el);
    assert.length(state.selectedElements, 1);
  });

  it('toggleSelection() removes element when already selected', () => {
    const el = document.createElement('div');
    state.select(el);
    state.toggleSelection(el);
    assert.length(state.selectedElements, 0);
  });

  it('addToSelection() adds element', () => {
    const el = document.createElement('div');
    state.addToSelection(el);
    assert.length(state.selectedElements, 1);
  });

  it('addToSelection() does not duplicate', () => {
    const el = document.createElement('div');
    state.addToSelection(el);
    state.addToSelection(el);
    assert.length(state.selectedElements, 1);
  });

  it('removeFromSelection() removes element', () => {
    const el = document.createElement('div');
    state.select(el);
    state.removeFromSelection(el);
    assert.length(state.selectedElements, 0);
  });

  it('setSelection() sets multiple elements', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    state.setSelection([el1, el2]);
    assert.length(state.selectedElements, 2);
  });

  it('deselectAll() clears selection', () => {
    const el = document.createElement('div');
    state.select(el);
    state.deselectAll();
    assert.length(state.selectedElements, 0);
  });

  it('deselectAll() does nothing when already empty', () => {
    assert.doesNotThrow(() => state.deselectAll());
  });

  it('deselect() is alias for deselectAll()', () => {
    const el = document.createElement('div');
    state.select(el);
    state.deselect();
    assert.length(state.selectedElements, 0);
  });

  it('getSelected() returns first element or null', () => {
    assert.null(state.getSelected());
    const el = document.createElement('div');
    state.select(el);
    assert.equal(state.getSelected(), el);
  });

  it('getSelectedAll() returns all selected elements', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('div');
    state.setSelection([el1, el2]);
    assert.length(state.getSelectedAll(), 2);
  });

  it('isSelected() checks if element is selected', () => {
    const el = document.createElement('div');
    state.select(el);
    assert.isTrue(state.isSelected(el));
    assert.isFalse(state.isSelected(document.createElement('div')));
  });
});


