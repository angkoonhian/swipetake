import { useState, useMemo } from 'react';
import { calculatePersonality, generatePersonalitySummary, getTotalAnswered } from '../services/stats';
import { AdPlaceholder } from '../components/AdPlaceholder';
import { showRewarded, adsConfigured } from '../services/ads';
import { useNavigate } from 'react-router-dom';

const TRAIT_CONFIGS = [
  {
    key: 'contrarianScore' as const,
    leftLabel: 'Mainstream',
    rightLabel: 'Contrarian',
    leftIcon: '🌊',
    rightIcon: '⚡',
    color: '#FF6B35',
    description: 'How often you disagree with the crowd',
  },
  {
    key: 'chaosScore' as const,
    leftLabel: 'Orderly',
    rightLabel: 'Chaotic',
    leftIcon: '📋',
    rightIcon: '🌀',
    color: '#7B2D8B',
    description: 'Your appetite for the unpredictable',
  },
  {
    key: 'heartScore' as const,
    leftLabel: 'Logic',
    rightLabel: 'Emotion',
    leftIcon: '🧠',
    rightIcon: '❤️',
    color: '#f43f5e',
    description: 'What drives your decisions',
  },
  {
    key: 'riskScore' as const,
    leftLabel: 'Safe',
    rightLabel: 'Risk-Taker',
    leftIcon: '🛡️',
    rightIcon: '🎲',
    color: '#00C9A7',
    description: 'How boldly you bet on yourself',
  },
];

function SpectrumBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        height: '14px',
        borderRadius: '999px',
        background: '#f0ece6',
        border: '2px solid #e8e4de',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Filled */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${value}%`,
          borderRadius: '999px',
          background: color,
          transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
      {/* Thumb */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${value}%`,
          transform: 'translate(-50%, -50%)',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          border: `3px solid ${color}`,
          boxShadow: '2px 2px 0px #1a1a1a',
          transition: 'left 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 2,
        }}
      />
    </div>
  );
}

function getPersonalityTitle(traits: ReturnType<typeof calculatePersonality>): string {
  const avg = (traits.chaosScore + traits.contrarianScore + traits.heartScore + traits.riskScore) / 4;

  if (traits.contrarianScore > 65 && traits.riskScore > 60) return 'The Wildcard';
  if (traits.heartScore > 65 && traits.contrarianScore < 40) return 'The Empath';
  if (traits.chaosScore < 35 && traits.riskScore < 35) return 'The Strategist';
  if (traits.contrarianScore > 60 && traits.heartScore < 40) return 'The Critic';
  if (traits.riskScore > 65 && traits.chaosScore > 60) return 'The Maverick';
  if (avg < 40) return 'The Anchor';
  if (avg > 65) return 'The Rebel';
  return 'The Realist';
}

function getTitleColor(title: string): string {
  const map: Record<string, string> = {
    'The Wildcard':   '#FF6B35',
    'The Empath':     '#f43f5e',
    'The Strategist': '#00C9A7',
    'The Critic':     '#7B2D8B',
    'The Maverick':   '#FF6B35',
    'The Anchor':     '#00C9A7',
    'The Rebel':      '#7B2D8B',
    'The Realist':    '#FFD23F',
  };
  return map[title] ?? '#FF6B35';
}

export function PersonalityPage() {
  const navigate      = useNavigate();
  const totalAnswered = getTotalAnswered();
  const [unlocked, setUnlocked] = useState(totalAnswered >= 20);
  const [showAd, setShowAd]     = useState(false);
  const [adError, setAdError]   = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  const traits  = useMemo(() => calculatePersonality(), []);
  const summary = useMemo(() => generatePersonalitySummary(traits), [traits]);
  const title   = useMemo(() => getPersonalityTitle(traits), [traits]);
  const titleColor = getTitleColor(title);

  if (totalAnswered < 20) {
    return (
      <div
        className="dot-grid-bg"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '28px',
            padding: '36px 28px',
            border: '2.5px solid #1a1a1a',
            boxShadow: '6px 6px 0px #FF6B35',
            maxWidth: '380px',
            width: '100%',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 10px' }}>
            Not Yet Unlocked
          </h1>
          <p style={{ color: '#999', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px', fontWeight: '600' }}>
            Answer {20 - totalAnswered} more questions to unlock your personality analysis.
          </p>
          <div
            style={{
              height: '12px',
              borderRadius: '999px',
              background: '#f0ece6',
              border: '2px solid #e8e4de',
              marginBottom: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(totalAnswered / 20) * 100}%`,
                background: '#FF6B35',
                borderRadius: '999px',
              }}
            />
          </div>
          <p style={{ color: '#bbb', fontSize: '13px', marginBottom: '24px', fontWeight: '700' }}>
            {totalAnswered}/20
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '999px',
              border: '2.5px solid #1a1a1a',
              background: '#FF6B35',
              color: '#fff',
              fontWeight: '900',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '4px 4px 0px #1a1a1a',
            }}
          >
            Go Answer Questions ⚡
          </button>
        </div>
      </div>
    );
  }

  const handleUnlock = async () => {
    if (adsConfigured()) {
      setAdLoading(true);
      try {
        const earned = await showRewarded();
        setAdLoading(false);
        if (earned) {
          setUnlocked(true);
          return;
        }
      } catch {
        setAdLoading(false);
      }
    }
    setAdError(false);
    setShowAd(true);
  };

  if (!unlocked) {
    return (
      <>
        {showAd && (
          <AdPlaceholder
            type="rewarded"
            onClose={() => setShowAd(false)}
            onRewardEarned={() => setUnlocked(true)}
          />
        )}
        <div
          className="dot-grid-bg"
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '28px',
              padding: '32px 24px',
              border: '2.5px solid #1a1a1a',
              boxShadow: '6px 6px 0px #7B2D8B',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>✨</div>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 8px' }}>
              Your Report is Ready
            </h1>
            <p style={{ color: '#999', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', fontWeight: '600' }}>
              You've answered {totalAnswered} questions.<br />
              Watch a short ad to unlock your personality analysis.
            </p>

            {/* Blurred preview */}
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: '#FAF7F2',
                border: '2px solid #e8e4de',
                marginBottom: '24px',
              }}
            >
              {TRAIT_CONFIGS.map((cfg) => (
                <div key={cfg.key} style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      height: '14px',
                      borderRadius: '999px',
                      background: '#e8e4de',
                      filter: 'blur(2px)',
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  height: '50px',
                  borderRadius: '12px',
                  background: '#e8e4de',
                  filter: 'blur(3px)',
                }}
              />
            </div>

            {adError && (
              <div style={{ color: '#FF6B35', fontSize: '14px', marginBottom: '12px', fontWeight: '700' }}>
                Watch the full ad to unlock your report.
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={adLoading}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '999px',
                border: '2.5px solid #1a1a1a',
                background: adLoading ? '#e8e4de' : '#FFD23F',
                color: adLoading ? '#bbb' : '#1a1a1a',
                fontWeight: '900',
                fontSize: '16px',
                cursor: adLoading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                boxShadow: adLoading ? 'none' : '4px 4px 0px #1a1a1a',
                transition: 'all 0.2s',
              }}
            >
              {adLoading ? 'Loading ad…' : '▶ Watch Ad to Unlock (15s)'}
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#bbb',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '700',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="dot-grid-bg"
      style={{
        minHeight: '100dvh',
        paddingBottom: '100px',
        overflowY: 'auto',
      }}
    >
      {/* Hero — big bold magazine title */}
      <div
        style={{
          padding: '32px 24px 28px',
          textAlign: 'center',
          background: '#fff',
          borderBottom: '2.5px solid #1a1a1a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative star */}
        <svg
          width="40" height="40" viewBox="0 0 40 40" fill="none"
          style={{ position: 'absolute', top: '20px', right: '24px', opacity: 0.5 }}
        >
          <path d="M20 2 L23 15 L37 20 L23 25 L20 38 L17 25 L3 20 L17 15 Z" fill="#FFD23F" />
        </svg>
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          style={{ position: 'absolute', top: '28px', left: '24px', opacity: 0.4 }}
        >
          <path d="M12 1 L14 9 L22 12 L14 15 L12 23 L10 15 L2 12 L10 9 Z" fill="#00C9A7" />
        </svg>

        <div
          style={{
            display: 'inline-block',
            background: titleColor,
            border: '2.5px solid #1a1a1a',
            borderRadius: '999px',
            padding: '5px 18px',
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: titleColor === '#FFD23F' ? '#1a1a1a' : '#fff',
            marginBottom: '16px',
            boxShadow: '3px 3px 0px #1a1a1a',
          }}
        >
          AI Personality Report
        </div>

        <h1
          style={{
            fontSize: '48px',
            fontWeight: '900',
            color: titleColor,
            margin: '0 0 6px',
            lineHeight: '1',
            textShadow: '3px 3px 0px rgba(0,0,0,0.08)',
            letterSpacing: '-1px',
          }}
        >
          {title}
        </h1>
        <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontWeight: '700' }}>
          Based on {totalAnswered} answers
        </p>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Summary quote card */}
        <div
          style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '22px',
            border: '2.5px solid #1a1a1a',
            boxShadow: `5px 5px 0px ${titleColor}`,
            position: 'relative',
          }}
        >
          {/* Big quote mark */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '18px',
              fontSize: '72px',
              lineHeight: '1',
              color: titleColor,
              opacity: 0.15,
              fontWeight: '900',
              pointerEvents: 'none',
            }}
          >
            "
          </div>
          <p
            style={{
              color: '#1a1a1a',
              fontSize: '16px',
              lineHeight: '1.7',
              margin: 0,
              fontStyle: 'italic',
              fontWeight: '600',
              position: 'relative',
              zIndex: 1,
            }}
          >
            "{summary}"
          </p>
        </div>

        {/* Spectrum header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
          <span
            style={{
              fontSize: '11px',
              fontWeight: '900',
              color: '#bbb',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            YOUR SPECTRUM
          </span>
          <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
        </div>

        {/* Trait cards */}
        {TRAIT_CONFIGS.map((cfg) => (
          <div
            key={cfg.key}
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '18px',
              border: '2.5px solid #1a1a1a',
              boxShadow: `4px 4px 0px ${cfg.color}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '14px',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#999',
                }}
              >
                {cfg.leftIcon} {cfg.leftLabel}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: '#bbb',
                  fontWeight: '700',
                  textAlign: 'center',
                  maxWidth: '90px',
                  lineHeight: '1.3',
                }}
              >
                {cfg.description}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#999' }}>
                {cfg.rightLabel} {cfg.rightIcon}
              </span>
            </div>
            <SpectrumBar value={traits[cfg.key]} color={cfg.color} />
            <div
              style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '14px',
                fontWeight: '900',
                color: cfg.color,
              }}
            >
              {traits[cfg.key]}% toward {traits[cfg.key] > 50 ? cfg.rightLabel : cfg.leftLabel}
            </div>
          </div>
        ))}

        {/* Share card */}
        <div
          style={{
            background: '#FFD23F',
            borderRadius: '20px',
            padding: '24px',
            border: '2.5px solid #1a1a1a',
            boxShadow: '5px 5px 0px #1a1a1a',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#1a1a1a', marginBottom: '4px' }}>
            Screenshot & Share
          </div>
          <div style={{ fontSize: '14px', color: '#1a1a1a', opacity: 0.7, fontWeight: '600' }}>
            Show the world what kind of opinion-haver you are
          </div>
        </div>
      </div>
    </div>
  );
}
