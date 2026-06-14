# VRC-NEXUS — Meta App Lab Submission Pack

Everything you need to submit to **App Lab** (developer.meta.com → your org → Create App). Items marked **DONE** are produced for you in this repo; the rest are forms you fill in on Meta's dashboard.

---

## ⚠️ Read first — two honest caveats
1. **This is a 2D app.** App Lab is built primarily for **VR** experiences. A purely 2D/utility app *can* be submitted but **approval is not guaranteed** — Meta may ask for VR content or reject it. If it's rejected, your reliable distribution stays: **one-time sideload + the in-app updater** (no PC needed after the first install). Submit and see — nothing to lose.
2. **Switching to the release key changes the app signature.** Anyone who installed a previous **debug** build must **uninstall it first**, then install the new **release** build. Do this now while you have few testers. From here on, always ship the **release** APK.

---

## 1. App identity — **DONE**
| Field | Value |
|---|---|
| App name | **VRC-NEXUS** |
| Package / App ID | `com.deize.vrcnexus.quest` |
| Version | `0.1.7` (versionCode `8`) |
| Min / Target SDK | per `android/variables.gradle` (Capacitor defaults) |
| Build to upload | `VRC-NEXUS-Quest-RELEASE.apk` (on your Desktop) — release-signed |

## 2. Signing keystore — **DONE (back this up!)**
- Keystore: `android/vrc-nexus-release.jks`
- Credentials: `android/keystore.properties` (alias `vrcnexus`, password in that file)
- Certificate fingerprints (Meta sometimes asks):
  - SHA-1: `AA:58:E9:D8:CA:B3:F8:3B:5D:47:36:5B:35:90:FC:61:00:8E:E9:7F`
  - SHA-256: `15:16:8E:4B:6D:5C:1F:68:A5:C4:15:05:CC:C3:73:63:75:97:D4:C5:A3:2B:BE:74:15:B3:49:1F:38:94:16:93`

> 🔐 **CRITICAL:** Copy `vrc-nexus-release.jks` + `keystore.properties` somewhere safe (password manager / cloud backup). **If you lose them you can never update the app again** — not on App Lab, not via the in-app updater. They are git-ignored on purpose (never push them to GitHub).

To build a release APK in future: `npm run build && npx cap sync android && cd android && .\gradlew.bat assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk`.

## 3. Store graphics — specs to upload
Meta's required art (verify exact sizes in the uploader — Meta tweaks them):
- **App icon / square logo** — 512×512 PNG (a `VRC-NEXUS-icon-512.png` is generated in this repo)
- **Landscape cover** — 2560×1440 PNG/JPG (16:9)
- **Hero / banner** — 1440×700-ish (Meta will state the exact size)
- **Screenshots** — at least 1 (2560×1440). Take these in-headset or from the app.

## 4. Store listing copy — **DONE (paste these)**
**Short description (≤ ~150 chars):**
> Your VRChat companion on Quest — browse & equip avatars, manage favourites, friends, worlds, plus OSC chatbox, avatar controls & visual scripting.

**Long description:**
> VRC-NEXUS is a standalone companion for VRChat, built for Quest.
>
> • Discover & equip public avatars, and manage your favourites in custom sections
> • Import your VRChat website favourites ("inf favourites")
> • Friends, worlds, groups and notifications at a glance
> • OSC controls: chatbox, live avatar-parameter sliders (set height, hue, emission…), and quick actions (mute, jump)
> • Visual OSC scripting: drag-free code blocks with loops, ramps and a one-tap rainbow — including bounce/ping-pong cycles
> • Sign in with your own VRChat account (password never stored; only a local session cookie)
> • In-app auto-updates
>
> Unofficial third-party tool. Not affiliated with or endorsed by VRChat Inc.

**Category:** Utilities / Tools  **Keywords:** vrchat, avatars, osc, companion, favourites, scripting

## 5. Privacy policy — **DONE**
- File: `PRIVACY.md` in this repo.
- **Host it at a public URL** for the form. Easiest: enable **GitHub Pages** on `XnotCykoX/vrc-nexus-quest`, or just link the raw file:
  `https://raw.githubusercontent.com/XnotCykoX/vrc-nexus-quest/main/PRIVACY.md`
  (A proper HTML page on GitHub Pages looks more legitimate to reviewers — see step 8.)

## 6. Data Use Checkup (DUC) — recommended answers
The app has **no backend** and collects **nothing** to any server you control. Answer truthfully; the typical answers here:
- **Do you collect/use data?** The app does **not** transmit user data to the developer. It communicates **directly with VRChat under the user's own account** and reads only local data. Declare **no developer data collection / no sharing / no analytics / no ads**.
- If Meta requires per-type answers, the only sensitive item is the **VRChat login**, which is entered by the user, sent only to VRChat, and stored **on-device** (session cookie only, never the password). Nothing is sold or shared.

## 7. Content rating (IARC)
Fill the IARC questionnaire honestly. The app itself has no mature content; it's a utility. (VRChat itself is 13+.) You'll likely land at **Everyone/Teen**.

## 8. Step-by-step on Meta's dashboard
1. **developer.meta.com** → your **organization** → **Create New App** → platform **Meta Quest** → choose **App Lab** distribution.
2. Fill **App Details** (name, package `com.deize.vrcnexus.quest`, category) using §1 & §4.
3. **Build:** upload `VRC-NEXUS-Quest-RELEASE.apk` to a release channel (e.g. ALPHA first, then PRODUCTION/App Lab).
4. **Store listing:** paste §4 copy, upload §3 graphics, set the **privacy policy URL** (§5).
5. Complete **Data Use Checkup** (§6) and **IARC content rating** (§7).
6. Set **devices** = Quest 2 / 3 / Pro, and the **comfort rating**.
7. Submit for review. App Lab review is lighter than the main Store but still manual.

## 9. After approval
Users install from the Quest store with **no PC, no sideload, no developer mode**, and Meta auto-updates them. (Your GitHub raw-URL updater becomes redundant for store users but still works for sideloaders.)
