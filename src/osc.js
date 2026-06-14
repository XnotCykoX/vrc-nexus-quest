// OSC over UDP for standalone VRChat (Quest).
// The raw UDP socket is provided by a tiny native Kotlin/Java Capacitor plugin ("Osc");
// here we encode/decode OSC packets and expose chatbox + avatar-parameter helpers.

import { registerPlugin } from "@capacitor/core";
const Osc = registerPlugin("Osc");

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}
export function oscAvailable() { return isNative(); }

// ---- OSC encoding ----
function padString(str) {
  const bytes = new TextEncoder().encode(str);
  const len = bytes.length + 1;                 // +1 for the null terminator
  const padded = len + ((4 - (len % 4)) % 4);   // pad to multiple of 4
  const out = new Uint8Array(padded);
  out.set(bytes);
  return out;
}
function concat(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}
// args: [{ type: "f"|"i"|"s"|"b", value }]
function encode(address, args) {
  let tags = ",";
  for (const a of args) tags += a.type === "b" ? (a.value ? "T" : "F") : a.type;
  const chunks = [padString(address), padString(tags)];
  for (const a of args) {
    if (a.type === "f") { const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, Number(a.value), false); chunks.push(new Uint8Array(dv.buffer)); }
    else if (a.type === "i") { const dv = new DataView(new ArrayBuffer(4)); dv.setInt32(0, a.value | 0, false); chunks.push(new Uint8Array(dv.buffer)); }
    else if (a.type === "s") { chunks.push(padString(String(a.value))); }
    // "b" -> encoded in the type tag (T/F), no payload
  }
  return concat(chunks);
}
function toB64(u8) { let s = ""; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }

// ---- OSC decoding (single message: address + first arg) ----
function readString(view, offset) {
  let end = offset;
  while (end < view.byteLength && view.getUint8(end) !== 0) end++;
  const str = new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset + offset, end - offset));
  let next = end + 1;
  next += (4 - (next % 4)) % 4;
  return [str, next];
}
function decode(u8) {
  try {
    const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let [address, off] = readString(view, 0);
    let [tags, o2] = readString(view, off);
    off = o2;
    const args = [];
    for (const t of tags.slice(1)) {
      if (t === "f") { args.push(view.getFloat32(off, false)); off += 4; }
      else if (t === "i") { args.push(view.getInt32(off, false)); off += 4; }
      else if (t === "s") { const [s, n] = readString(view, off); args.push(s); off = n; }
      else if (t === "T") args.push(true);
      else if (t === "F") args.push(false);
    }
    return { address, args };
  } catch { return null; }
}

// ---- target (configurable; VRChat listens on 127.0.0.1:9000) ----
let HOST = "127.0.0.1";
let PORT = 9000;
try { HOST = localStorage.getItem("osc_host") || HOST; PORT = Number(localStorage.getItem("osc_port")) || PORT; } catch { /* defaults */ }
export function getTarget() { return { host: HOST, port: PORT }; }
export function setTarget(host, port) {
  HOST = String(host || "127.0.0.1").trim();
  PORT = Number(port) || 9000;
  try { localStorage.setItem("osc_host", HOST); localStorage.setItem("osc_port", String(PORT)); } catch { /* ignore */ }
}

// ---- send helpers (return the byte count sent, for diagnostics) ----
export async function sendRaw(address, args) {
  if (!isNative()) throw new Error("OSC works on the Quest only (no UDP in the browser).");
  const bytes = encode(address, args);
  await Osc.send({ host: HOST, port: PORT, data: toB64(bytes) });
  return bytes.length;
}
export async function chatbox(text, immediate = true, sound = false) {
  return sendRaw("/chatbox/input", [
    { type: "s", value: String(text).slice(0, 144) },
    { type: "b", value: immediate },
    { type: "b", value: sound },
  ]);
}
export async function chatboxTyping(on) {
  await sendRaw("/chatbox/typing", [{ type: "b", value: !!on }]);
}
export async function setParam(name, value) {
  let arg;
  if (typeof value === "boolean") arg = { type: "b", value };
  else if (Number.isInteger(value)) arg = { type: "i", value };
  else arg = { type: "f", value: Number(value) };
  return sendRaw(`/avatar/parameters/${name}`, [arg]);
}

// ---- VRChat input helpers (the PC-app quick actions) ----
export async function inputInt(name, value) { return sendRaw(`/input/${name}`, [{ type: "i", value: value | 0 }]); }
export async function pulseInput(name, ms = 120) {
  await inputInt(name, 1);
  await new Promise((r) => setTimeout(r, ms));
  return inputInt(name, 0);
}
export async function voicePulse() { return pulseInput("Voice"); }   // toggles mute
export async function jump() { return pulseInput("Jump"); }

// ---- receive (all incoming OSC; caller decides what to do) ----
let listening = false;
let oscHandle = null;
export function isReceiving() { return listening; }
export async function startReceiver(onMessage) {
  if (!isNative() || listening) return;
  listening = true;
  oscHandle = await Osc.addListener("osc", (ev) => {
    try {
      const bin = Uint8Array.from(atob(ev.data), (c) => c.charCodeAt(0));
      const msg = decode(bin);
      if (msg && msg.address) onMessage(msg.address, msg.args);
    } catch { /* ignore malformed */ }
  });
  await Osc.startListen({ port: 9001 });
}
export async function stopReceiver() {
  if (!isNative() || !listening) return;
  listening = false;
  try { if (oscHandle) { oscHandle.remove(); oscHandle = null; } } catch { /* ignore */ }
  try { await Osc.stopListen(); } catch { /* ignore */ }
}
