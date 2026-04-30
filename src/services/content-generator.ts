/**
 * content-generator.ts
 *
 * Calls Claude Haiku to generate fresh question batches in the background.
 * Returns an empty array on any failure — never crashes the app.
 *
 * NOTE: dangerouslyAllowBrowser: true is set here for convenience during
 * development / a Capacitor-bundled app. In a production web deployment,
 * route API calls through a server-side proxy instead so the key stays
 * off the client.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Question, WYRQuestion, HotTakeQuestion, TriviaQuestion, PickOneQuestion } from '../types';
import { isContentSafe } from './content-filter';

// Rate-limit: at most one batch call every 5 minutes per session.
const RATE_LIMIT_MS = 5 * 60 * 1000;
let lastBatchAt = 0;

const SYSTEM_PROMPT = `You are a content generator for a swipe-based opinion/trivia app. Generate exactly {count} questions in valid JSON array format.

Mix of types:
- "wyr" (Would You Rather): two genuinely difficult choices. Both options should be tempting or both terrible. NOT obvious answers.
- "hottake" (Hot Take): a controversial opinion statement that roughly splits people 40-60% or 50-50. Must be debatable, not objectively true/false.
- "trivia": a surprising factual question with 4 options where the correct answer is counterintuitive. Include which option index (0-3) is correct.
- "pickone": a "you can only keep one" prompt with 4 popular options where there's no clear winner.

NEVER generate content about: specific politicians, political parties, religious beliefs or groups, sexual content, self-harm, violence, racial or ethnic slurs, or content targeting specific ethnic groups.

Requirements:
- Questions must be engaging, fun, and make people want to share their answer
- Avoid anything offensive, political, religious, or NSFW
- Stats should look realistic (not all 50/50 — vary between 30/70 and 55/45)
- Each question needs a unique id (use format "ai-{timestamp}-{index}")

Return ONLY a valid JSON array, no other text. Format:
[
  { "id": "ai-1234-0", "type": "wyr", "optionA": "...", "optionB": "...", "statsA": 62, "statsB": 38 },
  { "id": "ai-1234-1", "type": "hottake", "statement": "...", "agreePercent": 57 },
  { "id": "ai-1234-2", "type": "trivia", "question": "...", "options": ["A","B","C","D"], "correct": 2, "percentCorrect": 34 },
  { "id": "ai-1234-3", "type": "pickone", "prompt": "...", "options": ["A","B","C","D"], "stats": [30, 28, 25, 17] }
]`;

function buildClient(): Anthropic | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiKey = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) return null;
  return new Anthropic({
    apiKey,
    // dangerouslyAllowBrowser: true is required when calling the Anthropic SDK
    // directly from browser code. Replace with a server-side proxy for production.
    dangerouslyAllowBrowser: true,
  });
}

function validateQuestion(q: unknown): q is Question {
  if (!q || typeof q !== 'object') return false;
  const obj = q as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.type !== 'string') return false;

  switch (obj.type) {
    case 'wyr':
      return (
        typeof obj.optionA === 'string' &&
        typeof obj.optionB === 'string' &&
        typeof obj.statsA === 'number' &&
        typeof obj.statsB === 'number'
      );
    case 'hottake':
      return typeof obj.statement === 'string' && typeof obj.agreePercent === 'number';
    case 'trivia':
      return (
        typeof obj.question === 'string' &&
        Array.isArray(obj.options) &&
        (obj.options as unknown[]).length === 4 &&
        typeof obj.correct === 'number' &&
        [0, 1, 2, 3].includes(obj.correct as number) &&
        typeof obj.percentCorrect === 'number'
      );
    case 'pickone':
      return (
        typeof obj.prompt === 'string' &&
        Array.isArray(obj.options) &&
        (obj.options as unknown[]).length === 4 &&
        Array.isArray(obj.stats) &&
        (obj.stats as unknown[]).length === 4
      );
    default:
      return false;
  }
}

function coerceQuestion(q: Record<string, unknown>): Question | null {
  if (!validateQuestion(q)) return null;
  // Ensure numeric fields are numbers (JSON can have them as strings)
  switch (q.type) {
    case 'wyr': {
      const w = q as WYRQuestion;
      return { ...w, statsA: Number(w.statsA), statsB: Number(w.statsB) };
    }
    case 'hottake': {
      const h = q as HotTakeQuestion;
      return { ...h, agreePercent: Number(h.agreePercent) };
    }
    case 'trivia': {
      const t = q as TriviaQuestion;
      return {
        ...t,
        correct: Number(t.correct) as 0 | 1 | 2 | 3,
        percentCorrect: Number(t.percentCorrect),
      };
    }
    case 'pickone': {
      const p = q as PickOneQuestion;
      return {
        ...p,
        stats: (p.stats as number[]).map(Number) as [number, number, number, number],
      };
    }
  }
  return null;
}

/** Extract all text fields from a question for safety scanning */
function questionTextFragments(q: Question): string[] {
  switch (q.type) {
    case 'wyr':     return [q.optionA, q.optionB];
    case 'hottake': return [q.statement];
    case 'trivia':  return [q.question, ...q.options];
    case 'pickone': return [q.prompt, ...q.options];
  }
}

async function parseResponse(text: string): Promise<Question[]> {
  // Strip possible markdown fences
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const parsed: unknown = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];
  const results: Question[] = [];
  for (const item of parsed) {
    const q = coerceQuestion(item as Record<string, unknown>);
    // Filter out any question that contains blocked content
    if (q && isContentSafe(...questionTextFragments(q))) {
      results.push(q);
    }
  }
  return results;
}

export async function generateBatch(count: number): Promise<Question[]> {
  const now = Date.now();
  if (now - lastBatchAt < RATE_LIMIT_MS) {
    return [];
  }

  const client = buildClient();
  if (!client) return [];

  lastBatchAt = now;

  const systemPrompt = SYSTEM_PROMPT.replace('{count}', String(count));
  const userMessage = `Generate ${count} fresh questions. Make them unique and engaging.`;

  // Attempt once, retry once on JSON parse failure, then give up silently.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') continue;

      const questions = await parseResponse(textBlock.text);
      if (questions.length > 0) return questions;
      // If empty/invalid JSON on first attempt, retry once
    } catch {
      // Network error, rate limit, auth error — fall through silently
      break;
    }
  }

  return [];
}
