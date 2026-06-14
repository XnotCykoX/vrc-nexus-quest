// Pure-Node (no deps) generator for the VRC-NEXUS app icon — a glowing "nexus" orb with
// orbit rings over a violet galaxy. Renders at 4x supersample, downsamples, encodes PNG.
import { writeFileSync } from "node:fs";
import zlib from "node:zlib";

function render(N, rounded = true) {
  const S = 4, W = N * S;
  const rgb = new Float32Array(W * W * 3);
  const al = new Float32Array(W * W);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function blend(x, y, c, a) {
    if (a <= 0) return; x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= W) return;
    const i = y * W + x, j = i * 3, ea = al[i], oa = a + ea * (1 - a); if (oa <= 0) return;
    rgb[j] = (c[0] * a + rgb[j] * ea * (1 - a)) / oa; rgb[j + 1] = (c[1] * a + rgb[j + 1] * ea * (1 - a)) / oa; rgb[j + 2] = (c[2] * a + rgb[j + 2] * ea * (1 - a)) / oa; al[i] = oa;
  }
  const cx = W / 2, cy = W / 2, corner = 0.235 * W;
  const inRound = (x, y) => { const dx = Math.max(Math.abs(x - cx) - (W / 2 - corner), 0), dy = Math.max(Math.abs(y - cy) - (W / 2 - corner), 0); return Math.hypot(dx, dy) <= corner; };
  const bg = [[0, [20, 8, 44]], [0.5, [74, 26, 150]], [0.8, [120, 38, 196]], [1, [168, 30, 175]]];
  function grad(t) { t = clamp(t, 0, 1); for (let i = 1; i < bg.length; i++) if (t <= bg[i][0]) { const a = bg[i - 1], b = bg[i], f = (t - a[0]) / (b[0] - a[0]); return [lerp(a[1][0], b[1][0], f), lerp(a[1][1], b[1][1], f), lerp(a[1][2], b[1][2], f)]; } return bg[bg.length - 1][1]; }
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    if (rounded && !inRound(x + 0.5, y + 0.5)) continue;
    let c = grad((x + y) / (2 * W));
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / (W / 2);
    const glow = clamp(1 - d * 1.15, 0, 1) ** 2 * 0.5; c = [lerp(c[0], 200, glow), lerp(c[1], 140, glow), lerp(c[2], 255, glow)];
    const vig = clamp((d - 0.55) / 0.5, 0, 1) * 0.3; c = [c[0] * (1 - vig), c[1] * (1 - vig), c[2] * (1 - vig)];
    const i = y * W + x; al[i] = 1; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2];
  }
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let k = 0; k < 90; k++) {
    const x = rnd() * W, y = rnd() * W; if (rounded && !inRound(x, y)) continue;
    const r = (rnd() * 1.6 + 0.5) * S, a = rnd() * 0.7 + 0.3;
    for (let yy = -r - 1; yy <= r + 1; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) if (Math.hypot(xx, yy) <= r) blend(x + xx, y + yy, [255, 255, 255], a);
  }
  function ring(rx, ry, rot, thick, col, ga) {
    const cos = Math.cos(rot), sin = Math.sin(rot);
    for (let y = Math.floor(cy - rx - 8); y < cy + rx + 8; y++) for (let x = Math.floor(cx - rx - 8); x < cx + rx + 8; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy; const u = dx * cos + dy * sin, v = -dx * sin + dy * cos;
      const e = Math.hypot(u / rx, v / ry); if (Math.abs(e - 1) < thick) blend(x, y, col, ga * (1 - Math.abs(e - 1) / thick));
    }
  }
  ring(W * 0.34, W * 0.13, -0.5, 0.05, [216, 180, 255], 0.85);
  ring(W * 0.34, W * 0.13, 0.5, 0.05, [255, 150, 220], 0.7);
  function disc(px, py, r, col, a) { for (let y = Math.floor(py - r - 2); y <= py + r + 2; y++) for (let x = Math.floor(px - r - 2); x <= px + r + 2; x++) { const dd = Math.hypot(x + 0.5 - px, y + 0.5 - py); if (dd <= r) blend(x, y, col, a * clamp(r - dd, 0, 1)); } }
  for (let y = Math.floor(cy - W * 0.22); y < cy + W * 0.22; y++) for (let x = Math.floor(cx - W * 0.22); x < cx + W * 0.22; x++) { const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / (W * 0.2); if (dd < 1) blend(x, y, [190, 130, 255], (1 - dd) ** 2 * 0.55); }
  disc(cx, cy, W * 0.11, [120, 90, 240], 1);
  disc(cx, cy, W * 0.082, [200, 170, 255], 1);
  disc(cx - W * 0.02, cy - W * 0.02, W * 0.05, [255, 255, 255], 1);
  const out = Buffer.alloc(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let r = 0, g = 0, b = 0, a = 0; for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const i = (y * S + sy) * W + (x * S + sx), aa = al[i]; a += aa; r += rgb[i * 3] * aa; g += rgb[i * 3 + 1] * aa; b += rgb[i * 3 + 2] * aa; }
    const o = (y * N + x) * 4; out[o] = a > 0 ? clamp(Math.round(r / a), 0, 255) : 0; out[o + 1] = a > 0 ? clamp(Math.round(g / a), 0, 255) : 0; out[o + 2] = a > 0 ? clamp(Math.round(b / a), 0, 255) : 0; out[o + 3] = clamp(Math.round((a / (S * S)) * 255), 0, 255);
  }
  return out;
}
function png(N, rgba) {
  function crc(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (~c) >>> 0; }
  function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const t = Buffer.from(type); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, cr]); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(N * (N * 4 + 1)); for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; rgba.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
const RES = "android/app/src/main/res";
const FG = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };  // adaptive foreground
const LG = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };     // legacy raster
for (const [d, n] of Object.entries(FG)) writeFileSync(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, png(n, render(n, false)));
for (const [d, n] of Object.entries(LG)) { const buf = png(n, render(n, true)); writeFileSync(`${RES}/mipmap-${d}/ic_launcher.png`, buf); writeFileSync(`${RES}/mipmap-${d}/ic_launcher_round.png`, buf); }
for (const N of [512, 1024]) writeFileSync(`VRC-NEXUS-icon-${N}.png`, png(N, render(N, true)));
console.log("wrote store icons + launcher icons (foreground + legacy, all densities)");

