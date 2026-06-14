// Local app state — favourites (with sections), cached avatar metadata, and recents.
// Persisted to localStorage (survives in the Capacitor webview too).
import { reactive } from "vue";

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
function dump(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

export const store = reactive({
  user: null,
  favourites: load("favourites", { unsectioned: [], sections: {} }), // { unsectioned:[ids], sections:{ name:[ids] } }
  meta: load("avatarMeta", {}),   // { avtr_id: {id,name,author,image,platforms} }
  recent: load("recent", []),     // [ids] (most-recent first)
});

export function persist() {
  dump("favourites", store.favourites);
  dump("avatarMeta", store.meta);
  dump("recent", store.recent);
}

// Cache the display info for an avatar so favourites/recents render without re-fetching.
export function rememberMeta(av) {
  if (av && av.id) {
    store.meta[av.id] = {
      id: av.id,
      name: av.name || "Unknown",
      author: av.author || "",
      image: av.image || "",
      platforms: av.platforms || [],
    };
    persist();
  }
}

export function metaFor(id) {
  return store.meta[id] || { id, name: id, author: "", image: "", platforms: [] };
}

export function isFav(id) {
  if (store.favourites.unsectioned.includes(id)) return true;
  return Object.values(store.favourites.sections).some((arr) => arr.includes(id));
}

export function toggleFav(id) {
  if (isFav(id)) {
    store.favourites.unsectioned = store.favourites.unsectioned.filter((x) => x !== id);
    for (const k of Object.keys(store.favourites.sections)) {
      store.favourites.sections[k] = store.favourites.sections[k].filter((x) => x !== id);
    }
  } else {
    store.favourites.unsectioned.push(id);
  }
  persist();
}

export function addToSection(id, section) {
  if (!section) { if (!store.favourites.unsectioned.includes(id)) store.favourites.unsectioned.push(id); persist(); return; }
  store.favourites.sections[section] = store.favourites.sections[section] || [];
  if (!store.favourites.sections[section].includes(id)) store.favourites.sections[section].push(id);
  store.favourites.unsectioned = store.favourites.unsectioned.filter((x) => x !== id);
  persist();
}

export function createSection(name) {
  name = String(name || "").trim();
  if (!name || store.favourites.sections[name]) return;
  store.favourites.sections[name] = [];
  persist();
}
export function deleteSection(name) {
  if (store.favourites.sections[name]) { delete store.favourites.sections[name]; persist(); }
}

export function allFavIds() {
  return [...new Set([...store.favourites.unsectioned, ...Object.values(store.favourites.sections).flat()])];
}

export function pushRecent(id) {
  store.recent = [id, ...store.recent.filter((x) => x !== id)].slice(0, 60);
  persist();
}
