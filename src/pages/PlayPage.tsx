/**
 * PlayPage — plays through a custom quiz received via QR code.
 *
 * Isolated from main feed: no ads, no streak/personality effect.
 * Uses same visual language as the main card components.
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CustomQuiz, CustomQuestion, QuizResults } from '../types';
import { encodeResults, hashQuiz } from '../services/qr-codec';

// ─── Quiz Report Modal ────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Offensive Content',
  'Bullying / Harassment',
  'Spam',
  'Other',
] as const;

interface ReportModalProps {
  quiz: CustomQuiz;
  onClose: () => void;
}

function ReportModal({ quiz, onClose }: ReportModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    // Store report in localStorage (production: send to moderation service)
    try {
      const existing = JSON.parse(localStorage.getItem('swipetake_reports') ?? '[]');
      existing.push({
        quizTitle: quiz.t,
        quizBy: quiz.by,
        reason: selected,
        reportedAt: new Date().toISOString(),
      });
      localStorage.setItem('swipetake_reports', JSON.stringify(existing));
    } catch { /* noop */ }
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '28px 24px',
          border: `2.5px solid ${DARK}`,
          boxShadow: `8px 8px 0px ${CORAL}`,
          width: '100%',
          maxWidth: '360px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontWeight: '900', fontSize: '18px', color: DARK }}>Reported. Thank you.</div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: '900', fontSize: '18px', color: DARK, marginBottom: '6px' }}>
              ⚠️ Report this quiz as inappropriate?
            </div>
            <div style={{ color: '#888', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
              Select a reason:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelected(reason)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: `2px solid ${selected === reason ? CORAL : '#e8e4de'}`,
                    background: selected === reason ? CORAL + '18' : CREAM,
                    color: selected === reason ? CORAL : '#666',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '999px',
                  border: `2px solid #e8e4de`,
                  background: CREAM,
                  color: '#888',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '999px',
                  border: `2px solid ${DARK}`,
                  background: selected ? CORAL : '#e8e4de',
                  color: selected ? '#fff' : '#bbb',
                  fontWeight: '900',
                  fontSize: '14px',
                  cursor: selected ? 'pointer' : 'not-allowed',
                }}
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CORAL  = '#FF6B35';
const PURPLE = '#7B2D8B';
const TEAL   = '#00C9A7';
const YELLOW = '#FFD23F';
const DARK   = '#1a1a1a';
const CREAM  = '#FAF7F2';

const OPTION_COLORS = [CORAL, PURPLE, TEAL, YELLOW];
const LETTERS = ['A', 'B', 'C', 'D'];

// ─── Per-question play views ──────────────────────────────────────────────────

interface QuestionPlayProps {
  question: CustomQuestion;
  onAnswer: (choice: number) => void;
}

function WYRPlay({ question, onAnswer }: QuestionPlayProps & { question: Extract<CustomQuestion, { type: 'wyr' }> }) {
  const [chosen, setChosen] = useState<number | null>(null);

  const handleChoose = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    setTimeout(() => onAnswer(idx), 800);
  };

  return (
    <div>
      <p style={{ fontWeight: '900', fontSize: '22px', textAlign: 'center', marginBottom: '24px' }}>
        Pick one — no middle ground.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[question.optionA, question.optionB].map((opt, i) => {
          const color   = i === 0 ? CORAL : PURPLE;
          const isChosen = chosen === i;
          const fade    = chosen !== null && !isChosen;
          return (
            <button
              key={i}
              onClick={() => handleChoose(i)}
              style={{
                padding: '20px 16px',
                borderRadius: '20px',
                border: `2.5px solid ${fade ? '#e8e4de' : DARK}`,
                background: isChosen ? color : fade ? '#f5f2ee' : color + '18',
                color: isChosen ? '#fff' : fade ? '#ccc' : DARK,
                fontWeight: '800',
                fontSize: '17px',
                cursor: chosen !== null ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: isChosen ? `4px 4px 0px ${DARK}` : fade ? 'none' : `3px 3px 0px ${color}66`,
                transform: isChosen ? 'scale(1.02)' : fade ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#999', fontWeight: '700', fontSize: '14px' }}>
          Your answer: <strong style={{ color: DARK }}>{chosen === 0 ? question.optionA : question.optionB}</strong>
        </div>
      )}
    </div>
  );
}

function HotTakePlay({ question, onAnswer }: QuestionPlayProps & { question: Extract<CustomQuestion, { type: 'hottake' }> }) {
  const [chosen, setChosen] = useState<number | null>(null);

  const handleChoose = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    setTimeout(() => onAnswer(idx), 800);
  };

  return (
    <div>
      <blockquote style={{ fontSize: '23px', fontWeight: '900', textAlign: 'center', fontStyle: 'italic', marginBottom: '28px', lineHeight: '1.3' }}>
        "{question.statement}"
      </blockquote>
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: '🔥 AGREE', color: CORAL },
          { label: '❄️ NOPE',  color: TEAL  },
        ].map(({ label, color }, i) => {
          const isChosen = chosen === i;
          const fade    = chosen !== null && !isChosen;
          return (
            <button
              key={i}
              onClick={() => handleChoose(i)}
              style={{
                flex: 1,
                padding: '20px 12px',
                borderRadius: '20px',
                border: `2.5px solid ${fade ? '#e8e4de' : DARK}`,
                background: isChosen ? color : fade ? '#f5f2ee' : color + '18',
                color: isChosen ? '#fff' : fade ? '#ccc' : color,
                fontWeight: '900',
                fontSize: '16px',
                cursor: chosen !== null ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: isChosen ? `4px 4px 0px ${DARK}` : fade ? 'none' : `3px 3px 0px ${color}66`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#999', fontWeight: '700', fontSize: '14px' }}>
          Your answer: <strong style={{ color: DARK }}>{chosen === 0 ? 'Agree' : 'Disagree'}</strong>
        </div>
      )}
    </div>
  );
}

function TriviaPlay({ question, onAnswer }: QuestionPlayProps & { question: Extract<CustomQuestion, { type: 'trivia' }> }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;

  const handleChoose = (idx: number) => {
    if (answered) return;
    setChosen(idx);
    setTimeout(() => onAnswer(idx), 1000);
  };

  return (
    <div>
      <p style={{ fontWeight: '900', fontSize: '20px', lineHeight: '1.3', marginBottom: '24px' }}>
        {question.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isRight  = i === question.correct;
          let bg    = OPTION_COLORS[i] + '18';
          let border = `2.5px solid ${DARK}`;
          let color  = DARK;
          let shadow = `3px 3px 0px ${OPTION_COLORS[i]}66`;
          let scale  = 'scale(1)';

          if (answered) {
            if (isRight) { bg = TEAL; color = '#fff'; shadow = `4px 4px 0px ${DARK}`; scale = 'scale(1.02)'; }
            else if (isChosen) { bg = CORAL; color = '#fff'; }
            else { bg = '#f5f2ee'; border = '2.5px solid #e8e4de'; color = '#ccc'; shadow = 'none'; scale = 'scale(0.97)'; }
          }

          return (
            <button
              key={i}
              onClick={() => handleChoose(i)}
              style={{
                padding: '14px 16px',
                borderRadius: '18px',
                border,
                background: bg,
                color,
                fontWeight: '700',
                fontSize: '15px',
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: shadow,
                transform: scale,
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  border: '2px solid rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: '900',
                  fontSize: '13px',
                }}
              >
                {answered && isRight ? '✓' : answered && isChosen && !isRight ? '✗' : LETTERS[i]}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '16px',
            background: chosen === question.correct ? TEAL + '20' : CORAL + '20',
            border: `2.5px solid ${chosen === question.correct ? TEAL : CORAL}`,
            color: chosen === question.correct ? '#007a65' : '#cc3d00',
            fontWeight: '800',
            fontSize: '15px',
            textAlign: 'center',
          }}
        >
          {chosen === question.correct
            ? '✅ Correct!'
            : `❌ Nope — it's: ${question.options[question.correct]}`}
        </div>
      )}
    </div>
  );
}

function PickOnePlay({ question, onAnswer }: QuestionPlayProps & { question: Extract<CustomQuestion, { type: 'pickone' }> }) {
  const [chosen, setChosen] = useState<number | null>(null);

  const handleChoose = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    setTimeout(() => onAnswer(idx), 800);
  };

  return (
    <div>
      <p style={{ fontWeight: '900', fontSize: '22px', textAlign: 'center', marginBottom: '24px', lineHeight: '1.2' }}>
        {question.prompt}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {question.options.map((opt, i) => {
          const color   = OPTION_COLORS[i];
          const isChosen = chosen === i;
          const fade    = chosen !== null && !isChosen;
          return (
            <button
              key={i}
              onClick={() => handleChoose(i)}
              style={{
                padding: '20px 10px',
                borderRadius: '20px',
                border: `2.5px solid ${fade ? '#e8e4de' : DARK}`,
                background: isChosen ? color : fade ? '#f5f2ee' : color + '18',
                color: isChosen ? (i === 3 ? DARK : '#fff') : fade ? '#ccc' : DARK,
                fontWeight: '800',
                fontSize: '15px',
                cursor: chosen !== null ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxShadow: isChosen ? `4px 4px 0px ${DARK}` : fade ? 'none' : `3px 3px 0px ${color}66`,
                transform: isChosen ? 'scale(1.04)' : fade ? 'scale(0.97)' : 'scale(1)',
                lineHeight: '1.3',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#999', fontWeight: '700', fontSize: '14px' }}>
          Your answer: <strong style={{ color: DARK }}>{question.options[chosen]}</strong>
        </div>
      )}
    </div>
  );
}

// ─── QuestionWrapper — adds the category badge identical to main feed card ────

const TYPE_META: Record<string, { badge: string; emoji: string; shadow: string }> = {
  wyr:      { badge: 'Would You Rather', emoji: '🤔', shadow: `6px 6px 0px ${PURPLE}` },
  hottake:  { badge: 'Hot Take',         emoji: '🔥', shadow: `6px 6px 0px ${CORAL}`  },
  trivia:   { badge: 'Trivia',           emoji: '🧠', shadow: `6px 6px 0px ${YELLOW}` },
  pickone:  { badge: 'Pick One',         emoji: '👆', shadow: `6px 6px 0px ${TEAL}`   },
};

function QuestionWrapper({ question, onAnswer }: { question: CustomQuestion; onAnswer: (choice: number) => void }) {
  const meta = TYPE_META[question.type] ?? { badge: 'Question', emoji: '❓', shadow: `6px 6px 0px ${CORAL}` };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '24px',
        border: `2.5px solid ${DARK}`,
        boxShadow: meta.shadow,
        transform: 'rotate(-0.5deg)',
      }}
    >
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '18px' }}>{meta.emoji}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: DARK,
            background: CREAM,
            border: `2px solid ${DARK}`,
            borderRadius: '999px',
            padding: '3px 10px',
          }}
        >
          {meta.badge}
        </span>
      </div>

      {question.type === 'wyr' && <WYRPlay question={question} onAnswer={onAnswer} />}
      {question.type === 'hottake' && <HotTakePlay question={question} onAnswer={onAnswer} />}
      {question.type === 'trivia' && <TriviaPlay question={question} onAnswer={onAnswer} />}
      {question.type === 'pickone' && <PickOnePlay question={question} onAnswer={onAnswer} />}
    </div>
  );
}

// ─── Nickname screen ──────────────────────────────────────────────────────────

function NicknameScreen({ quiz, onStart }: { quiz: CustomQuiz; onStart: (name: string) => void }) {
  const [name, setName] = useState<string>(() => {
    try { return localStorage.getItem('swipetake_player_name') ?? ''; } catch { return ''; }
  });

  const handleStart = () => {
    const n = name.trim() || 'Anonymous';
    try { localStorage.setItem('swipetake_player_name', n); } catch { /* noop */ }
    onStart(n);
  };

  return (
    <div className="dot-grid-bg" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div
        style={{
          background: '#fff',
          border: `2.5px solid ${DARK}`,
          borderRadius: '28px',
          padding: '32px 24px',
          boxShadow: `8px 8px 0px ${CORAL}`,
          width: '100%',
          maxWidth: '380px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📦</div>
        <div style={{ fontWeight: '900', fontSize: '22px', marginBottom: '4px' }}>{quiz.t}</div>
        <div style={{ color: '#888', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
          by {quiz.by}
        </div>
        <div
          style={{
            display: 'inline-block',
            background: CORAL,
            color: '#fff',
            padding: '3px 12px',
            borderRadius: '999px',
            fontWeight: '800',
            fontSize: '13px',
            border: `2px solid ${DARK}`,
            marginBottom: '28px',
          }}
        >
          {quiz.q.length} question{quiz.q.length !== 1 ? 's' : ''}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '800', fontSize: '12px', letterSpacing: '0.8px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>
            Your Nickname
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleStart(); }}
            placeholder="Enter your name..."
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '16px',
              border: `2px solid ${DARK}`,
              fontFamily: 'inherit',
              fontWeight: '600',
              fontSize: '16px',
              background: CREAM,
              outline: 'none',
              textAlign: 'center',
            }}
          />
        </div>

        <button
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '999px',
            border: `2.5px solid ${DARK}`,
            background: CORAL,
            color: '#fff',
            fontWeight: '900',
            fontSize: '17px',
            cursor: 'pointer',
            boxShadow: `4px 4px 0px ${DARK}`,
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `2px 2px 0px ${DARK}`; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0px ${DARK}`; }}
        >
          Let's Play! →
        </button>
      </div>
    </div>
  );
}

// ─── Main PlayPage ────────────────────────────────────────────────────────────

export function PlayPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const quiz: CustomQuiz | null = (location.state as { quiz?: CustomQuiz })?.quiz ?? null;

  const [phase, setPhase]     = useState<'nickname' | 'playing' | 'done'>('nickname');
  const [playerName, setPlayerName] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showReport, setShowReport] = useState(false);

  if (!quiz) {
    return (
      <div className="dot-grid-bg" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontWeight: '800', color: '#999' }}>No quiz loaded.</p>
        <button onClick={() => navigate('/scan')} style={{ padding: '14px 24px', borderRadius: '999px', border: `2.5px solid ${DARK}`, background: CORAL, color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
          Scan a QR Code
        </button>
      </div>
    );
  }

  if (phase === 'nickname') {
    return (
      <NicknameScreen
        quiz={quiz}
        onStart={(name) => { setPlayerName(name); setPhase('playing'); }}
      />
    );
  }

  if (phase === 'done') {
    // Should have navigated away — but just in case
    return null;
  }

  const question = quiz.q[currentIdx];
  const progress = `${currentIdx + 1} / ${quiz.q.length}`;

  const handleAnswer = (choice: number) => {
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);

    if (currentIdx + 1 >= quiz.q.length) {
      // Calculate score (only trivia questions contribute)
      const score = newAnswers.reduce((acc, ans, i) => {
        const q = quiz.q[i];
        if (q.type === 'trivia' && ans === q.correct) return acc + 1;
        return acc;
      }, 0);
      const triviaCount = quiz.q.filter((q) => q.type === 'trivia').length;

      const results: QuizResults = {
        v: 1,
        ref: hashQuiz(quiz),
        by: playerName,
        answers: newAnswers,
        score,
        total: triviaCount,
      };

      const encoded = encodeResults(results);

      navigate('/quiz-results', {
        state: {
          quiz,
          results,
          encodedResults: encoded,
          viewMode: 'player',
          playerName,
        },
      });
    } else {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 600);
    }
  };

  return (
    <div className="dot-grid-bg" style={{ minHeight: '100dvh', paddingBottom: '100px' }}>
      {/* Report modal */}
      {showReport && <ReportModal quiz={quiz} onClose={() => setShowReport(false)} />}

      {/* Progress header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: `2px solid #e8e4de`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: '900', fontSize: '14px', color: DARK }}>
            📦 {quiz.t}
          </div>
          <div style={{ fontSize: '12px', color: '#888', fontWeight: '700' }}>
            by {quiz.by}
          </div>
        </div>
        <div
          style={{
            background: CORAL,
            color: '#fff',
            padding: '6px 16px',
            borderRadius: '999px',
            fontWeight: '900',
            fontSize: '14px',
            border: `2px solid ${DARK}`,
            boxShadow: '2px 2px 0px ' + DARK,
          }}
        >
          {progress}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Report button — subtle but visible */}
          <button
            onClick={() => setShowReport(true)}
            style={{
              background: 'none',
              border: `1.5px solid #e8e4de`,
              borderRadius: '999px',
              padding: '5px 10px',
              color: '#bbb',
              fontWeight: '700',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '0.2px',
            }}
            title="Report this quiz"
          >
            ⚠️ Report
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#f5f2ee',
              border: `2px solid #e8e4de`,
              borderRadius: '999px',
              padding: '6px 12px',
              color: '#999',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: '#e8e4de' }}>
        <div
          style={{
            height: '100%',
            background: CORAL,
            width: `${((currentIdx + 1) / quiz.q.length) * 100}%`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Question card */}
      <div style={{ padding: '20px 16px' }}>
        <QuestionWrapper
          key={currentIdx}
          question={question}
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  );
}
