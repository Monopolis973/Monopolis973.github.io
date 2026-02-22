/* ============================================================
   shell.js  —  injects nav, canvases, and drawing toolbar
   ============================================================ */
(function () {
  "use strict";

  // ── Build nav ────────────────────────────────────────────
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  const navLinks = SITE_CONFIG.nav.map(link => {
    const active = (link.href === currentPage || (currentPage === "" && link.href === "index.html")) ? ' class="active"' : "";
    return `<a href="${link.href}"${active}>${link.label}</a>`;
  }).join("\n");

  const navHTML = `
<nav class="chalkboard-nav">
  <a class="site-title" href="index.html">${SITE_CONFIG.site_name}</a>
  <div class="nav-links">${navLinks}</div>
</nav>`;

  // ── Chalk color palette ──────────────────────────────────
  const colors = [
    { color: "#f0ece0", label: "white" },
    { color: "#f5c8c8", label: "pink" },
    { color: "#f5d78e", label: "yellow" },
    { color: "#8ed4f5", label: "sky" },
    { color: "#8ef5a4", label: "mint" },
    { color: "#d46060", label: "red" },
    { color: "#d4a84b", label: "gold" },
    { color: "#6ea8d4", label: "blue" },
    { color: "#a06ed4", label: "purple" },
    { color: "#6dd4a8", label: "teal" },
  ];

  const swatchHTML = colors.map(c =>
    `<button class="swatch" data-color="${c.color}" title="${c.label}" style="background:${c.color}"></button>`
  ).join("\n");

  // ── Toolbar HTML ─────────────────────────────────────────
  const toolbarHTML = `
<div id="draw-toolbar">
  <div id="draw-panel">
    <div>
      <div class="panel-label">chalk color</div>
      <div class="color-swatches">${swatchHTML}</div>
    </div>
    <div>
      <div class="panel-label">size</div>
      <div class="brush-size-row">
        <span style="font-size:0.7rem;color:var(--chalk-dim)">·</span>
        <input id="brush-size" type="range" min="1" max="18" value="3">
        <span style="font-size:1.1rem;color:var(--chalk-dim)">●</span>
      </div>
    </div>
    <button id="eraser-btn">🧼 eraser</button>
    <button id="clear-btn">clear my drawings</button>
    <button id="stop-draw-btn">✕ stop drawing</button>
  </div>
  <button id="draw-toggle-btn">
    <span id="draw-toggle-icon">✏️</span>
    <span class="toggle-label">draw/span>
  </button>
</div>`;

  // ── Canvases ─────────────────────────────────────────────
  const canvasHTML = `
<canvas id="chalk-canvas"></canvas>`;

  // ── Inject into document ─────────────────────────────────
  // We expect the page to have a <div class="site-content"> already
  // with a <main> inside. We prepend the nav.
  document.addEventListener("DOMContentLoaded", () => {
    // Canvases (before everything)
    document.body.insertAdjacentHTML("afterbegin", canvasHTML);

    // Nav (inside .site-content, before main)
    const content = document.querySelector(".site-content");
    if (content) {
      content.insertAdjacentHTML("afterbegin", navHTML);
    }

    // Toolbar (end of body)
    document.body.insertAdjacentHTML("beforeend", toolbarHTML);
  });
})();