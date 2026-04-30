/**
 * ads.ts
 * Unified ad service — single API for the rest of the app.
 *
 * Automatically routes to the correct backend:
 *   - Native (iOS / Android via Capacitor) → @capacitor-community/admob
 *   - Web                                  → Google AdSense
 *
 * Every function is guaranteed never to throw: all errors are caught and
 * logged at most once so ad failures never crash the app.
 */

import {
  initAdMob,
  showInterstitial as nativeInterstitial,
  showRewarded as nativeRewarded,
  showBanner as nativeBanner,
  hideBanner as nativeHideBanner,
} from './ads-native';

import { showWebInterstitial, renderBannerAd } from './ads-web';

// ─── Platform detection ───────────────────────────────────────────────────────

async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Call once at application start (e.g. inside main.tsx or App.tsx).
 * Initialises AdMob on native; nothing to initialise on web.
 */
export async function initAds(): Promise<void> {
  try {
    if (await isNative()) {
      await initAdMob();
    }
    // AdSense auto-ads initialise themselves via the script tag in index.html
  } catch {
    // Ignore — ad initialisation must never block the app
  }
}

/**
 * Show an interstitial ad.
 *
 * On native: loads and shows an AdMob interstitial.
 * On web: triggers AdSense interstitial (no-op if not configured).
 *
 * @returns true if a real ad was shown, false if the app should show its
 *          own placeholder (dev mode) or nothing (no config).
 */
export async function showInterstitial(): Promise<boolean> {
  try {
    if (await isNative()) {
      await nativeInterstitial();
      return true;
    }
    // Web: returns true when AdSense was configured and attempted
    return await showWebInterstitial();
  } catch {
    return false;
  }
}

/**
 * Show a rewarded ad and wait for the result.
 *
 * @returns true  → user watched the full ad; grant the reward.
 *          false → ad unavailable, user skipped, or error; do NOT grant reward.
 */
export async function showRewarded(): Promise<boolean> {
  try {
    if (await isNative()) {
      return await nativeRewarded();
    }
    // Web: AdSense does not have a true rewarded format.
    // Return false so the caller falls back to the placeholder flow.
    return false;
  } catch {
    return false;
  }
}

/**
 * Show a banner ad (bottom of screen on native; AdSense banner on web).
 *
 * @param containerId  DOM element id to inject the web banner into.
 *                     Ignored on native.
 * @returns true if a real ad was rendered, false if nothing was shown.
 */
export async function showBanner(containerId?: string): Promise<boolean> {
  try {
    if (await isNative()) {
      await nativeBanner();
      return true;
    }
    // Web: inject AdSense banner into the provided container
    if (containerId) {
      return renderBannerAd(containerId);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Hide the banner ad.
 * On web this is a no-op (the banner lives inside a React-controlled element).
 */
export async function hideBanner(): Promise<void> {
  try {
    if (await isNative()) {
      await nativeHideBanner();
    }
  } catch {
    // Ignore
  }
}

/**
 * Convenience: returns whether the ad system is likely configured.
 * Useful for deciding whether to show the dev placeholder or nothing.
 */
export function adsConfigured(): boolean {
  const hasAdSense = !!(import.meta.env.VITE_ADSENSE_PUBLISHER_ID);
  const hasAdMob = !!(
    import.meta.env.VITE_ADMOB_INTERSTITIAL_ID ||
    import.meta.env.VITE_ADMOB_REWARDED_ID ||
    import.meta.env.VITE_ADMOB_BANNER_ID
  );
  return hasAdSense || hasAdMob;
}
