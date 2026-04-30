import type { UserAnswer, PersonalityTraits } from '../types';

const ANSWERS_KEY = 'swipetake_user_answers';
const STREAK_KEY = 'swipetake_streak';

// ─── Persistence ────────────────────────────────────────────────────────────

export function saveAnswer(answer: UserAnswer): void {
  const existing = getAnswers();
  existing.push(answer);
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(existing));
}

export function getAnswers(): UserAnswer[] {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserAnswer[];
  } catch {
    return [];
  }
}

export function getTotalAnswered(): number {
  return getAnswers().length;
}

// ─── Streak ─────────────────────────────────────────────────────────────────

interface StreakData {
  current: number;
  lastDate: string; // ISO date string (date only)
}

export function getStreakData(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, lastDate: '' };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { current: 0, lastDate: '' };
  }
}

export function updateStreak(): number {
  const today = new Date().toISOString().split('T')[0];
  const data = getStreakData();

  if (data.lastDate === today) return data.current;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = data.lastDate === yesterdayStr ? data.current + 1 : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ current: newStreak, lastDate: today }));
  return newStreak;
}

// ─── Personality Traits ──────────────────────────────────────────────────────

// Question IDs tagged for trait analysis
// chaotic = absurd/weird choices tagged
// contrarian = agreeing/disagreeing with majority
// heart = emotional choice
// risk = risky choice

const CHAOTIC_A_IDS = new Set([
  'wyr-001', 'wyr-002', 'wyr-005', 'wyr-009', 'wyr-021',
]);
const HEART_A_IDS = new Set([
  'wyr-007', 'wyr-020', 'wyr-024', 'wyr-030',
]);
const RISK_A_IDS = new Set([
  'wyr-006', 'wyr-009', 'wyr-015', 'wyr-019',
]);

export function calculatePersonality(): PersonalityTraits {
  const answers = getAnswers();
  if (answers.length === 0) {
    return { chaosScore: 50, contrarianScore: 50, heartScore: 50, riskScore: 50 };
  }

  let chaosPoints = 0;
  let chaosTotal = 0;
  let contrarianPoints = 0;
  let heartPoints = 0;
  let heartTotal = 0;
  let riskPoints = 0;
  let riskTotal = 0;

  for (const ans of answers) {
    // Contrarian: chose minority option
    if (ans.agreedWithMajority === false) {
      contrarianPoints++;
    }

    // Chaotic: chose "chaotic" option
    if (CHAOTIC_A_IDS.has(ans.questionId)) {
      chaosTotal++;
      if (ans.userChoice === 0) chaosPoints++;
    }

    // Heart: chose emotional option
    if (HEART_A_IDS.has(ans.questionId)) {
      heartTotal++;
      if (ans.userChoice === 0) heartPoints++;
    }

    // Risk: chose risky option
    if (RISK_A_IDS.has(ans.questionId)) {
      riskTotal++;
      if (ans.userChoice === 0) riskPoints++;
    }
  }

  const contrarianScore = Math.round((contrarianPoints / answers.length) * 100);
  const chaosScore = chaosTotal > 0 ? Math.round((chaosPoints / chaosTotal) * 100) : 50;
  const heartScore = heartTotal > 0 ? Math.round((heartPoints / heartTotal) * 100) : 50;
  const riskScore = riskTotal > 0 ? Math.round((riskPoints / riskTotal) * 100) : 50;

  return { chaosScore, contrarianScore, heartScore, riskScore };
}

export function generatePersonalitySummary(traits: PersonalityTraits): string {
  const { chaosScore, contrarianScore, heartScore, riskScore } = traits;

  const parts: string[] = [];

  if (contrarianScore > 60) {
    parts.push('You\'re a contrarian at heart — you naturally gravitate toward the road less traveled, even when you know the crowd might be right.');
  } else if (contrarianScore < 30) {
    parts.push('You run with the pack — and that\'s not weakness. You understand social consensus and know when to go with the flow.');
  } else {
    parts.push('You\'re independently minded — you agree with the majority when it makes sense, but you\'re not afraid to break rank.');
  }

  if (chaosScore > 60) {
    parts.push('You\'re drawn to the absurd and the unknown. Routine bores you. You\'d rather regret something wild than play it safe and wonder.');
  } else if (chaosScore < 40) {
    parts.push('You value structure and predictability. You know that systems and habits are what actually get things done.');
  }

  if (heartScore > 60) {
    parts.push('When it comes down to it, you lead with your heart. Logic takes a back seat when emotions are on the line.');
  } else if (heartScore < 40) {
    parts.push('You\'re a rational operator. Feelings are data — you process them, then decide. That\'s a rare skill.');
  }

  if (riskScore > 60) {
    parts.push('You have a high tolerance for uncertainty. You\'re the kind of person who bets on themselves.');
  } else if (riskScore < 40) {
    parts.push('You\'re a calculated player. You don\'t avoid risk — you price it in and act accordingly.');
  }

  return parts.join(' ');
}
