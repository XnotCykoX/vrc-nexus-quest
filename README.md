# VRC-NEXUS — Quest

Standalone Meta Quest companion for VRChat avatars, sideloaded via **SideQuest**. Same brand and core avatar features as the PC version, minus the PC-only SteamVR/overlay pieces (which can't exist on standalone hardware).

It runs as a **Capacitor** app: a Vue UI in a native Android shell. On the Quest it uses the native HTTP layer to talk to the VRChat + avatar-DB APIs (no CORS, custom User-Agent, its own cookie jar). In a desktop browser it runs through a dev proxy so you can build the UI fast.

## Channels (this build)
**Avatars**
- **Discover** — search public avatars (community avatar database).
- **Favourites** — your local favourites, with sections; star anything to add it.
- **inf Favourites** — import every avatar you've favourited on the VRChat website.
- **Recent** — avatars you've equipped.
- **Equip** — change into any public/own avatar straight from a card.

**Social (Phase 2)**
- **Friends** — online + offline friends with status colour, platform (PC/Quest), status text.
- **Worlds** — search worlds + view your favourite worlds.
- **Groups** — your VRChat groups (icon, short code, member count).
- **Notifs** — friend requests / invites; accept or dismiss.

**Tools (Phase 3 & 4)**
- **OSC** — chatbox messages + send/receive avatar parameters (Quest build only; needs VRChat → Settings → OSC enabled). Backed by a native Kotlin/Java UDP plugin (`native-android/OscPlugin.java`).
- **Gallery** — browse on-device screenshots from a configurable folder (default `Pictures/VRChat`).

**Account** — VRChat login (username/password + 2FA). Password is sent only to VRChat; only the login cookie is stored on-device.

## Run in a browser (fast dev loop)
```
npm install
npm run dev
```
Open the printed URL. (API calls go through the Vite proxy so CORS doesn't block them.)

## Build the Quest APK (sideload via SideQuest)
Requires **Android Studio + JDK** installed once.
```
npm install
npm run cap:add        # one-time: adds the native android/ project
npm run cap:sync       # builds the web app + copies it into android/
npm run cap:open       # opens Android Studio
```
In Android Studio: **Build → Generate Signed App Bundle / APK → APK**, create/select a keystore, build **release**. The APK lands in `android/app/release/`. Drag that APK into **SideQuest** (Quest in developer mode) to install.

> First time only: `npm run cap:add` creates the `android/` folder. After UI changes just re-run `npm run cap:sync` and rebuild in Android Studio.

## Auto-update (in-app updater)
On launch the app fetches a JSON manifest you host and, if a newer build is listed, shows an
**Update** banner that downloads the APK and fires the system install prompt (one tap — Android
never silently installs a sideloaded app).

To publish an update:
1. **Bump the version in two places:** `src/updater.js` (`BUILD.code`) **and** `android` versionCode (in `android/app/build.gradle`).
2. Build a **signed release APK with the SAME keystore every time** (see below) and upload it somewhere public.
3. Update your hosted **`update.json`** (sample in repo root):
   ```json
   { "version": "0.2.0", "versionCode": 2, "apkUrl": "https://your-host/VRC-NEXUS-Quest.apk", "notes": "What changed" }
   ```
4. Point `UPDATE_MANIFEST_URL` in `src/updater.js` at that hosted `update.json` (a GitHub raw URL works).

Every user's app polls the manifest on launch; when `versionCode` exceeds theirs, they get the banner.

### ⚠️ Signing key (required for updates)
Android only updates an app if the new APK is signed with the **same keystore**. The debug builds
above use a throwaway debug key. Before your first real release, create one permanent keystore and
always sign with it — otherwise updates (and App Lab) become impossible. Ask and I'll wire release
signing into the Gradle build.

## Roadmap (next phases)
- **Phase 2:** Friends/socials list, worlds search + favourites, notifications/invites, groups (all VRChat API — Quest-capable).
- **Phase 3:** OSC (chatbox + avatar parameters) via a small native Kotlin UDP plugin — validated on-device against standalone VRChat.
- **Phase 4:** Quest UX polish (controller focus, bigger panels), screenshot gallery.
- More Discover providers (Prismic, VRCX mirrors) folded into `src/discover.js`.

## Not included (platform wall, not effort)
SteamVR overlays (Lyric Island / player HUD), VRChat process detection, global hotkeys/tray — these need a PC + SteamVR and cannot run on a standalone Quest, regardless of SideQuest.
