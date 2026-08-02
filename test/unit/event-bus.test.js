import * as assert from '../assert.js';
import { describe, it, afterEach } from '../assert.js';
import eventBus from '../../src/core/events/event-bus.js';

describe('EventBus', () => {
  afterEach(() => {
    eventBus.clear();
  });

  it('on() registers a listener', () => {
    let called = false;
    eventBus.on('test:event', () => { called = true; });
    eventBus.emit('test:event');
    assert.isTrue(called);
  });

  it('on() passes arguments to listener', () => {
    let received = null;
    eventBus.on('test:args', (data) => { received = data; });
    eventBus.emit('test:args', { foo: 'bar' });
    assert.equal(received.foo, 'bar');
  });

  it('off() removes a listener', () => {
    let called = false;
    const handler = () => { called = true; };
    eventBus.on('test:off', handler);
    eventBus.off('test:off', handler);
    eventBus.emit('test:off');
    assert.isFalse(called);
  });

  it('once() fires only once', () => {
    let callCount = 0;
    eventBus.once('test:once', () => { callCount++; });
    eventBus.emit('test:once');
    eventBus.emit('test:once');
    assert.equal(callCount, 1);
  });

  it('emit() returns undefined when no listeners', () => {
    const result = eventBus.emit('test:no-listeners');
    assert.undefined(result);
  });

  it('clear(event) removes listeners for specific event', () => {
    let called = false;
    eventBus.on('test:clear', () => { called = true; });
    eventBus.clear('test:clear');
    eventBus.emit('test:clear');
    assert.isFalse(called);
  });

  it('clear() with no argument removes all listeners', () => {
    let called1 = false, called2 = false;
    eventBus.on('test:clear-all-1', () => { called1 = true; });
    eventBus.on('test:clear-all-2', () => { called2 = true; });
    eventBus.clear();
    eventBus.emit('test:clear-all-1');
    eventBus.emit('test:clear-all-2');
    assert.isFalse(called1);
    assert.isFalse(called2);
  });

  it('multiple listeners for same event all fire', () => {
    let count = 0;
    eventBus.on('test:multi', () => { count++; });
    eventBus.on('test:multi', () => { count++; });
    eventBus.on('test:multi', () => { count++; });
    eventBus.emit('test:multi');
    assert.equal(count, 3);
  });

  it('listener context is applied correctly', () => {
    const obj = { value: 42 };
    let received = null;
    eventBus.on('test:context', function() { received = this.value; }, obj);
    eventBus.emit('test:context');
    assert.equal(received, 42);
  });

  it('on() returns unsubscribe function', () => {
    let called = false;
    const unsubscribe = eventBus.on('test:unsub', () => { called = true; });
    unsubscribe();
    eventBus.emit('test:unsub');
    assert.isFalse(called);
  });
});



