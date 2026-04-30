/**
 * QuizResultsPage — shown after completing a custom quiz.
 *
 * Two modes:
 *  - 'player': shows your score + a QR to share results back to creator
 *  - 'received': creator scanned results QR — shows player's answers
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { CustomQuiz, CustomQuestion, QuizResults } from '../types';

// ─── Quiz Report Modal ────────────────────────────────────────────────────────

const REPORT_REASONS = [
  'Offensive Content',
  'Bullying / Harassment',
  'Spam',
  'Other',
] as const;

function ReportModal({ quiz, onClose }: { quiz: CustomQuiz | null; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    try {
      const existing = JSON.parse(localStorage.getItem('swipetake_reports') ?? '[]');
      existing.push({
        quizTitle: quiz?.t ?? 'Unknown',
        quizBy: quiz?.by ?? 'Unknown',
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '24px', padding: '28px 24px', border: `2.5px solid ${DARK}`, boxShadow: `8px 8px 0px ${CORAL}`, width: '100%', maxWidth: '360px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontWeight: '900', fontSize: '18px', color: DARK }}>Reported. Thank you.</div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: '900', fontSize: '18px', color: DARK, marginBottom: '6px' }}>⚠️ Report this quiz?</div>
            <div style={{ color: '#888', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>Select a reason:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelected(reason)}
                  style={{ padding: '14px 16px', borderRadius: '14px', border: `2px solid ${selected === reason ? CORAL : '#e8e4de'}`, background: selected === reason ? CORAL + '18' : CREAM, color: selected === reason ? CORAL : '#666', fontWeight: '700', fontSize: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '999px', border: `2px solid #e8e4de`, background: CREAM, color: '#888', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!selected} style={{ flex: 1, padding: '14px', borderRadius: '999px', border: `2px solid ${DARK}`, background: selected ? CORAL : '#e8e4de', color: selected ? '#fff' : '#bbb', fontWeight: '900', fontSize: '14px', cursor: selected ? 'pointer' : 'not-allowed' }}>Submit</button>
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

// ─── Score animation ──────────────────────────────────────────────────────────

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const pct = total > 0 ? Math.round((score / total) * 100) : null;

  const emoji = pct === null ? '🎉' : pct === 100 ? '🏆' : pct >= 60 ? '🔥' : pct >= 40 ? '👏' : '💪';
  const message =
    pct === null ? 'Great job!' :
    pct === 100 ? 'Perfect score!' :
    pct >= 60   ? 'Well done!' :
    pct >= 40   ? 'Not bad!' :
    'Better luck next time!';

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        textAlign: 'center',
        marginBottom: '24px',
      }}
    >
      <div style={{ fontSize: '52px', marginBottom: '8px' }}>{emoji}</div>
      {total > 0 ? (
        <>
          <div style={{ fontWeight: '900', fontSize: '38px', color: DARK }}>
            {score} / {total}
          </div>
          <div style={{ fontWeight: '800', fontSize: '16px', color: '#888', marginTop: '4px' }}>
            Trivia Score
          </div>
        </>
      ) : (
        <div style={{ fontWeight: '900', fontSize: '26px', color: DARK }}>
          Quiz Complete!
        </div>
      )}
      <div
        style={{
          marginTop: '10px',
          display: 'inline-block',
          background: CORAL,
          color: '#fff',
          padding: '6px 18px',
          borderRadius: '999px',
          fontWeight: '800',
          fontSize: '15px',
          border: `2px solid ${DARK}`,
          boxShadow: '2px 2px 0px ' + DARK,
        }}
      >
        {message}
      </div>
    </div>
  );
}

// ─── Per-question breakdown ───────────────────────────────────────────────────

function AnswerBreakdown({ question, userAnswer, index }: {
  question: CustomQuestion;
  userAnswer: number;
  index: number;
}) {
  const isTrivia = question.type === 'trivia';
  const isCorrect = isTrivia && userAnswer === question.correct;
  const borderColor = isTrivia ? (isCorrect ? TEAL : CORAL) : PURPLE;

  let answerLabel = '';
  switch (question.type) {
    case 'wyr':
      answerLabel = userAnswer === 0 ? question.optionA : question.optionB;
      break;
    case 'hottake':
      answerLabel = userAnswer === 0 ? 'Agree' : 'Disagree';
      break;
    case 'trivia':
      answerLabel = question.options[userAnswer] ?? '—';
      break;
    case 'pickone':
      answerLabel = question.options[userAnswer] ?? '—';
      break;
  }

  return (
    <div
      style={{
        background: '#fff',
        border: `2.5px solid ${borderColor}`,
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '10px',
        boxShadow: `3px 3px 0px ${borderColor}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: borderColor,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '12px',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '800', fontSize: '13px', color: '#888', marginBottom: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {question.type === 'wyr' ? 'Would You Rather' : question.type === 'hottake' ? 'Hot Take' : question.type === 'trivia' ? 'Trivia' : 'Pick One'}
          </div>
          <div style={{ fontWeight: '700', fontSize: '14px', color: DARK, marginBottom: '8px' }}>
            {question.type === 'wyr' ? 'Choose between two options' :
             question.type === 'hottake' ? `"${question.statement}"` :
             question.type === 'trivia' ? question.question :
             question.prompt}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#aaa' }}>YOUR ANSWER:</span>
            <span
              style={{
                background: borderColor + '20',
                border: `2px solid ${borderColor}`,
                borderRadius: '999px',
                padding: '3px 12px',
                fontWeight: '800',
                fontSize: '13px',
                color: DARK,
              }}
            >
              {answerLabel}
            </span>
            {isTrivia && (
              <span style={{ fontSize: '16px' }}>{isCorrect ? '✅' : '❌'}</span>
            )}
          </div>

          {isTrivia && !isCorrect && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#aaa' }}>CORRECT:</span>
              <span
                style={{
                  background: TEAL + '20',
                  border: `2px solid ${TEAL}`,
                  borderRadius: '999px',
                  padding: '3px 12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  color: DARK,
                }}
              >
                {question.options[question.correct]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Results QR display ───────────────────────────────────────────────────────

function ResultsQR({ encoded, playerName }: { encoded: string; playerName: string }) {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: '999px',
          border: `2.5px solid ${DARK}`,
          background: PURPLE,
          color: '#fff',
          fontWeight: '900',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: `4px 4px 0px ${DARK}`,
          marginBottom: '12px',
        }}
        onPointerDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `2px 2px 0px ${DARK}`; }}
        onPointerUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0px ${DARK}`; }}
      >
        📤 Generate Results QR
      </button>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        border: `2.5px solid ${DARK}`,
        borderRadius: '24px',
        padding: '24px',
        boxShadow: `6px 6px 0px ${PURPLE}`,
        textAlign: 'center',
        marginBottom: '12px',
      }}
    >
      <div style={{ fontWeight: '900', fontSize: '16px', color: DARK, marginBottom: '12px' }}>
        Share your results!
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <div style={{ padding: '12px', background: '#fff', borderRadius: '12px', border: `2px solid ${DARK}` }}>
          <QRCodeSVG value={encoded} size={200} level="M" fgColor={DARK} bgColor="#fff" />
        </div>
      </div>
      <div style={{ color: '#888', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
        Results by <strong>{playerName}</strong>
      </div>
      <div
        style={{
          background: YELLOW + '33',
          border: `2px solid ${YELLOW}`,
          borderRadius: '12px',
          padding: '10px',
          color: '#7a6000',
          fontWeight: '700',
          fontSize: '13px',
        }}
      >
        📸 Let the quiz creator scan this!
      </div>
    </div>
  );
}

// ─── Received results view (creator scanned player's QR) ─────────────────────

function ReceivedResultsView({
  results,
  quiz,
}: {
  results: QuizResults;
  quiz: CustomQuiz | null;
}) {
  const navigate = useNavigate();

  return (
    <div className="dot-grid-bg" style={{ minHeight: '100dvh', paddingBottom: '100px' }}>
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: '800', color: '#999', cursor: 'pointer', marginBottom: '16px', padding: '0' }}
        >
          ← Back to Feed
        </button>

        <div
          style={{
            background: '#fff',
            border: `2.5px solid ${DARK}`,
            borderRadius: '24px',
            padding: '24px',
            boxShadow: `6px 6px 0px ${TEAL}`,
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
          <div style={{ fontWeight: '900', fontSize: '22px', color: DARK, marginBottom: '4px' }}>
            {results.by}'s Results
          </div>
          {results.total > 0 && (
            <div style={{ fontWeight: '800', fontSize: '28px', color: CORAL, margin: '8px 0' }}>
              {results.score} / {results.total}
            </div>
          )}
          <div style={{ color: '#888', fontWeight: '700', fontSize: '14px' }}>
            {results.answers.length} question{results.answers.length !== 1 ? 's' : ''} answered
          </div>
        </div>

        {quiz && results.answers.map((ans, i) => (
          quiz.q[i] ? (
            <AnswerBreakdown
              key={i}
              question={quiz.q[i]}
              userAnswer={ans}
              index={i}
            />
          ) : null
        ))}

        {!quiz && (
          <div
            style={{
              background: YELLOW + '33',
              border: `2px solid ${YELLOW}`,
              borderRadius: '16px',
              padding: '16px',
              color: '#7a6000',
              fontWeight: '700',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Quiz details not available — scan the original quiz QR for question context.
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '18px',
            borderRadius: '999px',
            border: `2.5px solid ${DARK}`,
            background: CORAL,
            color: '#fff',
            fontWeight: '900',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: `4px 4px 0px ${DARK}`,
          }}
        >
          ⚡ Back to Feed
        </button>
      </div>
    </div>
  );
}

// ─── Main QuizResultsPage ─────────────────────────────────────────────────────

export function QuizResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    quiz?: CustomQuiz;
    results?: QuizResults;
    encodedResults?: string;
    viewMode?: 'player' | 'received';
    playerName?: string;
  } | null;

  const quiz          = state?.quiz ?? null;
  const results       = state?.results ?? null;
  const encodedResults = state?.encodedResults ?? '';
  const viewMode      = state?.viewMode ?? 'player';
  const playerName    = state?.playerName ?? results?.by ?? 'You';
  const [showReport, setShowReport] = useState(false);

  if (!results) {
    return (
      <div className="dot-grid-bg" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontWeight: '800', color: '#999' }}>No results to display.</p>
        <button onClick={() => navigate('/')} style={{ padding: '14px 24px', borderRadius: '999px', border: `2.5px solid ${DARK}`, background: CORAL, color: '#fff', fontWeight: '800', cursor: 'pointer' }}>
          Back to Feed
        </button>
      </div>
    );
  }

  if (viewMode === 'received') {
    return <ReceivedResultsView results={results} quiz={quiz} />;
  }

  // Player view
  return (
    <div className="dot-grid-bg" style={{ minHeight: '100dvh', paddingBottom: '100px' }}>
      {showReport && <ReportModal quiz={quiz} onClose={() => setShowReport(false)} />}

      <div style={{ padding: '20px' }}>
        {/* Report button — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={() => setShowReport(true)}
            style={{ background: 'none', border: `1.5px solid #e8e4de`, borderRadius: '999px', padding: '5px 12px', color: '#bbb', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}
          >
            ⚠️ Report Quiz
          </button>
        </div>

        {/* Score summary card */}
        <div
          style={{
            background: '#fff',
            border: `2.5px solid ${DARK}`,
            borderRadius: '24px',
            padding: '28px 20px',
            boxShadow: `8px 8px 0px ${CORAL}`,
            marginBottom: '20px',
          }}
        >
          <ScoreBadge score={results.score} total={results.total} />
          {quiz && (
            <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '2px solid #f0ece6' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', color: DARK }}>{quiz.t}</div>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#888' }}>by {quiz.by}</div>
            </div>
          )}
        </div>

        {/* Per-question breakdown */}
        {quiz && results.answers.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: '900', fontSize: '16px', color: DARK, marginBottom: '12px' }}>
              Your Answers
            </div>
            {results.answers.map((ans, i) =>
              quiz.q[i] ? (
                <AnswerBreakdown
                  key={i}
                  question={quiz.q[i]}
                  userAnswer={ans}
                  index={i}
                />
              ) : null
            )}
          </div>
        )}

        {/* Share results QR */}
        {encodedResults && (
          <ResultsQR encoded={encodedResults} playerName={playerName} />
        )}

        {/* Back to feed */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '18px',
            borderRadius: '999px',
            border: `2.5px solid ${DARK}`,
            background: TEAL,
            color: '#fff',
            fontWeight: '900',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: `4px 4px 0px ${DARK}`,
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `2px 2px 0px ${DARK}`; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0px ${DARK}`; }}
        >
          ⚡ Back to Feed
        </button>
      </div>
    </div>
  );
}
