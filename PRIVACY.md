# VRC-NEXUS (Quest) — Privacy Policy

_Last updated: 2026-07-18_

VRC-NEXUS is a standalone companion app for VRChat. It runs on your headset and talks directly to VRChat and a small number of other services listed below, using your own VRChat account. **We do not operate any account system, run ads, do analytics/tracking, or sell data.**

## What is stored on your device only

- Your **VRChat login session cookie** (so you stay signed in). Your **password is never stored** — it is sent only to VRChat to obtain the session, exactly like signing in on VRChat's own site.
- Your **favourites, pinned items, recent avatars/worlds, settings, saved OSC scripts, and invite-message drafts**.
- **Cached avatar/world metadata** (names/images) for display.
- A random, non-personal **install ID** (a generated code, not tied to your VRChat account or any personal info) used only if you publish something to the Community Hub — see below.

All of the above lives in the app's local storage on your headset and is removed if you uninstall the app or sign out.

## Data we (the developer) receive

The only data that reaches a server we control is what you **explicitly choose to publish** to the in-app **Community Hub** (Chatbox tab → Community): the preset/script content itself, a display name you type in, and your random install ID (used to show "your items" and to let you delete them later — see below). This is stored in a private GitHub repository and Cloudflare storage that we administer. Nothing else you do in the app — browsing avatars, chatbox use, friends/worlds/groups, translator, media detection, etc. — is sent to us; those features talk directly from your device to the third-party services below.

## Services the app contacts directly (from your device, using your own VRChat login where applicable)

- **VRChat API** (`api.vrchat.cloud`) — to log in and fetch/manage your avatars, friends, worlds, groups, notifications, invite messages, prints, and VRC+ image slots. Governed by VRChat's own privacy policy and Terms.
- **Community avatar databases** (`avtr.icu`, `avtr.zuxi.dev`) — only when you use **Discover**, to search public avatar listings.
- **Community Hub** (`vrc-nexus-community-proxy.deizeljkite.workers.dev`, developer-operated) — only when you browse or publish shared chatbox presets/scripts.
- **LRCLIB** (`lrclib.net`) — only when the Lyrics feature is on, to look up synced lyrics by track/artist name.
- **Google Translate** (`translate.googleapis.com`) — only when you use the in-app Translator, to translate the text you enter.
- **Open-Meteo** (`open-meteo.com`) — only if you enable the Weather widget, to look up local weather by approximate location.
- **GitHub** (`raw.githubusercontent.com`) — to check for app updates.
- **VRChat, on your device only, via OSC/UDP on `127.0.0.1`** — for the chatbox, avatar parameters and inputs. This traffic never leaves your headset.

## Sensitive permissions and why

- **Internet** — required for everything above.
- **Notification access** (optional, off by default) — if you grant it, the app reads the title/artist of media currently playing on your headset (e.g. a music app) so it can show a "Now Playing" chatbox status and synced lyrics. This is read locally on-device only; it is never transmitted anywhere, including to us.
- **Read images** — only to show your own VRChat screenshots in the Gallery (read-only; images stay on your device unless you choose to upload one to VRChat's Prints/VRC+ slots).
- **Battery state** — read locally only, to show an optional low-battery notification. Never transmitted.
- **Install unknown apps** — only so the in-app updater can install a newer version you choose to download, from the GitHub release you approve.
- **All-files access (`MANAGE_EXTERNAL_STORAGE`)** — used only by an advanced, Developer-Mode-only cache-reading feature aimed at power users. Not exposed in the main app UI.

## Meta Platform purchases & subscriptions

Premium features are unlocked through **Meta's own In-App Purchases and Subscriptions system**, not a payment system we run ourselves. When you buy or subscribe, Meta's platform tells the app your **Meta User ID** and your current entitlement/subscription status, so the app can unlock the features you paid for. We never see your payment method, billing address, or Meta password — all payment processing is handled entirely by Meta and governed by [Meta's own privacy policy](https://www.meta.com/legal/quest/privacy-policy/). We store only the minimum needed to remember your entitlement (your Meta User ID paired with your unlocked tier); we do not request or use your broader Meta profile (display name, friends list, avatar, etc.).

## How to delete your data

- **Everything stored on your device** (favourites, settings, cached session, scripts): uninstall the app, or use the in-app Sign Out.
- **Your VRChat account data**: managed by VRChat directly at [vrchat.com](https://vrchat.com) — this app only ever acts on your behalf using your own login.
- **Anything you published to the Community Hub**: open Chatbox → Community — your own items show a **Delete mine** button that removes them immediately and permanently. If you can't access the app, email **deizeljkite@gmail.com** with the item name and, if possible, your install ID (shown at the bottom of the Community tab) and we will delete it manually within a few days.
- **Purchase/subscription entitlement data**: cancel or manage the subscription itself through your Meta account's subscription settings; to have the entitlement record tied to your Meta User ID deleted from our side, email **deizeljkite@gmail.com**.

## Children

VRChat requires users to be 13+. This app is intended for existing VRChat users and is not directed at children under 13.

## Contact

Questions or data-deletion requests: **deizeljkite@gmail.com**

This app is an unofficial third-party tool and is not affiliated with or endorsed by VRChat Inc. or Meta.
