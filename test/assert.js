let passed = 0, failed = 0, currentSuite = '';
const _beforeEachFns = [];
const _afterEachFns = [];
const _addedElements = [];

export function describe(name, fn) {
  currentSuite = name;
  fn();
}

export function it(name, fn) {
  const hooks = [..._beforeEachFns];
  try {
    hooks.forEach(h => h());
    fn();
    passed++;
    log('PASS', currentSuite, name);
  } catch (e) {
    failed++;
    log('FAIL', currentSuite, name, e.message);
  } finally {
    _afterEachFns.forEach(h => h());
    cleanupTrackedElements();
  }
}

function cleanupTrackedElements() {
  for (const el of _addedElements) {
    try {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    } catch (_) {
      // Element already removed or not in DOM
    }
  }
  _addedElements.length = 0;
}

export function beforeEach(fn) {
  _beforeEachFns.push(fn);
}

export function afterEach(fn) {
  _afterEachFns.push(fn);
}

export function trackElement(el) {
  _addedElements.push(el);
  return el;
}

export function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

export const equal = assertEqual;
export const notEqual = assertNotEqual;
export const isTrue = (val, msg) => { if (val !== true) throw new Error(`${msg || ''} Expected true, got ${JSON.stringify(val)}`); };
export const isFalse = (val, msg) => { if (val !== false) throw new Error(`${msg || ''} Expected false, got ${JSON.stringify(val)}`); };
export const isNull = (val, msg) => { if (val !== null) throw new Error(`${msg || ''} Expected null, got ${JSON.stringify(val)}`); };
export const isNotNull = (val, msg) => { if (val === null || val === undefined) throw new Error(`${msg || ''} Expected non-null`); };
export const isUndefined = (val, msg) => { if (val !== undefined) throw new Error(`${msg || ''} Expected undefined, got ${JSON.stringify(val)}`); };
export const isNumber = (val, msg) => { if (typeof val !== 'number') throw new Error(`${msg || ''} Expected number, got ${typeof val}`); };
export const isString = (val, msg) => { if (typeof val !== 'string') throw new Error(`${msg || ''} Expected string, got ${typeof val}`); };
export const isBoolean = (val, msg) => { if (typeof val !== 'boolean') throw new Error(`${msg || ''} Expected boolean, got ${typeof val}`); };
export const isFunction = (val, msg) => { if (typeof val !== 'function') throw new Error(`${msg || ''} Expected function, got ${typeof val}`); };
export const isObject = (val, msg) => { if (val === null || typeof val !== 'object') throw new Error(`${msg || ''} Expected object, got ${typeof val}`); };
export const isArray = (val, msg) => { if (!Array.isArray(val)) throw new Error(`${msg || ''} Expected array, got ${typeof val}`); };
export const isInstanceOf = assertInstanceOf;
export const instanceOf = assertInstanceOf;
export const greaterThan = assertGreaterThan;
export const greaterThanOrEqual = assertGreaterThanOrEqual;
export const lessThan = assertLessThan;
export const lessThanOrEqual = assertLessThanOrEqual;
export const includes = assertIncludes;
export const notIncludes = assertNotIncludes;
export const length = assertLength;
export const doesNotThrow = (fn, msg) => { try { fn(); } catch (e) { throw new Error(`${msg || ''} Expected no throw, but threw: ${e.message}`); } };

export function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function assertNotEqual(actual, expected, msg) {
  if (actual === expected) throw new Error(`${msg || ''} Expected not ${JSON.stringify(expected)}`);
}

export function assertClose(actual, expected, tolerance, msg) {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`${msg || ''} Expected ~${expected}, got ${actual}`);
}

export function assertInstanceOf(actual, expected, msg) {
  if (!(actual instanceof expected)) throw new Error(`${msg || ''} Expected instance of ${expected.name}`);
}

export function assertNull(actual, msg) {
  if (actual !== null && actual !== undefined) throw new Error(`${msg || ''} Expected null/undefined, got ${JSON.stringify(actual)}`);
}

export function assertNotNull(actual, msg) {
  if (actual === null || actual === undefined) throw new Error(`${msg || ''} Expected non-null value`);
}

export function assertArrayEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${msg || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function assertObjectEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${msg || ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function assertBoolean(actual, msg) {
  if (typeof actual !== 'boolean') throw new Error(`${msg || ''} Expected boolean, got ${typeof actual}`);
}

export function assertNumber(actual, msg) {
  if (typeof actual !== 'number') throw new Error(`${msg || ''} Expected number, got ${typeof actual}`);
}

export function assertString(actual, msg) {
  if (typeof actual !== 'string') throw new Error(`${msg || ''} Expected string, got ${typeof actual}`);
}

export function assertFunction(actual, msg) {
  if (typeof actual !== 'function') throw new Error(`${msg || ''} Expected function, got ${typeof actual}`);
}

export function assertGreaterThan(actual, expected, msg) {
  if (actual <= expected) throw new Error(`${msg || ''} Expected ${actual} > ${expected}`);
}

export function assertGreaterThanOrEqual(actual, expected, msg) {
  if (actual < expected) throw new Error(`${msg || ''} Expected ${actual} >= ${expected}`);
}

export function assertLessThan(actual, expected, msg) {
  if (actual >= expected) throw new Error(`${msg || ''} Expected ${actual} < ${expected}`);
}

export function assertLessThanOrEqual(actual, expected, msg) {
  if (actual > expected) throw new Error(`${msg || ''} Expected ${actual} <= ${expected}`);
}

export function assertIncludes(array, item, msg) {
  if (!array.includes(item)) throw new Error(`${msg || ''} Expected array to include ${JSON.stringify(item)}`);
}

export function assertNotIncludes(array, item, msg) {
  if (array.includes(item)) throw new Error(`${msg || ''} Expected array not to include ${JSON.stringify(item)}`);
}

export function assertLength(array, expected, msg) {
  if (array.length !== expected) throw new Error(`${msg || ''} Expected length ${expected}, got ${array.length}`);
}

export function assertUndefined(actual, msg) {
  if (actual !== undefined) throw new Error(`${msg || ''} Expected undefined, got ${JSON.stringify(actual)}`);
}

export function assertDeepEqual(actual, expected, msg) {
  const aStr = JSON.stringify(actual, (k, v) => v instanceof HTMLElement ? `[HTMLElement: ${v.tagName}]` : v);
  const eStr = JSON.stringify(expected, (k, v) => v instanceof HTMLElement ? `[HTMLElement: ${v.tagName}]` : v);
  if (aStr !== eStr) throw new Error(`${msg || ''} Expected ${eStr}, got ${aStr}`);
}

function log(status, suite, test, detail) {
  const el = document.getElementById('results');
  if (!el) return;
  const div = document.createElement('div');
  div.className = status === 'PASS' ? 'pass' : 'fail';
  div.textContent = `[${status}] ${suite} › ${test}${detail ? ' — ' + detail : ''}`;
  el.appendChild(div);
}

export function summary() {
  const total = passed + failed;
  return { passed, failed, total, passRate: total ? (passed / total * 100).toFixed(1) + '%' : 'N/A' };
}

export function reset() {
  passed = 0;
  failed = 0;
  currentSuite = '';
  _beforeEachFns.length = 0;
  _afterEachFns.length = 0;
  _addedElements.length = 0;
}
