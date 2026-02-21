/* ============================================================
   chalkboard.js  —  canvas drawing engine
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
(function () {
  "use strict";

  // ── Canvases ────────────────────────────────────────────
  const canvas     = document.getElementById("chalk-canvas");
  const dustCanvas = document.getElementById("dust-canvas");
  const ctx        = canvas.getContext("2d");
  const dctx       = dustCanvas.getContext("2d");

  // ── State ───────────────────────────────────────────────
  let tool         = "chalk";          // "chalk" | "eraser"
  let color        = "#f0ece0";
  let brushSize    = 3;
  let isDrawing    = false;
  let isHolding    = false;            // eraser hold-to-erase
  let holdTimer    = null;
  let lastX        = 0;
  let lastY        = 0;
  let drawingMode  = false;
  let dustParticles = [];
  let rafId        = null;

  // ── Resize ──────────────────────────────────────────────
  // Canvas must cover the FULL document, not just the viewport,
  // so that drawings stay anchored to page content when scrolling.
  function docSize() {
    return {
      w: Math.max(document.body.scrollWidth,  document.documentElement.scrollWidth,  window.innerWidth),
      h: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight),
    };
  }

  function resize() {
    const { w, h } = docSize();
    // Save current drawing before resize wipes the pixel data
    const img = canvas.toDataURL();
    canvas.width      = w;
    canvas.height     = h;
    dustCanvas.width  = w;
    dustCanvas.height = h;
    // Restore drawing
    const i = new Image();
    i.onload = () => ctx.drawImage(i, 0, 0);
    i.src = img;
  }

  window.addEventListener("resize", resize);
  resize();

  // When dynamically-loaded content (posts, poems) makes the page taller,
  // grow the canvas to match so you can draw all the way to the bottom.
  const _ro = new ResizeObserver(() => {
    const { w, h } = docSize();
    if (w !== canvas.width || h !== canvas.height) resize();
  });
  _ro.observe(document.body);

  // ── Chalk drawing helpers ────────────────────────────────
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return {r,g,b};
  }

  /**
   * Draw a chalk-textured line segment from (px,py) to (x,y).
   * Uses multiple semi-transparent strokes with random offsets
   * to mimic real chalk.
   */
  function drawChalkSegment(x, y, px, py) {
    const dist  = Math.hypot(x - px, y - py);
    const steps = Math.max(1, Math.floor(dist / 1.5));
    const {r,g,b} = hexToRgb(color);

    ctx.lineCap   = "round";
    ctx.lineJoin  = "round";

    for (let s = 0; s <= steps; s++) {
      const t  = s / steps;
      const cx = px + (x - px) * t;
      const cy = py + (y - py) * t;

      // Main stroke
      ctx.beginPath();
      ctx.arc(cx, cy, brushSize * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + Math.random() * 0.3})`;
      ctx.fill();

      // Texture grain — smaller scattered dots
      for (let j = 0; j < 3; j++) {
        const ox = (Math.random() - 0.5) * brushSize * 1.4;
        const oy = (Math.random() - 0.5) * brushSize * 1.4;
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, brushSize * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.2 + Math.random() * 0.25})`;
        ctx.fill();
      }
    }
  }

  // ── Eraser ───────────────────────────────────────────────
  function erase(x, y) {
    const r = (brushSize + 6) * 2.5;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fill();
    ctx.restore();
  }

  // ── Chalk dust particles ─────────────────────────────────
  // x, y here are always VIEWPORT coords (not document coords),
  // because dust is a purely visual effect that lives in the air —
  // it doesn't need to be anchored to the page like chalk marks do.
  // The dust canvas is position:fixed so viewport coords map directly.
  function spawnDust(vx, vy, count) {
    count = count || (28 + Math.floor(Math.random() * 18));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 2.8;
      const grey  = Math.floor(190 + Math.random() * 60);
      dustParticles.push({
        x: vx, y: vy,
        vx:   Math.cos(angle) * speed,
        vy:   Math.sin(angle) * speed - 1.2,
        life: 1,
        fade: 0.018 + Math.random() * 0.025,
        size: 1.5 + Math.random() * 3.5,
        r: grey, g: grey, b: grey,
      });
    }
    if (!rafId) animateDust();
  }

  function animateDust() {
    dctx.clearRect(0, 0, dustCanvas.width, dustCanvas.height);
    dustParticles = dustParticles.filter(p => p.life > 0);
    for (const p of dustParticles) {
      p.x   += p.vx;
      p.y   += p.vy;
      p.vy  += 0.06;        // gravity
      p.vx  *= 0.97;        // drag
      p.life -= p.fade;
      dctx.beginPath();
      dctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      dctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.life * 0.65})`;
      dctx.fill();
    }
    if (dustParticles.length > 0) {
      rafId = requestAnimationFrame(animateDust);
    } else {
      rafId = null;
    }
  }

  // ── Pointer events ───────────────────────────────────────
  // Document coords — used for chalk drawing (canvas is position:absolute)
  function getPos(e) {
    const sx = window.scrollX;
    const sy = window.scrollY;
    if (e.touches) {
      return {
        x: e.touches[0].clientX + sx,
        y: e.touches[0].clientY + sy,
      };
    }
    return { x: e.clientX + sx, y: e.clientY + sy };
  }

  // Viewport coords — used for dust (dust canvas is position:fixed)
  function getViewportPos(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (!drawingMode) return;
    const {x, y}    = getPos(e);
    const {x: vx, y: vy} = getViewportPos(e);
    lastX = x; lastY = y;

    // Collapse the options panel while drawing so it's out of the way
    panel.classList.add("minimized");

    if (tool === "eraser") {
      // Initial click = big dust burst; hold = erase + trickle dust
      spawnDust(vx, vy);  // full burst (default count ~30–45)
      holdTimer = setTimeout(() => {
        isHolding = true;
        erase(x, y);
      }, 160);
    } else {
      isDrawing = true;
      drawChalkSegment(x, y, x, y);
      saveCanvas();
    }

    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drawingMode) return;
    const {x, y}         = getPos(e);
    const {x: vx, y: vy} = getViewportPos(e);

    if (tool === "eraser" && isHolding) {
      erase(x, y);
      // Trickle a small amount of dust as the eraser moves — about 1/8 of the burst
      if (Math.random() < 0.6) spawnDust(vx, vy, 3 + Math.floor(Math.random() * 4));
      saveCanvas();
    } else if (tool === "chalk" && isDrawing) {
      drawChalkSegment(x, y, lastX, lastY);
    }
    lastX = x; lastY = y;
    e.preventDefault();
  });

  canvas.addEventListener("pointerup", () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (isHolding) { saveCanvas(); }
    isDrawing = false;
    isHolding = false;
    // Restore the panel once the stroke is done
    panel.classList.remove("minimized");
  });

  canvas.addEventListener("pointercancel", () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    isDrawing = false;
    isHolding = false;
    panel.classList.remove("minimized");
  });

  // ── LocalStorage persistence ─────────────────────────────
  const STORAGE_KEY = "chalkCanvas_" + window.location.pathname;

  function saveCanvas() {
    try {
      localStorage.setItem(STORAGE_KEY, canvas.toDataURL());
    } catch(e) { /* quota exceeded — silently ignore */ }
  }

  function loadCanvas() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    }
  }

  // ── Initial markings API ─────────────────────────────────
  /**
   * Called by individual pages to draw custom initial chalk art.
   * Only drawn if there is NO saved state for this page,
   * so user edits won't get overwritten on reload.
   */
  window.drawInitialMarkings = function(drawFn) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Wait for canvas to be sized, then draw
      setTimeout(() => drawFn(ctx, canvas), 120);
    }
  };

  // ── Toolbar wiring ────────────────────────────────────────
  const toggleBtn  = document.getElementById("draw-toggle-btn");
  const panel      = document.getElementById("draw-panel");
  const eraserBtn  = document.getElementById("eraser-btn");
  const clearBtn   = document.getElementById("clear-btn");
  const brushInput = document.getElementById("brush-size");
  const swatches   = document.querySelectorAll(".swatch");

  toggleBtn.addEventListener("click", () => {
    drawingMode = !drawingMode;
    toggleBtn.classList.toggle("active", drawingMode);
    panel.classList.toggle("visible", drawingMode);
    document.body.classList.toggle("drawing-mode", drawingMode && tool !== "eraser");
    document.body.classList.toggle("drawing-mode-eraser", drawingMode && tool === "eraser");
    toggleBtn.querySelector(".toggle-label").textContent =
      drawingMode ? "stop drawing" : "draw on board";
  });

  eraserBtn.addEventListener("click", () => {
    tool = "eraser";
    eraserBtn.classList.add("selected");
    swatches.forEach(s => s.classList.remove("selected"));
    document.body.classList.remove("drawing-mode");
    document.body.classList.add("drawing-mode-eraser");
  });

  swatches.forEach(sw => {
    sw.addEventListener("click", () => {
      color = sw.dataset.color;
      tool  = "chalk";
      sw.classList.add("selected");
      eraserBtn.classList.remove("selected");
      document.body.classList.remove("drawing-mode-eraser");
      if (drawingMode) document.body.classList.add("drawing-mode");
    });
  });

  brushInput.addEventListener("input", () => {
    brushSize = parseInt(brushInput.value);
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Erase all your chalk drawings on this page?")) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      localStorage.removeItem(STORAGE_KEY);
      // Re-draw initial markings if defined
      if (window._initialMarkingsFn) {
        window._initialMarkingsFn(ctx, canvas);
      }
    }
  });

  // Keyboard: Escape exits draw mode
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawingMode) {
      drawingMode = false;
      toggleBtn.classList.remove("active");
      panel.classList.remove("visible");
      document.body.classList.remove("drawing-mode", "drawing-mode-eraser");
      toggleBtn.querySelector(".toggle-label").textContent = "draw on board";
    }
  });

  // ── Init ─────────────────────────────────────────────────
  // Select first swatch as default
  if (swatches.length) {
    swatches[0].classList.add("selected");
    color = swatches[0].dataset.color;
  }

  // Load saved canvas (after a tiny delay so canvas is sized)
  window.addEventListener("load", () => {
    setTimeout(loadCanvas, 80);
  });

  // Save on page unload
  window.addEventListener("beforeunload", () => {
    if (ctx) saveCanvas();
  });

  // Expose for external use
  window._chalkCtx     = ctx;
  window._chalkCanvas  = canvas;
  window._saveCanvas   = saveCanvas;

})();
}); // end DOMContentLoaded