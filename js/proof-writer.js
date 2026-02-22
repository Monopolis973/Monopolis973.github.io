/* ============================================================
   js/proof-writer.js  —  stroke-by-stroke proof animation
   Requires opentype.js to be loaded first.

   Usage:
     const buf = await fetch('fonts/Caveat-Regular.ttf').then(r => r.arrayBuffer());
     await ProofWriter.animate(ctx, canvas, { title, body }, buf);
   ============================================================ */

window.ProofWriter = (function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  const CFG = {
    color:        '#f0ece0',
    alpha:        0.30,           // ghostly — visible but not distracting
    lineWidth:    1.7,
    speed:        220,            // px / second along a stroke
    liftPause:    90,             // ms pause between strokes (pen lift)
    charPause:    25,             // extra ms between characters
    wordPause:    55,             // extra ms between words
    linePause:    280,            // extra ms between lines
    startX:       52,
    startY:       450,
    maxWidth:     680,            // capped against canvas width at runtime
    titleSize:    25,
    bodySize:     19,
    lineHeight:   34,
    bezierSteps:  14,             // sample points per bezier segment
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

  // ── Convert opentype path commands → strokes ────────────────────────────
  // A "stroke" is an array of {x,y} points — one continuous pen-down motion.
  // moveTo starts a new stroke; closePath closes it.
  function commandsToStrokes(commands) {
    const N = CFG.bezierSteps;
    const strokes = [];
    let stroke    = [];
    let cx = 0, cy = 0, sx = 0, sy = 0;

    for (const c of commands) {
      switch (c.type) {
        case 'M':
          if (stroke.length > 1) strokes.push(stroke);
          stroke = [{ x: c.x, y: c.y }];
          cx = sx = c.x;
          cy = sy = c.y;
          break;
        case 'L':
          stroke.push({ x: c.x, y: c.y });
          cx = c.x; cy = c.y;
          break;
        case 'C':
          for (let i = 1; i <= N; i++) {
            const t = i / N;
            stroke.push({
              x: cubicAt(cx, c.x1, c.x2, c.x, t),
              y: cubicAt(cy, c.y1, c.y2, c.y, t),
            });
          }
          cx = c.x; cy = c.y;
          break;
        case 'Q':
          for (let i = 1; i <= N; i++) {
            const t = i / N;
            stroke.push({
              x: quadAt(cx, c.x1, c.x, t),
              y: quadAt(cy, c.y1, c.y, t),
            });
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

  // ── Text layout ─────────────────────────────────────────────────────────
  // Turns a proof {title, body} into an ordered list of "atoms".
  // Each atom is either:
  //   { strokes: [[{x,y}]], pauseAfter: ms }   — a glyph to draw
  //   { strokes: [],        pauseAfter: ms }   — a pause/spacer (no drawing)
  //
  function layoutProof(font, proof, maxWidth) {
    const atoms = [];

    // Measure a string's advance width at a given font size
    function adv(str, size) {
      return str ? font.getAdvanceWidth(str, size) : 0;
    }

    // Emit atoms for one text line (no wrapping — pass pre-wrapped lines)
    function emitLine(text, fontSize, x, y) {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ') {
          atoms.push({ strokes: [], pauseAfter: CFG.wordPause });
          x += adv(' ', fontSize);
          continue;
        }
        const glyph    = font.charToGlyph(ch);
        const path     = glyph.getPath(x, y, fontSize);
        const strokes  = commandsToStrokes(path.commands);
        if (strokes.length) {
          atoms.push({ strokes, pauseAfter: CFG.charPause });
        }
        x += adv(ch, fontSize);
      }
    }

    // Word-wrap text → array of line strings
    function wordWrap(text, fontSize) {
      const words = text.split(' ');
      const lines = [];
      let line    = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (line && adv(test, fontSize) > maxWidth) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    // Process one paragraph of raw text (may be blank)
    // Returns the y position for the next paragraph.
    function addParagraph(rawLine, fontSize, startX, startY) {
      if (!rawLine.trim()) {
        // Blank line — just a vertical spacer atom
        atoms.push({ strokes: [], pauseAfter: CFG.linePause * 0.5 });
        return startY + CFG.lineHeight * 0.55;
      }

      // Preserve leading indentation
      const indentChars = rawLine.match(/^ */)[0].length;
      const indentPx    = adv(' '.repeat(indentChars), fontSize);
      const trimmed     = rawLine.trimStart();

      const lines = wordWrap(trimmed, fontSize);
      let y = startY;

      for (let li = 0; li < lines.length; li++) {
        emitLine(lines[li], fontSize, startX + indentPx, y);
        atoms.push({ strokes: [], pauseAfter: CFG.linePause });
        y += CFG.lineHeight;
      }
      return y;
    }

    // ── Build atoms from proof ─────────────────────────────────────────
    let y = CFG.startY;
    const x = CFG.startX;

    if (proof.title) {
      y = addParagraph(proof.title, CFG.titleSize, x, y);
      y += 10; // gap between title and body
    }

    for (const line of proof.body.split('\n')) {
      y = addParagraph(line, CFG.bodySize, x, y);
    }

    return atoms;
  }

  // ── Drawing ─────────────────────────────────────────────────────────────
  const [cr, cg, cb] = [0xf0, 0xec, 0xe0]; // chalk white RGB

  function drawSeg(ctx, x0, y0, x1, y1) {
    ctx.save();
    ctx.globalAlpha = CFG.alpha * (0.78 + Math.random() * 0.22);
    ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
    ctx.lineWidth   = CFG.lineWidth + (Math.random() - 0.5) * 0.3;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  // ── Animation loop ───────────────────────────────────────────────────────
  // Speed-based: we advance CFG.speed px per second along the current stroke,
  // pausing between strokes and atoms to simulate natural pen behaviour.
  function runAnimation(ctx, atoms, onDone) {
    let ai = 0; // atom index
    let si = 0; // stroke index within atom
    let pi = 0; // point index within stroke
    let state    = 'drawing';   // 'drawing' | 'pausing'
    let pauseEnd = 0;
    let lastTs   = null;

    function frame(ts) {
      if (lastTs === null) { lastTs = ts; requestAnimationFrame(frame); return; }
      const dt  = Math.min(ts - lastTs, 50); // clamp for tab-hidden pauses
      lastTs = ts;

      if (state === 'pausing') {
        if (ts < pauseEnd) { requestAnimationFrame(frame); return; }
        state = 'drawing';
      }

      // px budget for this frame
      let budget = CFG.speed * (dt / 1000);

      outer:
      while (budget > 0 && ai < atoms.length) {
        const atom = atoms[ai];

        // Pure-pause atom (blank line, word gap, etc.)
        if (!atom.strokes.length) {
          ai++; si = 0; pi = 0;
          state    = 'pausing';
          pauseEnd = ts + atom.pauseAfter;
          break;
        }

        // Finished all strokes in this atom?
        if (si >= atom.strokes.length) {
          ai++; si = 0; pi = 0;
          state    = 'pausing';
          pauseEnd = ts + atom.pauseAfter;
          break;
        }

        const stroke = atom.strokes[si];

        // Walk along this stroke consuming budget
        while (budget > 0 && pi < stroke.length - 1) {
          const p0 = stroke[pi];
          const p1 = stroke[pi + 1];
          const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);

          if (segLen < 0.01) { pi++; continue; }

          if (budget >= segLen) {
            drawSeg(ctx, p0.x, p0.y, p1.x, p1.y);
            budget -= segLen;
            pi++;
          } else {
            // Partial segment — draw up to where our budget runs out
            const t  = budget / segLen;
            const mx = p0.x + (p1.x - p0.x) * t;
            const my = p0.y + (p1.y - p0.y) * t;
            drawSeg(ctx, p0.x, p0.y, mx, my);
            budget = 0;
          }
        }

        // Finished this stroke?
        if (pi >= stroke.length - 1) {
          si++; pi = 0;
          // Pen-lift pause between strokes
          state    = 'pausing';
          pauseEnd = ts + CFG.liftPause;
          break;
        }
      }

      if (ai >= atoms.length) {
        onDone && onDone();
        return;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ── Public API ───────────────────────────────────────────────────────────
  async function animate(ctx, canvas, proof, fontBuffer) {
    await document.fonts.ready; // ensure Caveat CSS font is loaded (for layout)

    const font     = opentype.parse(fontBuffer);
    const maxWidth = Math.min(CFG.maxWidth, canvas.width - CFG.startX * 2);
    const atoms    = layoutProof(font, proof, maxWidth);

    return new Promise(resolve => {
      setTimeout(() => runAnimation(ctx, atoms, resolve), 700); // settle delay
    });
  }

  return { animate };
})();
