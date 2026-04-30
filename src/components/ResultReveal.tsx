import { useEffect, useRef, useState } from 'react';

interface ResultBarProps {
  label: string;
  percent: number;
  color: string;
  isChosen: boolean;
  delay?: number;
}

function ResultBar({ label, percent, color, isChosen, delay = 0 }: ResultBarProps) {
  const [width, setWidth] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWidth(percent);

      const duration = 900;
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Bouncy ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayPct(Math.round(eased * percent));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [percent, delay]);

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* Label row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: isChosen ? '800' : '600',
            color: isChosen ? '#1a1a1a' : '#999',
            maxWidth: '70%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isChosen && <span style={{ marginRight: '4px' }}>✓</span>}
          {label}
        </span>
        <span
          style={{
            fontSize: '19px',
            fontWeight: '900',
            color: isChosen ? color : '#bbb',
            minWidth: '48px',
            textAlign: 'right',
            transition: 'color 0.3s',
          }}
        >
          {displayPct}%
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          height: '18px',
          borderRadius: '999px',
          background: '#f0ece6',
          border: '2px solid #e8e4de',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '999px',
            width: `${width}%`,
            background: isChosen ? color : `${color}88`,
            transition: 'width 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: isChosen ? `inset 0 -2px 0 rgba(0,0,0,0.15)` : 'none',
          }}
        />
      </div>
    </div>
  );
}

interface ResultRevealProps {
  bars: { label: string; percent: number; color: string; isChosen: boolean }[];
  onNext: () => void;
  context?: string;
}

export function ResultReveal({ bars, onNext, context }: ResultRevealProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        marginTop: '20px',
      }}
    >
      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#bbb', letterSpacing: '1px' }}>THE VOTES</span>
        <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
      </div>

      {bars.map((bar, i) => (
        <ResultBar key={i} {...bar} delay={i * 120} />
      ))}

      {context && (
        <p
          style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '13px',
            marginTop: '6px',
            marginBottom: '0',
            fontWeight: '600',
          }}
        >
          {context}
        </p>
      )}

      <button
        onClick={onNext}
        style={{
          width: '100%',
          marginTop: '20px',
          padding: '18px',
          borderRadius: '999px',
          border: '2.5px solid #1a1a1a',
          background: '#FF6B35',
          color: '#fff',
          fontWeight: '900',
          fontSize: '16px',
          cursor: 'pointer',
          letterSpacing: '0.5px',
          boxShadow: '4px 4px 0px #1a1a1a',
          transition: 'transform 0.1s, box-shadow 0.1s',
        }}
        onPointerDown={(e) => {
          e.currentTarget.style.transform = 'translate(2px, 2px)';
          e.currentTarget.style.boxShadow = '2px 2px 0px #1a1a1a';
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = 'translate(0, 0)';
          e.currentTarget.style.boxShadow = '4px 4px 0px #1a1a1a';
          onNext();
        }}
      >
        Next one →
      </button>
    </div>
  );
}
