function initEmojiCursor() {
  const emoji = ["🌸", "👛", "🩰", "🎀"];
  const spriteSize = 32;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    pointerEvents: "none",
    zIndex: "1000",
  });

  let width = 0;
  let height = 0;
  let ratio = 0;
  let sprites = [];
  let particles = [];
  let frame = 0;
  let lastEmission = -Infinity;
  let lastMouse = null;

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    particles = [];
    lastMouse = null;
    lastEmission = -Infinity;
    context.clearRect(0, 0, width, height);
  }

  function resize() {
    clear();
    width = window.innerWidth;
    height = window.innerHeight;
    const nextRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * nextRatio);
    canvas.height = Math.round(height * nextRatio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    context.setTransform(nextRatio, 0, 0, nextRatio, 0, 0);

    if (nextRatio !== ratio) {
      ratio = nextRatio;
      sprites = emoji.map((glyph) => {
        const sprite = document.createElement("canvas");
        sprite.width = Math.ceil(spriteSize * ratio);
        sprite.height = Math.ceil(spriteSize * ratio);
        const ink = sprite.getContext("2d");
        ink.setTransform(ratio, 0, 0, ratio, 0, 0);
        ink.font = "21px serif";
        ink.textAlign = "center";
        ink.textBaseline = "middle";
        ink.fillText(glyph, spriteSize / 2, spriteSize / 2);
        return sprite;
      });
    }
  }

  function draw(now) {
    frame = 0;
    context.clearRect(0, 0, width, height);
    particles = particles.filter((particle) => now - particle.born < particle.duration);

    for (const particle of particles) {
      const age = now - particle.born;
      const seconds = age / 1000;
      const size = spriteSize * (1 - age / particle.duration);
      const x = particle.x + particle.vx * seconds;
      const y = particle.y + particle.vy * seconds + 90 * seconds * seconds;
      context.drawImage(particle.sprite, x - size / 2, y - size / 2, size, size);
    }

    if (particles.length) frame = requestAnimationFrame(draw);
  }

  function emit(points) {
    const now = performance.now();
    if (document.hidden || now - lastEmission < 16 || !points.length) return;
    lastEmission = now;

    for (const point of points) {
      particles.push({
        x: point.clientX,
        y: point.clientY,
        born: now,
        duration: (80 + Math.random() * 60) * 1000 / 60,
        vx: (Math.random() - 0.5) * 30,
        vy: 48 + Math.random() * 24,
        sprite: sprites[Math.floor(Math.random() * sprites.length)],
      });
    }

    if (!frame) frame = requestAnimationFrame(draw);
  }

  function onMouseMove(event) {
    if (lastMouse && Math.hypot(
      event.clientX - lastMouse.x,
      event.clientY - lastMouse.y,
    ) <= 1) return;
    emit([event]);
    lastMouse = { x: event.clientX, y: event.clientY };
  }

  function onTouchMove(event) {
    emit(Array.from(event.touches));
  }

  resize();
  document.body.append(canvas);
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("touchstart", onTouchMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener("pagehide", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
}

initEmojiCursor();
