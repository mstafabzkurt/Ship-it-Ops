const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/hooks/useOnboardingViewport.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

function surface(properties = {}) {
  const listeners = new Map();
  return {
    ...properties,
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type, callback) {
      assert.equal(listeners.get(type), callback);
      listeners.delete(type);
    },
    emit(type) { listeners.get(type)?.(); },
    listeners,
  };
}

function mount({ platform = 'web', hasVisualViewport = true } = {}) {
  let state = null;
  let effect;
  let cleanup;
  let pendingFrame;
  const viewport = surface({ width: 390, height: 760, scale: 1, offsetTop: 0 });
  const browser = surface({ visualViewport: hasVisualViewport ? viewport : undefined });
  const document = surface({
    visibilityState: 'visible',
    documentElement: { clientWidth: 390, clientHeight: 844 },
  });
  const nativeDimensions = { width: 390, height: 844 };
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, window: browser, document,
    requestAnimationFrame(callback) { pendingFrame = callback; return 1; },
    cancelAnimationFrame() { pendingFrame = undefined; },
    require(name) {
      if (name === 'react') return {
        useState: () => [state, (update) => { state = update(state); }],
        useEffect: (callback) => { effect = callback; },
      };
      if (name === 'react-native') return {
        Platform: { OS: platform }, useWindowDimensions: () => nativeDimensions,
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  exports.useOnboardingViewport();
  cleanup = effect();
  return {
    viewport, browser, document, nativeDimensions,
    read: () => exports.useOnboardingViewport(),
    flush() { const callback = pendingFrame; pendingFrame = undefined; callback?.(); },
    unmount() { cleanup?.(); assert.equal(pendingFrame, undefined); },
  };
}

const app = mount();
assert.equal(app.read().width, 390);
assert.equal(app.read().height, 760);

// Pinch zoom must not turn a mobile panel into a narrower responsive layout.
const beforeZoom = app.read();
Object.assign(app.viewport, { width: 195, height: 380, scale: 2 });
app.viewport.emit('resize');
app.flush();
assert.equal(app.read(), beforeZoom);

// The keyboard reduces available height; width and layout identity stay stable.
Object.assign(app.viewport, { width: 390, height: 430, scale: 1 });
app.viewport.emit('resize');
app.flush();
assert.equal(app.read().width, 390);
assert.equal(app.read().height, 430);

// iOS keyboard panning can change the visible origin without a resize.
app.viewport.offsetTop = 120;
app.viewport.emit('scroll');
app.flush();
assert.equal(app.read().top, 120);
assert.equal(app.read().height, 430);
app.viewport.offsetTop = -10;
app.viewport.emit('scroll');
app.flush();
assert.equal(app.read().top, 0);
app.viewport.offsetTop = 900;
app.viewport.emit('scroll');
app.flush();
assert.equal(app.read().top, 414, 'The visible panel must not extend past the layout viewport');

// Inactive/zero measurements from browser UI must retain the last usable layout.
const withKeyboard = app.read();
app.viewport.scale = 0;
app.viewport.emit('resize');
app.flush();
assert.equal(app.read(), withKeyboard);
for (const height of [0, NaN, Infinity]) {
  Object.assign(app.viewport, { height, scale: 1 });
  app.viewport.emit('resize');
  app.flush();
  assert.equal(app.read(), withKeyboard, 'Invalid heights must retain the previous layout');
}
Object.assign(app.viewport, { height: 430, scale: 1 });
for (const scale of [NaN, Infinity, -1]) {
  app.viewport.scale = scale;
  app.viewport.emit('resize');
  app.flush();
  assert.equal(app.read(), withKeyboard);
}
app.viewport.scale = 1;
for (const width of [0, NaN, Infinity]) {
  app.viewport.width = width;
  app.viewport.emit('resize');
  app.flush();
  assert.equal(app.read(), withKeyboard);
}
app.viewport.width = 390;
app.document.visibilityState = 'hidden';
Object.assign(app.viewport, { height: 760, scale: 1 });
app.viewport.emit('resize');
app.flush();
assert.equal(app.read(), withKeyboard);
app.document.visibilityState = 'visible';
app.document.emit('visibilitychange');
app.flush();
assert.equal(app.read().height, 760);
assert.equal(app.read().top, 84, 'Stale iOS offsets are clamped when the keyboard closes');
app.viewport.offsetTop = 0;
app.viewport.emit('scroll');
app.flush();
assert.equal(app.read().top, 0);

// A focus/pageshow return repairs the height even without another resize event.
app.viewport.height = 700;
app.browser.emit('focus');
app.flush();
assert.equal(app.read().height, 700);
app.viewport.height = 760;
app.browser.emit('pageshow');
app.flush();
assert.equal(app.read().height, 760);

// Orientation and desktop resizing use layout width, even while zoomed.
Object.assign(app.document.documentElement, { clientWidth: 844, clientHeight: 390 });
Object.assign(app.viewport, { height: 195, scale: 2 });
app.browser.emit('orientationchange');
app.flush();
assert.equal(app.read().width, 844);
assert.equal(app.read().height, 390);
assert.equal(app.read().top, 0, 'Zoom panning must not shift onboarding');
Object.assign(app.document.documentElement, { clientWidth: 1280, clientHeight: 900 });
Object.assign(app.viewport, { height: 950, scale: 1 });
app.browser.emit('resize');
app.flush();
assert.equal(app.read().width, 1280);
assert.equal(app.read().height, 900);
app.viewport.emit('resize');
app.unmount();
for (const target of [app.viewport, app.browser, app.document]) assert.equal(target.listeners.size, 0);

const fallback = mount({ hasVisualViewport: false });
assert.equal(fallback.read().height, 844);
fallback.document.documentElement.clientHeight = 430;
fallback.browser.emit('resize');
fallback.flush();
assert.equal(fallback.read().height, 430);
fallback.unmount();

const native = mount({ platform: 'ios' });
assert.equal(native.read(), native.nativeDimensions);
assert.equal(native.browser.listeners.size, 0);
native.unmount();
console.log('Onboarding viewport checks passed: zoom, keyboard resize/pan, invalid sizes, browser return, orientation, fallback, cleanup, native.');
