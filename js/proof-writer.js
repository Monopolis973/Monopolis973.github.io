/* ============================================================
   js/proof-writer.js  —  stroke-by-stroke proof animation
   Requires opentype.js to be loaded before this file.

   Usage:
     const buf = await fetch('fonts/Caveat-Regular.ttf').then(r=>r.arrayBuffer());
     const wrote = await ProofWriter.animate(ctx, canvas, {title, body}, buf);
     // returns false if no clear spot was found on the canvas
   ============================================================ */

window.ProofWriter = (function () {
  'use strict';

  const CFG = {
    alpha:         0.13,    // very faint — ghostly background presence
    lineWidth:     0.55,    // thin like a real piece of chalk on a board
    speed:         4500,    // px/second — fast enough to feel like real writing
    liftPause:     18,      // ms between strokes within a glyph
    charPause:     6,       // ms between glyphs
    wordPause:     18,      // ms between words
    linePause:     90,      // ms between lines
    titleSize:     22,
    bodySize:      17,
    lineHeight:    29,
    bezierSteps:   10,
    // empty-spot detection
    scanMarginX:   55,      // don't place within this many px of left/right edge
    scanMinY:      320,     // don't start above this Y (clears nav + hero)
    scanStep:      40,
    emptyThresh:   0.015,   // max pixel density to count as "empty"
    clearance:     55,      // padding around proof bounding box when scanning
  };

  // ── Bezier samplers ────────────────────────────────────────────────────
  function cubicAt(p0,p1,p2,p3,t){const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3;}
  function quadAt(p0,p1,p2,t){const u=1-t;return u*u*p0+2*u*t*p1+t*t*p2;}

  // ── opentype path commands → arrays of {x,y} strokes ──────────────────
  // Each "stroke" is one continuous pen-down motion. moveTo / Z lift the pen.
  function commandsToStrokes(commands) {
    const N = CFG.bezierSteps;
    const strokes = [];
    let s = [], cx = 0, cy = 0, sx = 0, sy = 0;

    for (const c of commands) {
      switch (c.type) {
        case 'M':
          if (s.length > 1) strokes.push(s);
          s = [{x:c.x, y:c.y}];
          cx=sx=c.x; cy=sy=c.y;
          break;
        case 'L':
          s.push({x:c.x, y:c.y});
          cx=c.x; cy=c.y;
          break;
        case 'C':
          for (let i=1;i<=N;i++){const t=i/N;s.push({x:cubicAt(cx,c.x1,c.x2,c.x,t),y:cubicAt(cy,c.y1,c.y2,c.y,t)});}
          cx=c.x; cy=c.y;
          break;
        case 'Q':
          for (let i=1;i<=N;i++){const t=i/N;s.push({x:quadAt(cx,c.x1,c.x,t),y:quadAt(cy,c.y1,c.y,t)});}
          cx=c.x; cy=c.y;
          break;
        case 'Z':
          s.push({x:sx, y:sy});
          if (s.length > 1) strokes.push(s);
          s = [];
          break;
      }
    }
    if (s.length > 1) strokes.push(s);
    return strokes;
  }

  // ── Layout ─────────────────────────────────────────────────────────────
  // Lays out a proof at origin (0,0) and returns:
  //   { atoms, width, height }
  // Each atom: { strokes: [[{x,y}]...], pauseAfter: ms }
  //           or { strokes: [], pauseAfter: ms }  (timing gap only)
  function layoutProof(font, proof, maxWidth) {
    const atoms = [];

    function adv(str, size) {
      // Robustly get advance width; fall back to 0 for unsupported chars
      try { return font.getAdvanceWidth(str, size); }
      catch { return 0; }
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

        let strokes = [];
        try {
          const glyph = font.charToGlyph(ch);
          // Skip .notdef (usually glyph index 0) — unsupported chars like
          // Unicode math symbols that Caveat doesn't have.  Drawing .notdef
          // produces an ugly box and corrupts the bounding-box normalisation.
          if (glyph.index !== 0) {
            const path = glyph.getPath(x, y, size);
            strokes = commandsToStrokes(path.commands);
          }
        } catch (e) {
          // If anything goes wrong, just skip this character
        }

        if (strokes.length) {
          atoms.push({ strokes, pauseAfter: CFG.charPause });
        }
        x += adv(ch, size);
      }
    }

    function addParagraph(rawLine, size, startX, y) {
      if (!rawLine.trim()) {
        atoms.push({ strokes: [], pauseAfter: CFG.linePause * 0.5 });
        return y + CFG.lineHeight * 0.6;
      }
      const indentSpaces = (rawLine.match(/^ */)[0].length);
      const indentPx = adv(' '.repeat(indentSpaces), size);
      const trimmed = rawLine.trimStart();
      const lines = wordWrap(trimmed, size);
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
      y += 10;
    }
    for (const line of proof.body.split('\n')) {
      y = addParagraph(line, CFG.bodySize, 0, y);
    }

    // Compute bounding box of all drawn stroke points
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    let hasPoints = false;
    for (const atom of atoms) {
      for (const stroke of atom.strokes) {
        for (const pt of stroke) {
          if (pt.x < minX) minX=pt.x;
          if (pt.y < minY) minY=pt.y;
          if (pt.x > maxX) maxX=pt.x;
          if (pt.y > maxY) maxY=pt.y;
          hasPoints = true;
        }
      }
    }

    if (!hasPoints) return { atoms, width: 0, height: 0 };

    const W = maxX - minX;
    const H = maxY - minY;

    // Shift so bounding box starts at (0, 0)
    const dx = -minX, dy = -minY;
    const normalised = atoms.map(a => ({
      ...a,
      strokes: a.strokes.map(s => s.map(p => ({x: p.x+dx, y: p.y+dy})))
    }));

    return { atoms: normalised, width: W, height: H };
  }

  // ── Empty-spot detection ───────────────────────────────────────────────
  // Returns a {x, y} offset to place the proof, or null if no clear spot.
  function findEmptySpot(ctx, canvas, proofW, proofH) {
    const C = CFG.clearance;
    const scanW = Math.ceil(proofW + C * 2);
    const scanH = Math.ceil(proofH + C * 2);

    if (scanW >= canvas.width || scanH >= canvas.height) return null;

    const candidates = [];
    for (let y = CFG.scanMinY; y + scanH < canvas.height - 20; y += CFG.scanStep) {
      for (let x = CFG.scanMarginX; x + scanW < canvas.width - CFG.scanMarginX; x += CFG.scanStep) {
        candidates.push({x, y});
      }
    }
    if (!candidates.length) return null;

    // Shuffle so placement varies across visits
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const {x, y} of candidates) {
      const sx = Math.max(0, x), sy = Math.max(0, y);
      const sw = Math.min(scanW, canvas.width  - sx);
      const sh = Math.min(scanH, canvas.height - sy);
      if (sw <= 0 || sh <= 0) continue;

      let data;
      try { data = ctx.getImageData(sx, sy, sw, sh).data; }
      catch { continue; }

      let filled = 0;
      // Sample every 4th pixel for speed
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] > 10) filled++;
      }
      const density = filled / (sw * sh / 4);

      if (density < CFG.emptyThresh) {
        return { x: x + C, y: y + C };
      }
    }

    return null;
  }

  // ── Drawing ────────────────────────────────────────────────────────────
  function drawSeg(ctx, x0, y0, x1, y1) {
    ctx.save();
    ctx.globalAlpha = CFG.alpha * (0.82 + Math.random() * 0.18);
    ctx.strokeStyle = '#f0ece0';
    ctx.lineWidth   = CFG.lineWidth + (Math.random() - 0.5) * 0.12;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  // ── Animation loop ─────────────────────────────────────────────────────
  function runAnimation(ctx, atoms, onDone) {
    let ai=0, si=0, pi=0;
    let pausing=false, pauseEnd=0, lastTs=null;

    function frame(ts) {
      if (lastTs === null) { lastTs = ts; requestAnimationFrame(frame); return; }
      const dt = Math.min(ts - lastTs, 50);
      lastTs = ts;

      // Sit out a pause (pen lift / char gap / line gap)
      if (pausing) {
        if (ts < pauseEnd) { requestAnimationFrame(frame); return; }
        pausing = false;
      }

      // Budget of distance we can draw this frame
      let budget = CFG.speed * (dt / 1000);

      while (ai < atoms.length) {
        const atom = atoms[ai];

        // Timing-only atom (word/line gap)
        if (!atom.strokes.length) {
          ai++; si=0; pi=0;
          pausing=true; pauseEnd=ts+atom.pauseAfter;
          break;
        }

        // All strokes in this atom done → move to next atom
        if (si >= atom.strokes.length) {
          ai++; si=0; pi=0;
          pausing=true; pauseEnd=ts+atom.pauseAfter;
          break;
        }

        const stroke = atom.strokes[si];

        // Single-point or degenerate stroke → skip
        if (stroke.length < 2) { si++; pi=0; continue; }

        // Walk along this stroke
        let advanced = false;
        while (pi < stroke.length - 1 && budget > 0) {
          const p0=stroke[pi], p1=stroke[pi+1];
          const segLen = Math.hypot(p1.x-p0.x, p1.y-p0.y);
          if (segLen < 0.01) { pi++; continue; }

          if (budget >= segLen) {
            drawSeg(ctx, p0.x, p0.y, p1.x, p1.y);
            budget -= segLen;
            pi++;
            advanced = true;
          } else {
            const t = budget / segLen;
            drawSeg(ctx, p0.x, p0.y, p0.x+(p1.x-p0.x)*t, p0.y+(p1.y-p0.y)*t);
            budget = 0;
            advanced = true;
          }
        }

        // Finished this stroke?
        if (pi >= stroke.length - 1) {
          si++; pi=0;
          // Short pen-lift pause between strokes within a glyph
          pausing=true; pauseEnd=ts+CFG.liftPause;
          break;
        }

        // Ran out of budget mid-stroke
        if (budget <= 0) break;

        // Didn't advance and didn't run out of budget — shouldn't happen, but
        // guard against an infinite loop just in case
        if (!advanced) { si++; pi=0; }
      }

      if (ai >= atoms.length) { onDone && onDone(); return; }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ── Public API ─────────────────────────────────────────────────────────
  async function animate(ctx, canvas, proof, fontBuffer) {
    await document.fonts.ready;

    let font;
    try { font = opentype.parse(fontBuffer); }
    catch (e) { console.error('ProofWriter: failed to parse font', e); return false; }

    const maxWidth = Math.min(560, canvas.width - CFG.scanMarginX * 2);
    const { atoms, width: proofW, height: proofH } = layoutProof(font, proof, maxWidth);

    if (!atoms.length || proofW === 0) return false;

    const spot = findEmptySpot(ctx, canvas, proofW, proofH);
    if (!spot) return false; // board is too full

    // Translate atoms to the chosen spot
    const placed = atoms.map(a => ({
      ...a,
      strokes: a.strokes.map(s => s.map(p => ({x: p.x+spot.x, y: p.y+spot.y})))
    }));

    return new Promise(resolve => {
      setTimeout(() => runAnimation(ctx, placed, () => resolve(true)), 300);
    });
  }

  return { animate };
})();