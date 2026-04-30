import { useState, useEffect, useRef } from 'react';
import { showInterstitial, showRewarded, adsConfigured } from '../services/ads';

interface Props {
  onClose: () => void;
  type?: 'interstitial' | 'rewarded';
  onRewardEarned?: () => void;
}

/**
 * AdPlaceholder — smart ad component.
 *
 * Behaviour matrix:
 *  ┌──────────────────────┬───────────────────────────────────────┐
 *  │ Real ads configured  │ Calls the real ad service, no UI      │
 *  │ Dev / no config      │ Shows the visual placeholder (timer)  │
 *  │ Ad failed / blocked  │ Falls back to placeholder             │
 *  └──────────────────────┴───────────────────────────────────────┘
 *
 * For interstitials the component:
 *   1. Attempts the real ad first (async).
 *   2. If the real ad succeeds → calls onClose immediately.
 *   3. If not configured / blocked → shows the dev-mode countdown UI.
 *
 * For rewarded ads:
 *   1. Attempts the real rewarded ad.
 *   2. If user earns reward → calls onRewardEarned + onClose.
 *   3. If no real ad → shows the dev-mode 15 s countdown UI.
 */
export function AdPlaceholder({ onClose, type = 'interstitial', onRewardEarned }: Props) {
  // Placeholder state (used when real ads are not available)
  const [countdown, setCountdown] = useState(type === 'rewarded' ? 15 : 3);
  const [rewardEarned, setRewardEarned] = useState(false);
  const [watching, setWatching] = useState(false);
  const [useRealAd, setUseRealAd] = useState(adsConfigured());
  const [realAdPending, setRealAdPending] = useState(false);
  const attemptedRef = useRef(false);

  // ── Interstitial: try real ad immediately on mount ──────────────────────
  useEffect(() => {
    if (type !== 'interstitial') return;
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    if (!useRealAd) return; // No config — use placeholder

    setRealAdPending(true);

    showInterstitial().then((shown) => {
      setRealAdPending(false);
      if (shown) {
        // Real ad was shown; close automatically after a short delay
        // so the ad network has time to display its own dismiss UI
        setTimeout(onClose, 500);
      } else {
        // Real ad unavailable (blocker, no config) — fall back to placeholder
        setUseRealAd(false);
      }
    });
  }, [type, useRealAd, onClose]);

  // ── Interstitial placeholder countdown ──────────────────────────────────
  useEffect(() => {
    if (type === 'interstitial' && !useRealAd) {
      if (countdown <= 0) return;
      const t = setInterval(() => setCountdown((n) => n - 1), 1000);
      return () => clearInterval(t);
    }
  }, [countdown, type, useRealAd]);

  // ── Rewarded placeholder countdown ──────────────────────────────────────
  useEffect(() => {
    if (type === 'rewarded' && watching && !useRealAd) {
      if (countdown <= 0) {
        setRewardEarned(true);
        onRewardEarned?.();
        return;
      }
      const t = setInterval(() => setCountdown((n) => n - 1), 1000);
      return () => clearInterval(t);
    }
  }, [countdown, type, watching, onRewardEarned, useRealAd]);

  // ── Handle "Watch Ad" button for rewarded (real ad path) ─────────────────
  const handleWatchRealRewarded = async () => {
    setRealAdPending(true);
    const earned = await showRewarded();
    setRealAdPending(false);

    if (earned) {
      setRewardEarned(true);
      onRewardEarned?.();
    } else {
      // Real rewarded ad not available — fall back to placeholder
      setUseRealAd(false);
      setWatching(true);
    }
  };

  // ── When real ad pending show a minimal waiting screen ───────────────────
  if (realAdPending) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.98)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#555', fontSize: '14px' }}>Loading ad…</div>
      </div>
    );
  }

  // ── Real ad is configured but hasn't dismissed yet: return null ──────────
  // (The real ad SDK controls its own UI)
  if (useRealAd && type === 'interstitial') {
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Placeholder UI (dev mode / ad blocker fallback)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Ad content area */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          aspectRatio: type === 'rewarded' ? '9/16' : '4/3',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #1e1e3a, #2d1b4e)',
          border: '2px dashed rgba(255,255,255,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Simulated ad background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 30% 40%, rgba(59,130,246,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.12) 0%, transparent 60%)
            `,
          }}
        />

        <div style={{ fontSize: '48px' }}>📱</div>
        <div
          style={{
            textAlign: 'center',
            zIndex: 1,
            padding: '0 24px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '2px',
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Advertisement
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '900',
              color: '#fff',
              lineHeight: '1.3',
              marginBottom: '8px',
            }}
          >
            {type === 'rewarded' ? 'Watch to Unlock Your\nPersonality Report' : 'Your Ad Could\nLive Here'}
          </div>
          <div style={{ color: '#888', fontSize: '14px', lineHeight: '1.4' }}>
            {type === 'rewarded'
              ? 'Watch a 15-second ad to unlock your full AI personality analysis'
              : 'In production, a real ad appears here via AdMob / AdSense'}
          </div>
        </div>

        {type === 'rewarded' && watching && !rewardEarned && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '999px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#fff',
            }}
          >
            {countdown}s remaining
          </div>
        )}
      </div>

      {/* Controls — interstitial */}
      {type === 'interstitial' && (
        <button
          onClick={onClose}
          disabled={countdown > 0}
          style={{
            padding: '14px 32px',
            borderRadius: '12px',
            border: 'none',
            background: countdown > 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: countdown > 0 ? '#555' : '#fff',
            fontWeight: '700',
            fontSize: '16px',
            cursor: countdown > 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {countdown > 0 ? `Close in ${countdown}s` : 'Back to SwipeTake'}
        </button>
      )}

      {/* Controls — rewarded (not yet watching) */}
      {type === 'rewarded' && !watching && !rewardEarned && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px' }}>
          <button
            onClick={useRealAd ? handleWatchRealRewarded : () => setWatching(true)}
            style={{
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: '#fff',
              fontWeight: '800',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Watch Ad (15s) → Unlock Report
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#888',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </div>
      )}

      {/* Reward earned state */}
      {type === 'rewarded' && rewardEarned && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '380px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
            Reward Earned!
          </div>
          <div style={{ color: '#888', marginBottom: '20px' }}>
            Your personality report is now unlocked.
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '16px 32px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              color: '#fff',
              fontWeight: '800',
              fontSize: '16px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            View My Report →
          </button>
        </div>
      )}
    </div>
  );
}
