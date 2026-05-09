/**
 * Seed synthetic Firestore data for QA / UI testing (skips real-time waits).
 *
 * Prerequisites:
 * - Firebase Admin credentials (one of):
 *   - GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
 *   - FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
 * - Same GCP project as NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 *
 * Usage:
 *   SEED_USER_ID=<firebase_auth_uid> npm run seed:test-data
 *   SEED_USER_ID=<uid> npm run seed:test-data -- --clean   # remove previous [Seed] sets first
 *
 * Creates fixed doc IDs under users/{uid}/sets/seed_* so you can re-run safely with --clean.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  Firestore,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";

const SEED_SET_PREFIX = "seed_";

type WordSeed = {
  index: number;
  meaning: string;
  answer: string;
  status: "new" | "learning" | "weak" | "mastered";
  reviewLevel: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
};

type SetSeed = {
  id: string;
  title: string;
  status: "new" | "learning" | "reviewing" | "completed";
  createdDaysAgo: number;
  nextReviewAt: Date;
  lastPracticedAt: Date | null;
  words: WordSeed[];
  session?: {
    id: string;
    completedHoursAgo: number;
    metrics: {
      score: number;
      wrongCount: number;
      usedHintCount: number;
      totalRounds: number;
    };
    attempts: Array<{
      wordIndex: number;
      round: number;
      input: string;
      isCorrect: boolean;
      usedHint: boolean;
    }>;
  };
};

function parseArgs(): { clean: boolean } {
  const clean = process.argv.includes("--clean");
  return { clean };
}

function initAdmin(): Firestore {
  if (getApps().length === 0) {
    const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (jsonRaw) {
      const trimmed = jsonRaw.trim();
      const isJsonContent = trimmed.startsWith("{");
      if (!isJsonContent) {
        const absolute = resolve(trimmed);
        const json = JSON.parse(readFileSync(absolute, "utf8")) as Parameters<
          typeof cert
        >[0];
        initializeApp({ credential: cert(json) });
        return getFirestore();
      }

      initializeApp({
        credential: cert(JSON.parse(trimmed) as Parameters<typeof cert>[0]),
      });
    } else if (credPath) {
      const absolute = resolve(credPath);
      const json = JSON.parse(readFileSync(absolute, "utf8")) as Parameters<
        typeof cert
      >[0];
      initializeApp({ credential: cert(json) });
    } else {
      throw new Error(
        "Set GOOGLE_APPLICATION_CREDENTIALS (path to JSON) or FIREBASE_SERVICE_ACCOUNT_JSON.",
      );
    }
  }

  return getFirestore();
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

function formatDateForSeedTitle(value: Date): string {
  const day = `${value.getDate()}`.padStart(2, "0");
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

function toSeedIdFromDate(value: Date): string {
  const day = `${value.getDate()}`.padStart(2, "0");
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const year = value.getFullYear();
  return `${SEED_SET_PREFIX}${year}${month}${day}`;
}

function addDays(base: Date, days: number): Date {
  const value = new Date(base);
  value.setDate(value.getDate() + days);
  return value;
}

function addHours(base: Date, hours: number): Date {
  const value = new Date(base);
  value.setHours(value.getHours() + hours);
  return value;
}

const WORD_BANK: Array<{ meaning: string; answer: string }> = [
  { meaning: "apple", answer: "táo" },
  { meaning: "book", answer: "sách" },
  { meaning: "cat", answer: "mèo" },
  { meaning: "dog", answer: "chó" },
  { meaning: "egg", answer: "trứng" },
  { meaning: "fish", answer: "cá" },
  { meaning: "garden", answer: "khu vườn" },
  { meaning: "house", answer: "ngôi nhà" },
  { meaning: "ice", answer: "băng" },
  { meaning: "jacket", answer: "áo khoác" },
  { meaning: "kite", answer: "diều" },
  { meaning: "lion", answer: "sư tử" },
  { meaning: "moon", answer: "mặt trăng" },
  { meaning: "nest", answer: "cái tổ" },
  { meaning: "orange", answer: "màu cam" },
  { meaning: "paper", answer: "giấy" },
  { meaning: "queen", answer: "nữ hoàng" },
  { meaning: "river", answer: "sông" },
  { meaning: "sun", answer: "mặt trời" },
  { meaning: "tree", answer: "cây" },
];

function buildScenarios(now: Date): SetSeed[] {
  const minimumSets = 40;
  const scenarios: SetSeed[] = [];

  for (let createdDaysAgo = 0; createdDaysAgo < minimumSets; createdDaysAgo += 1) {
    const createdAt = addDays(now, -createdDaysAgo);
    const id = toSeedIdFromDate(createdAt);
    const title = `[Seed] ${formatDateForSeedTitle(createdAt)}`;

    const wordCount = createdDaysAgo % 8 === 0 ? 10 : 5;
    const mode = createdDaysAgo % 4;

    let status: SetSeed["status"] = "learning";
    let nextReviewAt = addDays(now, 1);
    let lastPracticedAt: Date | null = addDays(createdAt, 1);

    if (createdDaysAgo === 0) {
      status = "new";
      nextReviewAt = now;
      lastPracticedAt = null;
    } else if (mode === 0) {
      status = "reviewing";
      nextReviewAt = addDays(now, -(createdDaysAgo % 6) - 1);
      lastPracticedAt = addDays(now, -(createdDaysAgo % 5) - 2);
    } else if (mode === 1) {
      status = "reviewing";
      nextReviewAt = addHours(now, -((createdDaysAgo % 5) + 1));
      lastPracticedAt = addDays(now, -((createdDaysAgo % 4) + 1));
    } else if (mode === 2) {
      status = "learning";
      nextReviewAt = addDays(now, (createdDaysAgo % 7) + 1);
      lastPracticedAt = addHours(now, -((createdDaysAgo % 10) + 2));
    } else {
      status = "completed";
      nextReviewAt = addDays(now, 30 + (createdDaysAgo % 15));
      lastPracticedAt = addDays(now, -((createdDaysAgo % 7) + 1));
    }

    const words: WordSeed[] = Array.from({ length: wordCount }, (_, index) => {
      const dict = WORD_BANK[(createdDaysAgo + index) % WORD_BANK.length];
      let wordStatus: WordSeed["status"] = "learning";
      let reviewLevel = 1;
      let wordNextReviewAt = nextReviewAt;
      let lastReviewedAt = lastPracticedAt;

      if (createdDaysAgo === 0) {
        wordStatus = "new";
        reviewLevel = 0;
        wordNextReviewAt = now;
        lastReviewedAt = null;
      } else if (mode === 0 || mode === 1) {
        wordStatus = index % 3 === 0 ? "weak" : "learning";
        reviewLevel = wordStatus === "weak" ? 0 : 1;
        wordNextReviewAt = addHours(nextReviewAt, -index);
      } else if (mode === 2) {
        wordStatus = index % 2 === 0 ? "learning" : "mastered";
        reviewLevel = wordStatus === "mastered" ? 2 : 1;
        wordNextReviewAt = addHours(nextReviewAt, index);
      } else {
        wordStatus = "mastered";
        reviewLevel = 4;
        wordNextReviewAt = addHours(nextReviewAt, index);
      }

      return {
        index,
        meaning: `${dict.meaning}_${createdDaysAgo}_${index}`,
        answer: `${dict.answer}_${createdDaysAgo}_${index}`,
        status: wordStatus,
        reviewLevel,
        nextReviewAt: wordNextReviewAt,
        lastReviewedAt,
      };
    });

    const hasSession = createdDaysAgo > 0 && createdDaysAgo % 3 === 0;
    const session = hasSession
      ? {
          id: `sess_${id}`,
          completedHoursAgo: createdDaysAgo * 24 - 2,
          metrics: {
            score: Math.max(1, 10 - (createdDaysAgo % 6)),
            wrongCount: createdDaysAgo % 4,
            usedHintCount: createdDaysAgo % 3,
            totalRounds: 3,
          },
          attempts: [
            {
              wordIndex: 0,
              round: 0,
              input: words[0].answer,
              isCorrect: true,
              usedHint: false,
            },
            {
              wordIndex: 1,
              round: 0,
              input: `${words[1].answer}_wrong`,
              isCorrect: false,
              usedHint: createdDaysAgo % 2 === 0,
            },
          ],
        }
      : undefined;

    scenarios.push({
      id,
      title,
      status,
      createdDaysAgo,
      nextReviewAt,
      lastPracticedAt,
      words,
      session,
    });
  }

  return scenarios;
}

function assertNoDuplicates(scenarios: SetSeed[]): void {
  const setIds = new Set<string>();
  const setTitles = new Set<string>();

  for (const scenario of scenarios) {
    if (setIds.has(scenario.id)) {
      throw new Error(`Duplicate set id detected: ${scenario.id}`);
    }
    setIds.add(scenario.id);

    if (setTitles.has(scenario.title)) {
      throw new Error(`Duplicate set title detected: ${scenario.title}`);
    }
    setTitles.add(scenario.title);

    const wordKeySet = new Set<string>();
    for (const word of scenario.words) {
      const key = `${word.index}|${word.meaning}|${word.answer}`;
      if (wordKeySet.has(key)) {
        throw new Error(
          `Duplicate word in set ${scenario.id}: index=${word.index}, meaning=${word.meaning}, answer=${word.answer}`,
        );
      }
      wordKeySet.add(key);
    }
  }
}

async function deleteAttemptsForSession(
  db: Firestore,
  userId: string,
  setId: string,
  sessionId: string,
): Promise<void> {
  const attemptsRef = db.collection(
    `users/${userId}/sets/${setId}/sessions/${sessionId}/attempts`,
  );
  const snap = await attemptsRef.get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  if (!snap.empty) {
    await batch.commit();
  }
}

async function deleteSetTree(db: Firestore, userId: string, setId: string): Promise<void> {
  const sessionsSnap = await db
    .collection(`users/${userId}/sets/${setId}/sessions`)
    .get();

  for (const s of sessionsSnap.docs) {
    await deleteAttemptsForSession(db, userId, setId, s.id);
    await s.ref.delete();
  }

  const wordsSnap = await db.collection(`users/${userId}/sets/${setId}/words`).get();
  const wb = db.batch();
  wordsSnap.docs.forEach((d) => wb.delete(d.ref));
  if (!wordsSnap.empty) {
    await wb.commit();
  }

  await db.doc(`users/${userId}/sets/${setId}`).delete();
}

async function seedSet(db: Firestore, userId: string, scenario: SetSeed, now: Date): Promise<void> {
  const setRef = db.doc(`users/${userId}/sets/${scenario.id}`);
  const createdAt = daysAgo(scenario.createdDaysAgo);
  const updatedAt = now;

  let lastSessionId: string | null = null;
  if (scenario.session) {
    lastSessionId = scenario.session.id;
  }

  await setRef.set({
    title: scenario.title,
    totalWords: scenario.words.length,
    status: scenario.status,
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(updatedAt),
    nextReviewAt: Timestamp.fromDate(scenario.nextReviewAt),
    lastPracticedAt: scenario.lastPracticedAt
      ? Timestamp.fromDate(scenario.lastPracticedAt)
      : null,
    lastSessionId,
  });

  const wordIdByIndex: string[] = [];
  for (const w of scenario.words) {
    const wordRef = setRef.collection("words").doc();
    wordIdByIndex[w.index] = wordRef.id;
    await wordRef.set({
      index: w.index,
      meaning: w.meaning,
      answer: w.answer,
      status: w.status,
      reviewLevel: w.reviewLevel,
      nextReviewAt: Timestamp.fromDate(w.nextReviewAt),
      lastReviewedAt: w.lastReviewedAt
        ? Timestamp.fromDate(w.lastReviewedAt)
        : null,
      createdAt: Timestamp.fromDate(createdAt),
      updatedAt: Timestamp.fromDate(updatedAt),
    });
  }

  if (scenario.session) {
    const { session } = scenario;
    const completedAt = hoursAgo(session.completedHoursAgo);
    const startedAt = hoursAgo(session.completedHoursAgo + 1);
    const sessionRef = setRef.collection("sessions").doc(session.id);

    await sessionRef.set({
      type: "review",
      startedAt: Timestamp.fromDate(startedAt),
      completedAt: Timestamp.fromDate(completedAt),
      totalRounds: session.metrics.totalRounds,
      score: session.metrics.score,
      wrongCount: session.metrics.wrongCount,
      usedHintCount: session.metrics.usedHintCount,
    });

    for (const a of session.attempts) {
      const wordId = wordIdByIndex[a.wordIndex];
      if (!wordId) {
        throw new Error(`Missing word index ${a.wordIndex} for set ${scenario.id}`);
      }
      const attemptRef = sessionRef.collection("attempts").doc();
      await attemptRef.set({
        wordId,
        round: a.round,
        input: a.input,
        isCorrect: a.isCorrect,
        usedHint: a.usedHint,
        createdAt: Timestamp.fromDate(completedAt),
      });
    }
  }
}

async function main(): Promise<void> {
  const userId = process.env.SEED_USER_ID?.trim();
  if (!userId) {
    throw new Error("Set SEED_USER_ID to the Firebase Auth uid (e.g. your email/password test account).");
  }

  const { clean } = parseArgs();
  const db = initAdmin();
  const now = new Date();
  const scenarios = buildScenarios(now);
  assertNoDuplicates(scenarios);

  if (clean) {
    for (const s of scenarios) {
      await deleteSetTree(db, userId, s.id);
    }
    console.log(`Removed previous seed sets under users/${userId}/sets/seed_*`);
  }

  for (const scenario of scenarios) {
    await seedSet(db, userId, scenario, now);
    console.log(`Seeded ${scenario.id}: ${scenario.title}`);
  }

  console.log(`Done. Open the app logged in as uid=${userId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
