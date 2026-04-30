/**
 * Feature flags — set to false to disable AI-powered features.
 * Set to true once the Claude API integration is ready for production.
 */
export const FEATURES = {
  AI_CONTENT_REFILL:  false,
  AI_QUIZ_GENERATION: false,
  AI_PERSONALITY:     false,
} as const;
