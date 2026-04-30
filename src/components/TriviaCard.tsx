import type { TriviaQuestion } from '../types';
import { ResultReveal } from './ResultReveal';

interface Props {
  question: TriviaQuestion;
  userChoice: number | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
}

// Pastel-ish but bold enough — each option gets its own personality
const OPTION_COLORS = ['#FF6B35', '#7B2D8B', '#00C9A7', '#FFD23F'];
const OPTION_TEXT   = ['#fff',    '#fff',    '#fff',    '#1a1a1a'];
const LETTERS = ['A', 'B', 'C', 'D'];

export function TriviaCard({ question, userChoice, onAnswer, onNext }: Props) {
  const answered  = userChoice !== null;
  const isCorrect = answered && userChoice === question.correct;

  const btnStyle = (idx: number): React.CSSProperties => {
    const color    = OPTION_COLORS[idx];
    const txtColor = OPTION_TEXT[idx];
    const chosen    = userChoice === idx;
    const isRight   = idx === question.correct;
    const notChosen = answered && !chosen;

    let bg      = `${color}18`;
    let border  = `2.5px solid #1a1a1a`;
    let textCol = '#1a1a1a';
    let shadow  = `3px 3px 0px ${color}66`;
    let tform   = 'scale(1)';

    if (answered) {
      if (isRight) {
        bg      = '#00C9A7';
        textCol = '#fff';
        shadow  = '4px 4px 0px #1a1a1a';
        tform   = 'scale(1.02)';
      } else if (chosen && !isRight) {
        bg      = '#FF6B35';
        textCol = '#fff';
        border  = '2.5px solid #1a1a1a';
        shadow  = '4px 4px 0px #1a1a1a';
      } else {
        bg      = '#f5f2ee';
        border  = '2.5px solid #e8e4de';
        textCol = '#ccc';
        shadow  = 'none';
        tform   = 'scale(0.97)';
      }
    } else {
      bg      = `${color}18`;
      textCol = '#1a1a1a';
    }
    void notChosen;
    void txtColor;

    return {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '18px',
      border,
      background: bg,
      color: textCol,
      fontWeight: '700',
      fontSize: '15px',
      lineHeight: '1.4',
      cursor: answered ? 'default' : 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.2s ease',
      boxShadow: shadow,
      transform: tform,
    };
  };

  const bars = question.options.map((opt, i) => ({
    label: opt,
    percent: i === question.correct ? question.percentCorrect : Math.round((100 - question.percentCorrect) / 3),
    color: OPTION_COLORS[i],
    isChosen: userChoice === i,
  }));

  const context = answered
    ? isCorrect
      ? `Only ${question.percentCorrect}% got this right — you're one of them!`
      : `Only ${question.percentCorrect}% of people got this right`
    : undefined;

  return (
    <div>
      <p
        style={{
          fontSize: '21px',
          fontWeight: '900',
          color: '#1a1a1a',
          lineHeight: '1.3',
          marginBottom: '24px',
        }}
      >
        {question.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            style={btnStyle(i)}
            onClick={() => !answered && onAnswer(i)}
            onPointerDown={(e) => { if (!answered) e.currentTarget.style.transform = 'scale(0.96)'; }}
            onPointerUp={(e)   => { if (!answered) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: answered ? 'rgba(255,255,255,0.25)' : OPTION_COLORS[i] + '33',
                border: '2px solid rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: '900',
                fontSize: '13px',
                color: 'inherit',
              }}
            >
              {LETTERS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {answered && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '16px',
              background: isCorrect ? '#00C9A720' : '#FF6B3520',
              border: `2.5px solid ${isCorrect ? '#00C9A7' : '#FF6B35'}`,
              color: isCorrect ? '#007a65' : '#cc3d00',
              fontWeight: '800',
              fontSize: '15px',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            {isCorrect ? '✅ Correct! You crushed it.' : `❌ Nope — it's: ${question.options[question.correct]}`}
          </div>
          <ResultReveal bars={bars} onNext={onNext} context={context} />
        </div>
      )}
    </div>
  );
}
