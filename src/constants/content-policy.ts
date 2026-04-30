/**
 * content-policy.ts
 *
 * App content rating and community guidelines.
 * Used in store submissions and surfaced to quiz creators.
 */

export const CONTENT_RATING = {
  apple: '12+',
  google: 'Teen',
  reason: 'Opinion-based content, ad-supported, user-generated quiz sharing',
} as const;

export const CONTENT_GUIDELINES =
  "Keep it fun! No hate speech, bullying, sexual content, or targeting specific people. " +
  "Quizzes that violate these guidelines may be reported.";
