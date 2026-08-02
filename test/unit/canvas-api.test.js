import * as assert from '../assert.js';
import { describe, it } from '../assert.js';
import CanvasAPI from '../../src/core/canvas/canvas-api.js';

describe('CanvasAPI', () => {
  it('getDocument() returns document', () => {
    assert.equal(CanvasAPI.getDocument(), document);
  });

  it('getWindow() returns window', () => {
    assert.equal(CanvasAPI.getWindow(), window);
  });

  it('getBody() returns document.body', () => {
    assert.equal(CanvasAPI.getBody(), document.body);
  });

  it('getIframe() returns null', () => {
    assert.null(CanvasAPI.getIframe());
  });

  it('getIframeRect() returns zero rect', () => {
    const rect = CanvasAPI.getIframeRect();
    assert.equal(rect.left, 0);
    assert.equal(rect.top, 0);
    assert.equal(rect.width, 0);
    assert.equal(rect.height, 0);
  });

  it('getRoot() returns the canvas element', () => {
    const root = CanvasAPI.getRoot();
    assert.notNull(root);
    assert.equal(root.id, 'canvas');
  });

  it('getSelection() returns window selection', () => {
    const sel = CanvasAPI.getSelection();
    assert.instanceOf(sel, window.Selection);
  });

  it('query() returns first matching element', () => {
    const el = CanvasAPI.query('#canvas');
    assert.notNull(el);
    assert.equal(el.id, 'canvas');
  });

  it('queryAll() returns all matching elements', () => {
    const els = CanvasAPI.queryAll('[data-editor-element]');
    assert.isArray(els);
  });

  it('create() creates element with attributes', () => {
    const el = CanvasAPI.create('div', { id: 'test-el', className: 'test-class', 'data-foo': 'bar' });
    assert.equal(el.id, 'test-el');
    assert.equal(el.className, 'test-class');
    assert.equal(el.getAttribute('data-foo'), 'bar');
    assert.equal(el.tagName, 'DIV');
  });

  it('create() handles textContent', () => {
    const el = CanvasAPI.create('div', { textContent: 'Hello' });
    assert.equal(el.textContent, 'Hello');
  });

  it('remove() removes element from DOM', () => {
    const parent = CanvasAPI.create('div');
    const child = CanvasAPI.create('div');
    parent.appendChild(child);
    assert.equal(parent.children.length, 1);
    CanvasAPI.remove(child);
    assert.equal(parent.children.length, 0);
  });

  it('append() appends element to root', () => {
    const el = CanvasAPI.create('div', { id: 'test-append' });
    CanvasAPI.append(el);
    assert.includes(CanvasAPI.getRoot().children, el);
    CanvasAPI.remove(el);
  });

  it('prepend() prepends element to root', () => {
    const el = CanvasAPI.create('div', { id: 'test-prepend' });
    CanvasAPI.prepend(el);
    assert.equal(CanvasAPI.getRoot().firstChild, el);
    CanvasAPI.remove(el);
  });

  it('setStyle() sets CSS property', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.setStyle(el, 'color', 'red');
    assert.equal(el.style.color, 'red');
  });

  it('getStyle() gets CSS property', () => {
    const el = CanvasAPI.create('div');
    el.style.setProperty('color', 'blue');
    assert.equal(CanvasAPI.getStyle(el, 'color'), 'blue');
  });

  it('setAttribute() sets attribute', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.setAttribute(el, 'data-test', 'value');
    assert.equal(el.getAttribute('data-test'), 'value');
  });

  it('getAttribute() gets attribute', () => {
    const el = CanvasAPI.create('div', { 'data-foo': 'bar' });
    assert.equal(CanvasAPI.getAttribute(el, 'data-foo'), 'bar');
  });

  it('removeAttribute() removes attribute', () => {
    const el = CanvasAPI.create('div', { 'data-remove': 'yes' });
    CanvasAPI.removeAttribute(el, 'data-remove');
    assert.equal(el.getAttribute('data-remove'), null);
  });

  it('hasAttribute() checks attribute existence', () => {
    const el = CanvasAPI.create('div', { 'data-present': 'yes' });
    assert.isTrue(CanvasAPI.hasAttribute(el, 'data-present'));
    assert.isFalse(CanvasAPI.hasAttribute(el, 'data-absent'));
  });

  it('addClass() adds class', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.addClass(el, 'my-class');
    assert.includes(el.classList, 'my-class');
  });

  it('removeClass() removes class', () => {
    const el = CanvasAPI.create('div', { className: 'my-class' });
    CanvasAPI.removeClass(el, 'my-class');
    assert.notIncludes(el.classList, 'my-class');
  });

  it('toggleClass() toggles class', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.toggleClass(el, 'toggled', true);
    assert.includes(el.classList, 'toggled');
    CanvasAPI.toggleClass(el, 'toggled', false);
    assert.notIncludes(el.classList, 'toggled');
  });

  it('setClass() sets class', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.setClass(el, 'single-class');
    assert.equal(el.className, 'single-class');
  });

  it('getClass() returns class name', () => {
    const el = CanvasAPI.create('div', { className: 'my-class' });
    assert.equal(CanvasAPI.getClass(el), 'my-class');
  });

  it('contains() checks parent-child relationship', () => {
    const parent = CanvasAPI.create('div');
    const child = CanvasAPI.create('div');
    parent.appendChild(child);
    assert.isTrue(CanvasAPI.contains(parent, child));
    assert.isFalse(CanvasAPI.contains(child, parent));
  });

  it('setText() sets text content', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.setText(el, 'Hello World');
    assert.equal(el.textContent, 'Hello World');
  });

  it('getText() gets text content', () => {
    const el = CanvasAPI.create('div', { textContent: 'Some text' });
    assert.equal(CanvasAPI.getText(el), 'Some text');
  });

  it('setHTML() sets inner HTML', () => {
    const el = CanvasAPI.create('div');
    CanvasAPI.setHTML(el, '<span>inner</span>');
    assert.equal(el.innerHTML, '<span>inner</span>');
  });

  it('getHTML() gets inner HTML', () => {
    const el = CanvasAPI.create('div');
    el.innerHTML = '<span>inner</span>';
    assert.equal(CanvasAPI.getHTML(el), '<span>inner</span>');
  });

  it('closest() finds ancestor matching selector', () => {
    const parent = CanvasAPI.create('div', { className: 'parent' });
    const child = CanvasAPI.create('div');
    parent.appendChild(child);
    assert.equal(CanvasAPI.closest(child, '.parent'), parent);
  });

  it('matches() checks element matches selector', () => {
    const el = CanvasAPI.create('div', { className: 'test-el' });
    assert.isTrue(CanvasAPI.matches(el, '.test-el'));
    assert.isFalse(CanvasAPI.matches(el, '.other'));
  });

  it('getElementRect() returns element rect', () => {
    const el = CanvasAPI.create('div');
    el.style.position = 'absolute';
    el.style.left = '100px';
    el.style.top = '200px';
    el.style.width = '300px';
    el.style.height = '150px';
    document.body.appendChild(trackElement(el));
    const rect = CanvasAPI.getElementRect(el);
    assert.isNumber(rect.left);
    assert.isNumber(rect.top);
    assert.isNumber(rect.width);
    assert.isNumber(rect.height);
    document.body.removeChild(el);
  });

  it('getElementRect() returns zero rect for null', () => {
    const rect = CanvasAPI.getElementRect(null);
    assert.equal(rect.left, 0);
    assert.equal(rect.top, 0);
    assert.equal(rect.width, 0);
    assert.equal(rect.height, 0);
  });

  it('getComputedStyle() returns computed style', () => {
    const el = CanvasAPI.create('div');
    document.body.appendChild(trackElement(el));
    const style = CanvasAPI.getComputedStyle(el);
    assert.isObject(style);
    document.body.removeChild(el);
  });

  it('getRootRect() returns canvas root rect', () => {
    const rect = CanvasAPI.getRootRect();
    assert.isObject(rect);
    assert.isNumber(rect.left);
    assert.isNumber(rect.top);
    assert.isNumber(rect.width);
    assert.isNumber(rect.height);
  });

  it('getCanvasRect() returns canvas rect', () => {
    const rect = CanvasAPI.getCanvasRect();
    assert.isObject(rect);
  });

  it('getZoom() returns zoom level', () => {
    const zoom = CanvasAPI.getZoom();
    assert.isNumber(zoom);
    assert.greaterThanOrEqual(zoom, 0.25);
    assert.lessThanOrEqual(zoom, 3);
  });

  it('getDevicePixelRatio() returns device pixel ratio', () => {
    const dpr = CanvasAPI.getDevicePixelRatio();
    assert.isNumber(dpr);
    assert.greaterThan(dpr, 0);
  });

  it('getScrollX() returns scroll X', () => {
    const x = CanvasAPI.getScrollX();
    assert.isNumber(x);
    assert.greaterThanOrEqual(x, 0);
  });

  it('getScrollY() returns scroll Y', () => {
    const y = CanvasAPI.getScrollY();
    assert.isNumber(y);
    assert.greaterThanOrEqual(y, 0);
  });
});





