// In-app updater. On launch the app fetches a small JSON manifest you host; if it lists a
// newer build, it offers a one-tap update that downloads the APK and fires the install prompt.
//
// REQUIREMENTS for updates to actually apply:
//   • Every release APK must be signed with the SAME keystore as the installed app.
//   • Bump BUILD.code below (and android versionCode) for each release.
//   • Host update.json + the APK somewhere public; set UPDATE_MANIFEST_URL.
import { registerPlugin } from "@capacitor/core";
const Updater = registerPlugin("Updater");

// This build's identity — bump on every release.
export const BUILD = { version: "0.1.9", code: 10 };

// Hosted manifest (GitHub raw). The app polls this on launch to offer updates.
export const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/XnotCykoX/vrc-nexus-quest/main/update.json";

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

async function fetchJson(url) {
  if (isNative()) {
    const { CapacitorHttp } = window.Capacitor.Plugins;
    const r = await CapacitorHttp.request({ url: url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), method: "GET", headers: { Accept: "application/json" } });
    return r.status >= 200 && r.status < 300 ? r.data : null;
  }
  const r = await fetch(url, { cache: "no-store" });
  return r.ok ? r.json().catch(() => null) : null;
}

// Returns { available, version, notes, apkUrl } or { available:false }.
export async function checkForUpdate() {
  if (!isNative()) return { available: false };
  try {
    const m = await fetchJson(UPDATE_MANIFEST_URL);
    if (!m) return { available: false };
    const remoteCode = Number(m.versionCode || 0);
    if (remoteCode > BUILD.code && m.apkUrl) {
      return { available: true, version: m.version || "?", notes: m.notes || "", apkUrl: m.apkUrl };
    }
  } catch { /* offline / manifest unreachable */ }
  return { available: false };
}

export async function installUpdate(apkUrl) {
  if (!isNative()) throw new Error("Updates run on the Quest build only.");
  await Updater.downloadAndInstall({ url: apkUrl });
}
