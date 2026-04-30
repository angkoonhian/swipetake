export type QuestionType = 'wyr' | 'hottake' | 'trivia' | 'pickone';

export interface WYRQuestion {
  id: string;
  type: 'wyr';
  optionA: string;
  optionB: string;
  statsA: number;
  statsB: number;
}

export interface HotTakeQuestion {
  id: string;
  type: 'hottake';
  statement: string;
  agreePercent: number;
}

export interface TriviaQuestion {
  id: string;
  type: 'trivia';
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  percentCorrect: number;
}

export interface PickOneQuestion {
  id: string;
  type: 'pickone';
  prompt: string;
  options: [string, string, string, string];
  stats: [number, number, number, number];
}

export type Question = WYRQuestion | HotTakeQuestion | TriviaQuestion | PickOneQuestion;

export interface UserAnswer {
  questionId: string;
  userChoice: number; // index of chosen option (0 = A/agree, 1 = B/disagree, etc.)
  timestamp: number;
  isCorrect?: boolean; // for trivia
  agreedWithMajority?: boolean;
}

export interface PersonalityTraits {
  chaosScore: number;       // 0-100, 0=orderly, 100=chaotic
  contrarianScore: number;  // 0-100, 0=mainstream, 100=contrarian
  heartScore: number;       // 0-100, 0=head, 100=heart
  riskScore: number;        // 0-100, 0=safe, 100=risk-taker
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  streak: number;
  totalAnswers: number;
  contrarianScore: number;
  isUser?: boolean;
}

// ─── Custom Quiz Types ────────────────────────────────────────────────────────

export type CustomQuestion =
  | { type: 'wyr'; optionA: string; optionB: string }
  | { type: 'hottake'; statement: string }
  | { type: 'trivia'; question: string; options: string[]; correct: number }
  | { type: 'pickone'; prompt: string; options: string[] };

export interface CustomQuiz {
  v: 1;
  t: string;   // title
  by: string;  // creator name
  q: CustomQuestion[];
}

export interface QuizResults {
  v: 1;
  ref: string;    // hash of the quiz for matching
  by: string;     // player name
  answers: number[];
  score: number;
  total: number;
}
