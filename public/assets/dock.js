/**
 * macOS Dock magnification physics.
 *
 * Uses a C1-continuous Hann bell curve driven by cursor position along the dock
 * axis, smoothly interpolated via requestAnimationFrame. Icons anchor to the
 * bottom edge of the frosted glass shelf and rise upward as they magnify,
 * expanding the dock width organically with zero layout jitter.
 */

const MAX_SCALE = 1.56;
const MAX_LIFT = 5;
const RADIUS_FACTOR = 2.9;
const TRACK_EASE = 0.24;
const SETTLE_EASE = 0.16;
const EPSILON = 0.08;

function initDock(dock) {
  const list = dock.querySelector(".dock-list");
  const items = Array.from(dock.querySelectorAll("[data-dock-item]"));
  const links = items.map((item) => item.querySelector(".dock-link"));

  if (!list || items.length === 0 || links.some((el) => !el)) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  let baseSize = 54;
  let gap = 11;
  let sizes = [];
  let lifts = [];
  let pointerX = null;
  let focusedIndex = -1;
  let rafId = 0;

  const readMetrics = () => {
    const styles = getComputedStyle(dock);
    const parsedBase = parseFloat(styles.getPropertyValue("--dock-base"));
    const parsedGap = parseFloat(styles.getPropertyValue("--dock-gap"));
    baseSize = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : 54;
    gap = Number.isFinite(parsedGap) && parsedGap >= 0 ? parsedGap : 11;
  };

  const resetImmediate = () => {
    cancelAnimationFrame(rafId);
    rafId = 0;
    sizes = items.map(() => baseSize);
    lifts = items.map(() => 0);
    for (let i = 0; i < links.length; i++) {
      links[i].style.removeProperty("--icon-size");
      links[i].style.removeProperty("--icon-lift");
    }
  };

  const computeInfluence = (distance, radius) => {
    if (distance >= radius) return 0;
    return 0.5 * (1 + Math.cos((Math.PI * distance) / radius));
  };

  const step = () => {
    rafId = 0;

    const maxSize = baseSize * MAX_SCALE;
    const radius = baseSize * RADIUS_FACTOR;
    const active = pointerX !== null || focusedIndex >= 0;
    const ease = active ? TRACK_EASE : SETTLE_EASE;

    // Derive each item's horizontal center analytically from current sizes
    // around the dock midpoint to avoid per-item layout feedback oscillation.
    const listRect = list.getBoundingClientRect();
    const listCenter = listRect.left + listRect.width / 2;
    let totalWidth = gap * Math.max(0, sizes.length - 1);
    for (let i = 0; i < sizes.length; i++) {
      totalWidth += sizes[i];
    }

    let cursor = listCenter - totalWidth / 2;
    const centers = new Array(sizes.length);
    for (let i = 0; i < sizes.length; i++) {
      centers[i] = cursor + sizes[i] / 2;
      cursor += sizes[i] + gap;
    }

    const anchorX = pointerX !== null ? pointerX : focusedIndex >= 0 ? centers[focusedIndex] : null;
    let settled = true;

    for (let i = 0; i < sizes.length; i++) {
      let targetSize = baseSize;
      let targetLift = 0;

      if (anchorX !== null) {
        const influence = computeInfluence(Math.abs(anchorX - centers[i]), radius);
        targetSize = baseSize + (maxSize - baseSize) * influence;
        targetLift = MAX_LIFT * influence;
      }

      const nextSize = sizes[i] + (targetSize - sizes[i]) * ease;
      const nextLift = lifts[i] + (targetLift - lifts[i]) * ease;

      if (Math.abs(targetSize - nextSize) > EPSILON || Math.abs(targetLift - nextLift) > EPSILON) {
        settled = false;
        sizes[i] = nextSize;
        lifts[i] = nextLift;
      } else {
        sizes[i] = targetSize;
        lifts[i] = targetLift;
      }

      links[i].style.setProperty("--icon-size", `${sizes[i].toFixed(2)}px`);
      links[i].style.setProperty("--icon-lift", `${lifts[i].toFixed(2)}px`);
    }

    if (!settled) {
      rafId = requestAnimationFrame(step);
    } else if (!active) {
      resetImmediate();
    }
  };

  const wake = () => {
    if (reducedMotion.matches || !finePointer.matches) return;
    if (!rafId) {
      rafId = requestAnimationFrame(step);
    }
  };

  readMetrics();
  resetImmediate();
  dock.dataset.dockReady = "true";

  dock.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    pointerX = event.clientX;
    wake();
  });

  dock.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    pointerX = event.clientX;
    wake();
  });

  dock.addEventListener("pointerleave", () => {
    pointerX = null;
    wake();
  });

  links.forEach((link, index) => {
    link.addEventListener("focus", () => {
      if (!link.matches(":focus-visible") || reducedMotion.matches) return;
      focusedIndex = index;
      wake();
    });

    link.addEventListener("blur", () => {
      if (focusedIndex === index) {
        focusedIndex = -1;
        wake();
      }
    });

    link.addEventListener("click", () => {
      if (reducedMotion.matches) return;
      const item = items[index];
      item.classList.remove("is-bouncing");
      void item.offsetWidth;
      item.classList.add("is-bouncing");
      window.setTimeout(() => item.classList.remove("is-bouncing"), 480);
    });
  });

  const handleEnvironmentChange = () => {
    readMetrics();
    pointerX = null;
    focusedIndex = -1;
    resetImmediate();
  };

  window.addEventListener("resize", handleEnvironmentChange, { passive: true });
  reducedMotion.addEventListener("change", handleEnvironmentChange);
  finePointer.addEventListener("change", handleEnvironmentChange);
}

const dockEl = document.querySelector("[data-dock]");
if (dockEl) {
  initDock(dockEl);
}
