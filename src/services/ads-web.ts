/**
 * ads-web.ts
 * Google AdSense integration for the web platform.
 *
 * All functions are no-ops when:
 *  - AdSense script is not loaded (script tag still commented out in index.html)
 *  - The publisher / slot IDs are not set in .env
 *  - An ad-blocker prevents the AdSense script from loading
 *
 * Configure via environment variables (see .env.example):
 *   VITE_ADSENSE_PUBLISHER_ID       – ca-pub-XXXXXXXXXXXXXXXX
 *   VITE_ADSENSE_INTERSTITIAL_SLOT  – ad unit slot ID for interstitials
 *   VITE_ADSENSE_BANNER_SLOT        – ad unit slot ID for banners
 */

// AdSense uses a global command queue that any type of ad push writes to.
// We keep the type intentionally loose because the actual accepted shapes
// vary per ad format and are not formally typed by Google.
type AdsByGoogle = Array<Record<string, unknown>>;

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogle;
  }
}

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID ?? '';
const INTERSTITIAL_SLOT = import.meta.env.VITE_ADSENSE_INTERSTITIAL_SLOT ?? '';
const BANNER_SLOT = import.meta.env.VITE_ADSENSE_BANNER_SLOT ?? '';

/** Returns true when AdSense is both configured (env vars set) and the script loaded. */
function isAdSenseReady(): boolean {
  return !!(
    PUBLISHER_ID &&
    typeof window !== 'undefined' &&
    Array.isArray(window.adsbygoogle)
  );
}

/** Push a command into the AdSense queue */
function adPush(cmd: Record<string, unknown>): void {
  (window.adsbygoogle as AdsByGoogle).push(cmd);
}

/**
 * Shows a full-screen AdSense interstitial overlay in the browser.
 *
 * @returns true if a real ad was attempted, false if skipped (no config / ad-blocker)
 */
export async function showWebInterstitial(): Promise<boolean> {
  if (!isAdSenseReady() || !INTERSTITIAL_SLOT) {
    return false;
  }

  try {
    // AdSense interstitial ads use the standard push mechanism.
    // The ad unit must be created as "Interstitial" type in AdSense console.
    //
    // COPPA compliance: SwipeTake is NOT directed at children (rated 12+/Teen).
    // Setting tag_for_child_directed_treatment=0 and tag_for_under_age_of_consent=0
    // explicitly marks requests as non-child-directed, enabling standard ad targeting.
    adPush({
      google_ad_client: PUBLISHER_ID,
      enable_page_level_ads: true,
      // Non-child-directed ad request tags (required for COPPA / GDPR compliance)
      tag_for_child_directed_treatment: 0,
      tag_for_under_age_of_consent: 0,
    });
    return true;
  } catch {
    // Ad blocker or network error — fail silently
    return false;
  }
}

/**
 * Injects a responsive AdSense banner ad into the given DOM container.
 *
 * @param containerId  The id of the element to render the ad into.
 *                     The element is cleared before inserting the ad unit.
 * @returns true if the ad was injected, false if skipped
 */
export function renderBannerAd(containerId: string): boolean {
  if (!isAdSenseReady() || !BANNER_SLOT) {
    return false;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    return false;
  }

  try {
    // Clear any existing content (previous ad or placeholder)
    container.innerHTML = '';

    // Build the <ins> element AdSense requires
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient = PUBLISHER_ID;
    ins.dataset.adSlot = BANNER_SLOT;
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    // COPPA compliance: mark banner ad request as non-child-directed.
    // SwipeTake is rated 12+/Teen — NOT child-directed content.
    ins.dataset.tagForChildDirectedTreatment = '0';
    ins.dataset.tagForUnderAgeOfConsent = '0';

    container.appendChild(ins);

    // Trigger AdSense to fill the slot
    adPush({});

    return true;
  } catch {
    // If push fails (e.g. after the script was removed), clean up quietly
    if (container) container.innerHTML = '';
    return false;
  }
}
