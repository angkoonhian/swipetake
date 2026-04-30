import { useState, useMemo } from 'react';
import { getTotalAnswered, getStreakData, calculatePersonality } from '../services/stats';
import { BannerAdSlot } from '../components/BannerAdSlot';
import type { LeaderboardEntry } from '../types';

const FAKE_USERNAMES = [
  'NightOwl99', 'ChaosQueen', 'LogicBro', 'WildCard88',
  'TakesTaker', 'DebateKing', 'RiskRunner', 'MidnightTake',
  'HotOpinion', 'PickMaster', 'TriviaAce', 'ContrarianX',
  'StormMind', 'PeakVibes', 'TakeFactory', 'ZeroFilter',
  'BluntTakes', 'DeepCuts99', 'OpinionHub', 'LastWordLou',
];

const BASE_LEADERBOARD: Omit<LeaderboardEntry, 'rank'>[] = FAKE_USERNAMES.map((username, i) => {
  const seed = (i * 7919 + 12345) % 100;
  return {
    username,
    streak: (seed % 29) + 2,
    totalAnswers: ((seed * 3) % 180) + 25,
    contrarianScore: (seed % 75) + 8,
  };
});

type SortKey = 'streak' | 'contrarian' | 'total';

// Podium colors + shadows
const RANK_STYLES: Record<number, { bg: string; border: string; shadow: string; emoji: string }> = {
  1: { bg: '#FFD23F', border: '#1a1a1a', shadow: '4px 4px 0px #1a1a1a', emoji: '🥇' },
  2: { bg: '#e8e4de', border: '#1a1a1a', shadow: '4px 4px 0px #1a1a1a', emoji: '🥈' },
  3: { bg: '#FF6B35', border: '#1a1a1a', shadow: '4px 4px 0px #1a1a1a', emoji: '🥉' },
};

export function LeaderboardPage() {
  const [sort, setSort] = useState<SortKey>('streak');

  const totalAnswered = getTotalAnswered();
  const streakData    = getStreakData();
  const traits        = useMemo(() => calculatePersonality(), []);

  const userEntry: Omit<LeaderboardEntry, 'rank'> = {
    username: 'You',
    streak: streakData.current,
    totalAnswers: totalAnswered,
    contrarianScore: traits.contrarianScore,
    isUser: true,
  };

  const combined = [...BASE_LEADERBOARD, userEntry];
  const sorted   = [...combined].sort((a, b) =>
    sort === 'streak'
      ? b.streak - a.streak
      : sort === 'contrarian'
      ? b.contrarianScore - a.contrarianScore
      : b.totalAnswers - a.totalAnswers
  );

  const ranked: LeaderboardEntry[] = sorted.map((entry, i) => ({ ...entry, rank: i + 1 }));
  const userRank = ranked.find((e) => e.isUser)?.rank ?? '—';

  const pillStyle = (active: boolean, activeColor: string): React.CSSProperties => ({
    padding: '9px 18px',
    borderRadius: '999px',
    border: `2.5px solid ${active ? '#1a1a1a' : '#e8e4de'}`,
    background: active ? activeColor : '#fff',
    color: active ? (activeColor === '#FFD23F' ? '#1a1a1a' : '#fff') : '#bbb',
    fontWeight: '800',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
    boxShadow: active ? '3px 3px 0px #1a1a1a' : '2px 2px 0px #e8e4de',
  });

  // Top 3 podium entries
  const top3 = ranked.slice(0, 3);
  const rest  = ranked.slice(3);

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
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 4px' }}>
          🏆 Daily Rankings
        </h1>
        <p style={{ color: '#bbb', fontSize: '13px', margin: 0, fontWeight: '600' }}>
          You're #{userRank} today · {totalAnswered} answers logged
        </p>
      </div>

      {/* Sort pills */}
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          background: '#fff',
          borderBottom: '2.5px solid #1a1a1a',
        }}
      >
        <button style={pillStyle(sort === 'streak', '#FFD23F')} onClick={() => setSort('streak')}>
          🔥 Streak
        </button>
        <button style={pillStyle(sort === 'contrarian', '#7B2D8B')} onClick={() => setSort('contrarian')}>
          ⚡ Contrarian
        </button>
        <button style={pillStyle(sort === 'total', '#FF6B35')} onClick={() => setSort('total')}>
          📊 Volume
        </button>
      </div>

      {/* Podium — Top 3 */}
      <div
        style={{
          padding: '20px 16px 12px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Reorder: 2nd, 1st, 3rd for visual podium */}
        {[top3[1], top3[0], top3[2]].map((entry, visualIdx) => {
          if (!entry) return null;
          const podiumOrder = [2, 1, 3][visualIdx]; // actual rank
          const heights     = [80, 110, 65];
          const style       = RANK_STYLES[podiumOrder] ?? RANK_STYLES[3];

          return (
            <div
              key={entry.username}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  fontSize: visualIdx === 1 ? '32px' : '22px',
                  lineHeight: 1,
                }}
              >
                {style.emoji}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#1a1a1a',
                  textAlign: 'center',
                  maxWidth: '80px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.isUser ? 'YOU' : entry.username}
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${heights[visualIdx]}px`,
                  background: style.bg,
                  borderRadius: '12px 12px 0 0',
                  border: `2.5px solid ${style.border}`,
                  borderBottom: 'none',
                  boxShadow: style.shadow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a1a' }}>
                  {sort === 'streak'
                    ? `${entry.streak}🔥`
                    : sort === 'contrarian'
                    ? `${entry.contrarianScore}%`
                    : entry.totalAnswers}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner ad */}
      <div style={{ margin: '0 16px 12px' }}>
        <BannerAdSlot placeholderHeight={50} />
      </div>

      {/* Rest of list */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rest.map((entry) => (
          <div
            key={entry.username}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 16px',
              borderRadius: '16px',
              background: entry.isUser ? '#FF6B35' : '#fff',
              border: `2.5px solid ${entry.isUser ? '#1a1a1a' : '#e8e4de'}`,
              boxShadow: entry.isUser ? '4px 4px 0px #1a1a1a' : '2px 2px 0px #e8e4de',
            }}
          >
            {/* Rank */}
            <div
              style={{
                width: '36px',
                fontWeight: '900',
                fontSize: '15px',
                color: entry.isUser ? '#fff' : '#bbb',
                flexShrink: 0,
                textAlign: 'center',
              }}
            >
              #{entry.rank}
            </div>

            {/* Username */}
            <div style={{ flex: 1, paddingLeft: '10px', minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: entry.isUser ? '900' : '700',
                  color: entry.isUser ? '#fff' : '#1a1a1a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {entry.username} {entry.isUser && '← you'}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: entry.isUser ? 'rgba(255,255,255,0.7)' : '#ccc',
                  marginTop: '2px',
                  fontWeight: '600',
                }}
              >
                {entry.totalAnswers} answers
              </div>
            </div>

            {/* Stat */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  color: entry.isUser ? '#fff' : '#1a1a1a',
                }}
              >
                {sort === 'streak'
                  ? `${entry.streak}🔥`
                  : sort === 'contrarian'
                  ? `${entry.contrarianScore}%`
                  : entry.totalAnswers}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: entry.isUser ? 'rgba(255,255,255,0.6)' : '#ccc',
                  marginTop: '2px',
                  fontWeight: '700',
                }}
              >
                {sort === 'streak' ? 'day streak' : sort === 'contrarian' ? 'vs crowd' : 'answered'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#ccc',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}
      >
        Rankings reset daily · Simulated for MVP
      </div>
    </div>
  );
}
