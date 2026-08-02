import * as assert from './assert.js';

import './unit/canvas-api.test.js';
import './unit/canvas-host.test.js';
import './unit/canvas-event-bridge.test.js';
import './unit/canvas-mutation-observer.test.js';
import './unit/coordinate.test.js';
import './unit/frame-cache.test.js';
import './unit/dirty-state.test.js';
import './unit/event-bus.test.js';
import './unit/overlay-renderer.test.js';
import './unit/viewport-culling.test.js';
import './unit/selection-state.test.js';
import './unit/selection-hit-test.test.js';
import './unit/selection-events.test.js';
import './unit/drag.test.js';
import './unit/resize.test.js';
import './unit/rotate.test.js';
import './unit/overlay-manager.test.js';
import './unit/resize-handles.test.js';
import './unit/rotate-handle.test.js';
import './unit/keyboard-shortcuts.test.js';
import './unit/editor.test.js';

window.addEventListener('load', () => {
  const s = assert.summary();
  const el = document.getElementById('summary');
  if (el) {
    el.innerHTML = `
      <strong>Summary:</strong>
      <span class="pass-count">${s.passed} passed</span> /
      <span class="fail-count">${s.failed} failed</span> /
      ${s.total} total (${s.passRate})
    `;
  }
  console.log(`\nTests: ${s.passed}/${s.total} passed (${s.passRate})`);
});