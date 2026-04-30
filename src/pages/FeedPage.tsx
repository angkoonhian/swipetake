import { useEffect } from 'react';
import { useFeed } from '../hooks/useFeed';
import { useStreak } from '../hooks/useStreak';
import { QuestionCard } from '../components/QuestionCard';
import { StreakBadge } from '../components/StreakBadge';
import { AdPlaceholder } from '../components/AdPlaceholder';

// Haptics — gracefully degraded for web
async function triggerHaptic() {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Not on native device — skip
  }
}

// Decorative squiggly SVG line element
function Squiggle({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <svg
      width="80"
      height="20"
      viewBox="0 0 80 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', opacity: 0.35, pointerEvents: 'none', ...style }}
    >
      <path
        d="M2 10 C12 2, 22 18, 32 10 C42 2, 52 18, 62 10 C72 2, 76 14, 78 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function DotCluster({ color, style }: { color: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.3, ...style }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: color,
            position: 'absolute',
            left: `${(i % 3) * 14}px`,
            top: `${Math.floor(i / 3) * 14}px`,
          }}
        />
      ))}
    </div>
  );
}

export function FeedPage() {
  const { currentQuestion, feedState, userChoice, totalAnswered, showAd, answer, advance, dismissAd } = useFeed();
  const { streak, refresh } = useStreak();

  const isTransitioning = feedState === 'transition';

  useEffect(() => {
    refresh();
  }, [totalAnswered, refresh]);

  const handleAnswer = async (choice: number) => {
    await triggerHaptic();
    answer(choice);
  };

  if (!currentQuestion) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#FAF7F2',
          color: '#999',
          fontWeight: '700',
          fontSize: '16px',
        }}
      >
        Loading feed...
      </div>
    );
  }

  return (
    <>
      {showAd && <AdPlaceholder onClose={dismissAd} type="interstitial" />}

      <div
        className="dot-grid-bg"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background elements */}
        <Squiggle color="#FF6B35" style={{ top: '80px', right: '-10px', transform: 'rotate(20deg)' }} />
        <Squiggle color="#7B2D8B" style={{ top: '200px', left: '-20px', transform: 'rotate(-15deg)' }} />
        <DotCluster color="#00C9A7" style={{ top: '140px', right: '20px' }} />
        <DotCluster color="#FFD23F" style={{ bottom: '160px', left: '16px' }} />

        {/* Star doodle top-left */}
        <svg
          width="28" height="28" viewBox="0 0 28 28" fill="none"
          style={{ position: 'absolute', top: '72px', left: '18px', opacity: 0.4, pointerEvents: 'none' }}
        >
          <path d="M14 2 L16 11 L26 14 L16 17 L14 26 L12 17 L2 14 L12 11 Z" fill="#FF6B35" />
        </svg>

        {/* Header */}
        <header
          style={{
            padding: '16px 20px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            <span
              style={{
                fontSize: '26px',
                fontWeight: '900',
                color: '#1a1a1a',
                letterSpacing: '-0.5px',
              }}
            >
              Swipe<span style={{ color: '#FF6B35' }}>Take</span>
            </span>
            <div
              style={{
                fontSize: '11px',
                color: '#bbb',
                fontWeight: '700',
                letterSpacing: '0.5px',
                marginTop: '1px',
              }}
            >
              {totalAnswered} answered
            </div>
          </div>
          <StreakBadge streak={streak} />
        </header>

        {/* Card area */}
        <main
          style={{
            flex: 1,
            padding: '8px 16px 90px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <QuestionCard
            question={currentQuestion}
            userChoice={userChoice}
            onAnswer={handleAnswer}
            onNext={advance}
            animating={isTransitioning}
          />

          {/* Chunky progress dots */}
          {totalAnswered > 0 && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const filled = i < (totalAnswered % 7 || 7);
                  return (
                    <div
                      key={i}
                      style={{
                        width: filled ? '20px' : '8px',
                        height: '8px',
                        borderRadius: '999px',
                        background: filled ? '#FF6B35' : '#e8e4de',
                        border: '2px solid ' + (filled ? '#1a1a1a' : '#e8e4de'),
                        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ fontSize: '11px', color: '#ccc', marginTop: '6px', fontWeight: '600' }}>
                {7 - (totalAnswered % 7 || 7) > 0 ? `${7 - (totalAnswered % 7)} until ad break` : ''}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
