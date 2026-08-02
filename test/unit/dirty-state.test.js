import * as assert from '../assert.js';
import { describe, it, beforeEach } from '../assert.js';
import DirtyState, { DIRTY } from '../../src/core/dirty-state.js';

describe('DirtyState', () => {
  beforeEach(() => {
    DirtyState.clearAll();
  });

  it('mark() adds a flag', () => {
    DirtyState.mark(DIRTY.SELECTION);
    assert.isTrue(DirtyState.has(DIRTY.SELECTION));
  });

  it('clear() removes a flag', () => {
    DirtyState.mark(DIRTY.OVERLAY);
    assert.isTrue(DirtyState.has(DIRTY.OVERLAY));
    DirtyState.clear(DIRTY.OVERLAY);
    assert.isFalse(DirtyState.has(DIRTY.OVERLAY));
  });

  it('clearAll() removes all flags', () => {
    DirtyState.mark(DIRTY.SELECTION);
    DirtyState.mark(DIRTY.OVERLAY);
    DirtyState.mark(DIRTY.GUIDES);
    DirtyState.clearAll();
    assert.equal(DirtyState.list().length, 0);
  });

  it('has() returns false for unmarked flag', () => {
    assert.isFalse(DirtyState.has(DIRTY.SELECTION));
  });

  it('list() returns array of dirty flags', () => {
    DirtyState.mark(DIRTY.SELECTION);
    DirtyState.mark(DIRTY.OVERLAY);
    const flags = DirtyState.list();
    assert.includes(flags, DIRTY.SELECTION);
    assert.includes(flags, DIRTY.OVERLAY);
  });

  it('onChange() subscribes to dirty changes', () => {
    let receivedFlag = null;
    const unsubscribe = DirtyState.onChange((flag) => {
      receivedFlag = flag;
    });
    DirtyState.mark(DIRTY.QUALITY);
    assert.equal(receivedFlag, DIRTY.QUALITY);
    unsubscribe();
  });

  it('onChange() unsubscribe stops notifications', () => {
    let callCount = 0;
    const unsubscribe = DirtyState.onChange(() => {
      callCount++;
    });
    DirtyState.mark(DIRTY.SELECTION);
    assert.equal(callCount, 1);
    unsubscribe();
    DirtyState.mark(DIRTY.OVERLAY);
    assert.equal(callCount, 1);
  });

  it('DIRTY contains all expected flags', () => {
    assert.equal(DIRTY.SELECTION, 'DIRTY_SELECTION');
    assert.equal(DIRTY.OVERLAY, 'DIRTY_OVERLAY');
    assert.equal(DIRTY.GUIDES, 'DIRTY_GUIDES');
    assert.equal(DIRTY.PROPERTIES, 'DIRTY_PROPERTIES');
    assert.equal(DIRTY.LAYER, 'DIRTY_LAYER');
    assert.equal(DIRTY.HISTORY, 'DIRTY_HISTORY');
    assert.equal(DIRTY.QUALITY, 'DIRTY_QUALITY');
    assert.equal(DIRTY.EXPORT, 'DIRTY_EXPORT');
    assert.equal(DIRTY.CANVAS, 'DIRTY_CANVAS');
  });
});


