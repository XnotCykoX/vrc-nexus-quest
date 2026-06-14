<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import * as vrc from "./vrchat.js";
import { discoverSearch } from "./discover.js";
import * as osc from "./osc.js";
import { listScreenshots } from "./gallery.js";
import { checkForUpdate, installUpdate } from "./updater.js";
import Scripts from "./Scripts.vue";
import { store, rememberMeta, metaFor, isFav, toggleFav, allFavIds, createSection, deleteSection, pushRecent } from "./store.js";

const update = reactive({ available: false, version: "", notes: "", apkUrl: "", busy: false });
async function doUpdate() {
  update.busy = true;
  try { await installUpdate(update.apkUrl); notify("Downloading update…"); }
  catch (e) { notify(e.message || String(e)); update.busy = false; }
}

const tab = ref("discover");
const TABS = [
  ["discover", "🔭", "Discover"],
  ["favourites", "★", "Favourites"],
  ["inffav", "∞", "inf Fav"],
  ["recent", "🕒", "Recent"],
  ["friends", "👥", "Friends"],
  ["worlds", "🌐", "Worlds"],
  ["groups", "🛡️", "Groups"],
  ["notifs", "🔔", "Notifs"],
  ["osc", "🎛️", "OSC"],
  ["scripts", "🧩", "Scripts"],
  ["gallery", "📷", "Gallery"],
  ["account", "👤", "Account"],
];

const toast = ref("");
let toastT = null;
function notify(m) { toast.value = m; clearTimeout(toastT); toastT = setTimeout(() => (toast.value = ""), 2600); }
function requireLogin() { if (!vrc.isLoggedIn()) { notify("Sign in first (Account tab)"); tab.value = "account"; return false; } return true; }

// ---------- auth ----------
const auth = reactive({ username: "", password: "", code: "", methods: null, busy: false, error: "" });
async function doLogin() {
  auth.error = ""; auth.busy = true;
  try {
    const r = await vrc.login(auth.username.trim(), auth.password);
    if (r.twofa) { auth.methods = r.twofa; notify("Enter your 2FA code"); }
    else { store.user = r.user; auth.password = ""; notify(`Signed in as ${r.user.displayName}`); }
  } catch (e) { auth.error = e.message || String(e); }
  finally { auth.busy = false; }
}
async function doVerify() {
  auth.error = ""; auth.busy = true;
  try {
    const user = await vrc.verify2fa(auth.code, auth.methods);
    store.user = user; auth.methods = null; auth.code = ""; auth.password = "";
    notify(`Signed in as ${user.displayName}`);
  } catch (e) { auth.error = e.message || String(e); }
  finally { auth.busy = false; }
}
async function doLogout() { await vrc.logout(); store.user = null; notify("Signed out"); }

// ---------- avatars: discover / inf / fav / recent ----------
const disc = reactive({ q: "", busy: false, results: [], page: 1, msg: "" });
async function runDiscover(reset = true) {
  if (!disc.q.trim()) return;
  disc.busy = true; disc.msg = "";
  if (reset) { disc.page = 1; disc.results = []; }
  try {
    const r = await discoverSearch(disc.q, disc.page);
    disc.results = reset ? r : [...disc.results, ...r];
    if (!disc.results.length) disc.msg = "No avatars found.";
  } catch (e) { disc.msg = "Search failed: " + (e.message || e); }
  finally { disc.busy = false; }
}
function discoverMore() { disc.page++; runDiscover(false); }

const inf = reactive({ busy: false, list: [], msg: "" });
async function importInfFav() {
  if (!requireLogin()) return;
  inf.busy = true; inf.msg = "";
  try {
    let all = [], offset = 0;
    for (let i = 0; i < 12; i++) {
      const batch = await vrc.websiteFavouriteAvatars(100, offset);
      if (!batch.length) break;
      all = all.concat(batch); offset += batch.length;
      if (batch.length < 100) break;
    }
    inf.list = all.map(vrc.normAvatar).filter(Boolean);
    inf.list.forEach(rememberMeta);
    inf.msg = `Imported ${inf.list.length} website favourites.`;
    notify(inf.msg);
  } catch (e) { inf.msg = "Import failed: " + (e.message || e); }
  finally { inf.busy = false; }
}
function importAllToLocal() { inf.list.forEach((a) => { if (!isFav(a.id)) toggleFav(a.id); }); notify(`Added ${inf.list.length} to favourites`); }

const favSearch = ref(""); const newSection = ref("");
const favouriteCards = computed(() => {
  const q = favSearch.value.trim().toLowerCase();
  return allFavIds().map(metaFor).filter((a) => !q || (a.name || "").toLowerCase().includes(q) || (a.author || "").toLowerCase().includes(q) || a.id.includes(q));
});
const recentCards = computed(() => store.recent.map(metaFor));

async function equip(av) {
  if (!requireLogin()) return;
  try { await vrc.selectAvatar(av.id); pushRecent(av.id); rememberMeta(av); notify(`Equipped: ${av.name}`); }
  catch (e) { notify(e.message || String(e)); }
}
function fav(av) { rememberMeta(av); toggleFav(av.id); }

// ---------- friends ----------
const fr = reactive({ busy: false, list: [], q: "", msg: "" });
async function loadFriends() {
  if (!requireLogin()) return;
  fr.busy = true; fr.msg = "";
  try {
    const [on, off] = await Promise.all([vrc.friends(false, 100), vrc.friends(true, 100)]);
    fr.list = [...on, ...off].map(vrc.normFriend);
    if (!fr.list.length) fr.msg = "No friends found.";
  } catch (e) { fr.msg = "Failed: " + (e.message || e); }
  finally { fr.busy = false; }
}
const friendsShown = computed(() => {
  const q = fr.q.trim().toLowerCase();
  return fr.list.filter((f) => !q || f.name.toLowerCase().includes(q));
});
function statusColor(s) { return s === "join me" ? "#3ddc84" : s === "active" ? "#5b9dff" : s === "ask me" ? "#ffce4d" : s === "busy" ? "#ff5c64" : "#6a7088"; }

// ---------- worlds ----------
const wld = reactive({ q: "", busy: false, list: [], mode: "search", msg: "" });
async function searchWorlds() {
  if (!wld.q.trim()) return;
  wld.busy = true; wld.msg = ""; wld.mode = "search";
  try { wld.list = (await vrc.searchWorlds(wld.q, 24)).map(vrc.normWorld); if (!wld.list.length) wld.msg = "No worlds found."; }
  catch (e) { wld.msg = "Search failed: " + (e.message || e); }
  finally { wld.busy = false; }
}
async function loadWorldFavs() {
  if (!requireLogin()) return;
  wld.busy = true; wld.msg = ""; wld.mode = "fav";
  try { wld.list = (await vrc.favoriteWorlds(100)).map(vrc.normWorld); if (!wld.list.length) wld.msg = "No favourite worlds."; }
  catch (e) { wld.msg = "Failed: " + (e.message || e); }
  finally { wld.busy = false; }
}

// ---------- groups ----------
const grp = reactive({ busy: false, list: [], msg: "" });
async function loadGroups() {
  if (!requireLogin()) return;
  grp.busy = true; grp.msg = "";
  try { grp.list = (await vrc.myGroups(store.user.id)).map(vrc.normGroup); if (!grp.list.length) grp.msg = "You're not in any groups."; }
  catch (e) { grp.msg = "Failed: " + (e.message || e); }
  finally { grp.busy = false; }
}

// ---------- notifications ----------
const nt = reactive({ busy: false, list: [], msg: "" });
async function loadNotifs() {
  if (!requireLogin()) return;
  nt.busy = true; nt.msg = "";
  try { nt.list = await vrc.notifications(100); if (!nt.list.length) nt.msg = "No notifications."; }
  catch (e) { nt.msg = "Failed: " + (e.message || e); }
  finally { nt.busy = false; }
}
async function acceptReq(n) { if (await vrc.acceptFriendRequest(n.id)) { nt.list = nt.list.filter((x) => x.id !== n.id); notify("Accepted"); } }
async function hideNotif(n) { if (await vrc.hideNotification(n.id)) { nt.list = nt.list.filter((x) => x.id !== n.id); } }

// ---------- OSC ----------
const _t = osc.getTarget();
const oscState = reactive({ available: osc.oscAvailable(), chat: "", pName: "", pVal: "", receiving: false, params: {}, host: _t.host, port: _t.port, last: "" });
const paramList = computed(() => Object.entries(oscState.params).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)));
function fmtVal(v) { return typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(3)) : String(v); }
// Auto-collect every avatar parameter VRChat streams (built-ins arrive instantly; all of them on avatar load).
async function startOsc() {
  if (oscState.receiving || !oscState.available) return;
  try {
    await osc.startReceiver((address, args) => {
      if (address === "/avatar/change") { oscState.params = {}; return; }      // new avatar -> reset list
      if (address.startsWith("/avatar/parameters/")) oscState.params[address.slice(19)] = args[0];
    });
    oscState.receiving = true;
  } catch (e) { notify(e.message || String(e)); }
}
async function toggleParam(p) {
  const next = typeof p.value === "boolean" ? !p.value : (p.value ? 0 : 1);
  osc.setTarget(oscState.host, oscState.port);
  try { await osc.setParam(p.name, next); oscState.params[p.name] = next; }
  catch (e) { notify(e.message || String(e)); }
}
function editParam(p) { oscState.pName = p.name; oscState.pVal = String(p.value); }
function applyTarget() { osc.setTarget(oscState.host, oscState.port); notify(`OSC target set to ${oscState.host}:${oscState.port}`); }
async function sendChat() {
  if (!oscState.chat.trim()) return;
  osc.setTarget(oscState.host, oscState.port);
  try {
    const n = await osc.chatbox(oscState.chat.trim());
    oscState.last = `✅ Sent ${n} bytes to ${oscState.host}:${oscState.port}`;
    notify("Sent to chatbox");
    oscState.chat = "";
  } catch (e) { oscState.last = `❌ ${e.message || e}`; notify(e.message || String(e)); }
}
async function sendParam(forceType) {
  if (!oscState.pName.trim()) return;
  let v = oscState.pVal.trim();
  let value;
  if (forceType === "toggle") value = true;
  else if (v === "true" || v === "false") value = v === "true";
  else if (v.includes(".")) value = parseFloat(v);
  else value = parseInt(v, 10);
  osc.setTarget(oscState.host, oscState.port);
  try { const n = await osc.setParam(oscState.pName.trim(), value); oscState.last = `✅ Sent ${n} bytes — ${oscState.pName}=${value}`; notify(`Sent ${oscState.pName} = ${value}`); }
  catch (e) { oscState.last = `❌ ${e.message || e}`; notify(e.message || String(e)); }
}
function clearParams() { oscState.params = {}; }

// ---------- gallery ----------
const gal = reactive({ busy: false, images: [], path: "Pictures/VRChat", msg: "" });
async function loadGallery() {
  gal.busy = true; gal.msg = "";
  const r = await listScreenshots(gal.path.trim() || "Pictures/VRChat");
  gal.images = r.images || [];
  if (!r.ok) gal.msg = r.error;
  else if (!gal.images.length) gal.msg = "No images found in that folder.";
  gal.busy = false;
}

// ---------- lazy load on tab open ----------
function openTab(name) {
  tab.value = name;
  if (name === "friends" && !fr.list.length) loadFriends();
  if (name === "groups" && !grp.list.length) loadGroups();
  if (name === "notifs" && !nt.list.length) loadNotifs();
  if (name === "worlds" && wld.mode === "fav" && !wld.list.length) loadWorldFavs();
  if (name === "osc") startOsc();
}

onMounted(async () => {
  await vrc.loadSession();               // restore the durable login cookie (survives updates)
  if (vrc.isLoggedIn()) { try { store.user = await vrc.currentUser(); } catch { /* ignore */ } }
  try { const u = await checkForUpdate(); if (u.available) Object.assign(update, u); } catch { /* ignore */ }
});
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="brand"><span class="logo">✦</span> VRC-<b>NEXUS</b> <small>Quest</small></div>
      <div class="sp"></div>
      <div class="me" v-if="store.user">{{ store.user.displayName }}</div>
      <div class="me muted" v-else>Not signed in</div>
    </header>

    <nav class="tabs">
      <button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="openTab(t[0])">
        <span class="ic">{{ t[1] }}</span><span class="lb">{{ t[2] }}</span>
      </button>
    </nav>

    <div v-if="update.available" class="updbar">
      <span>⬆️ Update available — <b>v{{ update.version }}</b>{{ update.notes ? ' · ' + update.notes : '' }}</span>
      <button class="mini ok" :disabled="update.busy" @click="doUpdate">{{ update.busy ? "Downloading…" : "Update" }}</button>
    </div>

    <main class="body">
      <!-- DISCOVER -->
      <section v-show="tab === 'discover'">
        <div class="bar">
          <input v-model="disc.q" placeholder="Search public avatars…" @keydown.enter="runDiscover()" />
          <button class="primary" :disabled="disc.busy" @click="runDiscover()">{{ disc.busy ? "…" : "Search" }}</button>
        </div>
        <p v-if="disc.msg" class="muted">{{ disc.msg }}</p>
        <div class="grid">
          <article v-for="a in disc.results" :key="a.id" class="card">
            <div class="thumb" :style="a.image ? `background-image:url(${a.image})` : ''"></div>
            <div class="meta"><div class="nm">{{ a.name }}</div><div class="au">{{ a.author }}</div></div>
            <div class="act"><button class="fav" :class="{ on: isFav(a.id) }" @click="fav(a)">★</button><button class="equip" @click="equip(a)">Equip</button></div>
          </article>
        </div>
        <div v-if="disc.results.length" class="center"><button class="ghost" :disabled="disc.busy" @click="discoverMore">Load more</button></div>
      </section>

      <!-- FAVOURITES -->
      <section v-show="tab === 'favourites'">
        <div class="bar">
          <input v-model="favSearch" placeholder="Search favourites…" />
          <input v-model="newSection" placeholder="New section…" style="max-width:160px" />
          <button class="ghost" @click="createSection(newSection); newSection=''">Add section</button>
        </div>
        <p class="muted" v-if="!favouriteCards.length">No favourites yet. Star avatars in Discover, or import from inf Fav.</p>
        <div class="chips" v-if="Object.keys(store.favourites.sections).length">
          <span v-for="(arr,name) in store.favourites.sections" :key="name" class="chip">{{ name }} ({{ arr.length }}) <b @click="deleteSection(name)">×</b></span>
        </div>
        <div class="grid">
          <article v-for="a in favouriteCards" :key="a.id" class="card">
            <div class="thumb" :style="a.image ? `background-image:url(${a.image})` : ''"></div>
            <div class="meta"><div class="nm">{{ a.name }}</div><div class="au">{{ a.author }}</div></div>
            <div class="act"><button class="fav on" @click="toggleFav(a.id)">★</button><button class="equip" @click="equip(a)">Equip</button></div>
          </article>
        </div>
      </section>

      <!-- INF FAVOURITES -->
      <section v-show="tab === 'inffav'">
        <div class="bar">
          <button class="primary" :disabled="inf.busy" @click="importInfFav">{{ inf.busy ? "Importing…" : "Import website favourites" }}</button>
          <button class="ghost" v-if="inf.list.length" @click="importAllToLocal">Add all to favourites</button>
        </div>
        <p class="muted">Every avatar you've favourited on the VRChat website.</p>
        <p v-if="inf.msg">{{ inf.msg }}</p>
        <div class="grid">
          <article v-for="a in inf.list" :key="a.id" class="card">
            <div class="thumb" :style="a.image ? `background-image:url(${a.image})` : ''"></div>
            <div class="meta"><div class="nm">{{ a.name }}</div><div class="au">{{ a.author }}</div></div>
            <div class="act"><button class="fav" :class="{ on: isFav(a.id) }" @click="fav(a)">★</button><button class="equip" @click="equip(a)">Equip</button></div>
          </article>
        </div>
      </section>

      <!-- RECENT -->
      <section v-show="tab === 'recent'">
        <p class="muted" v-if="!recentCards.length">Avatars you equip show up here.</p>
        <div class="grid">
          <article v-for="a in recentCards" :key="a.id" class="card">
            <div class="thumb" :style="a.image ? `background-image:url(${a.image})` : ''"></div>
            <div class="meta"><div class="nm">{{ a.name }}</div><div class="au">{{ a.author }}</div></div>
            <div class="act"><button class="fav" :class="{ on: isFav(a.id) }" @click="fav(a)">★</button><button class="equip" @click="equip(a)">Equip</button></div>
          </article>
        </div>
      </section>

      <!-- FRIENDS -->
      <section v-show="tab === 'friends'">
        <div class="bar">
          <input v-model="fr.q" placeholder="Search friends…" />
          <button class="ghost" :disabled="fr.busy" @click="loadFriends">{{ fr.busy ? "…" : "Refresh" }}</button>
        </div>
        <p v-if="fr.msg" class="muted">{{ fr.msg }}</p>
        <div class="rows">
          <div v-for="f in friendsShown" :key="f.id" class="rowitem">
            <div class="ravatar" :style="f.image ? `background-image:url(${f.image})` : ''"><i class="dot" :style="`background:${statusColor(f.status)}`"></i></div>
            <div class="rmain"><div class="rname">{{ f.name }} <span v-if="f.platform" class="tagp">{{ f.platform }}</span></div>
              <div class="rsub">{{ f.statusDescription || f.where }}</div></div>
            <div class="rwhere">{{ f.where }}</div>
          </div>
        </div>
      </section>

      <!-- WORLDS -->
      <section v-show="tab === 'worlds'">
        <div class="bar">
          <input v-model="wld.q" placeholder="Search worlds…" @keydown.enter="searchWorlds" />
          <button class="primary" :disabled="wld.busy" @click="searchWorlds">Search</button>
          <button class="ghost" :disabled="wld.busy" @click="loadWorldFavs">My favourites</button>
        </div>
        <p v-if="wld.msg" class="muted">{{ wld.msg }}</p>
        <div class="grid">
          <article v-for="w in wld.list" :key="w.id" class="card">
            <div class="thumb" :style="w.image ? `background-image:url(${w.image})` : ''"></div>
            <div class="meta"><div class="nm">{{ w.name }}</div><div class="au">{{ w.author }} · 👥{{ w.capacity }}</div></div>
            <div class="act"><span class="wtag" v-for="p in w.platforms" :key="p">{{ p }}</span><span class="wfav">★ {{ w.favorites }}</span></div>
          </article>
        </div>
      </section>

      <!-- GROUPS -->
      <section v-show="tab === 'groups'">
        <div class="bar"><button class="ghost" :disabled="grp.busy" @click="loadGroups">{{ grp.busy ? "…" : "Refresh" }}</button></div>
        <p v-if="grp.msg" class="muted">{{ grp.msg }}</p>
        <div class="grid">
          <article v-for="g in grp.list" :key="g.id" class="card group">
            <div class="thumb sq" :style="g.icon ? `background-image:url(${g.icon})` : ''"></div>
            <div class="meta"><div class="nm">{{ g.name }}</div><div class="au">{{ g.shortCode }} · 👥{{ g.members }}</div></div>
          </article>
        </div>
      </section>

      <!-- NOTIFICATIONS -->
      <section v-show="tab === 'notifs'">
        <div class="bar"><button class="ghost" :disabled="nt.busy" @click="loadNotifs">{{ nt.busy ? "…" : "Refresh" }}</button></div>
        <p v-if="nt.msg" class="muted">{{ nt.msg }}</p>
        <div class="rows">
          <div v-for="n in nt.list" :key="n.id" class="rowitem">
            <div class="ntype">{{ n.type === 'friendRequest' ? '🤝' : n.type === 'invite' ? '✉️' : n.type === 'requestInvite' ? '🙋' : '🔔' }}</div>
            <div class="rmain"><div class="rname">{{ n.senderUsername || n.username || 'VRChat' }}</div><div class="rsub">{{ n.message || n.type }}</div></div>
            <div class="ract">
              <button v-if="n.type === 'friendRequest'" class="mini ok" @click="acceptReq(n)">Accept</button>
              <button class="mini" @click="hideNotif(n)">✕</button>
            </div>
          </div>
        </div>
      </section>

      <!-- OSC -->
      <section v-show="tab === 'osc'" class="account">
        <div class="card-lg" v-if="!oscState.available">
          <h2>🎛️ OSC</h2>
          <p class="muted">OSC sends UDP to VRChat and only works on the Quest build (not the browser). Enable OSC in VRChat → Settings → OSC.</p>
        </div>
        <template v-else>
          <div class="card-lg">
            <h2>🎯 OSC target</h2>
            <p class="muted small">VRChat listens on 127.0.0.1:9000. Enable OSC in VRChat → Main Menu → Settings → OSC.</p>
            <div class="row2">
              <input v-model="oscState.host" placeholder="Host" style="max-width:180px" />
              <input v-model="oscState.port" placeholder="Port" inputmode="numeric" style="max-width:110px" />
              <button class="ghost" @click="applyTarget">Set</button>
            </div>
            <p v-if="oscState.last" class="osc-status">{{ oscState.last }}</p>
          </div>
          <div class="card-lg">
            <h2>💬 Chatbox</h2>
            <input v-model="oscState.chat" placeholder="Type a message…" maxlength="144" @keydown.enter="sendChat" />
            <button class="primary" @click="sendChat">Send to chatbox</button>
          </div>
          <div class="card-lg">
            <div class="row2" style="justify-content:space-between;align-items:center">
              <h2 style="margin:0">🎚️ Avatar parameters ({{ paramList.length }})</h2>
              <button class="mini" @click="clearParams">Clear</button>
            </div>
            <p class="muted small" v-if="!paramList.length">{{ oscState.receiving ? "Listening… built-in parameters appear instantly; custom toggles appear when they change in-game (or re-load your avatar to dump them all)." : "Open this tab with VRChat OSC enabled to auto-detect parameters." }}</p>
            <div class="paramlist">
              <div v-for="p in paramList" :key="p.name" class="prow">
                <span>{{ p.name }}</span>
                <span class="pright">
                  <button v-if="typeof p.value === 'boolean'" class="mini" :class="{ ok: p.value }" @click="toggleParam(p)">{{ p.value ? "ON" : "OFF" }}</button>
                  <b v-else>{{ fmtVal(p.value) }}</b>
                  <button class="mini" title="Edit/send manually" @click="editParam(p)">✎</button>
                </span>
              </div>
            </div>
          </div>
          <div class="card-lg">
            <h2>🎚️ Send a parameter manually</h2>
            <input v-model="oscState.pName" placeholder="Parameter name (e.g. Hue)" />
            <input v-model="oscState.pVal" placeholder="Value (1, 0.5, true/false)" />
            <div class="row2">
              <button class="primary" @click="sendParam()">Send</button>
              <button class="ghost" @click="sendParam('toggle')">Send TRUE</button>
            </div>
          </div>
        </template>
      </section>

      <!-- SCRIPTS -->
      <section v-show="tab === 'scripts'">
        <Scripts />
      </section>

      <!-- GALLERY -->
      <section v-show="tab === 'gallery'">
        <div class="bar">
          <input v-model="gal.path" placeholder="Folder (e.g. Pictures/VRChat)" />
          <button class="primary" :disabled="gal.busy" @click="loadGallery">{{ gal.busy ? "…" : "Load" }}</button>
        </div>
        <p v-if="gal.msg" class="muted">{{ gal.msg }}</p>
        <div class="gallery">
          <a v-for="im in gal.images" :key="im.name" class="shot" :href="im.src" target="_blank" :style="`background-image:url(${im.src})`"></a>
        </div>
      </section>

      <!-- ACCOUNT -->
      <section v-show="tab === 'account'" class="account">
        <div v-if="store.user" class="card-lg">
          <div class="prof">
            <div class="pimg" :style="store.user.currentAvatarThumbnailImageUrl ? `background-image:url(${store.user.currentAvatarThumbnailImageUrl})` : ''"></div>
            <div><h2>{{ store.user.displayName }}</h2><p class="muted">{{ store.user.statusDescription || store.user.status }}</p><p class="muted small">{{ store.user.id }}</p></div>
          </div>
          <button class="ghost" @click="doLogout">Sign out</button>
        </div>
        <div v-else class="card-lg">
          <h2>Sign in to VRChat</h2>
          <template v-if="!auth.methods">
            <input v-model="auth.username" placeholder="Username or email" autocomplete="username" />
            <input v-model="auth.password" type="password" placeholder="Password" autocomplete="current-password" @keydown.enter="doLogin" />
            <button class="primary" :disabled="auth.busy" @click="doLogin">{{ auth.busy ? "…" : "Sign in" }}</button>
          </template>
          <template v-else>
            <p class="muted">Enter the 2FA code ({{ auth.methods.join(", ") }}).</p>
            <input v-model="auth.code" placeholder="2FA code" inputmode="numeric" @keydown.enter="doVerify" />
            <button class="primary" :disabled="auth.busy" @click="doVerify">{{ auth.busy ? "…" : "Verify" }}</button>
          </template>
          <p v-if="auth.error" class="err">{{ auth.error }}</p>
          <p class="muted small">Your password is sent only to VRChat and never stored — only the login cookie is kept on this device.</p>
        </div>
      </section>
    </main>

    <div class="toast" :class="{ show: toast }">{{ toast }}</div>
  </div>
</template>
