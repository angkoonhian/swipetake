/**
 * qr-codec.ts
 *
 * Encodes/decodes CustomQuiz and QuizResults to/from compact strings
 * suitable for embedding in QR codes.
 *
 * Pipeline: JSON → gzip (pako) → base64url
 */

import pako from 'pako';
import type { CustomQuiz, QuizResults } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToUint8(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padLen  = (4 - (padded.length % 4)) % 4;
  const standard = padded + '='.repeat(padLen);
  const binary   = atob(standard);
  const bytes    = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function compress(obj: unknown): string {
  const json    = JSON.stringify(obj);
  const encoded = new TextEncoder().encode(json);
  const gzipped = pako.gzip(encoded);
  return uint8ToBase64url(gzipped);
}

function decompress(str: string): unknown {
  const bytes     = base64urlToUint8(str);
  const inflated  = pako.ungzip(bytes);
  const json      = new TextDecoder().decode(inflated);
  return JSON.parse(json);
}

// ─── Type guards ─────────────────────────────────────────────────────────────

function looksLikeQuiz(data: unknown): data is CustomQuiz {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.v === 1 &&
    typeof d.t === 'string' &&
    typeof d.by === 'string' &&
    Array.isArray(d.q)
  );
}

function looksLikeResults(data: unknown): data is QuizResults {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.v === 1 &&
    typeof d.ref === 'string' &&
    typeof d.by === 'string' &&
    Array.isArray(d.answers) &&
    typeof d.score === 'number' &&
    typeof d.total === 'number'
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function encodeQuiz(quiz: CustomQuiz): string {
  return 'SQ1:' + compress(quiz);
}

export function decodeQuiz(encoded: string): CustomQuiz | null {
  try {
    const payload = encoded.startsWith('SQ1:') ? encoded.slice(4) : encoded;
    const data    = decompress(payload);
    return looksLikeQuiz(data) ? data : null;
  } catch {
    return null;
  }
}

export function encodeResults(results: QuizResults): string {
  return 'SR1:' + compress(results);
}

export function decodeResults(encoded: string): QuizResults | null {
  try {
    const payload = encoded.startsWith('SR1:') ? encoded.slice(4) : encoded;
    const data    = decompress(payload);
    return looksLikeResults(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Try to detect whether a raw QR scan string is a quiz or results payload.
 * Returns 'quiz' | 'results' | null.
 */
export function isQuizPayload(data: string): 'quiz' | 'results' | null {
  if (data.startsWith('SQ1:')) {
    const q = decodeQuiz(data);
    return q ? 'quiz' : null;
  }
  if (data.startsWith('SR1:')) {
    const r = decodeResults(data);
    return r ? 'results' : null;
  }
  // Try heuristic decode without prefix
  try {
    const decoded = decompress(data);
    if (looksLikeQuiz(decoded))    return 'quiz';
    if (looksLikeResults(decoded)) return 'results';
  } catch {
    // pass
  }
  return null;
}

/**
 * Simple djb2-ish hash of quiz content — used as QuizResults.ref
 */
export function hashQuiz(quiz: CustomQuiz): string {
  const str = JSON.stringify(quiz);
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h.toString(16);
}
