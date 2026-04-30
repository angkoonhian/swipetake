import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { CustomQuiz, CustomQuestion } from '../types';
import { encodeQuiz } from '../services/qr-codec';
import { generateCustomQuiz, getRemainingGenerations } from '../services/quiz-generator';
import { CONTENT_GUIDELINES } from '../constants/content-policy';

const QR_WARN_THRESHOLD  = 2000; // chars — warn user
const QR_BLOCK_THRESHOLD = 3500; // chars — block QR generation

function getQrSizeStatus(encoded: string): { status: 'ok' | 'large' | 'too-large'; label: string } {
  const len = encoded.length;
  if (len > QR_BLOCK_THRESHOLD) return { status: 'too-large', label: `QR size: Too Large ❌ (${len} chars)` };
  if (len > QR_WARN_THRESHOLD)  return { status: 'large',    label: `QR size: Large ⚠️ (${len} chars)` };
  return { status: 'ok', label: `QR size: OK ✅ (${len} chars)` };
}

const CORAL  = '#FF6B35';
const PURPLE = '#7B2D8B';
const TEAL   = '#00C9A7';
const YELLOW = '#FFD23F';
const DARK   = '#1a1a1a';
const CREAM  = '#FAF7F2';

const TYPE_LABELS: { type: CustomQuestion['type']; label: string; emoji: string; color: string }[] = [
  { type: 'wyr',     label: 'WYR',      emoji: '🤔', color: PURPLE },
  { type: 'hottake', label: 'Hot Take', emoji: '🔥', color: CORAL  },
  { type: 'trivia',  label: 'Trivia',   emoji: '🧠', color: YELLOW },
  { type: 'pickone', label: 'Pick One', emoji: '👆', color: TEAL   },
];

function makeBlankQuestion(type: CustomQuestion['type']): CustomQuestion {
  switch (type) {
    case 'wyr':     return { type, optionA: '', optionB: '' };
    case 'hottake': return { type, statement: '' };
    case 'trivia':  return { type, question: '', options: ['', '', '', ''], correct: 0 };
    case 'pickone': return { type, prompt: '', options: ['', '', '', ''] };
  }
}

// ─── Individual question card editor ─────────────────────────────────────────

interface QuestionEditorProps {
  question: CustomQuestion;
  index: number;
  total: number;
  onChange: (q: CustomQuestion) => void;
  onDelete: () => void;
}

function QuestionEditor({ question, index, total, onChange, onDelete }: QuestionEditorProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '14px',
    border: `2px solid ${DARK}`,
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '15px',
    background: CREAM,
    color: DARK,
    outline: 'none',
    marginBottom: '8px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.8px',
    color: '#888',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    display: 'block',
  };

  return (
    <div
      style={{
        background: '#fff',
        border: `2.5px solid ${DARK}`,
        borderRadius: '20px',
        padding: '18px',
        marginBottom: '14px',
        boxShadow: '4px 4px 0px ' + DARK,
        position: 'relative',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontWeight: '800', fontSize: '13px', color: '#bbb' }}>
          Q{index + 1} / {total}
        </span>

        {/* Type pill selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TYPE_LABELS.map(({ type, label, color }) => (
            <button
              key={type}
              onClick={() => onChange(makeBlankQuestion(type))}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: `2px solid ${DARK}`,
                background: question.type === type ? color : CREAM,
                color: question.type === type ? (type === 'trivia' ? DARK : '#fff') : '#888',
                fontWeight: '800',
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: question.type === type ? '2px 2px 0px ' + DARK : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            color: '#ccc',
          }}
          title="Delete question"
        >
          🗑️
        </button>
      </div>

      {/* Dynamic fields */}
      {question.type === 'wyr' && (
        <>
          <label style={labelStyle}>Option A</label>
          <input
            style={inputStyle}
            value={question.optionA}
            placeholder="Would you rather..."
            onChange={(e) => onChange({ ...question, optionA: e.target.value })}
          />
          <label style={labelStyle}>Option B</label>
          <input
            style={inputStyle}
            value={question.optionB}
            placeholder="Or would you rather..."
            onChange={(e) => onChange({ ...question, optionB: e.target.value })}
          />
        </>
      )}

      {question.type === 'hottake' && (
        <>
          <label style={labelStyle}>Statement</label>
          <input
            style={inputStyle}
            value={question.statement}
            placeholder="A bold opinion to agree or disagree with..."
            onChange={(e) => onChange({ ...question, statement: e.target.value })}
          />
        </>
      )}

      {question.type === 'trivia' && (
        <>
          <label style={labelStyle}>Question</label>
          <input
            style={inputStyle}
            value={question.question}
            placeholder="Your trivia question..."
            onChange={(e) => onChange({ ...question, question: e.target.value })}
          />
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="radio"
                name={`correct-${index}`}
                checked={question.correct === i}
                onChange={() => onChange({ ...question, correct: i })}
                style={{ accentColor: TEAL, width: '18px', height: '18px', flexShrink: 0 }}
              />
              <input
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                value={question.options[i] ?? ''}
                placeholder={`Option ${letter}`}
                onChange={(e) => {
                  const opts = [...question.options];
                  opts[i] = e.target.value;
                  onChange({ ...question, options: opts });
                }}
              />
              {question.correct === i && (
                <span style={{ fontSize: '16px', flexShrink: 0 }}>✅</span>
              )}
            </div>
          ))}
          <p style={{ fontSize: '11px', color: '#aaa', fontWeight: '600', marginTop: '4px' }}>
            Select the radio button next to the correct answer.
          </p>
        </>
      )}

      {question.type === 'pickone' && (
        <>
          <label style={labelStyle}>Prompt</label>
          <input
            style={inputStyle}
            value={question.prompt}
            placeholder="You can only pick one..."
            onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          />
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <input
              key={i}
              style={inputStyle}
              value={question.options[i] ?? ''}
              placeholder={`Option ${letter}`}
              onChange={(e) => {
                const opts = [...question.options];
                opts[i] = e.target.value;
                onChange({ ...question, options: opts });
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ─── QR display view ──────────────────────────────────────────────────────────

interface QRDisplayProps {
  quiz: CustomQuiz;
  onBack: () => void;
}

function QRDisplay({ quiz, onBack }: QRDisplayProps) {
  const encoded = encodeQuiz(quiz);

  return (
    <div
      className="dot-grid-bg"
      style={{ minHeight: '100dvh', padding: '24px 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          fontSize: '15px',
          fontWeight: '800',
          color: '#999',
          cursor: 'pointer',
          marginBottom: '20px',
          padding: '0',
        }}
      >
        ← Back
      </button>

      <div
        style={{
          background: '#fff',
          border: `2.5px solid ${DARK}`,
          borderRadius: '28px',
          padding: '28px',
          boxShadow: `8px 8px 0px ${CORAL}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '380px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#bbb', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>
          SwipeTake Quiz
        </div>

        <div
          style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '16px',
            border: `2px solid ${DARK}`,
            boxShadow: `4px 4px 0px ${PURPLE}`,
            marginBottom: '20px',
          }}
        >
          <QRCodeSVG
            value={encoded}
            size={220}
            level="M"
            fgColor={DARK}
            bgColor="#fff"
          />
        </div>

        <div
          style={{
            fontSize: '22px',
            fontWeight: '900',
            color: DARK,
            textAlign: 'center',
            marginBottom: '6px',
          }}
        >
          {quiz.t}
        </div>
        <div style={{ fontSize: '14px', color: '#888', fontWeight: '700', marginBottom: '4px' }}>
          by {quiz.by}
        </div>
        <div
          style={{
            background: CORAL,
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '999px',
            fontWeight: '800',
            fontSize: '13px',
            border: `2px solid ${DARK}`,
            boxShadow: '2px 2px 0px ' + DARK,
            marginBottom: '20px',
          }}
        >
          {quiz.q.length} question{quiz.q.length !== 1 ? 's' : ''}
        </div>

        <div
          style={{
            background: YELLOW + '33',
            border: `2px solid ${YELLOW}`,
            borderRadius: '14px',
            padding: '12px 16px',
            textAlign: 'center',
            color: '#7a6000',
            fontWeight: '700',
            fontSize: '14px',
          }}
        >
          📸 Screenshot to Share!
        </div>
      </div>

      <button
        onClick={onBack}
        style={{
          marginTop: '28px',
          padding: '18px 32px',
          borderRadius: '999px',
          border: `2.5px solid ${DARK}`,
          background: PURPLE,
          color: '#fff',
          fontWeight: '900',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: `4px 4px 0px ${DARK}`,
          width: '100%',
          maxWidth: '380px',
        }}
        onPointerDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `2px 2px 0px ${DARK}`; }}
        onPointerUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0px ${DARK}`; }}
      >
        ✏️ Create Another
      </button>
    </div>
  );
}

// ─── Main CreatePage ──────────────────────────────────────────────────────────

export function CreatePage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<'single' | 'pack'>('pack');
  const [title, setTitle] = useState('');
  const [creatorName, setCreatorName] = useState<string>(() => {
    try { return localStorage.getItem('swipetake_creator_name') ?? ''; } catch { return ''; }
  });
  const [questions, setQuestions] = useState<CustomQuestion[]>([makeBlankQuestion('trivia')]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState('');
  const [showQR, setShowQR]     = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const remainingAI = getRemainingGenerations();

  // Live QR size indicator — computed from current quiz state
  const qrSizeStatus = useMemo(() => {
    const previewQuiz: CustomQuiz = {
      v: 1,
      t: title.trim() || (mode === 'single' ? 'Quick Question' : 'My Quiz Pack'),
      by: creatorName.trim() || 'Anonymous',
      q: questions,
    };
    const encoded = encodeQuiz(previewQuiz);
    return getQrSizeStatus(encoded);
  }, [title, creatorName, mode, questions]);

  const saveCreatorName = (name: string) => {
    setCreatorName(name);
    try { localStorage.setItem('swipetake_creator_name', name); } catch { /* noop */ }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, makeBlankQuestion('trivia')]);
  };

  const handleChangeQuestion = useCallback((index: number, q: CustomQuestion) => {
    setQuestions((prev) => prev.map((existing, i) => (i === index ? q : existing)));
  }, []);

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) { setAiError('Enter a topic first.'); return; }
    if (remainingAI <= 0) { setAiError('No AI generations left today.'); return; }
    setAiLoading(true);
    setAiError('');
    try {
      const count = mode === 'single' ? 1 : 5;
      const generated = await generateCustomQuiz(aiTopic.trim(), count);
      if (generated.length === 0) {
        setAiError('AI generation failed. Check your API key or try again.');
      } else {
        setQuestions(generated);
        if (!title) setTitle(aiTopic.trim());
      }
    } catch {
      setAiError('Something went wrong. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateQR = () => {
    setErrorMsg('');

    const name = creatorName.trim() || 'Anonymous';
    const t    = title.trim() || (mode === 'single' ? 'Quick Question' : 'My Quiz Pack');

    // Validate questions are filled out
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === 'wyr' && (!q.optionA.trim() || !q.optionB.trim())) {
        setErrorMsg(`Q${i + 1}: Both WYR options are required.`); return;
      }
      if (q.type === 'hottake' && !q.statement.trim()) {
        setErrorMsg(`Q${i + 1}: Hot Take statement is required.`); return;
      }
      if (q.type === 'trivia') {
        if (!q.question.trim()) { setErrorMsg(`Q${i + 1}: Trivia question text is required.`); return; }
        const filled = q.options.filter((o) => o.trim());
        if (filled.length < 2) { setErrorMsg(`Q${i + 1}: Trivia needs at least 2 options.`); return; }
      }
      if (q.type === 'pickone') {
        if (!q.prompt.trim()) { setErrorMsg(`Q${i + 1}: Pick One prompt is required.`); return; }
        const filled = q.options.filter((o) => o.trim());
        if (filled.length < 2) { setErrorMsg(`Q${i + 1}: Pick One needs at least 2 options.`); return; }
      }
    }

    // QR size validation
    if (qrSizeStatus.status === 'too-large') {
      setErrorMsg('Quiz is too large for QR code. Please shorten your questions or remove some.');
      return;
    }
    if (qrSizeStatus.status === 'large') {
      // Just warn — don't block. Error message area shows the size status anyway.
      setErrorMsg('This quiz might be too large for some QR scanners. Try shorter questions or fewer questions.');
      // Do NOT return — allow the user to proceed despite the warning.
    }

    saveCreatorName(name);
    void t; // used in the quiz object built below
    setShowQR(true);
  };

  const quiz: CustomQuiz = {
    v: 1,
    t: title.trim() || (mode === 'single' ? 'Quick Question' : 'My Quiz Pack'),
    by: creatorName.trim() || 'Anonymous',
    q: questions,
  };

  if (showQR) {
    return <QRDisplay quiz={quiz} onBack={() => setShowQR(false)} />;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '16px',
    border: `2px solid ${DARK}`,
    fontFamily: 'inherit',
    fontWeight: '600',
    fontSize: '15px',
    background: '#fff',
    color: DARK,
    outline: 'none',
    marginBottom: '12px',
  };

  return (
    <div
      className="dot-grid-bg"
      style={{ minHeight: '100dvh', paddingBottom: '100px' }}
    >
      {/* Header */}
      <header style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999', padding: '0' }}
        >
          ←
        </button>
        <span style={{ fontWeight: '900', fontSize: '22px', color: DARK }}>
          ➕ Create Quiz
        </span>
      </header>

      <div style={{ padding: '20px' }}>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            background: '#fff',
            border: `2.5px solid ${DARK}`,
            borderRadius: '999px',
            padding: '4px',
            marginBottom: '20px',
            boxShadow: '3px 3px 0px ' + DARK,
          }}
        >
          {(['single', 'pack'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '999px',
                border: 'none',
                background: mode === m ? CORAL : 'transparent',
                color: mode === m ? '#fff' : '#999',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mode === m ? '2px 2px 0px ' + DARK : 'none',
              }}
            >
              {m === 'single' ? '1️⃣ Single Question' : '📦 Quiz Pack'}
            </button>
          ))}
        </div>

        {/* Title input (pack mode) */}
        {mode === 'pack' && (
          <>
            <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px', color: '#888', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>
              Quiz Title
            </label>
            <input
              style={inputStyle}
              value={title}
              placeholder="E.g. 'Space Facts Challenge'"
              onChange={(e) => setTitle(e.target.value)}
            />
          </>
        )}

        {/* Creator name */}
        <label style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.8px', color: '#888', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>
          Your Name
        </label>
        <input
          style={inputStyle}
          value={creatorName}
          placeholder="Creator name (saved for next time)"
          onChange={(e) => setCreatorName(e.target.value)}
          onBlur={() => saveCreatorName(creatorName)}
        />

        {/* AI Generate section */}
        <div
          style={{
            background: '#fff',
            border: `2.5px solid ${DARK}`,
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '3px 3px 0px ' + TEAL,
          }}
        >
          <div style={{ fontWeight: '900', fontSize: '15px', color: DARK, marginBottom: '10px' }}>
            🤖 AI Generate
            <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '700', color: '#aaa' }}>
              ({remainingAI} left today)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              value={aiTopic}
              placeholder="Topic e.g. 'space', 'movies', 'history'"
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAIGenerate(); }}
            />
            <button
              onClick={handleAIGenerate}
              disabled={aiLoading || remainingAI <= 0}
              style={{
                padding: '14px 18px',
                borderRadius: '14px',
                border: `2px solid ${DARK}`,
                background: aiLoading || remainingAI <= 0 ? '#e8e4de' : CORAL,
                color: aiLoading || remainingAI <= 0 ? '#bbb' : '#fff',
                fontWeight: '800',
                fontSize: '14px',
                cursor: aiLoading || remainingAI <= 0 ? 'not-allowed' : 'pointer',
                boxShadow: aiLoading || remainingAI <= 0 ? 'none' : '2px 2px 0px ' + DARK,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {aiLoading ? '⏳' : '✨ Go'}
            </button>
          </div>
          {aiError && (
            <p style={{ color: CORAL, fontSize: '13px', fontWeight: '700', marginTop: '8px' }}>
              {aiError}
            </p>
          )}
        </div>

        {/* Question cards */}
        <div style={{ marginBottom: '12px', fontWeight: '900', fontSize: '17px', color: DARK }}>
          Questions ({questions.length})
        </div>

        {questions.map((q, i) => (
          <QuestionEditor
            key={i}
            question={q}
            index={i}
            total={questions.length}
            onChange={(updated) => handleChangeQuestion(i, updated)}
            onDelete={() => handleDeleteQuestion(i)}
          />
        ))}

        {/* Add question button */}
        <button
          onClick={handleAddQuestion}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            border: `2.5px dashed ${PURPLE}`,
            background: PURPLE + '10',
            color: PURPLE,
            fontWeight: '800',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '24px',
          }}
        >
          + Add Question
        </button>

        {/* Preview section */}
        {questions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: '900', fontSize: '15px', color: '#888', marginBottom: '10px', letterSpacing: '0.5px' }}>
              PREVIEW — Q1
            </div>
            <div
              style={{
                background: '#fff',
                border: `2.5px solid ${DARK}`,
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '4px 4px 0px ' + YELLOW,
                opacity: 0.9,
              }}
            >
              <PreviewCard question={questions[0]} />
            </div>
          </div>
        )}

        {/* Content guidelines */}
        <div
          style={{
            fontSize: '12px',
            color: '#aaa',
            fontWeight: '600',
            lineHeight: '1.5',
            marginBottom: '10px',
            padding: '10px 14px',
            background: '#f9f6f1',
            borderRadius: '12px',
            border: '1.5px solid #ede9e1',
          }}
        >
          📋 {CONTENT_GUIDELINES}
        </div>

        {/* QR size indicator */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: '700',
            marginBottom: '12px',
            color: qrSizeStatus.status === 'ok' ? '#007a65' : qrSizeStatus.status === 'large' ? '#b36000' : '#cc3d00',
          }}
        >
          {qrSizeStatus.label}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div
            style={{
              background: CORAL + '20',
              border: `2px solid ${CORAL}`,
              borderRadius: '14px',
              padding: '12px 16px',
              color: '#cc3d00',
              fontWeight: '700',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Create QR button */}
        <button
          onClick={handleCreateQR}
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: '999px',
            border: `2.5px solid ${DARK}`,
            background: CORAL,
            color: '#fff',
            fontWeight: '900',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: `5px 5px 0px ${DARK}`,
            letterSpacing: '0.3px',
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `3px 3px 0px ${DARK}`; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `5px 5px 0px ${DARK}`; }}
        >
          📲 Create QR Code
        </button>
      </div>
    </div>
  );
}

// ─── Simple preview card ──────────────────────────────────────────────────────

function PreviewCard({ question }: { question: CustomQuestion }) {
  if (question.type === 'wyr') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: '900', fontSize: '18px', marginBottom: '16px' }}>Pick one — no middle ground.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '14px', borderRadius: '16px', background: CORAL + '18', border: `2px solid ${DARK}`, fontWeight: '700' }}>
            {question.optionA || 'Option A...'}
          </div>
          <div style={{ fontWeight: '900', color: DARK }}>VS</div>
          <div style={{ padding: '14px', borderRadius: '16px', background: PURPLE + '18', border: `2px solid ${DARK}`, fontWeight: '700' }}>
            {question.optionB || 'Option B...'}
          </div>
        </div>
      </div>
    );
  }
  if (question.type === 'hottake') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontStyle: 'italic', fontWeight: '900', fontSize: '18px', marginBottom: '16px' }}>
          "{question.statement || 'Your statement here...'}"
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, padding: '14px', borderRadius: '16px', background: CORAL + '18', border: `2px solid ${DARK}`, fontWeight: '800', textAlign: 'center', color: CORAL }}>🔥 AGREE</div>
          <div style={{ flex: 1, padding: '14px', borderRadius: '16px', background: TEAL + '18', border: `2px solid ${DARK}`, fontWeight: '800', textAlign: 'center', color: TEAL }}>❄️ NOPE</div>
        </div>
      </div>
    );
  }
  if (question.type === 'trivia') {
    return (
      <div>
        <p style={{ fontWeight: '900', fontSize: '17px', marginBottom: '14px' }}>
          {question.question || 'Your trivia question...'}
        </p>
        {['A', 'B', 'C', 'D'].map((l, i) => (
          <div key={i} style={{ padding: '10px 14px', borderRadius: '12px', border: `2px solid ${DARK}`, marginBottom: '6px', fontWeight: '700', fontSize: '14px', background: CREAM, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: CORAL + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px', flexShrink: 0 }}>{l}</span>
            {question.options[i] || `Option ${l}...`}
          </div>
        ))}
      </div>
    );
  }
  if (question.type === 'pickone') {
    return (
      <div>
        <p style={{ fontWeight: '900', fontSize: '18px', marginBottom: '14px', textAlign: 'center' }}>
          {question.prompt || 'Your prompt...'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[CORAL, PURPLE, TEAL, YELLOW].map((color, i) => (
            <div key={i} style={{ padding: '14px', borderRadius: '14px', background: color + '18', border: `2px solid ${DARK}`, fontWeight: '700', textAlign: 'center', fontSize: '14px' }}>
              {question.options[i] || `Option ${i + 1}`}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
