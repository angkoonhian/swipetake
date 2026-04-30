/**
 * content-filter.ts
 *
 * Client-side blocklist filter for AI-generated content.
 * Catches content the AI system prompt might miss.
 *
 * Categories blocked:
 *  - Explicit politics (party names, prominent politician names)
 *  - Religious groups / beliefs
 *  - Sexual acts / explicit body parts
 *  - Racial / ethnic slurs
 *  - Self-harm / violence references
 */

// ─── Blocklist ────────────────────────────────────────────────────────────────

const BLOCKED_PATTERNS: RegExp[] = [
  // Political parties
  /\b(republican|democrat|gop|labour|conservative party|liberal party|maga)\b/i,

  // Prominent politicians (US + international)
  /\b(trump|biden|obama|clinton|harris|desantis|pelosi|mcconnell|aoc|ocasio.cortez|bernie sanders|elizabeth warren|putin|xi jinping|kim jong|zelensky|erdogan|modi|boris johnson|macron|merkel)\b/i,

  // Religious targeting
  /\b(islam|muslim|christian|christianity|catholic|jew|jewish|judaism|hindu|hinduism|buddhist|buddhism|sikh|sikhism|atheist|atheism|god is|allah is|jesus is)\b/i,

  // Sexual content
  /\b(sex|sexual|porn|pornography|nude|naked|genitalia|penis|vagina|breast|nipple|orgasm|masturbat|erotic|fetish|rape|molest)\b/i,

  // Racial / ethnic slurs — using partial matches to catch variations
  /\b(nigger|nigga|faggot|fag\b|dyke|spic|chink|gook|kike|wetback|cracker|redneck as a slur|towelhead|raghead|coon\b|beaner|tranny as slur)\b/i,

  // Self-harm / violence
  /\b(suicide|suicidal|self.harm|self harm|cut yourself|kill yourself|kys\b|shoot yourself|bomb|terrorist|terrorism|genocide|ethnic cleansing)\b/i,
];

// ─── Public API ───────────────────────────────────────────────────────────────

export interface FilterResult {
  safe: boolean;
  /** Same as input when safe; may be returned as empty string when unsafe */
  cleaned: string;
  /** Which category triggered the block, for logging */
  reason?: string;
}

/**
 * Check a piece of text against the content blocklist.
 *
 * @param text  The text to check (question, statement, option, etc.)
 * @returns     { safe: true, cleaned: text } if OK,
 *              { safe: false, cleaned: '' } if blocked.
 */
export function filterContent(text: string): FilterResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        cleaned: '',
        reason: pattern.source.slice(0, 60),
      };
    }
  }
  return { safe: true, cleaned: text };
}

/**
 * Returns true if ALL text fragments in the array pass the content filter.
 * Short-circuits on the first violation.
 */
export function isContentSafe(...fragments: string[]): boolean {
  return fragments.every((f) => filterContent(f).safe);
}
