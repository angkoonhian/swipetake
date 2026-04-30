# SwipeTake — Monetization Guide

## Overview

SwipeTake uses two ad networks depending on the platform:

| Platform | Network | SDK |
|---|---|---|
| Web (browser) | Google AdSense | Script tag in `index.html` |
| Native (iOS / Android) | Google AdMob | `@capacitor-community/admob` |

A unified service (`src/services/ads.ts`) automatically routes to the correct
backend so the rest of the app never needs to know which one it's talking to.

---

## Part 1 — Google AdSense (Web)

### 1. Create an AdSense account

1. Go to <https://adsense.google.com> and sign in with your Google account.
2. Click **Get started** and enter your website URL.
3. AdSense will review your site (can take 1–14 days). You need real content
   and traffic to be approved.

### 2. Get your Publisher ID

Once approved your publisher ID appears in the AdSense dashboard:

```
ca-pub-XXXXXXXXXXXXXXXX
```

### 3. Create ad units

In AdSense go to **Ads → By ad unit → Create new ad unit**:

- **Interstitial** — full-screen; use "Interstitial" format.
- **Banner** — horizontal; use "Display" → "Responsive" format.

Copy the **slot ID** (the numeric part, e.g. `1234567890`) from each unit.

### 4. Activate in SwipeTake

1. Enable the script tag in `index.html` (remove the comment delimiters) and
   insert your publisher ID:
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
   ```
2. Add your IDs to `.env` (copy from `.env.example`):
   ```
   VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
   VITE_ADSENSE_INTERSTITIAL_SLOT=1234567890
   VITE_ADSENSE_BANNER_SLOT=0987654321
   ```

---

## Part 2 — Google AdMob (Native)

### 1. Create an AdMob account

1. Go to <https://admob.google.com> and sign in.
2. Click **Add app** → choose iOS or Android → enter your app details.
3. You'll receive an **App ID** in the format `ca-app-pub-XXXX~YYYY`.

### 2. Create ad units

In AdMob go to **Apps → [Your App] → Ad units → Add ad unit**:

- **Interstitial** — full-screen shown between cards (every 7 swipes).
- **Rewarded** — user watches to unlock personality report.
- **Banner** — shown on Profile and Leaderboard pages.

Copy each unit's **Ad unit ID** (format: `ca-app-pub-XXXX/YYYY`).

### 3. Add App ID to native manifests

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
```

**iOS** — `ios/App/App/Info.plist`:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ</string>
```

### 4. Install the plugin

```bash
npm install @capacitor-community/admob
npx cap sync
```

### 5. Activate in SwipeTake

Add your IDs to `.env`:
```
VITE_ADMOB_APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
VITE_ADMOB_APP_ID_IOS=ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA
VITE_ADMOB_REWARDED_ID=ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB
VITE_ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/CCCCCCCCCC
```

Update `capacitor.config.ts` — set `initializeForTesting: false` once you have
real ad unit IDs and are ready to go to production.

---

## Part 3 — Ad Placements in SwipeTake

| Placement | Type | Trigger |
|---|---|---|
| Feed | Interstitial | Every 7 cards answered |
| Personality unlock | Rewarded | "Watch Ad" button |
| Profile page | Banner | Page load |
| Leaderboard page | Banner | Page load |
| Feed page | None | (no interruption during swiping) |

---

## Part 4 — Expected Revenue

Revenue varies significantly by region, content category, and user
engagement. The numbers below are rough industry benchmarks (2024–2025).

### Banners (CPM = cost per 1 000 impressions)

| DAU | Daily impressions | Est. daily revenue |
|---|---|---|
| 1 K | ~2 K | $0.40 – $2 |
| 10 K | ~20 K | $4 – $20 |
| 50 K | ~100 K | $20 – $100 |

CPM range: $0.20 – $1.00 (banners are the lowest earners).

### Interstitials (CPM)

| DAU | Daily shows | Est. daily revenue |
|---|---|---|
| 1 K | ~500 | $1.50 – $5 |
| 10 K | ~5 K | $15 – $50 |
| 50 K | ~25 K | $75 – $250 |

CPM range: $3 – $10. **Interstitials earn 2–3x more than banners.**

### Rewarded ads (eCPM)

| DAU | Daily completions | Est. daily revenue |
|---|---|---|
| 1 K | ~200 | $2 – $8 |
| 10 K | ~2 K | $20 – $80 |
| 50 K | ~10 K | $100 – $400 |

eCPM range: $10 – $40. **Rewarded ads earn 5–10x more than banners.**

> **Tip**: Maximise rewarded ad placements where users get tangible value
> (e.g. unlocking the personality report). Rewarded ads have higher fill
> rates and users are more accepting of them.

---

## Part 5 — Revenue Optimisation Tips

1. **Rewarded > Interstitial > Banner** — always prioritise rewarded where
   you can offer real value in exchange.
2. **Mediation** — once you have volume, add AdMob mediation with Meta
   Audience Network, Unity Ads, or AppLovin to increase fill rates and CPM.
3. **A/B test frequency** — the current 7-card interstitial cadence is a
   starting point. Try 5 or 10 to find the sweet spot between revenue and
   retention.
4. **Geo targeting** — US, UK, AU, CA, DE users generate 3–5x higher CPMs
   than global average. If most users are in these markets, revenue will
   significantly exceed the estimates above.
5. **Keep ad load fast** — ads that take >2 s to load are abandoned. Use
   `prepareInterstitial` / `prepareRewardVideoAd` to preload before the
   moment of show.
6. **Never block UX for ads** — the current implementation loads ads async
   and never blocks the feed. Keep it that way.
