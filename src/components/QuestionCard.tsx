import type { Question } from '../types';
import { WYRCard } from './WYRCard';
import { HotTakeCard } from './HotTakeCard';
import { TriviaCard } from './TriviaCard';
import { PickOneCard } from './PickOneCard';

interface Props {
  question: Question;
  userChoice: number | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
  animating?: boolean;
}

const TYPE_META: Record<string, { badge: string; emoji: string; shadow: string }> = {
  wyr:      { badge: 'Would You Rather', emoji: '🤔', shadow: '6px 6px 0px #7B2D8B' },
  hottake:  { badge: 'Hot Take',         emoji: '🔥', shadow: '6px 6px 0px #FF6B35' },
  trivia:   { badge: 'Trivia',           emoji: '🧠', shadow: '6px 6px 0px #FFD23F' },
  pickone:  { badge: 'Pick One',         emoji: '👆', shadow: '6px 6px 0px #00C9A7' },
};

export function QuestionCard({ question, userChoice, onAnswer, onNext, animating }: Props) {
  const meta = TYPE_META[question.type] ?? { badge: 'Question', emoji: '❓', shadow: '6px 6px 0px #FF6B35' };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '24px',
        border: '2.5px solid #1a1a1a',
        boxShadow: animating ? 'none' : meta.shadow,
        position: 'relative',
        overflow: 'hidden',
        opacity: animating ? 0 : 1,
        transform: animating
          ? 'translateY(30px) scale(0.96) rotate(0deg)'
          : 'translateY(0) scale(1) rotate(-0.8deg)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Category badge */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '18px' }}>{meta.emoji}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#1a1a1a',
            background: '#FAF7F2',
            border: '2px solid #1a1a1a',
            borderRadius: '999px',
            padding: '3px 10px',
          }}
        >
          {meta.badge}
        </span>
      </div>

      {question.type === 'wyr' && (
        <WYRCard question={question} userChoice={userChoice} onAnswer={onAnswer} onNext={onNext} />
      )}
      {question.type === 'hottake' && (
        <HotTakeCard question={question} userChoice={userChoice} onAnswer={onAnswer} onNext={onNext} />
      )}
      {question.type === 'trivia' && (
        <TriviaCard question={question} userChoice={userChoice} onAnswer={onAnswer} onNext={onNext} />
      )}
      {question.type === 'pickone' && (
        <PickOneCard question={question} userChoice={userChoice} onAnswer={onAnswer} onNext={onNext} />
      )}

      {/* AI-generated content disclosure — required for transparency */}
      {question.id?.startsWith('ai-') && (
        <div
          style={{
            marginTop: '12px',
            textAlign: 'right',
            fontSize: '10px',
            fontWeight: '600',
            color: '#ccc',
            letterSpacing: '0.4px',
          }}
        >
          🤖 AI-generated
        </div>
      )}
    </div>
  );
}
