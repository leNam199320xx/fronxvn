import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import FrameCache from '../../src/core/viewport/frame-cache.js';

describe('FrameCache', () => {
  it('get() caches a value for the current frame', () => {
    let callCount = 0;
    const val = FrameCache.get('test-key', () => {
      callCount++;
      return 42;
    });
    assert.equal(val, 42);
    assert.equal(callCount, 1);
    const val2 = FrameCache.get('test-key', () => {
      callCount++;
      return 99;
    });
    assert.equal(val2, 42);
    assert.equal(callCount, 1);
    FrameCache.invalidate('test-key');
  });

  it('get() calls resolver if key not cached', () => {
    let callCount = 0;
    FrameCache.get('fresh-key', () => {
      callCount++;
      return 'fresh';
    });
    assert.equal(callCount, 1);
    FrameCache.invalidate('fresh-key');
  });

  it('get() returns non-function value as-is', () => {
    const val = FrameCache.get('static-key', 123);
    assert.equal(val, 123);
  });

  it('get() returns non-function value as-is (string)', () => {
    const val = FrameCache.get('static-key-str', 'hello');
    assert.equal(val, 'hello');
  });

  it('invalidate() removes cached entry', () => {
    FrameCache.get('to-invalidate', () => 'value');
    FrameCache.invalidate('to-invalidate');
    let callCount = 0;
    FrameCache.get('to-invalidate', () => {
      callCount++;
      return 'new-value';
    });
    assert.equal(callCount, 1);
  });

  it('clear() removes all cached entries', () => {
    FrameCache.get('key1', () => 'v1');
    FrameCache.get('key2', () => 'v2');
    FrameCache.clear();
    let c1 = 0, c2 = 0;
    FrameCache.get('key1', () => { c1++; return 'v1'; });
    FrameCache.get('key2', () => { c2++; return 'v2'; });
    assert.equal(c1, 1);
    assert.equal(c2, 1);
    FrameCache.invalidate('key1');
    FrameCache.invalidate('key2');
  });

  it('beginFrame() increments frame id', () => {
    const before = FrameCache.getFrameId();
    FrameCache.beginFrame();
    assert.greaterThan(FrameCache.getFrameId(), before);
  });

  it('endFrame() is alias for beginFrame()', () => {
    const before = FrameCache.getFrameId();
    FrameCache.endFrame();
    assert.greaterThan(FrameCache.getFrameId(), before);
  });

  it('getFrameId() returns current frame id', () => {
    const id = FrameCache.getFrameId();
    assert.isNumber(id);
    assert.greaterThanOrEqual(id, 0);
  });

  it('setDiagnosticsHooks() accepts hooks', () => {
    let hit = false, miss = false;
    FrameCache.setDiagnosticsHooks(() => { hit = true; }, () => { miss = true; });
    FrameCache.get('diag-key', () => 'value');
    FrameCache.invalidate('diag-key');
    FrameCache.setDiagnosticsHooks(null, null);
  });
});


