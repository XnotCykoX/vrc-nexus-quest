// Pure-Node (no deps) generator for VRC-NEXUS store + launcher art.
// Meta App Lab needs: a SOLID-filled square icon (no transparent corners) and a 10:3
// hero at 3000x900. This renders a violet "nexus" galaxy at supersample, then encodes PNG.
import { writeFileSync } from "node:fs";
import zlib from "node:zlib";

function render(Wout, Hout, { rounded = false, S = 4, background = true, emblem = true } = {}) {
  const W = Wout * S, H = Hout * S;
  const rgb = new Float32Array(W * H * 3), al = new Float32Array(W * H);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function blend(x, y, c, a) {
    if (a <= 0) return; x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x, j = i * 3, ea = al[i], oa = a + ea * (1 - a); if (oa <= 0) return;
    rgb[j] = (c[0] * a + rgb[j] * ea * (1 - a)) / oa; rgb[j + 1] = (c[1] * a + rgb[j + 1] * ea * (1 - a)) / oa; rgb[j + 2] = (c[2] * a + rgb[j + 2] * ea * (1 - a)) / oa; al[i] = oa;
  }
  const cx = W / 2, cy = H / 2, R = Math.min(W, H);
  const corner = 0.235 * W;
  const inRound = (x, y) => { const dx = Math.max(Math.abs(x - cx) - (W / 2 - corner), 0), dy = Math.max(Math.abs(y - cy) - (H / 2 - corner), 0); return Math.hypot(dx, dy) <= corner; };
  const bg = [[0, [20, 8, 44]], [0.5, [74, 26, 150]], [0.8, [120, 38, 196]], [1, [168, 30, 175]]];
  function grad(t) { t = clamp(t, 0, 1); for (let i = 1; i < bg.length; i++) if (t <= bg[i][0]) { const a = bg[i - 1], b = bg[i], f = (t - a[0]) / (b[0] - a[0]); return [lerp(a[1][0], b[1][0], f), lerp(a[1][1], b[1][1], f), lerp(a[1][2], b[1][2], f)]; } return bg[bg.length - 1][1]; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!background || (rounded && !inRound(x + 0.5, y + 0.5))) continue;
    let c = grad((x / W + y / H) / 2);
    const d = Math.hypot((x + 0.5 - cx) / (W / 2), (y + 0.5 - cy) / (H / 2));
    const glow = clamp(1 - d * 1.1, 0, 1) ** 2 * 0.5; c = [lerp(c[0], 200, glow), lerp(c[1], 140, glow), lerp(c[2], 255, glow)];
    const vig = clamp((d - 0.6) / 0.5, 0, 1) * 0.3; c = [c[0] * (1 - vig), c[1] * (1 - vig), c[2] * (1 - vig)];
    const i = y * W + x; al[i] = 1; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2];
  }
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const nStars = background ? Math.round(W * H / 30000) : 0;
  for (let k = 0; k < nStars; k++) { const x = rnd() * W, y = rnd() * H; if (rounded && !inRound(x, y)) continue; const r = (rnd() * 1.4 + 0.4) * S, a = rnd() * 0.7 + 0.3; for (let yy = -r - 1; yy <= r + 1; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) if (Math.hypot(xx, yy) <= r) blend(x + xx, y + yy, [255, 255, 255], a); }
  function ring(rx, ry, rot, thick, col, ga) { const cos = Math.cos(rot), sin = Math.sin(rot); for (let y = Math.floor(cy - rx - 8); y < cy + rx + 8; y++) for (let x = Math.floor(cx - rx - 8); x < cx + rx + 8; x++) { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = dx * cos + dy * sin, v = -dx * sin + dy * cos, e = Math.hypot(u / rx, v / ry); if (Math.abs(e - 1) < thick) blend(x, y, col, ga * (1 - Math.abs(e - 1) / thick)); } }
  function disc(px, py, r, col, a) { for (let y = Math.floor(py - r - 2); y <= py + r + 2; y++) for (let x = Math.floor(px - r - 2); x <= px + r + 2; x++) { const dd = Math.hypot(x + 0.5 - px, y + 0.5 - py); if (dd <= r) blend(x, y, col, a * clamp(r - dd, 0, 1)); } }
  if (emblem) {
    ring(R * 0.36, R * 0.14, -0.5, 0.05, [216, 180, 255], 0.85);
    ring(R * 0.36, R * 0.14, 0.5, 0.05, [255, 150, 220], 0.7);
    for (let y = Math.floor(cy - R * 0.24); y < cy + R * 0.24; y++) for (let x = Math.floor(cx - R * 0.24); x < cx + R * 0.24; x++) { const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / (R * 0.22); if (dd < 1) blend(x, y, [190, 130, 255], (1 - dd) ** 2 * 0.55); }
    disc(cx, cy, R * 0.115, [120, 90, 240], 1);
    disc(cx, cy, R * 0.086, [200, 170, 255], 1);
    disc(cx - R * 0.02, cy - R * 0.02, R * 0.052, [255, 255, 255], 1);
  }
  const out = Buffer.alloc(Wout * Hout * 4);
  for (let y = 0; y < Hout; y++) for (let x = 0; x < Wout; x++) {
    let r = 0, g = 0, b = 0, a = 0; for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const i = (y * S + sy) * W + (x * S + sx), aa = al[i]; a += aa; r += rgb[i * 3] * aa; g += rgb[i * 3 + 1] * aa; b += rgb[i * 3 + 2] * aa; }
    const o = (y * Wout + x) * 4; out[o] = a > 0 ? clamp(Math.round(r / a), 0, 255) : 0; out[o + 1] = a > 0 ? clamp(Math.round(g / a), 0, 255) : 0; out[o + 2] = a > 0 ? clamp(Math.round(b / a), 0, 255) : 0; out[o + 3] = clamp(Math.round((a / (S * S)) * 255), 0, 255);
  }
  return out;
}
function png(W, H, rgba, alpha = true) {
  function crc(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; }
  function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const t = Buffer.from(type); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, cr]); }
  const bpp = alpha ? 4 : 3;
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  const raw = Buffer.alloc(H * (W * bpp + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * bpp + 1)] = 0;
    if (alpha) { rgba.copy(raw, y * (W * bpp + 1) + 1, y * W * 4, (y + 1) * W * 4); }
    else { for (let x = 0; x < W; x++) { const s = (y * W + x) * 4, d = y * (W * bpp + 1) + 1 + x * 3; raw[d] = rgba[s]; raw[d + 1] = rgba[s + 1]; raw[d + 2] = rgba[s + 2]; } }
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// 360° equirectangular space environment (2:1). Vertical gradient = horizontally seamless.
function equirect(W, H) {
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    const t = y / H, s = Math.sin(t * Math.PI);
    const r = 7 + 13 * s, g = 5 + 7 * s, b = 18 + 24 * s;
    for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255; }
  }
  const blobs = [[0.28, 0.42, 0.24, [120, 50, 205]], [0.64, 0.56, 0.28, [185, 40, 140]], [0.5, 0.3, 0.2, [60, 40, 165]], [0.85, 0.35, 0.18, [150, 60, 200]]];
  for (const [bx, by, br, col] of blobs) {
    const cx = bx * W, cy = by * H, rr = br * H;
    for (let y = Math.max(0, Math.floor(cy - rr)); y < Math.min(H, cy + rr); y++) for (let x = Math.max(0, Math.floor(cx - rr)); x < Math.min(W, cx + rr); x++) {
      const d = Math.hypot(x - cx, y - cy) / rr; if (d >= 1) continue; const a = (1 - d) ** 2 * 0.45; const o = (y * W + x) * 4;
      buf[o] = Math.min(255, buf[o] + col[0] * a); buf[o + 1] = Math.min(255, buf[o + 1] + col[1] * a); buf[o + 2] = Math.min(255, buf[o + 2] + col[2] * a);
    }
  }
  let seed = 99; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let k = 0; k < 5000; k++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), br = Math.floor(150 + rnd() * 105), sz = rnd() < 0.82 ? 0 : 1;
    for (let yy = -sz; yy <= sz; yy++) for (let xx = -sz; xx <= sz; xx++) { const px = x + xx, py = y + yy; if (px < 0 || py < 0 || px >= W || py >= H) continue; const o = (py * W + px) * 4; buf[o] = br; buf[o + 1] = br; buf[o + 2] = Math.min(255, br + 12); }
  }
  return buf;
}

const RES = "android/app/src/main/res";
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
const LG = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
// launcher: foreground full-bleed, legacy raster rounded
for (const [d, n] of Object.entries(FG)) writeFileSync(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, png(n, n, render(n, n, { rounded: false })));
for (const [d, n] of Object.entries(LG)) { const buf = png(n, n, render(n, n, { rounded: true })); writeFileSync(`${RES}/mipmap-${d}/ic_launcher.png`, buf); writeFileSync(`${RES}/mipmap-${d}/ic_launcher_round.png`, buf); }
// STORE: SOLID (no alpha channel) square icon + 10:3 hero 3000x900
for (const N of [512, 1024]) writeFileSync(`VRC-NEXUS-icon-${N}.png`, png(N, N, render(N, N, { rounded: false }), false));
writeFileSync(`VRC-NEXUS-hero-3000x900.png`, png(3000, 900, render(3000, 900, { rounded: false, S: 2 }), false));
writeFileSync(`VRC-NEXUS-cover-2560x1440.png`, png(2560, 1440, render(2560, 1440, { rounded: false, S: 2 }), false));
// Spatialized tile (optional): solid 180 background + transparent 180 foreground emblem (138 safe area)
writeFileSync(`VRC-NEXUS-tile-bg-180.png`, png(180, 180, render(180, 180, { background: true, emblem: false }), false));
writeFileSync(`VRC-NEXUS-tile-fg-180.png`, png(180, 180, render(180, 180, { background: false, emblem: true }), true));
writeFileSync(`VRC-NEXUS-360-6000x3000.png`, png(6000, 3000, equirect(6000, 3000), false));
console.log("wrote: icons + hero + cover + spatialized tile + 360 equirect + launcher icons");
