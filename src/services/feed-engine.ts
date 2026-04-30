import { ContentQueue } from './content-queue';
import type { Question } from '../types';

const ANSWERED_KEY = 'swipetake_answered';
const SHUFFLE_KEY = 'swipetake_shuffle';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAnsweredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ANSWERED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function getShuffledOrder(): string[] {
  try {
    const raw = localStorage.getItem(SHUFFLE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveShuffledOrder(ids: string[]): void {
  localStorage.setItem(SHUFFLE_KEY, JSON.stringify(ids));
}

export function markAnswered(questionId: string): void {
  const answered = getAnsweredIds();
  answered.add(questionId);
  localStorage.setItem(ANSWERED_KEY, JSON.stringify([...answered]));
}

export function resetSession(): void {
  localStorage.removeItem(ANSWERED_KEY);
  localStorage.removeItem(SHUFFLE_KEY);
}

export class FeedEngine {
  private shuffledIds: string[];
  private answeredIds: Set<string>;
  private pointer: number = 0;
  /** Shared ContentQueue — exposes shouldRefill() for background generation. */
  readonly contentQueue: ContentQueue;

  constructor() {
    this.answeredIds = getAnsweredIds();
    this.contentQueue = new ContentQueue(this.answeredIds);

    const allQuestions = this.contentQueue.getAllQuestions();
    let stored = getShuffledOrder();

    // Rebuild shuffle order whenever the full question pool changes size.
    // We keep the existing order for questions already in it and append new ones.
    const storedSet = new Set(stored);
    const newIds = allQuestions.map((q) => q.id).filter((id) => !storedSet.has(id));
    if (newIds.length > 0) {
      stored = [...stored, ...shuffle(newIds)];
      saveShuffledOrder(stored);
    }
    if (stored.length === 0) {
      stored = shuffle(allQuestions.map((q) => q.id));
      saveShuffledOrder(stored);
    }
    this.shuffledIds = stored;

    // Find first unanswered
    this.pointer = this.shuffledIds.findIndex((id) => !this.answeredIds.has(id));
    if (this.pointer === -1) {
      // All answered — reset for a new cycle using entire current pool
      this.shuffledIds = shuffle(allQuestions.map((q) => q.id));
      saveShuffledOrder(this.shuffledIds);
      localStorage.removeItem(ANSWERED_KEY);
      this.answeredIds = new Set();
      this.pointer = 0;
    }
  }

  private idToQuestion(id: string): Question | undefined {
    return this.contentQueue.getAllQuestions().find((q) => q.id === id);
  }

  peek(offset: number = 0): Question | undefined {
    let count = 0;
    for (let i = this.pointer; i < this.shuffledIds.length; i++) {
      const id = this.shuffledIds[i];
      if (!this.answeredIds.has(id)) {
        if (count === offset) return this.idToQuestion(id);
        count++;
      }
    }
    return undefined;
  }

  current(): Question | undefined {
    return this.peek(0);
  }

  /**
   * Called when a new AI-generated batch arrives.
   * Appends new question IDs into the shuffle order so they surface naturally.
   */
  ingestNewQuestions(questions: Question[]): void {
    const existingSet = new Set(this.shuffledIds);
    const freshIds = questions.map((q) => q.id).filter((id) => !existingSet.has(id));
    if (freshIds.length === 0) return;
    // Insert the fresh ids at the current position so they interleave naturally.
    this.shuffledIds.splice(this.pointer + 1, 0, ...shuffle(freshIds));
    saveShuffledOrder(this.shuffledIds);
  }

  advance(): void {
    const cur = this.current();
    if (!cur) return;
    this.answeredIds.add(cur.id);
    this.contentQueue.markAnswered(cur.id);
    markAnswered(cur.id);
    this.pointer++;
    // Skip already-answered
    while (
      this.pointer < this.shuffledIds.length &&
      this.answeredIds.has(this.shuffledIds[this.pointer])
    ) {
      this.pointer++;
    }
    // If exhausted, reshuffle using the full current pool
    if (this.pointer >= this.shuffledIds.length) {
      const allQuestions = this.contentQueue.getAllQuestions();
      this.shuffledIds = shuffle(allQuestions.map((q) => q.id));
      saveShuffledOrder(this.shuffledIds);
      localStorage.removeItem(ANSWERED_KEY);
      this.answeredIds = new Set();
      this.pointer = 0;
    }
  }
}
