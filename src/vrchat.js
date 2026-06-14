// VRChat API client.
// On the Quest (Capacitor) it uses the NATIVE http layer (no CORS, lets us set User-Agent
// and manage the auth/twoFactorAuth cookies ourselves). In a browser it falls back to fetch
// through the Vite dev proxy. Same surface either way.

import { Preferences } from "@capacitor/preferences";

const UA = "VRCNexusQuest/0.1 (vrc-nexus quest companion)";

function isNative() {
  return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}
const BASE = () => (isNative() ? "https://api.vrchat.cloud/api/1" : "/vrcapi");

// ---- cookie jar (persisted) ----
// Stored in native SharedPreferences (durable across app updates) AND localStorage (sync + browser).
let cookies = {};
try { cookies = JSON.parse(localStorage.getItem("vrc_cookies") || "{}"); } catch { cookies = {}; }
// Load the durable copy on startup (call before any request); falls back to the localStorage copy.
export async function loadSession() {
  try {
    const { value } = await Preferences.get({ key: "vrc_cookies" });
    if (value) { const c = JSON.parse(value); if (c && c.auth) cookies = c; }
  } catch { /* use localStorage copy */ }
  return cookies;
}
function saveCookies() {
  const json = JSON.stringify(cookies);
  try { localStorage.setItem("vrc_cookies", json); } catch { /* ignore */ }
  Preferences.set({ key: "vrc_cookies", value: json }).catch(() => {});
}
function cookieHeader() { return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "); }
function captureSetCookie(list) {
  for (const raw of list || []) {
    const m = String(raw).match(/^\s*([^=]+)=([^;]+)/);
    if (!m) continue;
    const name = m[1].trim();
    if (name === "auth" || name === "twoFactorAuth") cookies[name] = m[2].trim();
  }
}
export function isLoggedIn() { return !!cookies.auth; }
export function clearAuth() { cookies = {}; saveCookies(); }

// ---- request core ----
async function request(method, pathOrUrl, opts = {}) {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : BASE() + pathOrUrl;
  const headers = { "User-Agent": UA, Accept: "application/json", ...(opts.headers || {}) };
  if (opts.auth) headers["Authorization"] = opts.auth;
  if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  if (isNative()) {
    const ch = cookieHeader();
    if (ch) headers["Cookie"] = ch;
    const { CapacitorHttp } = window.Capacitor.Plugins;
    const res = await CapacitorHttp.request({
      url, method, headers,
      data: opts.body ? opts.body : undefined,
    });
    const sc = res.headers && (res.headers["set-cookie"] || res.headers["Set-Cookie"]);
    if (sc) { captureSetCookie(Array.isArray(sc) ? sc : [sc]); saveCookies(); }
    return { status: res.status, data: res.data };
  }
  // browser dev (proxy handles cookies via cookieDomainRewrite)
  const res = await fetch(url, {
    method, headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-json */ }
  return { status: res.status, data };
}

// ---- auth ----
export async function login(username, password) {
  const basic = "Basic " + btoa(`${encodeURIComponent(username)}:${encodeURIComponent(password)}`);
  const r = await request("GET", "/auth/user", { auth: basic });
  if (r.status === 200 && r.data) {
    if (Array.isArray(r.data.requiresTwoFactorAuth) && r.data.requiresTwoFactorAuth.length) {
      return { twofa: r.data.requiresTwoFactorAuth };
    }
    return { user: r.data };
  }
  throw new Error((r.data && r.data.error && r.data.error.message) || `Login failed (HTTP ${r.status}). Steam/Oculus-only accounts can't sign in by username.`);
}
export async function verify2fa(code, methods) {
  const m = (methods || []).map((x) => String(x).toLowerCase());
  const ep = m.includes("totp") ? "/auth/twofactorauth/totp/verify"
    : m.includes("emailotp") ? "/auth/twofactorauth/emailotp/verify"
    : "/auth/twofactorauth/otp/verify";
  const r = await request("POST", ep, { body: { code: String(code).trim() } });
  if (r.status !== 200 || (r.data && r.data.verified === false)) {
    throw new Error((r.data && r.data.error && r.data.error.message) || "That 2FA code was rejected.");
  }
  const me = await request("GET", "/auth/user");
  return me.data;
}
export async function currentUser() {
  const r = await request("GET", "/auth/user");
  return r.status === 200 && r.data && r.data.id ? r.data : null;
}
export async function logout() {
  try { await request("PUT", "/logout"); } catch { /* ignore */ }
  clearAuth();
}

// ---- avatars ----
export async function getAvatar(id) {
  const r = await request("GET", `/avatars/${encodeURIComponent(id)}`);
  return r.status === 200 ? r.data : null;
}
export async function selectAvatar(id) {
  const r = await request("PUT", `/avatars/${encodeURIComponent(id)}/select`);
  if (r.status !== 200) throw new Error((r.data && r.data.error && r.data.error.message) || `Couldn't equip avatar (HTTP ${r.status}). You can only equip public avatars or your own.`);
  return r.data;
}
export async function myAvatars(n = 60, offset = 0) {
  const r = await request("GET", `/avatars?user=me&releaseStatus=all&sort=_created_at&order=descending&n=${n}&offset=${offset}`);
  return Array.isArray(r.data) ? r.data : [];
}
// "Import Website Favourites" (inf favourites): the full avatar objects you've favourited on the VRChat site.
export async function websiteFavouriteAvatars(n = 100, offset = 0) {
  const r = await request("GET", `/avatars/favorites?n=${n}&offset=${offset}`);
  return Array.isArray(r.data) ? r.data : [];
}

// normalise any VRChat avatar object to our compact shape
export function normAvatar(a) {
  if (!a) return null;
  const img = a.thumbnailImageUrl || a.imageUrl || (a.unityPackages && a.unityPackages[0] && a.unityPackages[0].assetUrl) || "";
  const platforms = (a.unityPackages || []).map((p) => p.platform).filter(Boolean);
  return {
    id: a.id,
    name: a.name || "Unknown",
    author: a.authorName || a.author || "",
    image: img,
    platforms: platforms.length ? [...new Set(platforms)] : (a.platforms || []),
    description: a.description || "",
    releaseStatus: a.releaseStatus || "",
  };
}

// ===================== Phase 2: friends / worlds / notifications / groups =====================

// ---- friends / socials ----
export async function friends(offline = false, n = 100, offset = 0) {
  const r = await request("GET", `/auth/user/friends?offline=${offline ? "true" : "false"}&n=${n}&offset=${offset}`);
  return Array.isArray(r.data) ? r.data : [];
}
export function normFriend(f) {
  const loc = String(f.location || "");
  const where = loc === "offline" ? "Offline" : loc === "private" ? "Private" : loc === "traveling" ? "Traveling" : (loc ? "In-world" : "Active");
  return {
    id: f.id,
    name: f.displayName || "Unknown",
    status: f.status || "",
    statusDescription: f.statusDescription || "",
    where,
    location: loc,
    image: f.currentAvatarThumbnailImageUrl || f.userIcon || f.profilePicOverride || "",
    platform: (f.last_platform || "").replace("standalonewindows", "PC").replace("android", "Quest"),
  };
}
export async function getUser(id) {
  const r = await request("GET", `/users/${encodeURIComponent(id)}`);
  return r.status === 200 ? r.data : null;
}

// ---- worlds ----
export async function searchWorlds(query, n = 24) {
  const r = await request("GET", `/worlds?search=${encodeURIComponent(query)}&n=${n}&sort=relevance&order=descending`);
  return Array.isArray(r.data) ? r.data : [];
}
export async function favoriteWorlds(n = 100, offset = 0) {
  const r = await request("GET", `/worlds/favorites?n=${n}&offset=${offset}`);
  return Array.isArray(r.data) ? r.data : [];
}
export function normWorld(w) {
  const platforms = (w.unityPackages || []).map((p) => p.platform).filter(Boolean);
  return {
    id: w.id,
    name: w.name || "Unknown",
    author: w.authorName || "",
    image: w.thumbnailImageUrl || w.imageUrl || "",
    capacity: w.capacity || 0,
    visits: w.visits || 0,
    favorites: w.favorites || 0,
    platforms: platforms.length ? [...new Set(platforms.map((p) => p.replace("standalonewindows", "PC").replace("android", "Quest")))] : [],
  };
}

// ---- notifications / invites ----
export async function notifications(n = 100) {
  const r = await request("GET", `/auth/user/notifications?type=all&n=${n}`);
  return Array.isArray(r.data) ? r.data : [];
}
export async function acceptFriendRequest(id) {
  const r = await request("PUT", `/auth/user/notifications/${encodeURIComponent(id)}/accept`);
  return r.status === 200;
}
export async function hideNotification(id) {
  const r = await request("PUT", `/auth/user/notifications/${encodeURIComponent(id)}/hide`);
  return r.status === 200;
}
export async function sendFriendRequest(userId) {
  const r = await request("POST", `/user/${encodeURIComponent(userId)}/friendRequest`);
  return r.status === 200;
}

// ---- groups ----
export async function myGroups(userId) {
  const r = await request("GET", `/users/${encodeURIComponent(userId)}/groups`);
  return Array.isArray(r.data) ? r.data : [];
}
export async function groupById(id) {
  const r = await request("GET", `/groups/${encodeURIComponent(id)}`);
  return r.status === 200 ? r.data : null;
}
export function normGroup(g) {
  return {
    id: g.groupId || g.id,
    name: g.name || "Group",
    shortCode: g.shortCode ? `${g.shortCode}.${g.discriminator || ""}` : "",
    icon: g.iconUrl || g.bannerUrl || "",
    members: g.memberCount || 0,
    description: g.description || "",
  };
}
