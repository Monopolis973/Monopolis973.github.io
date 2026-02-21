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
  let tool          = "chalk";   // "chalk" | "eraser"
  let color         = "#f0ece0";
  let brushSize     = 3;
  let isDrawing     = false;
  let isHolding     = false;
  let holdTimer     = null;
  let lastX         = 0;
  let lastY         = 0;
  let drawingMode   = false;
  let dustParticles = [];
  let rafId         = null;

  // ── Resize ──────────────────────────────────────────────
  // chalk canvas  = full document size (marks scroll with the page)
  // dust canvas   = viewport size only (dust is a fixed visual effect)
  function docSize() {
    return {
      w: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, window.innerWidth),
      h: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight),
    };
  }

  function resizeChalk() {
    const { w, h } = docSize();
    const img = canvas.toDataURL();
    canvas.width  = w;
    canvas.height = h;
    const i = new Image();
    i.onload = () => ctx.drawImage(i, 0, 0);
    i.src = img;
  }

  function resizeDust() {
    // Dust canvas is position:fixed — it only needs viewport dimensions.
    // If set to document size, the canvas coordinate space gets scaled down
    // to fit the viewport, making particle coords appear in the wrong place.
    dustCanvas.width  = window.innerWidth;
    dustCanvas.height = window.innerHeight;
  }

  window.addEventListener("resize", () => { resizeChalk(); resizeDust(); });
  resizeChalk();
  resizeDust();

  const _ro = new ResizeObserver(() => {
    const { w, h } = docSize();
    if (w !== canvas.width || h !== canvas.height) resizeChalk();
  });
  _ro.observe(document.body);

  // ── Chalk drawing ────────────────────────────────────────
  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1,3), 16),
      g: parseInt(hex.slice(3,5), 16),
      b: parseInt(hex.slice(5,7), 16),
    };
  }

  function drawChalkSegment(x, y, px, py) {
    const dist  = Math.hypot(x - px, y - py);
    const steps = Math.max(1, Math.floor(dist / 1.5));
    const {r,g,b} = hexToRgb(color);
    ctx.lineCap  = "round";
    ctx.lineJoin = "round";
    for (let s = 0; s <= steps; s++) {
      const t  = s / steps;
      const cx = px + (x - px) * t;
      const cy = py + (y - py) * t;
      ctx.beginPath();
      ctx.arc(cx, cy, brushSize * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + Math.random() * 0.3})`;
      ctx.fill();
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

  // ── Chalk dust ───────────────────────────────────────────
  // vx/vy MUST be viewport coords (clientX/clientY).
  // Dust canvas is position:fixed, viewport-sized. Its coordinate space
  // maps 1:1 to viewport pixels. Using document coords would place particles
  // far outside the visible area.
  function spawnDust(vx, vy, count) {
    if (count === undefined) count = 28 + Math.floor(Math.random() * 18);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 2.8;
      const grey  = Math.floor(190 + Math.random() * 60);
      dustParticles.push({
        x: vx, y: vy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
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
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.06;
      p.vx *= 0.97;
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

  // ── Position helpers ─────────────────────────────────────
  function getDocPos(e) {
    const sx = window.scrollX, sy = window.scrollY;
    if (e.touches) return { x: e.touches[0].clientX + sx, y: e.touches[0].clientY + sy };
    return { x: e.clientX + sx, y: e.clientY + sy };
  }

  function getViewportPos(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  // ── Pointer events ───────────────────────────────────────
  canvas.addEventListener("pointerdown", (e) => {
    if (!drawingMode) return;
    const {x, y}         = getDocPos(e);
    const {x: vx, y: vy} = getViewportPos(e);
    lastX = x; lastY = y;

    if (tool === "eraser") {
      spawnDust(vx, vy);          // big burst on initial press
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
    const {x, y}         = getDocPos(e);
    const {x: vx, y: vy} = getViewportPos(e);

    if (tool === "eraser" && isHolding) {
      erase(x, y);
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
    if (isHolding) saveCanvas();
    isDrawing = false;
    isHolding = false;
  });

  canvas.addEventListener("pointercancel", () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    isDrawing = false;
    isHolding = false;
  });

  // ── LocalStorage ─────────────────────────────────────────
  const STORAGE_KEY = "chalkCanvas_" + window.location.pathname;

  function saveCanvas() {
    try { localStorage.setItem(STORAGE_KEY, canvas.toDataURL()); }
    catch(e) { /* quota exceeded */ }
  }

  function loadCanvas() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    }
  }

  window.drawInitialMarkings = function(drawFn) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setTimeout(() => drawFn(ctx, canvas), 120);
  };

  // ── Toolbar ───────────────────────────────────────────────
  const toggleBtn   = document.getElementById("draw-toggle-btn");
  const toggleIcon  = document.getElementById("draw-toggle-icon");
  const toggleLabel = toggleBtn.querySelector(".toggle-label");
  const panel       = document.getElementById("draw-panel");
  const stopBtn     = document.getElementById("stop-draw-btn");
  const eraserBtn   = document.getElementById("eraser-btn");
  const clearBtn    = document.getElementById("clear-btn");
  const brushInput  = document.getElementById("brush-size");
  const swatches    = document.querySelectorAll(".swatch");

  // Chalkboard (felt) eraser cursor — wide rectangle, green felt bottom
  const ERASER_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='26' viewBox='0 0 44 26'><rect x='1' y='1' width='42' height='17' rx='2' fill='%23c8a87a' stroke='%238b6940' stroke-width='1.5'/><rect x='1' y='14' width='42' height='11' rx='1' fill='%235a7a5a' stroke='%233d5c3d' stroke-width='1.5'/><rect x='4' y='21' width='36' height='3' rx='1' fill='rgba(240%2C236%2C224%2C0.45)'/></svg>`;
  const ERASER_CURSOR = `url("data:image/svg+xml;utf8,${ERASER_SVG}") 22 25, cell`;

  // Update the options button to show current tool state
  function updateToggleBtn() {
    if (!drawingMode) {
      toggleIcon.textContent  = "✏️";
      toggleLabel.textContent = "draw on board";
      return;
    }
    if (tool === "eraser") {
      toggleIcon.innerHTML = `<svg width="18" height="11" viewBox="0 0 44 26" style="vertical-align:middle"><rect x="1" y="1" width="42" height="17" rx="2" fill="%23c8a87a" stroke="%238b6940" stroke-width="2"/><rect x="1" y="14" width="42" height="11" rx="1" fill="%235a7a5a"/></svg>`;
      toggleLabel.textContent = ` eraser · ${brushSize}`;
    } else {
      toggleIcon.innerHTML    = `<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.35);vertical-align:middle;margin-bottom:1px"></span>`;
      toggleLabel.textContent = ` · ${brushSize}`;
    }
  }

  function startDrawing() {
    drawingMode = true;
    panel.classList.add("visible");
    toggleBtn.classList.add("active");
    document.body.classList.toggle("drawing-mode",        tool !== "eraser");
    document.body.classList.toggle("drawing-mode-eraser", tool === "eraser");
    updateToggleBtn();
  }

  function stopDrawing() {
    drawingMode = false;
    panel.classList.remove("visible");
    toggleBtn.classList.remove("active");
    document.body.classList.remove("drawing-mode", "drawing-mode-eraser");
    updateToggleBtn();
  }

  // Main button: start drawing (if off) OR toggle panel visibility (if on)
  toggleBtn.addEventListener("click", () => {
    if (!drawingMode) {
      startDrawing();
    } else {
      panel.classList.toggle("visible");
    }
  });

  stopBtn.addEventListener("click", stopDrawing);

  eraserBtn.addEventListener("click", () => {
    tool = "eraser";
    eraserBtn.classList.add("selected");
    swatches.forEach(s => s.classList.remove("selected"));
    document.body.classList.remove("drawing-mode");
    if (drawingMode) document.body.classList.add("drawing-mode-eraser");
    updateToggleBtn();
  });

  swatches.forEach(sw => {
    sw.addEventListener("click", () => {
      color = sw.dataset.color;
      tool  = "chalk";
      sw.classList.add("selected");
      eraserBtn.classList.remove("selected");
      document.body.classList.remove("drawing-mode-eraser");
      if (drawingMode) document.body.classList.add("drawing-mode");
      updateToggleBtn();
    });
  });

  brushInput.addEventListener("input", () => {
    brushSize = parseInt(brushInput.value);
    updateToggleBtn();
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Erase all your chalk drawings on this page?")) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      localStorage.removeItem(STORAGE_KEY);
      if (window._initialMarkingsFn) window._initialMarkingsFn(ctx, canvas);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawingMode) stopDrawing();
  });

  // Apply eraser cursor via CSS custom property so the CSS rule can use it
  document.documentElement.style.setProperty("--eraser-cursor", ERASER_CURSOR);

  // ── Init ─────────────────────────────────────────────────
  if (swatches.length) {
    swatches[0].classList.add("selected");
    color = swatches[0].dataset.color;
  }

  window.addEventListener("load", () => setTimeout(loadCanvas, 80));
  window.addEventListener("beforeunload", () => { if (ctx) saveCanvas(); });

  window._chalkCtx    = ctx;
  window._chalkCanvas = canvas;
  window._saveCanvas  = saveCanvas;

})();
}); // end DOMContentLoaded