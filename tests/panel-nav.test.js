const assert = require('node:assert/strict');
const { renderNavigation, createDrawerController } = require('../src/js/panel-nav.js');

const links = ['inicio.html', 'Meuperfil.html', 'Painelfinanceiro.html', 'painelmensagens.html'];
for (const href of links) assert.ok(renderNavigation('perfil').includes(`href="${href}"`));
assert.match(renderNavigation('financeiro'), /href="Painelfinanceiro\.html"[^>]*aria-current="page"/);
assert.doesNotMatch(renderNavigation('invalida'), /aria-current="page"/);

function classList() {
  const values = new Set();
  return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value), toggle(value, enabled) { enabled ? values.add(value) : values.delete(value); } };
}
function element() {
  const listeners = new Map();
  return {
    classList: classList(), attrs: {}, listeners, inert: false,
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    focus() { this.focused = true; }
  };
}
const sidebar = element();
const overlay = element();
const trigger = element();
const close = element();
const body = { classList: classList() };
let breakpointListener;
const media = {
  matches: false,
  addEventListener(name, fn) { breakpointListener = fn; },
  removeEventListener(name, fn) { if (breakpointListener === fn) breakpointListener = null; }
};
const windowTarget = element();
const nav = createDrawerController({ sidebar, overlay, trigger, close, body, media, windowTarget, links: [] });

assert.equal(sidebar.inert, true);
assert.equal(sidebar.attrs['aria-hidden'], 'true');

nav.setOpen(true);
assert.equal(sidebar.classList.contains('open'), true);
assert.equal(sidebar.inert, false);
assert.equal(sidebar.attrs['aria-hidden'], 'false');
assert.equal(overlay.classList.contains('visible'), true);
assert.equal(trigger.attrs['aria-expanded'], 'true');
assert.equal(close.focused, true);
windowTarget.listeners.get('keydown')({ key: 'Escape' });
assert.equal(sidebar.classList.contains('open'), false);
assert.equal(sidebar.inert, true);
assert.equal(sidebar.attrs['aria-hidden'], 'true');
assert.equal(trigger.focused, true);
nav.setOpen(true);
media.matches = true;
breakpointListener({ matches: true });
assert.equal(sidebar.classList.contains('open'), false);
assert.equal(body.classList.contains('drawer-open'), false);
assert.equal(sidebar.inert, false);
assert.equal(sidebar.attrs['aria-hidden'], 'false');

nav.setOpen(true);
nav.cleanup();
assert.equal(sidebar.classList.contains('open'), false);
assert.equal(windowTarget.listeners.has('keydown'), false);
assert.equal(breakpointListener, null);

console.log('Navegação compartilhada passou.');

