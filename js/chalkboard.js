/* ============================================================
   chalkboard.js  —  canvas drawing engine
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
(function () {
  "use strict";

  // ── Canvas ───────────────────────────────────────────────
  const canvas = document.getElementById("chalk-canvas");
  const ctx    = canvas.getContext("2d");

  // ── State ───────────────────────────────────────────────
  let color       = "#f0ece0";
  let brushSize   = 3;
  let isDrawing   = false;
  let lastX       = 0;
  let lastY       = 0;
  let drawingMode = false;

  // ── Resize ──────────────────────────────────────────────
  // Canvas covers the full document so marks stay anchored to content.
  function docSize() {
    return {
      w: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, window.innerWidth),
      h: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight),
    };
  }

  function resize() {
    const { w, h } = docSize();
    const img = canvas.toDataURL();
    canvas.width  = w;
    canvas.height = h;
    const i = new Image();
    i.onload = () => ctx.drawImage(i, 0, 0);
    i.src = img;
  }

  window.addEventListener("resize", resize);
  resize();

  // Grow canvas if dynamic content (posts, poems) makes the page taller
  const _ro = new ResizeObserver(() => {
    const { w, h } = docSize();
    if (w !== canvas.width || h !== canvas.height) resize();
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

  // ── Position helpers ─────────────────────────────────────
  // Canvas is position:absolute — add scroll offsets to get document coords.
  function getDocPos(e) {
    const sx = window.scrollX, sy = window.scrollY;
    if (e.touches) return { x: e.touches[0].clientX + sx, y: e.touches[0].clientY + sy };
    return { x: e.clientX + sx, y: e.clientY + sy };
  }

  // ── Pointer events ───────────────────────────────────────
  canvas.addEventListener("pointerdown", (e) => {
    if (!drawingMode) return;
    const {x, y} = getDocPos(e);
    lastX = x; lastY = y;
    isDrawing = true;
    drawChalkSegment(x, y, x, y);
    saveCanvas();
    // Close the options panel as soon as drawing starts
    panel.classList.remove("visible");
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!drawingMode || !isDrawing) return;
    const {x, y} = getDocPos(e);
    drawChalkSegment(x, y, lastX, lastY);
    lastX = x; lastY = y;
    e.preventDefault();
  });

  canvas.addEventListener("pointerup", () => {
    if (isDrawing) saveCanvas();
    isDrawing = false;
  });

  canvas.addEventListener("pointercancel", () => { isDrawing = false; });

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
  const clearBtn    = document.getElementById("clear-btn");
  const brushInput  = document.getElementById("brush-size");
  const swatches    = document.querySelectorAll(".swatch");

  function updateToggleBtn() {
    if (!drawingMode) {
      toggleIcon.textContent  = "✏️";
      toggleLabel.textContent = "draw on board";
      return;
    }
    toggleIcon.innerHTML    = `<span style="display:inline-block;width:13px;height:13px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.35);vertical-align:middle;margin-bottom:1px"></span>`;
    toggleLabel.textContent = ` · ${brushSize}`;
  }

  function startDrawing() {
    drawingMode = true;
    panel.classList.add("visible");
    toggleBtn.classList.add("active");
    document.body.classList.add("drawing-mode");
    updateToggleBtn();
  }

  function stopDrawing() {
    drawingMode = false;
    isDrawing   = false;
    panel.classList.remove("visible");
    toggleBtn.classList.remove("active");
    document.body.classList.remove("drawing-mode");
    updateToggleBtn();
  }

  toggleBtn.addEventListener("click", () => {
    if (!drawingMode) {
      startDrawing();
    } else {
      panel.classList.toggle("visible");
    }
  });

  stopBtn.addEventListener("click", stopDrawing);

  swatches.forEach(sw => {
    sw.addEventListener("click", () => {
      color = sw.dataset.color;
      sw.classList.add("selected");
      swatches.forEach(s => { if (s !== sw) s.classList.remove("selected"); });
      updateToggleBtn();
    });
  });

  brushInput.addEventListener("input", () => {
    brushSize = parseInt(brushInput.value);
    updateToggleBtn();
  });

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem(STORAGE_KEY);
    if (window._initialMarkingsFn) window._initialMarkingsFn(ctx, canvas);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawingMode) stopDrawing();
  });

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