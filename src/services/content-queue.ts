/**
 * content-queue.ts
 *
 * Manages a hybrid queue of pre-loaded + AI-generated questions.
 * AI-generated questions are persisted to localStorage under GENERATED_KEY.
 * Deduplication is id-based (plus a simple text-similarity check).
 */

import { questions as staticQuestions } from '../data/questions';
import type { Question } from '../types';

const GENERATED_KEY = 'swipetake_generated';
const REFILL_THRESHOLD = 15;

// ── persistence helpers ────────────────────────────────────────────────────

function loadGenerated(): Question[] {
  try {
    const raw = localStorage.getItem(GENERATED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Question[];
  } catch {
    return [];
  }
}

function saveGenerated(questions: Question[]): void {
  try {
    localStorage.setItem(GENERATED_KEY, JSON.stringify(questions));
  } catch {
    // localStorage full or unavailable — carry on
  }
}

// ── similarity / dedup ────────────────────────────────────────────────────

/**
 * Returns a "fingerprint" string for a question used in similarity checks.
 * We extract the main text content and lowercase/trim it.
 */
function fingerprint(q: Question): string {
  switch (q.type) {
    case 'wyr':
      return `${q.optionA}|${q.optionB}`.toLowerCase();
    case 'hottake':
      return q.statement.toLowerCase();
    case 'trivia':
      return q.question.toLowerCase();
    case 'pickone':
      return `${q.prompt}|${q.options.join('|')}`.toLowerCase();
  }
}

function tooSimilar(a: string, b: string): boolean {
  // Very cheap n-gram overlap check: if the shorter string is >70% contained
  // in the longer one, treat them as similar.
  if (a === b) return true;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  // Check whether 70% of 5-grams from shorter appear in longer
  if (shorter.length < 10) return longer.includes(shorter);
  const grams: Set<string> = new Set();
  for (let i = 0; i <= shorter.length - 5; i++) {
    grams.add(shorter.slice(i, i + 5));
  }
  let hits = 0;
  for (const g of grams) {
    if (longer.includes(g)) hits++;
  }
  return hits / grams.size > 0.7;
}

// ── ContentQueue ──────────────────────────────────────────────────────────

export class ContentQueue {
  private generated: Question[];
  /** All questions the user hasn't yet swiped on (static + generated). */
  private queue: Question[];
  /** IDs that have been answered this session (kept in sync with feed-engine). */
  private answeredIds: Set<string>;

  constructor(answeredIds: Set<string>) {
    this.answeredIds = answeredIds;
    this.generated = loadGenerated();
    this.queue = this.buildQueue();
  }

  private buildQueue(): Question[] {
    const all = [...staticQuestions, ...this.generated];
    return all.filter((q) => !this.answeredIds.has(q.id));
  }

  // ── public API ────────────────────────────────────────────────────────

  getAllQuestions(): Question[] {
    return [...staticQuestions, ...this.generated];
  }

  getRemainingCount(): number {
    return this.queue.filter((q) => !this.answeredIds.has(q.id)).length;
  }

  shouldRefill(): boolean {
    return this.getRemainingCount() < REFILL_THRESHOLD;
  }

  /** Mark a question as answered so it no longer counts as "remaining". */
  markAnswered(id: string): void {
    this.answeredIds.add(id);
  }

  /**
   * Append a batch of AI-generated questions.
   * Skips duplicates (by id) and near-duplicates (by text similarity).
   */
  appendQuestions(incoming: Question[]): void {
    const existingIds = new Set<string>([
      ...staticQuestions.map((q) => q.id),
      ...this.generated.map((q) => q.id),
    ]);
    const existingFingerprints = [
      ...staticQuestions.map(fingerprint),
      ...this.generated.map(fingerprint),
    ];

    for (const q of incoming) {
      if (existingIds.has(q.id)) continue;
      const fp = fingerprint(q);
      if (existingFingerprints.some((ef) => tooSimilar(ef, fp))) continue;

      this.generated.push(q);
      existingIds.add(q.id);
      existingFingerprints.push(fp);

      // Also add to the live queue if not yet answered
      if (!this.answeredIds.has(q.id)) {
        this.queue.push(q);
      }
    }

    saveGenerated(this.generated);
  }
}
