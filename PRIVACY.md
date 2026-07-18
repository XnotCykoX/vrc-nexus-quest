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

The only data that reaches a server we control is: (a) what you **explicitly choose to publish** to the in-app **Community Hub** (Chatbox tab → Community) — the preset/script content itself, a display name you type in, and your random install ID, used to show "your items" and let you delete them later; and (b) if you buy the optional donation or a Membership subscription, your **Meta User ID** and entitlement status, provided to us by Meta's own platform (see below). Nothing else you do in the app — browsing avatars, chatbox use, friends/worlds/groups, translator, media detection, etc. — is sent to us; those features talk directly from your device to the third-party services below.

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

## Donations (optional in-app purchase)

The app offers an optional donation add-on through the Meta Horizon Store. This purchase:
- Provides **no in-app goods, currency, unlocks, or functional benefit** — it exists purely as a way for users to voluntarily support development.
- Is processed entirely by **Meta's own In-App Purchase (IAP) system**. We do not build, operate, or have access to any payment processing of our own.
- Involves **no personal or financial data passing through the app or to us**. Meta handles billing, payment details, and transaction records directly; we do not receive your payment method, billing address, or any other checkout information.

## Membership subscriptions (separate from Donations)

Some features are also unlockable through an optional **Membership subscription**, purchased and managed through **Meta's own Subscriptions/IAP system**, not a payment system we run ourselves. Unlike the no-strings Donation above, unlocking a Membership tier requires the app to know what you're entitled to: when you subscribe, Meta's platform provides the app your **Meta User ID** and current subscription status, which we use only to remember your unlocked tier. We never see your payment method, billing address, or Meta password — all payment processing is handled entirely by Meta and governed by [Meta's own privacy policy](https://www.meta.com/legal/quest/privacy-policy/). We do not request or use your broader Meta profile (display name, friends list, avatar, etc.) — only the bare ID needed to check entitlement.

## Data controller / responsible entity

For the purposes of Meta Horizon's data handling declarations, the entity responsible for any Meta Horizon User Data and/or Device User Data made accessible through this app is:

**Deizel Kite**, located in **Australia**.

We do not use any third-party data processors or service providers with access to Meta Horizon User Data or Device User Data beyond what's described in this policy (Meta's own IAP/Subscriptions billing, and — only if you choose to publish to it — the Community Hub). All other processing occurs locally on your device; the remaining third parties contacted are VRChat, the avatar databases you choose to browse, and GitHub for update checks, each under their own respective privacy policies.

## How to delete your data

- **Everything stored on your device** (favourites, settings, cached session, scripts): uninstall the app, or use the in-app Sign Out.
- **Your VRChat account data**: managed by VRChat directly at [vrchat.com](https://vrchat.com) — this app only ever acts on your behalf using your own login.
- **Anything you published to the Community Hub**: open Chatbox → Community — your own items show a **Delete mine** button that removes them immediately and permanently. If you can't access the app, email **deizeljkite@gmail.com** with the item name and, if possible, your install ID (shown at the bottom of the Community tab) and we will delete it manually within a few days.
- **Membership/purchase entitlement data**: cancel or manage the subscription itself through your Meta account's subscription settings; to have the entitlement record tied to your Meta User ID deleted from our side, email **deizeljkite@gmail.com**.

## Children

VRChat requires users to be 13+. This app is intended for existing VRChat users and is not directed at children under 13.

## Contact

Questions or data-deletion requests: **deizeljkite@gmail.com**

This app is an unofficial third-party tool and is not affiliated with or endorsed by VRChat Inc. or Meta.
