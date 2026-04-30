/**
 * BannerAdSlot — renders a banner ad on the current platform.
 *
 * On web:   injects an AdSense responsive banner into a container div.
 * On native: shows nothing in React — AdMob positions the banner natively
 *            via showBanner() which is called in the parent page's lifecycle.
 *
 * When ads are not configured, the slot renders nothing (zero height).
 */

import { useEffect, useId, useRef } from 'react';
import { showBanner, hideBanner, adsConfigured } from '../services/ads';

interface Props {
  /** Optional height for the placeholder area (default 50px). Only visible when
   *  ads are not configured so the layout doesn't jump. */
  placeholderHeight?: number;
}

export function BannerAdSlot({ placeholderHeight = 50 }: Props) {
  const id = useId().replace(/:/g, '_');
  const containerId = `banner-ad-${id}`;
  const mountedRef = useRef(false);
  const configured = adsConfigured();

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // showBanner handles platform detection internally:
    // - On native → AdMob.showBanner() (ignores containerId)
    // - On web    → renderBannerAd(containerId) → injects AdSense <ins>
    showBanner(containerId);

    return () => {
      hideBanner();
    };
  }, [containerId]);

  // On native, the banner is rendered by AdMob outside of the React tree.
  // We still render a zero-height spacer so the page content doesn't sit
  // behind the native banner (AdMob adjusts webview padding automatically
  // on newer SDK versions, but the spacer is a safe fallback).
  return (
    <div
      id={containerId}
      style={{
        width: '100%',
        // Show a subtle placeholder only when ads ARE configured (AdSense)
        // so the layout doesn't jump when the real ad loads.
        minHeight: configured ? `${placeholderHeight}px` : 0,
        overflow: 'hidden',
      }}
    />
  );
}
