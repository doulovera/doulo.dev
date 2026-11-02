/**
 * Ordered-dither renderer for the page's decorative layers:
 * the backdrop, the hero sphere, the title dissolve and the tile washes.
 *
 * Everything here is progressive enhancement. Without JS the page is still a
 * complete dark link grid.
 */
(() => {
  const CELL = 3; // Size of one dither pixel, in CSS pixels.
  const BAYER_SIZE = 8;
  const BAYER = buildBayer(BAYER_SIZE);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /** Builds a size x size Bayer matrix of thresholds in the range (0, 1). */
  function buildBayer(size) {
    let matrix = [0];
    for (let n = 1; n < size; n *= 2) {
      const next = new Array(n * n * 4);
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const v = matrix[y * n + x] * 4;
          next[y * 2 * n + x] = v;
          next[y * 2 * n + x + n] = v + 2;
          next[(y + n) * 2 * n + x] = v + 3;
          next[(y + n) * 2 * n + x + n] = v + 1;
        }
      }
      matrix = next;
    }
    return Float32Array.from(matrix, (v) => (v + 0.5) / (size * size));
  }

  const threshold = (x, y) => BAYER[(y % BAYER_SIZE) * BAYER_SIZE + (x % BAYER_SIZE)];
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /** Packs a colour for a Uint32Array view of ImageData (little-endian RGBA). */
  const pack = (r, g, b) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;

  function parseColor(hex) {
    const n = parseInt(hex.trim().slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /** Sizes a canvas to one pixel per dither cell and returns a drawing surface. */
  function createSurface(canvas, cssWidth, cssHeight) {
    const width = Math.max(1, Math.ceil(cssWidth / CELL));
    const height = Math.max(1, Math.ceil(cssHeight / CELL));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(width, height);
    return {
      width,
      height,
      pixels: new Uint32Array(image.data.buffer),
      flush: () => ctx.putImageData(image, 0, 0),
    };
  }

  function onResize(callback) {
    let timer;
    addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(callback, 120);
    });
  }

  /* ---------- Backdrop: a static field of dither rising from the page floor ---------- */
  function initBackdrop(canvas) {
    const color = pack(25, 25, 29);

    const draw = () => {
      const { width, height, pixels, flush } = createSurface(canvas, innerWidth, innerHeight);
      for (let y = 0; y < height; y++) {
        const rise = clamp01((y / height - 0.5) / 0.5);
        for (let x = 0; x < width; x++) {
          const swell = 0.75 + 0.25 * Math.sin(x * 0.018 + y * 0.006);
          const value = rise * rise * swell * 0.45;
          pixels[y * width + x] = value > threshold(x, y) ? color : 0;
        }
      }
      flush();
    };

    draw();
    onResize(draw);
  }

  /* ---------- Hero sphere: a textured planet, lit by the pointer ---------- */
  function buildPlanetTexture(width, height) {
    // Layered, horizontally wrapping value noise, stretched into soft bands.
    const texture = new Float32Array(width * height);
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    const layers = [
      { cellsX: 3, cellsY: 9, weight: 0.55 },
      { cellsX: 6, cellsY: 22, weight: 0.3 },
      { cellsX: 14, cellsY: 44, weight: 0.15 },
    ];

    for (const { cellsX, cellsY, weight } of layers) {
      const lattice = Float32Array.from({ length: cellsX * (cellsY + 1) }, random);
      const at = (cx, cy) => lattice[cy * cellsX + (cx % cellsX)];
      for (let y = 0; y < height; y++) {
        const gy = (y / height) * cellsY;
        const y0 = Math.floor(gy);
        const fy = gy - y0;
        const sy = fy * fy * (3 - 2 * fy);
        for (let x = 0; x < width; x++) {
          const gx = (x / width) * cellsX;
          const x0 = Math.floor(gx);
          const fx = gx - x0;
          const sx = fx * fx * (3 - 2 * fx);
          const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
          const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
          texture[y * width + x] += (top * (1 - sy) + bottom * sy) * weight;
        }
      }
    }
    return texture;
  }

  function initOrb(canvas) {
    const TEX_W = 512;
    const TEX_H = 256;
    const FRAME_MS = 1000 / 24;
    const TILT = -0.38;
    const texture = buildPlanetTexture(TEX_W, TEX_H);
    const bright = pack(240, 240, 236);
    const mid = pack(104, 104, 112);
    const dim = pack(44, 44, 50);

    let surface;
    let disc = [];
    let halo = [];

    const layout = () => {
      const size = canvas.clientWidth;
      surface = createSurface(canvas, size, size);
      const { width } = surface;
      const center = (width - 1) / 2;
      const radius = width * 0.39;
      const sinTilt = Math.sin(TILT);
      const cosTilt = Math.cos(TILT);
      disc = [];
      halo = [];

      for (let y = 0; y < width; y++) {
        for (let x = 0; x < width; x++) {
          const nx = (x - center) / radius;
          const ny = (y - center) / radius;
          const r2 = nx * nx + ny * ny;
          const index = y * width + x;
          const bayer = threshold(x, y);

          if (r2 <= 1) {
            const nz = Math.sqrt(1 - r2);
            // Tilt the texture's axis so the bands sit at an angle.
            const tx = nx * cosTilt - ny * sinTilt;
            const ty = nx * sinTilt + ny * cosTilt;
            disc.push({
              index,
              bayer,
              nx,
              ny,
              nz,
              u: Math.atan2(tx, nz) / (Math.PI * 2),
              v: Math.floor((Math.asin(clamp01((ty + 1) / 2) * 2 - 1) / Math.PI + 0.5) * (TEX_H - 1)),
            });
          } else {
            const r = Math.sqrt(r2);
            if (r < 1.26) {
              halo.push({ index, bayer, nx: nx / r, ny: ny / r, falloff: 1 - (r - 1) / 0.26 });
            }
          }
        }
      }
    };

    // Light position: eases towards the pointer, otherwise drifts in a slow arc.
    const light = { x: -0.55, y: -0.6 };
    let pointer = null;

    const draw = (time) => {
      const { pixels, flush } = surface;
      const drift = time * 0.00018;
      const targetX = pointer ? pointer.x : -0.55 + Math.sin(drift) * 0.35;
      const targetY = pointer ? pointer.y : -0.55 + Math.cos(drift * 0.8) * 0.2;
      light.x += (targetX - light.x) * 0.08;
      light.y += (targetY - light.y) * 0.08;

      const lz = 0.62;
      const length = Math.hypot(light.x, light.y, lz);
      const lx = light.x / length;
      const ly = light.y / length;
      const lnz = lz / length;
      const rotation = time * 0.000012;

      pixels.fill(0);

      for (const p of disc) {
        // A little ambient and rim light keeps the whole disc visible on the dark side.
        const edge = 1 - p.nz;
        const ambient = 0.07 + edge * edge * edge * 0.3;
        const lambert = p.nx * lx + p.ny * ly + p.nz * lnz;
        if (lambert <= 0) {
          if (ambient * 2 + p.bayer >= 1) pixels[p.index] = mid;
          continue;
        }
        const u = (p.u + rotation) % 1;
        const tex = texture[p.v * TEX_W + Math.floor((u < 0 ? u + 1 : u) * TEX_W)];
        const band = clamp01((tex - 0.36) / 0.28);
        const value = lambert * (0.2 + 0.72 * band * band * (3 - 2 * band));
        // Three tones: ordered dither between transparent, grey and near-white.
        const level = (value + ambient) * 2 + p.bayer;
        if (level >= 2) pixels[p.index] = bright;
        else if (level >= 1) pixels[p.index] = mid;
      }

      for (const p of halo) {
        const facing = clamp01(p.nx * lx + p.ny * ly + 0.35);
        if (p.falloff * p.falloff * facing * 0.62 > p.bayer) pixels[p.index] = dim;
      }

      flush();
    };

    layout();
    onResize(() => {
      layout();
      draw(performance.now());
    });
    draw(0);

    addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        const rect = canvas.getBoundingClientRect();
        // Limited so the light stays above the horizon, wherever the pointer goes.
        pointer = {
          x: Math.max(-1.2, Math.min(1.2, ((event.clientX - rect.left) / rect.width - 0.5) * 2.6)),
          y: Math.max(-1.2, Math.min(0.3, ((event.clientY - rect.top) / rect.height - 0.5) * 2.6)),
        };
      },
      { passive: true },
    );
    document.documentElement.addEventListener("pointerleave", () => {
      pointer = null;
    });

    let visible = true;
    let frame = 0;
    let last = 0;

    const tick = (time) => {
      frame = requestAnimationFrame(tick);
      if (time - last < FRAME_MS) return;
      last = time;
      draw(time);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (visible && !document.hidden && !reducedMotion.matches) {
        frame = requestAnimationFrame(tick);
      }
    };

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(canvas);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    sync();
  }

  /* ---------- Title: the last line dissolves into dither (real text, masked) ---------- */
  function initTitle(title) {
    const apply = () => {
      const scale = Math.max(1, Math.round(devicePixelRatio || 1));
      // Finer cells on small type, so the dither doesn't eat the letterforms.
      const cell = parseFloat(getComputedStyle(title).fontSize) < 90 ? 1 : 2;
      const rows = Math.ceil(title.offsetHeight / cell);
      const canvas = document.createElement("canvas");
      canvas.width = BAYER_SIZE * cell * scale;
      canvas.height = rows * cell * scale;
      const ctx = canvas.getContext("2d");
      const start = rows * 0.7;

      for (let y = 0; y < rows; y++) {
        // Bottoms out at 40% coverage so the name always stays legible.
        const coverage = y < start ? 1 : 1 - ((y - start) / (rows - start)) * 0.6;
        for (let x = 0; x < BAYER_SIZE; x++) {
          if (coverage > threshold(x, y)) {
            ctx.fillRect(x * cell * scale, y * cell * scale, cell * scale, cell * scale);
          }
        }
      }

      const mask = `url(${canvas.toDataURL()})`;
      const size = `${BAYER_SIZE * cell}px ${rows * cell}px`;
      for (const prefix of ["webkitMask", "mask"]) {
        title.style[`${prefix}Image`] = mask;
        title.style[`${prefix}Size`] = size;
        title.style[`${prefix}Repeat`] = "repeat-x";
      }
    };

    apply();
    onResize(apply);
    document.fonts?.ready.then(apply);
  }

  /* ---------- Tiles: a grey dither at rest that blooms in colour from the pointer ---------- */
  function initTile(tile) {
    const canvas = tile.querySelector(".tile__dither");
    const rest = [58, 58, 64];
    const accent = parseColor(getComputedStyle(tile).getPropertyValue("--accent"));

    let surface;
    let progress = 0;
    let target = 0;
    let frame = 0;
    const origin = { x: 0.8, y: 0.8 };
    const aim = { x: 0.8, y: 0.8 };

    const draw = () => {
      const { width, height, pixels, flush } = surface;
      const aspect = width / height;
      const color = pack(
        Math.round(rest[0] + (accent[0] - rest[0]) * progress),
        Math.round(rest[1] + (accent[1] - rest[1]) * progress),
        Math.round(rest[2] + (accent[2] - rest[2]) * progress),
      );
      const reach = 0.5 + 1.1 * progress;

      for (let y = 0; y < height; y++) {
        const v = y / height;
        for (let x = 0; x < width; x++) {
          const u = x / width;
          // Resting glow in the bottom-right corner, away from the text.
          const corner = clamp01(1 - Math.hypot((1 - u) * aspect, 1 - v) / (0.62 * Math.max(aspect, 1)));
          const bloom = clamp01(1 - Math.hypot((u - origin.x) * aspect, v - origin.y) / reach);
          const value = Math.max(corner * corner * 0.72, bloom * bloom * progress * 0.95);
          pixels[y * width + x] = value > threshold(x, y) ? color : 0;
        }
      }
      flush();
    };

    const animate = () => {
      progress += (target - progress) * 0.13;
      origin.x += (aim.x - origin.x) * 0.16;
      origin.y += (aim.y - origin.y) * 0.16;
      const settled =
        Math.abs(target - progress) < 0.004 &&
        Math.abs(aim.x - origin.x) < 0.002 &&
        Math.abs(aim.y - origin.y) < 0.002;
      if (settled) {
        progress = target;
        origin.x = aim.x;
        origin.y = aim.y;
      }
      draw();
      frame = settled ? 0 : requestAnimationFrame(animate);
    };

    const wake = () => {
      if (reducedMotion.matches) {
        progress = target;
        origin.x = aim.x;
        origin.y = aim.y;
        draw();
      } else if (!frame) {
        frame = requestAnimationFrame(animate);
      }
    };

    const aimAt = (event) => {
      const rect = tile.getBoundingClientRect();
      aim.x = (event.clientX - rect.left) / rect.width;
      aim.y = (event.clientY - rect.top) / rect.height;
    };

    tile.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      aimAt(event);
      origin.x = aim.x;
      origin.y = aim.y;
      target = 1;
      wake();
    });
    tile.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;
      aimAt(event);
      wake();
    });
    tile.addEventListener("pointerleave", () => {
      target = tile.matches(":focus-visible") ? 1 : 0;
      wake();
    });
    tile.addEventListener("focus", () => {
      if (!tile.matches(":focus-visible")) return;
      target = 1;
      wake();
    });
    tile.addEventListener("blur", () => {
      target = tile.matches(":hover") ? 1 : 0;
      wake();
    });

    const layout = () => {
      surface = createSurface(canvas, tile.clientWidth, tile.clientHeight);
      draw();
    };

    layout();
    onResize(layout);
  }

  const backdrop = document.querySelector(".backdrop");
  const orb = document.querySelector(".hero__orb");
  const title = document.querySelector(".hero__title");

  if (backdrop) initBackdrop(backdrop);
  if (orb) initOrb(orb);
  if (title) initTitle(title);
  document.querySelectorAll(".tile").forEach(initTile);
})();
