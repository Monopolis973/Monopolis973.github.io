/* ============================================================
   js/proof-writer.js  —  stroke-by-stroke proof animation
   Requires opentype.js to be loaded before this file.

   Usage (called by index.html after canvas is ready):
     const buf = await fetch('fonts/Caveat-Regular.ttf').then(r => r.arrayBuffer());
     await ProofWriter.animate(ctx, canvas, { title, body }, buf);
   ============================================================ */

window.ProofWriter = (function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  const CFG = {
    color:        '#f0ece0',
    alpha:        0.32,
    lineWidth:    0.9,          // thin — legible like actual chalk writing
    speed:        520,          // px / second (was 220 — much faster now)
    liftPause:    35,           // ms between strokes (pen lift)
    charPause:    8,            // ms between characters
    wordPause:    22,           // ms between words
    linePause:    110,          // ms between lines
    titleSize:    21,
    bodySize:     16,
    lineHeight:   27,
    bezierSteps:  12,
    // Empty-spot detection
    scanMarginX:  48,           // don't place within this many px of left/right edge
    scanMinY:     340,          // don't place above this Y (avoids nav + hero)
    scanStep:     55,           // grid step when searching for empty spot
    emptyThresh:  0.018,        // max pixel density (0–1) to count as "empty"
    minDistance:  60,           // min px clearance around the proof bounding box
  };

  // ── Bezier samplers ─────────────────────────────────────────────────────
  function cubicAt(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
  }
  function quadAt(p0, p1, p2, t) {
    const u = 1 - t;
    return u*u*p0 + 2*u*t*p1 + t*t*p2;
  }

  // ── Convert opentype commands → strokes ─────────────────────────────────
  // A "stroke" is one continuous pen-down sequence of {x,y} points.
  // moveTo / Z start/end strokes.
  function commandsToStrokes(commands) {
    const N = CFG.bezierSteps;
    const strokes = [];
    let stroke = [], cx = 0, cy = 0, sx = 0, sy = 0;

    for (const c of commands) {
      switch (c.type) {
        case 'M':
          if (stroke.length > 1) strokes.push(stroke);
          stroke = [{ x: c.x, y: c.y }];
          cx = sx = c.x; cy = sy = c.y;
          break;
        case 'L':
          stroke.push({ x: c.x, y: c.y });
          cx = c.x; cy = c.y;
          break;
        case 'C':
          for (let i = 1; i <= N; i++) {
            const t = i / N;
            stroke.push({ x: cubicAt(cx, c.x1, c.x2, c.x, t),
                          y: cubicAt(cy, c.y1, c.y2, c.y, t) });
          }
          cx = c.x; cy = c.y;
          break;
        case 'Q':
          for (let i = 1; i <= N; i++) {
            const t = i / N;
            stroke.push({ x: quadAt(cx, c.x1, c.x, t),
                          y: quadAt(cy, c.y1, c.y, t) });
          }
          cx = c.x; cy = c.y;
          break;
        case 'Z':
          stroke.push({ x: sx, y: sy });
          if (stroke.length > 1) strokes.push(stroke);
          stroke = [];
          break;
      }
    }
    if (stroke.length > 1) strokes.push(stroke);
    return strokes;
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  // Returns atoms positioned relative to origin (0, 0).
  // Each atom: { strokes, pauseAfter } or { strokes:[], pauseAfter } (pause only).
  // Also returns { width, height } of the bounding box.
  function layoutProof(font, proof, maxWidth) {
    const atoms = [];

    function adv(str, size) {
      return str ? font.getAdvanceWidth(str, size) : 0;
    }

    function wordWrap(text, size) {
      const words = text.split(' ');
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (line && adv(test, size) > maxWidth) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      return lines;
    }

    function emitLine(text, size, x, y) {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ') {
          atoms.push({ strokes: [], pauseAfter: CFG.wordPause });
          x += adv(' ', size);
          continue;
        }
        const path    = font.charToGlyph(ch).getPath(x, y, size);
        const strokes = commandsToStrokes(path.commands);
        if (strokes.length) atoms.push({ strokes, pauseAfter: CFG.charPause });
        x += adv(ch, size);
      }
    }

    function addParagraph(rawLine, size, startX, startY) {
      if (!rawLine.trim()) {
        atoms.push({ strokes: [], pauseAfter: CFG.linePause * 0.5 });
        return startY + CFG.lineHeight * 0.55;
      }
      const indentPx  = adv(' '.repeat((rawLine.match(/^ */)[0].length)), size);
      const trimmed   = rawLine.trimStart();
      const lines     = wordWrap(trimmed, size);
      let y = startY;
      for (const line of lines) {
        emitLine(line, size, startX + indentPx, y);
        atoms.push({ strokes: [], pauseAfter: CFG.linePause });
        y += CFG.lineHeight;
      }
      return y;
    }

    let y = 0;
    if (proof.title) {
      y = addParagraph(proof.title, CFG.titleSize, 0, y);
      y += 8;
    }
    for (const line of proof.body.split('\n')) {
      y = addParagraph(line, CFG.bodySize, 0, y);
    }

    // Compute bounding box across all stroke points
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const atom of atoms) {
      for (const stroke of atom.strokes) {
        for (const pt of stroke) {
          if (pt.x < minX) minX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y > maxY) maxY = pt.y;
        }
      }
    }

    const w = maxX - minX;
    const h = maxY - minY;

    // Normalise so the bounding box starts at (0,0)
    function translate(atoms, dx, dy) {
      return atoms.map(a => ({
        ...a,
        strokes: a.strokes.map(s => s.map(p => ({ x: p.x + dx, y: p.y + dy })))
      }));
    }
    const normalised = translate(atoms, -minX, -minY);

    return { atoms: normalised, width: w, height: h };
  }

  // ── Empty-spot detection ─────────────────────────────────────────────────
  // Scans the canvas for a rectangular region that has very few painted pixels,
  // with an extra clearance margin around it.
  // Returns {x, y} of the top-left corner to place the proof, or null.
  function findEmptySpot(ctx, canvas, proofW, proofH) {
    const M   = CFG.minDistance;
    const scanW = proofW + M * 2;
    const scanH = proofH + M * 2;

    const candidates = [];
    for (let y = CFG.scanMinY; y + scanH < canvas.height - 20; y += CFG.scanStep) {
      for (let x = CFG.scanMarginX; x + scanW < canvas.width - CFG.scanMarginX; x += CFG.scanStep) {
        candidates.push({ x, y });
      }
    }

    // Shuffle so we don't always pick top-left
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const { x, y } of candidates) {
      // Clamp to canvas bounds
      const sx = Math.max(0, x), sy = Math.max(0, y);
      const sw = Math.min(scanW, canvas.width - sx);
      const sh = Math.min(scanH, canvas.height - sy);
      if (sw <= 0 || sh <= 0) continue;

      let data;
      try {
        data = ctx.getImageData(sx, sy, sw, sh).data;
      } catch { continue; }

      let nonEmpty = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 12) nonEmpty++;
      }

      const density = nonEmpty / (sw * sh);
      if (density < CFG.emptyThresh) {
        // Return the inner rect (inside the margin)
        return { x: x + M, y: y + M };
      }
    }

    return null; // no suitable spot found
  }

  // ── Drawing ──────────────────────────────────────────────────────────────
  const [cr, cg, cb] = [0xf0, 0xec, 0xe0];

  function drawSeg(ctx, x0, y0, x1, y1) {
    ctx.save();
    ctx.globalAlpha = CFG.alpha * (0.80 + Math.random() * 0.20);
    ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
    ctx.lineWidth   = CFG.lineWidth + (Math.random() - 0.5) * 0.2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  // ── Animation loop ───────────────────────────────────────────────────────
  function runAnimation(ctx, atoms, onDone) {
    let ai = 0, si = 0, pi = 0;
    let state = 'drawing', pauseEnd = 0, lastTs = null;

    function frame(ts) {
      if (lastTs === null) { lastTs = ts; requestAnimationFrame(frame); return; }
      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;

      if (state === 'pausing') {
        if (ts < pauseEnd) { requestAnimationFrame(frame); return; }
        state = 'drawing';
      }

      let budget = CFG.speed * (dt / 1000);

      while (budget > 0 && ai < atoms.length) {
        const atom = atoms[ai];

        if (!atom.strokes.length) {
          ai++; si = 0; pi = 0;
          state = 'pausing'; pauseEnd = ts + atom.pauseAfter;
          break;
        }
        if (si >= atom.strokes.length) {
          ai++; si = 0; pi = 0;
          state = 'pausing'; pauseEnd = ts + atom.pauseAfter;
          break;
        }

        const stroke = atom.strokes[si];

        while (budget > 0 && pi < stroke.length - 1) {
          const p0 = stroke[pi], p1 = stroke[pi + 1];
          const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          if (segLen < 0.01) { pi++; continue; }
          if (budget >= segLen) {
            drawSeg(ctx, p0.x, p0.y, p1.x, p1.y);
            budget -= segLen; pi++;
          } else {
            const t = budget / segLen;
            drawSeg(ctx, p0.x, p0.y, p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t);
            budget = 0;
          }
        }

        if (pi >= stroke.length - 1) {
          si++; pi = 0;
          state = 'pausing'; pauseEnd = ts + CFG.liftPause;
          break;
        }
      }

      if (ai >= atoms.length) { onDone && onDone(); return; }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  async function animate(ctx, canvas, proof, fontBuffer) {
    await document.fonts.ready;

    const font     = opentype.parse(fontBuffer);
    const maxWidth = Math.min(600, canvas.width - CFG.scanMarginX * 2);

    // Layout relative to (0,0) to get bounding box
    const { atoms: baseAtoms, width: proofW, height: proofH } = layoutProof(font, proof, maxWidth);

    // Find a clear region on the canvas
    const spot = findEmptySpot(ctx, canvas, proofW, proofH);
    if (!spot) return false; // no room — caller can decide what to do

    // Translate atoms to the chosen spot
    const atoms = baseAtoms.map(a => ({
      ...a,
      strokes: a.strokes.map(s => s.map(p => ({ x: p.x + spot.x, y: p.y + spot.y })))
    }));

    return new Promise(resolve => {
      setTimeout(() => runAnimation(ctx, atoms, () => resolve(true)), 400);
    });
  }

  return { animate };
})();