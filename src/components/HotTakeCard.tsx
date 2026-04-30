import type { HotTakeQuestion } from '../types';
import { ResultReveal } from './ResultReveal';

interface Props {
  question: HotTakeQuestion;
  userChoice: number | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
}

const CORAL = '#FF6B35';
const TEAL  = '#00C9A7';

export function HotTakeCard({ question, userChoice, onAnswer, onNext }: Props) {
  const answered = userChoice !== null;
  const disagreePercent = 100 - question.agreePercent;

  const btnStyle = (idx: number): React.CSSProperties => {
    const color    = idx === 0 ? CORAL : TEAL;
    const chosen    = userChoice === idx;
    const notChosen = answered && !chosen;

    return {
      flex: 1,
      padding: '20px 12px',
      borderRadius: '20px',
      border: `2.5px solid ${notChosen ? '#e8e4de' : '#1a1a1a'}`,
      background: chosen ? color : notChosen ? '#f5f2ee' : `${color}18`,
      color: chosen ? '#fff' : notChosen ? '#bbb' : color,
      fontWeight: '900',
      fontSize: '16px',
      cursor: answered ? 'default' : 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      boxShadow: chosen ? `4px 4px 0px #1a1a1a` : notChosen ? 'none' : `3px 3px 0px ${color}66`,
      transform: chosen ? 'scale(1.03)' : notChosen ? 'scale(0.97)' : 'scale(1)',
      letterSpacing: '0.5px',
    };
  };

  const bars = [
    { label: 'Agree',    percent: question.agreePercent, color: CORAL, isChosen: userChoice === 0 },
    { label: 'Disagree', percent: disagreePercent,        color: TEAL,  isChosen: userChoice === 1 },
  ];

  const chosenPct = userChoice === 0 ? question.agreePercent : disagreePercent;
  const context = answered
    ? `${chosenPct}% of people ${userChoice === 0 ? 'agreed' : 'disagreed'}`
    : undefined;

  return (
    <div>
      <blockquote
        style={{
          fontSize: '23px',
          fontWeight: '900',
          color: '#1a1a1a',
          lineHeight: '1.3',
          margin: '0 0 28px',
          textAlign: 'center',
          fontStyle: 'italic',
          padding: '0 4px',
        }}
      >
        "{question.statement}"
      </blockquote>

      {!answered ? (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={btnStyle(0)}
            onClick={() => onAnswer(0)}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
            onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1.03)'; setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 150); }}
          >
            🔥 AGREE
          </button>
          <button
            style={btnStyle(1)}
            onClick={() => onAnswer(1)}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.93)'; }}
            onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1.03)'; setTimeout(() => { e.currentTarget.style.transform = 'scale(1)'; }, 150); }}
          >
            ❄️ NOPE
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
            <div style={btnStyle(0)}>🔥 AGREE</div>
            <div style={btnStyle(1)}>❄️ NOPE</div>
          </div>
          <ResultReveal bars={bars} onNext={onNext} context={context} />
        </>
      )}
    </div>
  );
}
