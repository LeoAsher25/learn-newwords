import { User } from "firebase/auth";
import {
  DocumentData,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { calculateNextReview, ReviewPerformance } from "@/lib/spacedRepetition";
import {
  Attempt,
  DueSetSummary,
  ResultData,
  RoundAttemptPayload,
  Session,
  SessionMetrics,
  SessionType,
  SetItem,
  SetStatus,
  Word,
  WordCreatePayload,
  WordPerformance,
  WordStatus,
} from "@/types";

function toDate(value: unknown, fallback: Date = new Date(0)): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return fallback;
}

function mapSetItem(id: string, data: DocumentData): SetItem {
  return {
    id,
    title: data.title ?? "",
    totalWords: data.totalWords ?? 0,
    status: (data.status as SetStatus) ?? "new",
    createdAt: toDate(data.createdAt, new Date()),
    updatedAt: toDate(data.updatedAt, new Date()),
    nextReviewAt: toDate(data.nextReviewAt, new Date()),
    lastPracticedAt: data.lastPracticedAt ? toDate(data.lastPracticedAt) : null,
    lastSessionId: typeof data.lastSessionId === "string" ? data.lastSessionId : null,
  };
}

function mapWord(id: string, data: DocumentData): Word {
  return {
    id,
    index: data.index ?? 0,
    meaning: data.meaning ?? "",
    answer: data.answer ?? "",
    status: (data.status as WordStatus) ?? "new",
    reviewLevel: typeof data.reviewLevel === "number" ? data.reviewLevel : 0,
    nextReviewAt: toDate(data.nextReviewAt, new Date()),
    lastReviewedAt: data.lastReviewedAt ? toDate(data.lastReviewedAt) : null,
    createdAt: toDate(data.createdAt, new Date()),
    updatedAt: toDate(data.updatedAt, new Date()),
  };
}

function mapSession(id: string, data: DocumentData): Session {
  return {
    id,
    type: (data.type as SessionType) ?? "review",
    startedAt: toDate(data.startedAt, new Date()),
    completedAt: data.completedAt ? toDate(data.completedAt) : null,
    totalRounds: typeof data.totalRounds === "number" ? data.totalRounds : 0,
    score: typeof data.score === "number" ? data.score : 0,
    usedHintCount: typeof data.usedHintCount === "number" ? data.usedHintCount : 0,
    wrongCount: typeof data.wrongCount === "number" ? data.wrongCount : 0,
  };
}

function mapAttempt(id: string, data: DocumentData): Attempt {
  return {
    id,
    wordId: data.wordId ?? "",
    round: typeof data.round === "number" ? data.round : 0,
    input: data.input ?? "",
    isCorrect: Boolean(data.isCorrect),
    usedHint: Boolean(data.usedHint),
    createdAt: toDate(data.createdAt, new Date()),
  };
}

function firestore() {
  return getFirebaseDb();
}

function userRef(userId: string) {
  return doc(firestore(), "users", userId);
}

function setsRef(userId: string) {
  return collection(firestore(), "users", userId, "sets");
}

function wordsRef(userId: string, setId: string) {
  return collection(firestore(), "users", userId, "sets", setId, "words");
}

function sessionsRef(userId: string, setId: string) {
  return collection(firestore(), "users", userId, "sets", setId, "sessions");
}

function attemptsRef(userId: string, setId: string, sessionId: string) {
  return collection(
    firestore(),
    "users",
    userId,
    "sets",
    setId,
    "sessions",
    sessionId,
    "attempts",
  );
}

export async function ensureUserDocument(user: User): Promise<void> {
  const creationTime = user.metadata.creationTime
    ? Timestamp.fromDate(new Date(user.metadata.creationTime))
    : serverTimestamp();
  await setDoc(
    userRef(user.uid),
    {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      updatedAt: serverTimestamp(),
      // Keep a stable createdAt value without requiring a blocking read.
      createdAt: creationTime,
    },
    { merge: true },
  );
}

export async function createSetWithWords(
  userId: string,
  title: string,
  words: WordCreatePayload[],
): Promise<string> {
  const setDocRef = doc(setsRef(userId));
  const batch = writeBatch(firestore());

  batch.set(setDocRef, {
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    totalWords: words.length,
    status: "new",
    nextReviewAt: Timestamp.fromDate(new Date()),
    lastPracticedAt: null,
    lastSessionId: null,
  });

  words.forEach((word) => {
    const wordDocRef = doc(wordsRef(userId, setDocRef.id));
    batch.set(wordDocRef, {
      index: word.index,
      meaning: word.meaning,
      answer: word.answer,
      status: "new",
      reviewLevel: 0,
      nextReviewAt: Timestamp.fromDate(new Date()),
      lastReviewedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return setDocRef.id;
}

export async function getSets(userId: string): Promise<SetItem[]> {
  const q = query(setsRef(userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapSetItem(item.id, item.data()));
}

export async function getDueSets(
  userId: string,
  now: Date = new Date(),
): Promise<SetItem[]> {
  const q = query(
    setsRef(userId),
    where("nextReviewAt", "<=", Timestamp.fromDate(now)),
    orderBy("nextReviewAt", "asc"),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapSetItem(item.id, item.data()));
}

export async function getSet(userId: string, setId: string): Promise<SetItem | null> {
  const snapshot = await getDoc(doc(firestore(), "users", userId, "sets", setId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapSetItem(snapshot.id, snapshot.data());
}

export async function getWords(userId: string, setId: string): Promise<Word[]> {
  const q = query(wordsRef(userId, setId), orderBy("index", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapWord(item.id, item.data()));
}

export async function getDueSetSummaries(
  userId: string,
  now: Date = new Date(),
): Promise<DueSetSummary[]> {
  const dueSets = await getDueSets(userId, now);

  const summaries = await Promise.all(
    dueSets.map(async (set) => {
      const words = await getWords(userId, set.id);
      const dueWords = words.filter((word) => word.nextReviewAt <= now).length;
      return { set, dueWords };
    }),
  );

  return summaries.filter((summary) => summary.dueWords > 0);
}

export async function createSession(
  userId: string,
  setId: string,
  type: SessionType,
  totalRounds: number,
): Promise<string> {
  const sessionDoc = await addDoc(sessionsRef(userId, setId), {
    type,
    startedAt: serverTimestamp(),
    completedAt: null,
    totalRounds,
    score: 0,
    usedHintCount: 0,
    wrongCount: 0,
  });

  return sessionDoc.id;
}

export async function saveRoundAttempts(
  userId: string,
  setId: string,
  sessionId: string,
  attempts: RoundAttemptPayload[],
): Promise<void> {
  const batch = writeBatch(firestore());

  attempts.forEach((attempt) => {
    const attemptDocRef = doc(attemptsRef(userId, setId, sessionId));
    batch.set(attemptDocRef, {
      ...attempt,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

function getNextWordUpdate(word: Word, performance: WordPerformance) {
  let status: WordStatus = word.status;
  let reviewLevel = word.reviewLevel;
  let reviewPerformance: ReviewPerformance = "correctClean";

  if (performance.hadWrong) {
    status = "weak";
    reviewLevel = Math.max(0, word.reviewLevel - 1);
    reviewPerformance = "wrong";
  } else if (performance.usedHint) {
    status = "learning";
    reviewPerformance = "usedHint";
  } else {
    status = "mastered";
    reviewLevel = word.reviewLevel + 1;
    reviewPerformance = "correctClean";
  }

  const nextReviewAt = calculateNextReview(word.reviewLevel, reviewPerformance);

  return {
    status,
    reviewLevel,
    nextReviewAt,
  };
}

function deriveSetStatus(wordStatuses: WordStatus[]): SetStatus {
  if (wordStatuses.every((status) => status === "mastered")) {
    return "completed";
  }

  if (wordStatuses.some((status) => status === "weak")) {
    return "reviewing";
  }

  return "learning";
}

export async function completeSession(
  userId: string,
  setId: string,
  sessionId: string,
  wordPerformances: WordPerformance[],
  metrics: SessionMetrics,
): Promise<void> {
  const words = await getWords(userId, setId);
  const performanceMap = new Map(
    wordPerformances.map((performance) => [performance.wordId, performance]),
  );

  const batch = writeBatch(firestore());
  const nextReviewDates: Date[] = [];
  const nextStatuses: WordStatus[] = [];

  words.forEach((word) => {
    const performance = performanceMap.get(word.id) ?? {
      wordId: word.id,
      hadWrong: false,
      usedHint: false,
    };

    const next = getNextWordUpdate(word, performance);
    nextReviewDates.push(next.nextReviewAt);
    nextStatuses.push(next.status);

    batch.update(doc(firestore(), "users", userId, "sets", setId, "words", word.id), {
      status: next.status,
      reviewLevel: next.reviewLevel,
      nextReviewAt: Timestamp.fromDate(next.nextReviewAt),
      lastReviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const setStatus = deriveSetStatus(nextStatuses);
  const minNextReviewAt = nextReviewDates.reduce((min, date) =>
    date < min ? date : min,
  );

  batch.update(doc(firestore(), "users", userId, "sets", setId), {
    status: setStatus,
    nextReviewAt: Timestamp.fromDate(minNextReviewAt),
    lastPracticedAt: serverTimestamp(),
    lastSessionId: sessionId,
    updatedAt: serverTimestamp(),
  });

  batch.update(doc(firestore(), "users", userId, "sets", setId, "sessions", sessionId), {
    completedAt: serverTimestamp(),
    score: metrics.score,
    wrongCount: metrics.wrongCount,
    usedHintCount: metrics.usedHintCount,
  });

  await batch.commit();
}

export async function getSession(
  userId: string,
  setId: string,
  sessionId: string,
): Promise<Session | null> {
  const snapshot = await getDoc(
    doc(firestore(), "users", userId, "sets", setId, "sessions", sessionId),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return mapSession(snapshot.id, snapshot.data());
}

export async function getAttempts(
  userId: string,
  setId: string,
  sessionId: string,
): Promise<Attempt[]> {
  const q = query(attemptsRef(userId, setId, sessionId), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapAttempt(item.id, item.data()));
}

export async function getLatestSessionId(
  userId: string,
  setId: string,
): Promise<string | null> {
  const q = query(sessionsRef(userId, setId), orderBy("startedAt", "desc"), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

export async function getResultData(
  userId: string,
  setId: string,
  sessionId: string,
): Promise<ResultData | null> {
  const [set, session, words, attempts] = await Promise.all([
    getSet(userId, setId),
    getSession(userId, setId, sessionId),
    getWords(userId, setId),
    getAttempts(userId, setId, sessionId),
  ]);

  if (!set || !session) {
    return null;
  }

  return {
    set,
    session,
    words,
    attempts,
  };
}
