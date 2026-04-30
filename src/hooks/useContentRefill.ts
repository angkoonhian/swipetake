/**
 * useContentRefill.ts
 *
 * Invisible background hook that checks whether the question queue needs
 * topping up, and if so, calls Claude Haiku to generate a new batch.
 *
 * Returns the newly generated questions (or an empty array) so the caller
 * can also pass them to FeedEngine.ingestNewQuestions().
 *
 * No loading states, no UI feedback — users never know this is running.
 */

import { useCallback, useRef } from 'react';
import { generateBatch } from '../services/content-generator';
import type { ContentQueue } from '../services/content-queue';
import type { Question } from '../types';
import { FEATURES } from '../constants/features';

const BATCH_SIZE = 25;

export function useContentRefill(queue: ContentQueue) {
  // Guard: only one in-flight generation at a time
  const generatingRef = useRef(false);

  /**
   * Check if a refill is needed and, if so, generate one.
   * Returns the newly appended questions (empty array if nothing generated).
   */
  const triggerRefillIfNeeded = useCallback(async (): Promise<Question[]> => {
    // AI_CONTENT_REFILL is disabled — app uses only the 110 pre-loaded questions.
    if (!FEATURES.AI_CONTENT_REFILL) return [];

    if (generatingRef.current) return [];
    if (!queue.shouldRefill()) return [];

    generatingRef.current = true;
    try {
      const newQuestions = await generateBatch(BATCH_SIZE);
      if (newQuestions.length > 0) {
        queue.appendQuestions(newQuestions);
      }
      return newQuestions;
    } catch {
      return [];
    } finally {
      generatingRef.current = false;
    }
  }, [queue]);

  return { triggerRefillIfNeeded };
}
