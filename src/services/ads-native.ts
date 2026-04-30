/**
 * ads-native.ts
 * AdMob integration via @capacitor-community/admob for iOS and Android.
 *
 * All functions are completely safe no-ops when:
 *  - Running in a browser (not native Capacitor context)
 *  - The AdMob package is not installed / not synced
 *  - Ad IDs are not configured in .env
 *
 * Configure via environment variables (see .env.example):
 *   VITE_ADMOB_APP_ID_ANDROID   – ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
 *   VITE_ADMOB_APP_ID_IOS       – ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ
 *   VITE_ADMOB_INTERSTITIAL_ID  – ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA
 *   VITE_ADMOB_REWARDED_ID      – ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB
 *   VITE_ADMOB_BANNER_ID        – ca-app-pub-XXXXXXXXXXXXXXXX/CCCCCCCCCC
 */

const INTERSTITIAL_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID ?? '';
const REWARDED_ID = import.meta.env.VITE_ADMOB_REWARDED_ID ?? '';
const BANNER_ID = import.meta.env.VITE_ADMOB_BANNER_ID ?? '';

/** Lazily resolve the AdMob plugin — returns null when unavailable */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAdMob(): Promise<any | null> {
  try {
    // Dynamic import so the build succeeds even when the package is absent
    // (it will only be present after `npm install && npx cap sync`)
    const mod = await import('@capacitor-community/admob');
    return mod.AdMob ?? null;
  } catch {
    // Package not installed or not on native platform
    return null;
  }
}

/** Return the AdMob enum module, or null */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAdMobEnums(): Promise<any | null> {
  try {
    return await import('@capacitor-community/admob');
  } catch {
    return null;
  }
}

/**
 * Initialize AdMob. Call once at app startup on the native platform.
 * Safe to call on web — will return immediately without doing anything.
 */
export async function initAdMob(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const AdMob = await getAdMob();
    if (!AdMob) return;

    await AdMob.initialize({
      // requestTrackingAuthorization prompts iOS ATT dialog
      requestTrackingAuthorization: true,
      // initializeForTesting uses Google's test ad IDs in development
      initializeForTesting: import.meta.env.DEV,
      // COPPA compliance: explicitly mark this app as NOT directed at children.
      // This enables interest-based advertising and must reflect actual app audience.
      // SwipeTake targets 12+ (Apple) / Teen (Google Play) and is NOT child-directed.
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
  } catch {
    // AdMob init failed — continue without ads
  }
}

/**
 * Load and present an interstitial ad.
 * Returns immediately (no-op) when not on native or no ad ID configured.
 */
export async function showInterstitial(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    if (!INTERSTITIAL_ID) return;

    const AdMob = await getAdMob();
    if (!AdMob) return;

    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
    await AdMob.showInterstitial();
  } catch {
    // Ad not filled, network error, etc. — fail silently
  }
}

/**
 * Load and present a rewarded ad.
 *
 * @returns true if the user watched the full ad and earned the reward,
 *          false if the ad failed to load, was skipped, or dismissed early.
 */
export async function showRewarded(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return false;
    if (!REWARDED_ID) return false;

    const AdMob = await getAdMob();
    if (!AdMob) return false;

    await AdMob.prepareRewardVideoAd({ adId: REWARDED_ID });

    return new Promise<boolean>((resolve) => {
      // Listen for reward event BEFORE showing
      AdMob.addListener('onRewarded', () => {
        resolve(true);
      });

      AdMob.showRewardVideoAd().catch(() => resolve(false));

      // Fallback: if the ad dismisses without firing onRewarded, resolve false
      AdMob.addListener('onRewardedVideoAdClosed', () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

/**
 * Show a banner ad anchored to the bottom of the screen.
 * No-op on web or when banner ID is not configured.
 */
export async function showBanner(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    if (!BANNER_ID) return;

    const AdMob = await getAdMob();
    if (!AdMob) return;

    const enums = await getAdMobEnums();
    if (!enums) return;

    const { BannerAdSize, BannerAdPosition } = enums;

    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: import.meta.env.DEV,
    });
  } catch {
    // Banner ad failed — fail silently
  }
}

/**
 * Hide and remove the banner ad.
 * Safe to call even if no banner is currently shown.
 */
export async function hideBanner(): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const AdMob = await getAdMob();
    if (!AdMob) return;

    await AdMob.hideBanner();
  } catch {
    // Nothing to hide — fail silently
  }
}
