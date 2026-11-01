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
const document = { activeElement: null };
function element() {
  const listeners = new Map();
  return {
    classList: classList(), attrs: {}, listeners, inert: false, ownerDocument: document,
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    focus() { this.focused = true; document.activeElement = this; }
  };
}
const sidebar = element();
const overlay = element();
const trigger = element();
const close = element();
const body = { classList: classList() };
const background = element();
const alreadyInert = element();
alreadyInert.inert = true;
const host = { parentElement: body };
sidebar.parentElement = host;
body.children = [host, background, alreadyInert];
const navLinks = [element(), element(), element(), element()];
let breakpointListener;
const media = {
  matches: false,
  addEventListener(name, fn) { breakpointListener = fn; },
  removeEventListener(name, fn) { if (breakpointListener === fn) breakpointListener = null; }
};
const windowTarget = element();
const nav = createDrawerController({ sidebar, overlay, trigger, close, body, media, windowTarget, links: navLinks });

function tabFrom(target, shiftKey = false) {
  target.focus();
  const event = { key: 'Tab', shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
  windowTarget.listeners.get('keydown')(event);
  return event.prevented;
}

assert.equal(sidebar.inert, true);
assert.equal(sidebar.attrs['aria-hidden'], 'true');

nav.setOpen(true);
assert.equal(sidebar.classList.contains('open'), true);
assert.equal(sidebar.inert, false);
assert.equal(sidebar.attrs['aria-hidden'], 'false');
assert.equal(overlay.classList.contains('visible'), true);
assert.equal(trigger.attrs['aria-expanded'], 'true');
assert.equal(close.focused, true);
assert.equal(tabFrom(navLinks[3]), true, 'Tab at the final link must wrap');
assert.equal(document.activeElement, close);
assert.equal(tabFrom(close, true), true, 'Shift+Tab at Close must wrap');
assert.equal(document.activeElement, navLinks[3]);
assert.equal(tabFrom(navLinks[1]), false, 'Interior links keep native Tab order');
assert.equal(tabFrom(navLinks[1], true), false);
assert.equal(tabFrom(background), true, 'Focus outside the open drawer is recovered');
assert.equal(document.activeElement, close);
assert.equal(tabFrom(background, true), true);
assert.equal(document.activeElement, navLinks[3]);
assert.equal(background.inert, true);
assert.equal(alreadyInert.inert, true);
assert.equal(overlay.inert, false);
assert.equal(overlay.attrs['aria-hidden'], 'false');
windowTarget.listeners.get('keydown')({ key: 'Escape' });
assert.equal(sidebar.classList.contains('open'), false);
assert.equal(sidebar.inert, true);
assert.equal(sidebar.attrs['aria-hidden'], 'true');
assert.equal(trigger.focused, true);
assert.equal(document.activeElement, trigger);
assert.equal(background.inert, false);
assert.equal(alreadyInert.inert, true);
assert.equal(overlay.inert, true);
assert.equal(overlay.attrs['aria-hidden'], 'true');
assert.equal(tabFrom(close, true), false, 'Closed drawer does not trap Tab');
nav.setOpen(true);
nav.setOpen(true);
overlay.listeners.get('click')();
assert.equal(document.activeElement, trigger, 'Overlay close returns focus');
assert.equal(background.inert, false, 'Repeated open does not overwrite prior inert state');
nav.setOpen(true);
close.listeners.get('click')();
assert.equal(document.activeElement, trigger, 'Close button returns focus');
assert.equal(background.inert, false);
nav.setOpen(true);
media.matches = true;
breakpointListener({ matches: true });
assert.equal(sidebar.classList.contains('open'), false);
assert.equal(body.classList.contains('drawer-open'), false);
assert.equal(sidebar.inert, false);
assert.equal(sidebar.attrs['aria-hidden'], 'false');
assert.equal(background.inert, false);
assert.equal(alreadyInert.inert, true);
assert.equal(tabFrom(navLinks[3]), false, 'Desktop navigation does not trap Tab');
nav.setOpen(true);
assert.equal(sidebar.classList.contains('open'), false, 'Desktop cannot enter modal state');

media.matches = false;
breakpointListener({ matches: false });
assert.equal(sidebar.inert, true, 'Returning to mobile restores the closed state');
nav.setOpen(true);
nav.cleanup();
assert.equal(sidebar.classList.contains('open'), false);
assert.equal(windowTarget.listeners.has('keydown'), false);
assert.equal(breakpointListener, null);
assert.equal(background.inert, false);
assert.equal(alreadyInert.inert, true);

console.log('Navegação compartilhada passou.');

