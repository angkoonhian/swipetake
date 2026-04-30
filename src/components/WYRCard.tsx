import type { WYRQuestion } from '../types';
import { ResultReveal } from './ResultReveal';

interface Props {
  question: WYRQuestion;
  userChoice: number | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
}

const CORAL  = '#FF6B35';
const PURPLE = '#7B2D8B';

export function WYRCard({ question, userChoice, onAnswer, onNext }: Props) {
  const answered = userChoice !== null;

  const btnStyle = (idx: number): React.CSSProperties => {
    const color  = idx === 0 ? CORAL : PURPLE;
    const chosen    = userChoice === idx;
    const notChosen = answered && !chosen;

    return {
      width: '100%',
      padding: '20px 16px',
      borderRadius: '20px',
      border: `2.5px solid ${notChosen ? '#e8e4de' : '#1a1a1a'}`,
      background: chosen ? color : notChosen ? '#f5f2ee' : `${color}18`,
      color: chosen ? '#fff' : notChosen ? '#bbb' : '#1a1a1a',
      fontWeight: '800',
      fontSize: '17px',
      lineHeight: '1.4',
      cursor: answered ? 'default' : 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      boxShadow: chosen ? `4px 4px 0px #1a1a1a` : notChosen ? 'none' : `3px 3px 0px ${color}88`,
      transform: chosen ? 'scale(1.02)' : notChosen ? 'scale(0.98)' : 'scale(1)',
    };
  };

  const bars = [
    { label: question.optionA, percent: question.statsA, color: CORAL,  isChosen: userChoice === 0 },
    { label: question.optionB, percent: question.statsB, color: PURPLE, isChosen: userChoice === 1 },
  ];

  const chosenPct = userChoice === 0 ? question.statsA : question.statsB;
  const context = answered
    ? `${chosenPct >= 50 ? chosenPct : 100 - chosenPct}% of people ${chosenPct >= 50 ? 'made the same call' : 'went the other way'}`
    : undefined;

  return (
    <div>
      <p
        style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#1a1a1a',
          lineHeight: '1.2',
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        Pick one — no middle ground.
      </p>

      {!answered ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            style={btnStyle(0)}
            onClick={() => onAnswer(0)}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {question.optionA}
          </button>

          {/* VS badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
            <div
              style={{
                background: '#FFD23F',
                border: '2.5px solid #1a1a1a',
                borderRadius: '999px',
                padding: '4px 14px',
                fontWeight: '900',
                fontSize: '13px',
                color: '#1a1a1a',
                letterSpacing: '1px',
                boxShadow: '2px 2px 0px #1a1a1a',
              }}
            >
              VS
            </div>
            <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
          </div>

          <button
            style={btnStyle(1)}
            onClick={() => onAnswer(1)}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {question.optionB}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={btnStyle(0)}>{question.optionA}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
            <div
              style={{
                background: '#FFD23F',
                border: '2.5px solid #1a1a1a',
                borderRadius: '999px',
                padding: '4px 14px',
                fontWeight: '900',
                fontSize: '13px',
                color: '#1a1a1a',
                letterSpacing: '1px',
                boxShadow: '2px 2px 0px #1a1a1a',
              }}
            >
              VS
            </div>
            <div style={{ flex: 1, height: '2px', background: '#e8e4de', borderRadius: '1px' }} />
          </div>

          <div style={btnStyle(1)}>{question.optionB}</div>
          <ResultReveal bars={bars} onNext={onNext} context={context} />
        </div>
      )}
    </div>
  );
}
