import { useMemo } from 'react';
import { getAnswers, getTotalAnswered, getStreakData, calculatePersonality } from '../services/stats';
import { BannerAdSlot } from '../components/BannerAdSlot';
import type { PersonalityTraits } from '../types';

function TraitBar({ label, value, leftLabel, rightLabel, color }: {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
  color: string;
}) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#bbb', fontWeight: '700' }}>{leftLabel}</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '800',
            color: '#1a1a1a',
            background: color + '22',
            border: `2px solid ${color}`,
            borderRadius: '999px',
            padding: '2px 10px',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '11px', color: '#bbb', fontWeight: '700' }}>{rightLabel}</span>
      </div>
      {/* Track */}
      <div
        style={{
          height: '12px',
          borderRadius: '999px',
          background: '#f0ece6',
          border: '2px solid #e8e4de',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Filled portion */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${value}%`,
            borderRadius: '999px',
            background: color,
            transition: 'width 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
        {/* Thumb dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${value}%`,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            border: `3px solid ${color}`,
            boxShadow: '2px 2px 0px #1a1a1a',
            transition: 'left 0.7s cubic-bezier(0.34,1.56,0.64,1)',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}

export function ProfilePage() {
  const totalAnswered = getTotalAnswered();
  const answers       = useMemo(() => getAnswers(), []);
  const streakData    = getStreakData();
  const traits: PersonalityTraits = useMemo(() => calculatePersonality(), []);

  const correctTrivia   = answers.filter((a) => a.isCorrect === true).length;
  const triviaTotal     = answers.filter((a) => a.isCorrect !== undefined).length;
  const contrarianCount = answers.filter((a) => a.agreedWithMajority === false).length;

  const STAT_CARDS = [
    {
      label: 'Answers',
      value: totalAnswered,
      icon: '📝',
      bg: '#FF6B35',
      shadow: '#cc3d00',
    },
    {
      label: 'Day Streak',
      value: streakData.current > 0 ? `${streakData.current}🔥` : '0',
      icon: '🔥',
      bg: '#FFD23F',
      shadow: '#c9a000',
    },
    {
      label: 'Trivia Score',
      value: triviaTotal > 0 ? `${Math.round((correctTrivia / triviaTotal) * 100)}%` : '—',
      icon: '🧠',
      bg: '#7B2D8B',
      shadow: '#4e1a5b',
    },
    {
      label: 'Contrarian',
      value: totalAnswered > 0 ? `${Math.round((contrarianCount / totalAnswered) * 100)}%` : '—',
      icon: '⚡',
      bg: '#00C9A7',
      shadow: '#007a65',
    },
  ];

  return (
    <div
      className="dot-grid-bg"
      style={{
        minHeight: '100dvh',
        paddingBottom: '80px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '2.5px solid #1a1a1a',
          background: '#fff',
        }}
      >
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>
          Your Profile 🫵
        </h1>
        <p style={{ color: '#bbb', fontSize: '13px', margin: '4px 0 0', fontWeight: '600' }}>
          Based on {totalAnswered} answer{totalAnswered !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {STAT_CARDS.map((card) => (
            <div
              key={card.label}
              style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '18px 14px',
                border: '2.5px solid #1a1a1a',
                boxShadow: `4px 4px 0px #1a1a1a`,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Color accent top bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: card.bg,
                  borderRadius: '18px 18px 0 0',
                }}
              />
              <div style={{ fontSize: '24px', marginBottom: '4px', marginTop: '4px' }}>{card.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a1a1a', lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '5px', fontWeight: '700' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Streak display */}
        {streakData.current > 0 && (
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '18px',
              border: '2.5px solid #1a1a1a',
              boxShadow: '4px 4px 0px #FFD23F',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1a1a1a', marginBottom: '10px' }}>
              🔥 STREAK CHAIN
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Array.from({ length: Math.min(streakData.current, 14) }).map((_, i) => (
                <span key={i} style={{ fontSize: '20px' }}>🔥</span>
              ))}
              {streakData.current > 14 && (
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#FF6B35', alignSelf: 'center' }}>
                  +{streakData.current - 14} more!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Personality traits */}
        {totalAnswered >= 5 && (
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              border: '2.5px solid #1a1a1a',
              boxShadow: '4px 4px 0px #7B2D8B',
            }}
          >
            <h2
              style={{
                fontSize: '14px',
                fontWeight: '900',
                color: '#1a1a1a',
                margin: '0 0 20px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              🎯 Personality Radar
            </h2>
            <TraitBar
              label="Chaos Level"
              value={traits.chaosScore}
              leftLabel="Orderly"
              rightLabel="Chaotic"
              color="#7B2D8B"
            />
            <TraitBar
              label="Crowd Alignment"
              value={100 - traits.contrarianScore}
              leftLabel="Contrarian"
              rightLabel="Mainstream"
              color="#FF6B35"
            />
            <TraitBar
              label="Decision Style"
              value={traits.heartScore}
              leftLabel="Head"
              rightLabel="Heart"
              color="#f43f5e"
            />
            <TraitBar
              label="Risk Appetite"
              value={traits.riskScore}
              leftLabel="Safe"
              rightLabel="Risk-Taker"
              color="#FFD23F"
            />
          </div>
        )}

        {/* Unlock personality report CTA */}
        {totalAnswered < 20 && (
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              border: '2.5px solid #1a1a1a',
              boxShadow: '4px 4px 0px #FF6B35',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1a1a1a', marginBottom: '4px' }}>
              AI Personality Report
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px', fontWeight: '600' }}>
              Answer {20 - totalAnswered} more question{20 - totalAnswered !== 1 ? 's' : ''} to unlock
            </div>
            {/* Progress bar */}
            <div
              style={{
                height: '12px',
                borderRadius: '999px',
                background: '#f0ece6',
                border: '2px solid #e8e4de',
                overflow: 'hidden',
                marginBottom: '6px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min((totalAnswered / 20) * 100, 100)}%`,
                  background: '#FF6B35',
                  borderRadius: '999px',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#bbb', fontWeight: '700' }}>
              {totalAnswered}/20
            </div>
          </div>
        )}

        {totalAnswered >= 20 && (
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              border: '2.5px solid #1a1a1a',
              boxShadow: '4px 4px 0px #00C9A7',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>✨</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1a1a1a', marginBottom: '4px' }}>
              Your Personality Report is Ready
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px', fontWeight: '600' }}>
              Watch a short ad to unlock your full analysis
            </div>
            <a
              href="/personality"
              style={{
                display: 'block',
                padding: '16px',
                borderRadius: '999px',
                border: '2.5px solid #1a1a1a',
                background: '#FF6B35',
                color: '#fff',
                fontWeight: '900',
                fontSize: '15px',
                textDecoration: 'none',
                boxShadow: '4px 4px 0px #1a1a1a',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
            >
              Unlock Report ✨
            </a>
          </div>
        )}

        {/* Recent answers */}
        {answers.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: '900',
                color: '#1a1a1a',
                margin: '0 0 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Recent Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {answers.slice(-5).reverse().map((ans, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: '2px solid #e8e4de',
                    boxShadow: '2px 2px 0px #e8e4de',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#ccc', fontFamily: 'monospace', fontWeight: '600' }}>
                    {ans.questionId}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {ans.isCorrect === true && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#007a65',
                          fontWeight: '800',
                          background: '#00C9A720',
                          border: '1.5px solid #00C9A7',
                          borderRadius: '999px',
                          padding: '2px 8px',
                        }}
                      >
                        ✓ correct
                      </span>
                    )}
                    {ans.isCorrect === false && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#cc3d00',
                          fontWeight: '800',
                          background: '#FF6B3520',
                          border: '1.5px solid #FF6B35',
                          borderRadius: '999px',
                          padding: '2px 8px',
                        }}
                      >
                        ✗ wrong
                      </span>
                    )}
                    {ans.agreedWithMajority === false && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#4e1a5b',
                          fontWeight: '800',
                          background: '#7B2D8B20',
                          border: '1.5px solid #7B2D8B',
                          borderRadius: '999px',
                          padding: '2px 8px',
                        }}
                      >
                        ⚡ contrarian
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalAnswered === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#fff',
              borderRadius: '20px',
              border: '2.5px solid #e8e4de',
              boxShadow: '4px 4px 0px #e8e4de',
            }}
          >
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>👻</div>
            <div style={{ fontSize: '17px', fontWeight: '900', color: '#1a1a1a', marginBottom: '6px' }}>
              Nothing here yet
            </div>
            <div style={{ fontSize: '14px', color: '#bbb', fontWeight: '600' }}>
              Head to the Feed tab and start opining!
            </div>
          </div>
        )}
      </div>

      {/* Banner ad */}
      <BannerAdSlot />
    </div>
  );
}
