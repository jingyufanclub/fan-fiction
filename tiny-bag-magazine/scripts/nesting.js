const nest = document.querySelector("#nest");
const stage = nest.querySelector(".stage");
const bags = [...nest.querySelectorAll(".bag")];
const motionToggle = document.querySelector(".motion-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let height = 0;
let sizes = [];
let frame = 0;
let animated = false;
let motionOverride = null;

const clamp = (value) => Math.max(0, Math.min(1, value));
const mix = (start, end, progress) => start + (end - start) * progress;
const smooth = (value) => value * value * (3 - 2 * value);
const restingTop = (index) => height * 0.56 - sizes[index] / 2;

function place(index, top, opacity, clip = 0) {
  const bag = bags[index];
  bag.style.transform = `translate3d(0, ${top}px, 0)`;
  bag.style.opacity = opacity;
  bag.style.clipPath = `inset(0 0 ${clip}px 0)`;
}

function render() {
  frame = 0;
  if (!animated) return;

  const distance = -nest.getBoundingClientRect().top;
  const progress = Math.max(0, Math.min(bags.length - 1,
    (distance - height * 0.18) / (height * 1.18)));
  const current = Math.floor(progress);
  const local = progress - current;

  bags.forEach((bag) => { bag.style.opacity = 0; });

  if (current === bags.length - 1) {
    place(current, restingTop(current), 1);
    return;
  }

  const next = current + 1;
  const parentTop = restingTop(current);
  const parentMouth = parentTop + sizes[current] * Number(bags[current].dataset.mouth);
  const drop = smooth(clamp((local - 0.18) / 0.62));
  const parentY = mix(parentTop, height + sizes[current] * 0.1, drop);
  const launch = 1 - (1 - clamp((local - 0.04) / 0.54)) ** 3;
  const settle = smooth(clamp((local - 0.58) / 0.32));
  const peak = Math.max(height * 0.08, restingTop(next) - height * 0.22);
  const childY = mix(mix(parentMouth, peak, launch), restingTop(next), settle);
  const rimY = parentMouth + parentY - parentTop;
  const clip = Math.max(0, Math.min(sizes[next], childY + sizes[next] - rimY));
  const fade = smooth(clamp((local - 0.25) / 0.48));

  place(current, parentY, 1 - fade);
  place(next, childY, 1, clip);
}

function requestRender() {
  if (animated && !frame) frame = requestAnimationFrame(render);
}

function measure() {
  if (!animated) return;
  height = stage.clientHeight;
  sizes = bags.map((bag) => bag.querySelector("img").getBoundingClientRect().height);
  nest.style.height = `${height * (1 + 0.18 + (bags.length - 1) * 1.18 + 0.3)}px`;
  requestRender();
}

function setMotion(preservePosition = false) {
  const position = clamp(-nest.getBoundingClientRect().top / Math.max(1, nest.offsetHeight - innerHeight));
  animated = (motionOverride ?? !reducedMotion.matches) && bags.length > 1;
  nest.classList.toggle("is-nesting", animated);
  motionToggle.hidden = !reducedMotion.matches;
  motionToggle.setAttribute("aria-pressed", String(animated));

  if (animated) {
    bags.forEach((bag, index) => { bag.style.zIndex = bags.length - index; });
    measure();
  } else {
    nest.style.removeProperty("height");
    bags.forEach((bag) => {
      for (const property of ["transform", "opacity", "clip-path", "z-index"]) {
        bag.style.removeProperty(property);
      }
    });
  }

  if (preservePosition) {
    window.scrollTo({ top: nest.offsetTop + position * Math.max(0, nest.offsetHeight - innerHeight), behavior: "auto" });
  }
}

window.addEventListener("scroll", requestRender, { passive: true });
window.addEventListener("resize", measure);
window.addEventListener("pageshow", measure);
reducedMotion.addEventListener("change", () => {
  motionOverride = null;
  setMotion(true);
});
motionToggle.addEventListener("click", () => {
  motionOverride = !animated;
  setMotion(true);
});
bags.forEach((bag) => bag.querySelector("img").addEventListener("load", measure));
setMotion();
