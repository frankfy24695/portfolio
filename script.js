'use strict';

/* ============================================================
   Helpers
   ============================================================ */
const TAU = Math.PI * 2;

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   Canvas registry — one entry per project card
   ============================================================ */
const cards = [];
document.querySelectorAll('canvas[data-anim]').forEach((canvas) => {
  cards.push({
    canvas,
    ctx: canvas.getContext('2d'),
    w: 0,
    h: 0,
    visible: true,
    name: canvas.dataset.anim,
    state: null,
  });
});

function fit(entry) {
  const rect = entry.canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  entry.w = Math.max(1, rect.width);
  entry.h = Math.max(1, rect.height);
  entry.canvas.width = Math.round(entry.w * dpr);
  entry.canvas.height = Math.round(entry.h * dpr);
  entry.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function fitAll() { cards.forEach(fit); }

/* Per-animation state init */
function initStates() {
  cards.forEach((entry) => {
    if (entry.name === 'particles') {
      const ps = [];
      for (let i = 0; i < 130; i++) {
        ps.push({
          x: Math.random(), y: Math.random(),
          vx: (Math.random() - 0.5) * 0.00006,
          vy: (Math.random() - 0.5) * 0.00006,
          r: Math.random() * 1.6 + 0.7,
        });
      }
      entry.state = { ps };
    }
  });
}

/* ============================================================
   1 · Aurora — morphing gradient mesh
   ============================================================ */
function aurora(ctx, w, h, t) {
  ctx.fillStyle = '#0b0b10';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  const blobs = ['#d4ff3f', '#7b5cff', '#ff5c8a', '#00e0c6'];
  const R = Math.min(w, h);
  blobs.forEach((color, i) => {
    const x = w * (0.5 + 0.36 * Math.sin(t * 0.00035 * (i + 1) + i * 2.1));
    const y = h * (0.5 + 0.36 * Math.cos(t * 0.00042 * (i + 2) + i * 1.4));
    const r = R * (0.5 + 0.12 * Math.sin(t * 0.0005 + i * 1.7));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexToRgba(color, 0.5));
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}

/* ============================================================
   2 · Marquee — scrolling typography
   ============================================================ */
function marquee(ctx, w, h, t) {
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, w, h);
  const rows = [
    { frac: 0.26, dir: 1,  pxMs: 0.045, size: 0.21, text: 'DESIGN — MOTION — TYPE — RHYTHM — ', color: '#f5f4f0', italic: true },
    { frac: 0.54, dir: -1, pxMs: 0.07,  size: 0.13, text: 'PIXELS · POETRY · PLAY · REPEAT · ',      color: '#d4ff3f', italic: false },
    { frac: 0.82, dir: 1,  pxMs: 0.03,  size: 0.25, text: 'FORM — FOLLOWS — FEELING — ',             color: 'rgba(245,244,240,0.32)', italic: true },
  ];
  ctx.textBaseline = 'middle';
  rows.forEach((r) => {
    const fs = Math.max(20, Math.min(w, h) * r.size);
    ctx.font = `${r.italic ? 'italic ' : ''}400 ${fs}px "Instrument Serif", Georgia, serif`;
    const tw = ctx.measureText(r.text).width;
    if (tw < 1) return;
    const off = ((t * r.pxMs * r.dir) % tw + tw) % tw;
    ctx.fillStyle = r.color;
    for (let x = -off - tw; x < w + tw; x += tw) {
      ctx.fillText(r.text, x, h * r.frac);
    }
  });
}

/* ============================================================
   3 · Wireframe — rotating 3D shapes
   ============================================================ */
function project3D(p, rotY, rotX, dist) {
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const x1 = p[0] * cy + p[2] * sy;
  const z1 = -p[0] * sy + p[2] * cy;
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const y2 = p[1] * cx - z1 * sx;
  const z2 = p[1] * sx + z1 * cx;
  const s = dist / (dist + z2);
  return [x1 * s, y2 * s];
}

function shapeEdges(verts) {
  const edges = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      let diff = 0;
      for (let k = 0; k < 3; k++) if (verts[i][k] !== verts[j][k]) diff++;
      if (diff === 1) edges.push([i, j]);
    }
  }
  return edges;
}

const CUBE = [];
[-1, 1].forEach((x) => [-1, 1].forEach((y) => [-1, 1].forEach((z) => CUBE.push([x, y, z]))));
const CUBE_EDGES = shapeEdges(CUBE);
const OCTA = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const OCTA_EDGES = [];
for (let i = 0; i < OCTA.length; i++) {
  for (let j = i + 1; j < OCTA.length; j++) {
    const opp = (i === 0 && j === 1) || (i === 2 && j === 3) || (i === 4 && j === 5);
    if (!opp) OCTA_EDGES.push([i, j]);
  }
}

function drawWire(ctx, verts, edges, cx, cy, S, rotY, rotX, color, width) {
  const pts = verts.map((v) => {
    const [x, y] = project3D(v, rotY, rotX, 4);
    return [cx + x * S, cy + y * S];
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  edges.forEach(([a, b]) => {
    ctx.moveTo(pts[a][0], pts[a][1]);
    ctx.lineTo(pts[b][0], pts[b][1]);
  });
  ctx.stroke();
  ctx.fillStyle = color;
  pts.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, width * 1.4, 0, TAU);
    ctx.fill();
  });
}

function wireframe(ctx, w, h, t) {
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, w, h);
  const S = Math.min(w, h) * 0.3;
  const cx = w / 2, cy = h / 2 + Math.sin(t * 0.0008) * h * 0.03;
  drawWire(ctx, CUBE, CUBE_EDGES, cx, cy, S, t * 0.00045, t * 0.00032, '#d4ff3f', 1.4);
  drawWire(ctx, OCTA, OCTA_EDGES, cx, cy, S * 0.52, -t * 0.0006, t * 0.0005, 'rgba(245,244,240,0.55)', 1);
}

/* ============================================================
   4 · Particles — drifting field with connections
   ============================================================ */
function particles(ctx, w, h, t, dt, state) {
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, w, h);
  const ps = state.ps;
  ps.forEach((p) => {
    p.x = (p.x + p.vx * dt + 1) % 1;
    p.y = (p.y + p.vy * dt + 1) % 1;
  });
  const LINK = Math.min(w, h) * 0.28;
  ctx.lineWidth = 1;
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const dx = (ps[i].x - ps[j].x) * w;
      const dy = (ps[i].y - ps[j].y) * h;
      const d = Math.hypot(dx, dy);
      if (d < LINK) {
        ctx.strokeStyle = hexToRgba('#d4ff3f', (1 - d / LINK) * 0.22);
        ctx.beginPath();
        ctx.moveTo(ps[i].x * w, ps[i].y * h);
        ctx.lineTo(ps[j].x * w, ps[j].y * h);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = hexToRgba('#d4ff3f', 0.85);
  ps.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, p.r, 0, TAU);
    ctx.fill();
  });
}

/* ============================================================
   5 · Blob — morphing organic form
   ============================================================ */
function blobPath(ctx, cx, cy, R, t, sx, sy, phase) {
  const N = 140;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const r = R * (
      1
      + 0.22 * Math.sin(3 * a + t * 0.0011 + phase)
      + 0.13 * Math.sin(5 * a - t * 0.0008 + phase)
      + 0.07 * Math.sin(2 * a + t * 0.0017)
    );
    const x = cx + Math.cos(a) * r * sx;
    const y = cy + Math.sin(a) * r * sy;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function blob(ctx, w, h, t) {
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.33;

  // soft echo behind
  blobPath(ctx, cx + w * 0.1, cy - h * 0.08, R * 0.72, t, 1.1, 0.95, 2.2);
  ctx.fillStyle = hexToRgba('#ff5c8a', 0.28);
  ctx.fill();

  // main gradient blob
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#d4ff3f');
  g.addColorStop(1, '#00e0c6');
  blobPath(ctx, cx, cy, R, t, 1.18, 0.92, 0);
  ctx.fillStyle = g;
  ctx.fill();

  // glossy highlight
  blobPath(ctx, cx - R * 0.22, cy - R * 0.28, R * 0.42, t * 1.2, 1.1, 0.9, 4.1);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();
}

/* ============================================================
   6 · Waves — undulating grid
   ============================================================ */
function waves(ctx, w, h, t) {
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, w, h);
  const rows = 16;
  ctx.lineWidth = 1;
  for (let j = 0; j < rows; j++) {
    const baseY = (h * (j + 0.5)) / rows;
    const amp = (h / rows) * 0.95;
    const alpha = 0.08 + 0.3 * (j / rows);
    ctx.strokeStyle = hexToRgba('#d4ff3f', alpha);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 6) {
      const y = baseY + Math.sin(x * 0.016 + t * 0.0021 + j * 0.62) * amp;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // drifting dots riding the waves
  ctx.fillStyle = hexToRgba('#f5f4f0', 0.7);
  for (let k = 0; k < 14; k++) {
    const x = ((t * 0.05 * (0.5 + (k % 3) * 0.4) + k * 197) % (w + 40)) - 20;
    const rowF = (k * 2.3) % rows;
    const baseY = (h * (Math.floor(rowF) + 0.5)) / rows;
    const y = baseY + Math.sin(x * 0.016 + t * 0.0021 + Math.floor(rowF) * 0.62) * ((h / rows) * 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, TAU);
    ctx.fill();
  }
}

const anims = { aurora, marquee, wireframe, particles, blob, waves };

/* ============================================================
   Master rAF loop — IntersectionObserver pauses offscreen cards
   ============================================================ */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    const entry = cards.find((c) => c.canvas === en.target);
    if (entry) entry.visible = en.isIntersecting;
  });
}, { threshold: 0.05 });
cards.forEach((e) => io.observe(e.canvas));

/* ============================================================
   Cursor face — 😮 follows the mouse with buttery lag
   ============================================================ */
const face = document.getElementById('cursorFace');
let tx = -200, ty = -200;   // mouse target
let fx = -200, fy = -200;   // face position (lerped)
let fs = 0.4;               // face scale (lerped)
let faceOn = false;

window.addEventListener('mousemove', (e) => {
  tx = e.clientX;
  ty = e.clientY;
}, { passive: true });

document.querySelectorAll('.talk-btn').forEach((btn) => {
  btn.addEventListener('mouseenter', () => {
    faceOn = true;
    face.classList.add('on');
    document.body.classList.add('face-on');
  });
  btn.addEventListener('mouseleave', () => {
    faceOn = false;
    face.classList.remove('on');
    document.body.classList.remove('face-on');
  });
});

/* ============================================================
   Master loop
   ============================================================ */
let last = performance.now();
let firstFrameDone = false;

function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;

  // Buttery cursor-face follow: position lerps fast, scale eases in/out
  fx += (tx - fx) * 0.18;
  fy += (ty - fy) * 0.18;
  fs += ((faceOn ? 1 : 0.4) - fs) * 0.18;
  const tilt = Math.max(-14, Math.min(14, (tx - fx) * 0.06));
  face.style.transform =
    `translate(${fx - 32}px, ${fy - 32}px) rotate(${tilt}deg) scale(${fs.toFixed(3)})`;

  // Canvas animations (skip when offscreen; single frame if reduced motion)
  if (!reducedMotion || !firstFrameDone) {
    cards.forEach((e) => {
      if (!e.visible || e.w < 2) return;
      anims[e.name](e.ctx, e.w, e.h, now, dt, e.state);
    });
    firstFrameDone = true;
  }

  requestAnimationFrame(frame);
}

/* ============================================================
   Live Beijing clock — updates every second
   ============================================================ */
const clockEl = document.getElementById('clock');
function tickClock() {
  try {
    clockEl.textContent = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (err) {
    clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: true });
  }
}
tickClock();
setInterval(tickClock, 1000);

/* ============================================================
   Boot
   ============================================================ */
initStates();
fitAll();
requestAnimationFrame(frame);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitAll, 150);
});
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => fitAll());
}
window.addEventListener('load', fitAll);
