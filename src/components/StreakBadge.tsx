interface Props {
  streak: number;
}

export function StreakBadge({ streak }: Props) {
  if (streak === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        background: '#FFD23F',
        border: '2.5px solid #1a1a1a',
        borderRadius: '999px',
        padding: '6px 14px',
        fontSize: '13px',
        fontWeight: '900',
        color: '#1a1a1a',
        boxShadow: '3px 3px 0px #1a1a1a',
        letterSpacing: '0.3px',
      }}
    >
      <span style={{ fontSize: '15px' }}>🔥</span>
      {streak} day{streak !== 1 ? 's' : ''}
    </div>
  );
}
