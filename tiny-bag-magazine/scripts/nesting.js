// ============================================================
// TOTE BAG DATA — edit this array with your own bags & images!
// Ordered LARGEST → SMALLEST (outermost to innermost nesting doll)
// To use an image: add an `image` key with the path, e.g.
//   { name: '...', description: '...', image: 'images/mybag.jpg' }
// Without `image`, a dashed placeholder outline is shown.
// ============================================================
const bags = [
  {
    name: "The Enormous Tote",
    description: "Holds: a smaller tote",
    color: "#e8d5c4",
    width: 340,
    height: 400,
  },
  {
    name: "The Big Tote",
    description: "Holds: a slightly smaller tote",
    color: "#d4c4b0",
    width: 300,
    height: 360,
  },
  {
    name: "The Medium Tote",
    description: "Holds: a smaller tote, somehow",
    color: "#c9b8a8",
    width: 260,
    height: 310,
  },
  {
    name: "The Modest Tote",
    description: "Holds: yet another tote",
    color: "#bfad9c",
    width: 220,
    height: 260,
  },
  {
    name: "The Small Tote",
    description: "Holds: one more tote",
    color: "#b5a290",
    width: 180,
    height: 220,
  },
  {
    name: "The Mini Tote",
    description: "Holds: a tiny tote",
    color: "#ab9784",
    width: 140,
    height: 170,
  },
  {
    name: "The Micro Tote",
    description: "Holds: just vibes",
    color: "#a08c78",
    width: 100,
    height: 120,
  },
];

// ============================================================
// BUILD THE SCENE
// ============================================================
const stage = document.getElementById("stage");
const scrollTrack = document.getElementById("scroll-track");
const cover = document.getElementById("cover");
const hint = document.getElementById("scroll-hint");
const finale = document.getElementById("finale");
const numBags = bags.length;

// Scroll track height: 1 screen for cover + 1 screen per bag transition + 1 for finale
scrollTrack.style.height = (numBags + 2) * 100 + "dvh";

// Create bag layers (rendered in reverse so largest is behind smallest in DOM)
for (let i = numBags - 1; i >= 0; i--) {
  const bag = bags[i];
  const layer = document.createElement("div");
  layer.className = "bag-layer";
  layer.style.zIndex = numBags - i;

  if (bag.image) {
    const img = document.createElement("img");
    img.src = bag.image;
    img.alt = bag.name;
    layer.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "bag-placeholder";
    placeholder.style.width = bag.width + "px";
    placeholder.style.height = bag.height + "px";
    placeholder.style.backgroundColor = bag.color;
    placeholder.textContent = "\u{1F4E6}";
    layer.appendChild(placeholder);
  }

  const label = document.createElement("div");
  label.className = "bag-label";
  label.textContent = bag.name;
  layer.appendChild(label);

  const desc = document.createElement("div");
  desc.className = "bag-description";
  desc.textContent = bag.description;
  layer.appendChild(desc);

  stage.appendChild(layer);
  bag.element = layer;
}

// ============================================================
// SCROLL TO BOTTOM ON LOAD
// ============================================================
window.scrollTo(0, document.body.scrollHeight);

// ============================================================
// SCROLL-DRIVEN NESTING ANIMATION
// ============================================================
function update() {
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight;
  const scrollTop = window.scrollY;

  // progress: 0 at bottom (start), 1 at top (end)
  const progress = Math.min(Math.max(1 - scrollTop / maxScroll, 0), 1);

  // Cover: visible only at very start (progress 0 → ~0.08)
  const coverEnd = 0.08;
  if (progress < coverEnd) {
    const t = progress / coverEnd;
    cover.style.opacity = 1 - t;
    cover.style.display = "";
  } else {
    cover.style.opacity = 0;
    cover.style.display = "none";
  }

  // Scroll hint: fade out as you start scrolling
  if (progress < 0.05) {
    hint.style.opacity = 1;
  } else {
    hint.style.opacity = Math.max(0, 1 - (progress - 0.05) / 0.05);
  }

  // Bag transitions occupy the middle of the progress range
  const bagStart = 0.1;
  const bagEnd = 0.88;
  const bagRange = bagEnd - bagStart;
  const bagProgress = Math.min(
    Math.max((progress - bagStart) / bagRange, 0),
    1
  );

  // Map to bag index
  const continuousIndex = bagProgress * (numBags - 1);
  const currentIndex = Math.min(Math.floor(continuousIndex), numBags - 2);
  const t = continuousIndex - currentIndex;

  for (let i = 0; i < numBags; i++) {
    const layer = bags[i].element;

    if (progress < bagStart) {
      // Before bag section — show only the largest
      if (i === 0) {
        layer.style.transform = "scale(1)";
        layer.style.opacity = 1;
      } else {
        layer.style.transform = "scale(0.3)";
        layer.style.opacity = 0;
      }
    } else if (progress > bagEnd) {
      // After bag section — show only the smallest
      if (i === numBags - 1) {
        const finaleT = Math.min((progress - bagEnd) / (1 - bagEnd), 1);
        layer.style.transform = "scale(1)";
        layer.style.opacity = 1 - finaleT * 0.5;
      } else {
        layer.style.transform = "scale(3)";
        layer.style.opacity = 0;
      }
    } else if (i < currentIndex) {
      // Already "opened" — zoomed past
      layer.style.transform = "scale(3)";
      layer.style.opacity = 0;
    } else if (i === currentIndex) {
      // Current bag: scales from 1→2.5 and fades out
      const scale = 1 + t * 1.5;
      const opacity = 1 - t;
      layer.style.transform = "scale(" + scale + ")";
      layer.style.opacity = opacity;
    } else if (i === currentIndex + 1) {
      // Next bag: scales from 0.3→1 and fades in
      const scale = 0.3 + t * 0.7;
      const opacity = t;
      layer.style.transform = "scale(" + scale + ")";
      layer.style.opacity = opacity;
    } else {
      // Not yet reached — hidden small
      layer.style.transform = "scale(0.3)";
      layer.style.opacity = 0;
    }
  }

  // Finale
  const finaleStart = 0.92;
  if (progress > finaleStart) {
    const ft = (progress - finaleStart) / (1 - finaleStart);
    finale.style.opacity = ft;
  } else {
    finale.style.opacity = 0;
  }
}

window.addEventListener("scroll", update, { passive: true });
window.addEventListener("resize", update);

// Run on load after scroll position is set
requestAnimationFrame(() => {
  requestAnimationFrame(update);
});
