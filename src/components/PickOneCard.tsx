import type { PickOneQuestion } from '../types';
import { ResultReveal } from './ResultReveal';

interface Props {
  question: PickOneQuestion;
  userChoice: number | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
}

const COLORS = ['#FF6B35', '#7B2D8B', '#00C9A7', '#FFD23F'];
const TEXT_COLORS = ['#fff', '#fff', '#fff', '#1a1a1a'];

export function PickOneCard({ question, userChoice, onAnswer, onNext }: Props) {
  const answered = userChoice !== null;
  const maxPct   = Math.max(...question.stats);

  const btnStyle = (idx: number): React.CSSProperties => {
    const color    = COLORS[idx];
    const txtColor = TEXT_COLORS[idx];
    const chosen    = userChoice === idx;
    const isTop     = question.stats[idx] === maxPct;
    const notChosen = answered && !chosen;

    return {
      padding: '20px 10px',
      borderRadius: '20px',
      border: `2.5px solid ${notChosen && !isTop ? '#e8e4de' : '#1a1a1a'}`,
      background: chosen
        ? color
        : notChosen
        ? isTop ? `${color}18` : '#f5f2ee'
        : `${color}18`,
      color: chosen ? txtColor : notChosen && !isTop ? '#ccc' : '#1a1a1a',
      fontWeight: '800',
      fontSize: '15px',
      cursor: answered ? 'default' : 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      boxShadow: chosen
        ? `4px 4px 0px #1a1a1a`
        : notChosen
        ? 'none'
        : `3px 3px 0px ${color}66`,
      transform: chosen ? 'scale(1.04)' : notChosen ? 'scale(0.97)' : 'scale(1)',
      lineHeight: '1.3',
    };
  };

  const bars = question.options.map((opt, i) => ({
    label: opt,
    percent: question.stats[i],
    color: COLORS[i],
    isChosen: userChoice === i,
  }));

  const chosenPct    = answered ? question.stats[userChoice] : 0;
  const isMostPopular = answered && question.stats[userChoice] === maxPct;
  const context = answered
    ? isMostPopular
      ? `${chosenPct}% picked this — you went with the crowd`
      : `${chosenPct}% picked this — against the grain!`
    : undefined;

  return (
    <div>
      <p
        style={{
          fontSize: '23px',
          fontWeight: '900',
          color: '#1a1a1a',
          lineHeight: '1.2',
          marginBottom: '28px',
          textAlign: 'center',
        }}
      >
        {question.prompt}
      </p>

      {!answered ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {question.options.map((opt, i) => (
            <button
              key={i}
              style={btnStyle(i)}
              onClick={() => onAnswer(i)}
              onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
              onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1.04)'; setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 150); }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
            {question.options.map((opt, i) => (
              <div key={i} style={btnStyle(i)}>
                {opt}
              </div>
            ))}
          </div>
          <ResultReveal bars={bars} onNext={onNext} context={context} />
        </>
      )}
    </div>
  );
}
