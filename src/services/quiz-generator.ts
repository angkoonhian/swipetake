/**
 * quiz-generator.ts
 *
 * AI-powered custom quiz question generation via Claude Haiku.
 * Mirrors the pattern from content-generator.ts.
 *
 * Free tier: 3 AI generations per day (tracked in localStorage).
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CustomQuestion } from '../types';
import { isContentSafe } from './content-filter';

const FREE_DAILY_KEY = 'swipetake_quiz_gen_daily';
const MAX_FREE_PER_DAY = 3;

// ─── Rate limiting helpers ────────────────────────────────────────────────────

interface DailyRecord {
  date: string;  // YYYY-MM-DD
  count: number;
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getRemainingGenerations(): number {
  try {
    const raw = localStorage.getItem(FREE_DAILY_KEY);
    if (!raw) return MAX_FREE_PER_DAY;
    const rec: DailyRecord = JSON.parse(raw);
    if (rec.date !== getTodayKey()) return MAX_FREE_PER_DAY;
    return Math.max(0, MAX_FREE_PER_DAY - rec.count);
  } catch {
    return MAX_FREE_PER_DAY;
  }
}

function consumeGeneration(): boolean {
  const remaining = getRemainingGenerations();
  if (remaining <= 0) return false;

  const today = getTodayKey();
  try {
    const raw = localStorage.getItem(FREE_DAILY_KEY);
    let rec: DailyRecord = { date: today, count: 0 };
    if (raw) {
      const parsed: DailyRecord = JSON.parse(raw);
      rec = parsed.date === today ? parsed : { date: today, count: 0 };
    }
    rec.count += 1;
    localStorage.setItem(FREE_DAILY_KEY, JSON.stringify(rec));
    return true;
  } catch {
    return false;
  }
}

// ─── Client builder ───────────────────────────────────────────────────────────

function buildClient(): Anthropic | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKey = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) return null;
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// ─── Response parsing ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a quiz creator for a fun social trivia app. Generate exactly {count} quiz questions about the topic '{topic}'.

Mix multiple question types in this order of preference: trivia, wyr, pickone, hottake.
Make them fun, surprising, and challenging.

NEVER generate content about: specific politicians, political parties, religious beliefs or groups, sexual content, self-harm, violence, racial or ethnic slurs, or content targeting specific ethnic groups.

Return ONLY a valid JSON array with no extra text. Each item must match one of these shapes:
[
  { "type": "trivia", "question": "...", "options": ["A","B","C","D"], "correct": 2 },
  { "type": "wyr", "optionA": "...", "optionB": "..." },
  { "type": "pickone", "prompt": "...", "options": ["A","B","C","D"] },
  { "type": "hottake", "statement": "..." }
]

Rules:
- For trivia: correct is a 0-3 index into options. Include exactly 4 options.
- For pickone: include exactly 4 options.
- For wyr: two genuinely hard choices, both appealing or both terrible.
- For hottake: must be genuinely debatable, not obviously true/false.
- Keep every question topic-relevant.`;

function validateCustomQuestion(q: unknown): q is CustomQuestion {
  if (!q || typeof q !== 'object') return false;
  const obj = q as Record<string, unknown>;
  if (typeof obj.type !== 'string') return false;

  switch (obj.type) {
    case 'wyr':
      return typeof obj.optionA === 'string' && typeof obj.optionB === 'string';
    case 'hottake':
      return typeof obj.statement === 'string';
    case 'trivia':
      return (
        typeof obj.question === 'string' &&
        Array.isArray(obj.options) &&
        (obj.options as unknown[]).length === 4 &&
        typeof obj.correct === 'number' &&
        [0, 1, 2, 3].includes(obj.correct as number)
      );
    case 'pickone':
      return (
        typeof obj.prompt === 'string' &&
        Array.isArray(obj.options) &&
        (obj.options as unknown[]).length === 4
      );
    default:
      return false;
  }
}

/** Extract all text fields from a custom question for safety scanning */
function customQuestionTextFragments(q: CustomQuestion): string[] {
  switch (q.type) {
    case 'wyr':     return [q.optionA, q.optionB];
    case 'hottake': return [q.statement];
    case 'trivia':  return [q.question, ...q.options];
    case 'pickone': return [q.prompt, ...q.options];
  }
}

function parseQuestions(text: string): CustomQuestion[] {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];
  const results: CustomQuestion[] = [];
  for (const item of parsed) {
    if (validateCustomQuestion(item)) {
      // normalise numeric correct index
      const q: CustomQuestion = item.type === 'trivia'
        ? { ...item, correct: Number(item.correct) }
        : item;
      // Remove any question containing blocked content
      if (isContentSafe(...customQuestionTextFragments(q))) {
        results.push(q);
      }
    }
  }
  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateCustomQuiz(topic: string, count: number): Promise<CustomQuestion[]> {
  // Check limit BEFORE calling the API, but only CONSUME after a successful result.
  // This prevents deducting a slot when the API call fails or returns nothing valid.
  const remaining = getRemainingGenerations();
  if (remaining <= 0) return [];

  const client = buildClient();
  if (!client) return [];

  const system  = SYSTEM_PROMPT.replace('{count}', String(count)).replace('{topic}', topic);
  const message = `Generate ${count} quiz questions about: ${topic}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: message }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') continue;

      const questions = parseQuestions(textBlock.text);
      if (questions.length > 0) {
        // Only consume a generation slot once we have valid questions
        consumeGeneration();
        return questions;
      }
      // Empty/filtered result on first attempt — retry without consuming a slot
    } catch {
      break;
    }
  }

  // API failed or returned nothing usable — do NOT consume a slot
  return [];
}
