// Discover — search PUBLIC avatars across community avatar databases (same providers/format
// the PC version uses). Prismic (avtr.icu) returns clean VRChat-shaped avatar objects and is
// the primary source; it REQUIRES a proper User-Agent with app name + contact.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VRCNexus/1.2.17 deize@users.noreply.github.com";

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

// On the Quest, native HTTP lets us hit providers directly (and set the User-Agent).
// In the browser, route through the Vite dev proxy (which injects the UA) to dodge CORS.
const PROVIDERS = [
  { name: "prismic", base: "https://avtr.icu", proxy: "/prismic" },
  { name: "prismic-mirror", base: "https://avtr.zuxi.dev", proxy: "/prismic2" },
];

async function getJson(provider, q, limit, offset) {
  const qs = `search=${encodeURIComponent(q)}&limit=${limit}&n=${limit}&offset=${offset}`;
  if (isNative()) {
    const url = `${provider.base}/search?${qs}`;
    const { CapacitorHttp } = window.Capacitor.Plugins;
    const r = await CapacitorHttp.request({ url, method: "GET", headers: { "User-Agent": UA, Accept: "application/json,text/plain,*/*" } });
    return r.status >= 200 && r.status < 300 ? r.data : null;
  }
  const r = await fetch(`${provider.proxy}/search?${qs}`, { headers: { Accept: "application/json,text/plain,*/*" } });
  return r.ok ? r.json().catch(() => null) : null;
}

export async function discoverSearch(query, page = 1) {
  const q = String(query || "").trim();
  if (!q) return [];
  const limit = 60;
  const offset = (page - 1) * limit;
  const out = [];
  const seen = new Set();
  for (const provider of PROVIDERS) {
    let data = null;
    try { data = await getJson(provider, q, limit, offset); } catch { /* try next */ }
    for (const raw of extractList(data)) {
      const a = normalize(raw);
      if (!a || seen.has(a.id)) continue;
      seen.add(a.id);
      out.push(a);
    }
    if (out.length) break; // first provider that returns results wins
  }
  return out;
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  for (const k of ["results", "avatars", "data", "items", "records"]) {
    if (Array.isArray(data[k])) return data[k];
  }
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.some((x) => x && typeof x === "object")) return v;
  }
  return [];
}

function normalize(a) {
  if (!a || typeof a !== "object") return null;
  const id = a.id || a.avatarId || a.avatar_id || a.avtrId || a.vrc_id;
  if (!id || !String(id).startsWith("avtr_")) return null;
  const platRaw = a.platforms || a.supportedPlatforms || (a.unityPackages || []).map((p) => p && p.platform) || [];
  const platforms = [...new Set(
    (Array.isArray(platRaw) ? platRaw : [])
      .map((x) => String(x).toUpperCase())
      .map((p) => (p.includes("WINDOWS") || p === "PC") ? "PC" : (p.includes("ANDROID") || p.includes("QUEST")) ? "Quest" : p)
      .filter((p) => p && p !== "UNKNOWN")
  )];
  return {
    id,
    name: a.name || a.avatarName || a.avatar_name || "Unknown",
    author: a.authorName || a.author || a.author_name || a.creatorName || "",
    image: a.thumbnailImageUrl || a.imageUrl || a.image_url || a.thumbnail_url || a.thumbnail || "",
    platforms,
  };
}
