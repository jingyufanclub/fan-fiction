const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(
  process.env.CURSOR_SOURCE || resolve(__dirname, "../scripts/emoji-cursor.js"),
  "utf8",
);

function browser({ ratio = 2, contextAvailable = true } = {}) {
  const window = new EventTarget();
  const document = new EventTarget();
  const body = new EventTarget();
  const frames = new Map();
  const canvases = [];
  let now = 0;
  let nextFrame = 0;
  let pageLoads = 0;

  window.innerWidth = 1280;
  window.innerHeight = 720;
  window.devicePixelRatio = ratio;
  window.onload = () => { pageLoads += 1; };
  window.matchMedia = () => ({ matches: true });
  document.hidden = false;
  document.body = body;
  body.children = [];
  body.append = (...elements) => body.children.push(...elements);
  body.appendChild = (element) => body.append(element);

  document.createElement = (tag) => {
    assert.equal(tag, "canvas");
    const attributes = new Map();
    const context = {
      visible: [],
      glyphs: [],
      clearRect() { this.visible = []; },
      drawImage(...args) { this.visible.push(args); },
      fillText(glyph) { this.glyphs.push(glyph); },
      measureText() { return { width: 21, actualBoundingBoxAscent: 21 }; },
      setTransform(...args) { this.transform = args; },
    };
    const canvas = {
      style: {},
      dataset: {},
      width: 300,
      height: 150,
      context,
      getContext: () => contextAvailable ? context : null,
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: (name) => attributes.get(name),
    };
    canvases.push(canvas);
    return canvas;
  };

  function requestAnimationFrame(callback) {
    frames.set(++nextFrame, callback);
    return nextFrame;
  }

  function cancelAnimationFrame(id) { frames.delete(id); }
  window.requestAnimationFrame = requestAnimationFrame;
  window.cancelAnimationFrame = cancelAnimationFrame;

  const math = Object.create(Math);
  math.random = () => 0.5;
  const sandbox = {
    window, document, requestAnimationFrame, cancelAnimationFrame,
    performance: { now: () => now }, Math: math,
  };

  function fire(type, properties = {}, target = window) {
    const event = new Event(type, { cancelable: true });
    for (const [key, value] of Object.entries(properties)) {
      Object.defineProperty(event, key, { value });
    }
    Object.defineProperty(event, "timeStamp", { value: now });
    if (type.startsWith("mouse") || type.startsWith("touch")) {
      body.dispatchEvent(event);
    }
    target.dispatchEvent(event);
    return event;
  }

  function tick(milliseconds = 1000 / 60) {
    now += milliseconds;
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(now));
  }

  function load() {
    vm.runInNewContext(source, sandbox);
    window.onload?.();
    fire("load");
  }

  return {
    window, document, body, frames, canvases, fire, tick, load,
    get pageLoads() { return pageLoads; },
    get overlay() { return body.children[0]; },
  };
}

test("pointer movement creates the familiar falling, shrinking emoji trail", () => {
  const page = browser();
  page.load();
  page.tick(20);
  page.fire("mousemove", { clientX: 200, clientY: 150 });
  page.tick();
  page.tick();
  const first = [...page.overlay.context.visible[0]];
  page.tick();
  const next = page.overlay.context.visible[0];
  assert.equal(page.body.children.length, 1);
  assert.deepEqual(
    page.canvases.flatMap((canvas) => canvas.context.glyphs).sort(),
    ["🌸", "👛", "🩰", "🎀"].sort(),
  );
  assert.ok(next[2] > first[2], "the emoji falls");
  assert.ok(next[3] < first[3], "the emoji shrinks as it ages");
});

test("loading the cursor preserves the magazine's existing load handler", () => {
  const page = browser();
  page.load();
  assert.equal(page.pageLoads, 1);
});

test("the decorative overlay passes clicks through and is hidden from assistive technology", () => {
  const page = browser();
  page.load();
  assert.equal(page.overlay.style.pointerEvents, "none");
  assert.equal(page.overlay.getAttribute("aria-hidden"), "true");
});

test("touch gestures emit the trail without canceling native scrolling", () => {
  const page = browser();
  page.load();
  const start = page.fire("touchstart", {
    touches: [{ clientX: 100, clientY: 100 }],
  });
  page.tick(30);
  const move = page.fire("touchmove", {
    touches: [{ clientX: 110, clientY: 140 }],
  });
  page.tick();
  assert.equal(start.defaultPrevented, false);
  assert.equal(move.defaultPrevented, false);
  assert.ok(page.overlay.context.visible.length > 0);
});

test("the trail stops requesting frames once every particle has disappeared", () => {
  const page = browser();
  page.load();
  page.tick(20);
  page.fire("mousemove", { clientX: 200, clientY: 150 });
  page.tick();
  page.tick();
  assert.ok(page.overlay.context.visible.length > 0);
  for (let i = 0; i < 240; i += 1) page.tick();
  assert.equal(page.frames.size, 0);
  assert.equal(page.overlay.context.visible.length, 0);
});

test("60 Hz and 120 Hz displays show the same trail position after one second", () => {
  function atOneSecond(hertz) {
    const page = browser();
    page.load();
    page.tick(20);
    page.fire("mousemove", { clientX: 200, clientY: 150 });
    for (let i = 0; i < hertz; i += 1) page.tick(1000 / hertz);
    return page.overlay.context.visible[0]?.slice(1);
  }
  const normal = atOneSecond(60);
  const fast = atOneSecond(120);
  assert.ok(normal && fast, "the trail is still present after one second");
  normal.forEach((value, index) => {
    assert.ok(Math.abs(value - fast[index]) < 0.001);
  });
});

test("resize keeps the overlay in viewport coordinates at the current pixel density", () => {
  const page = browser();
  page.load();
  page.window.innerWidth = 390;
  page.window.innerHeight = 844;
  page.window.devicePixelRatio = 3;
  page.fire("resize");
  assert.equal(page.body.children.length, 1);
  assert.equal(page.overlay.width, 1170);
  assert.equal(page.overlay.height, 2532);
  assert.equal(page.overlay.style.width, "390px");
  assert.equal(page.overlay.style.height, "844px");
  assert.deepEqual(page.overlay.context.transform, [3, 0, 0, 3, 0, 0]);
});

test("hiding and returning to a page clears old particles and accepts new movement", () => {
  const page = browser();
  page.load();
  page.tick(20);
  page.fire("mousemove", { clientX: 200, clientY: 150 });
  page.tick();
  page.tick();
  assert.ok(page.overlay.context.visible.length > 0);
  page.document.hidden = true;
  page.fire("visibilitychange", {}, page.document);
  assert.equal(page.frames.size, 0);
  assert.equal(page.overlay.context.visible.length, 0);
  page.document.hidden = false;
  page.fire("visibilitychange", {}, page.document);
  page.fire("mousemove", { clientX: 400, clientY: 250 });
  page.tick();
  assert.ok(page.overlay.context.visible.length > 0);
  page.fire("pagehide");
  assert.equal(page.frames.size, 0);
  assert.equal(page.overlay.context.visible.length, 0);
  page.fire("pageshow");
  page.fire("mousemove", { clientX: 450, clientY: 300 });
  page.tick();
  assert.ok(page.overlay.context.visible.length > 0);
});

test("a browser without canvas rendering can still load the page", () => {
  const page = browser({ contextAvailable: false });
  assert.doesNotThrow(() => page.load());
  assert.equal(page.body.children.length, 0);
  assert.equal(page.pageLoads, 1);
});
