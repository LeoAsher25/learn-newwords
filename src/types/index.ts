export type SetStatus = "new" | "learning" | "reviewing" | "completed";

export type WordStatus = "new" | "learning" | "weak" | "mastered";

export type SessionType = "learn" | "review";

export type ReviewDueMode = "precise_ms" | "cross_day" | "fixed_time";

export interface ReviewScheduleSettings {
  dueMode: ReviewDueMode;
  timezone: string;
  // Reserved for future notification scheduling flow.
  fixedReviewTime: string | null;
}

export interface Word {
  id: string;
  index: number;
  meaning: string;
  answer: string;
  examples: string[];
  status: WordStatus;
  reviewLevel: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordInput {
  meaning: string;
  answer: string;
  examples: string[];
}

export interface WordCreatePayload {
  index: number;
  meaning: string;
  answer: string;
  examples: string[];
}

export interface SetItem {
  id: string;
  title: string;
  totalWords: number;
  status: SetStatus;
  createdAt: Date;
  updatedAt: Date;
  nextReviewAt: Date;
  lastPracticedAt: Date | null;
  lastSessionId: string | null;
}

export interface Session {
  id: string;
  type: SessionType;
  startedAt: Date;
  completedAt: Date | null;
  totalRounds: number;
  score: number;
  usedHintCount: number;
  wrongCount: number;
}

export interface Attempt {
  id: string;
  wordId: string;
  round: number;
  input: string;
  isCorrect: boolean;
  usedHint: boolean;
  createdAt: Date;
}

export interface RoundAttemptPayload {
  wordId: string;
  round: number;
  input: string;
  isCorrect: boolean;
  usedHint: boolean;
}

export interface WordPerformance {
  wordId: string;
  hadWrong: boolean;
  usedHint: boolean;
}

export interface SessionMetrics {
  score: number;
  wrongCount: number;
  usedHintCount: number;
}

export interface DueSetSummary {
  set: SetItem;
  dueWords: number;
}

export interface ResultData {
  session: Session;
  set: SetItem;
  words: Word[];
  attempts: Attempt[];
}
