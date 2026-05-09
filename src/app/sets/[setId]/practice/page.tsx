"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import AuthGuard from "@/components/AuthGuard";
import { BackButton } from "@/components/BackButton";
import HintButton from "@/components/HintButton";
import LoadingState from "@/components/LoadingState";
import PracticeTable, { PracticePhase } from "@/components/PracticeTable";
import { useAuth } from "@/lib/auth";
import {
  completeSession,
  createSession,
  getSet,
  getWords,
  saveRoundAttempts,
} from "@/lib/firestore";
import { isAnswerCorrect } from "@/lib/normalizeAnswer";
import { generatePracticeOrders } from "@/lib/practice";
import { RoundAttemptPayload, SetItem, SessionMetrics, Word } from "@/types";

const TOTAL_ROUNDS = 3;

function PracticeContent() {
  const params = useParams<{ setId: string }>();
  const setId = params.setId;

  const { user } = useAuth();
  const router = useRouter();

  const [setItem, setSetItem] = useState<SetItem | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"learn" | "recall">("learn");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>("filling");
  const [wrongMap, setWrongMap] = useState<Record<string, boolean>>({});
  const [lastCheckMap, setLastCheckMap] = useState<Record<string, boolean>>({});
  const [hintedRoundMap, setHintedRoundMap] = useState<Record<string, boolean>>(
    {},
  );
  const [revealedWordId, setRevealedWordId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  const orders = useMemo(
    () => generatePracticeOrders(words.length),
    [words.length],
  );
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const wrongAccumulatorRef = useRef<Record<string, boolean>>({});
  const hintAccumulatorRef = useRef<Record<string, boolean>>({});
  const metricsRef = useRef({
    totalChecks: 0,
    correctChecks: 0,
    wrongCount: 0,
    usedHintCount: 0,
  });
  const { register, setValue, getValues, reset, control } = useForm<{
    inputs: Record<string, string>;
  }>({
    defaultValues: { inputs: {} },
  });
  const inputs = useWatch({ control, name: "inputs" });
  const safeInputs = useMemo(() => inputs ?? {}, [inputs]);

  useEffect(() => {
    async function loadData() {
      if (!user || !setId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [nextSet, nextWords] = await Promise.all([
          getSet(user.uid, setId),
          getWords(user.uid, setId),
        ]);

        if (!nextSet || nextWords.length === 0) {
          setError("Không tìm thấy set hoặc dữ liệu từ vựng.");
          return;
        }

        setSetItem(nextSet);
        setWords(nextWords);
      } catch {
        setError("Không thể tải dữ liệu luyện tập.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [setId, user]);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const orderedWordIds = useMemo(() => {
    const indexMap = new Map(words.map((word) => [word.index, word.id]));
    const currentOrder = orders[roundIndex] ?? [];

    return currentOrder
      .map((index) => indexMap.get(index))
      .filter((wordId): wordId is string => Boolean(wordId));
  }, [orders, roundIndex, words]);

  const activeWordId = useMemo(() => {
    if (phase === "fixing") {
      return orderedWordIds.find((wordId) => wrongMap[wordId]) ?? null;
    }

    for (let i = 0; i < orderedWordIds.length; i++) {
      const wordId = orderedWordIds[i];
      let priorFilled = true;

      for (let j = 0; j < i; j++) {
        if ((safeInputs[orderedWordIds[j]] ?? "").trim().length === 0) {
          priorFilled = false;
          break;
        }
      }

      if (!priorFilled) {
        continue;
      }

      if ((safeInputs[wordId] ?? "").trim().length === 0) {
        return wordId;
      }
    }

    return null;
  }, [phase, orderedWordIds, safeInputs, wrongMap]);

  const allInputsFilled = useMemo(
    () =>
      orderedWordIds.length > 0 &&
      orderedWordIds.every(
        (wordId) => (safeInputs[wordId] ?? "").trim().length > 0,
      ),
    [orderedWordIds, safeInputs],
  );

  const canRecheck =
    Object.keys(wrongMap).length > 0 &&
    Object.entries(wrongMap)
      .filter(([, value]) => value)
      .every(([wordId]) => (safeInputs[wordId] ?? "").trim().length > 0);

  const actionLabel = phase === "filling" ? "Kiểm tra" : "Kiểm tra lại";

  const actionDisabled =
    isSaving || (phase === "filling" ? !allInputsFilled : !canRecheck);

  const isInputEnabled = useMemo(() => {
    return (wordId: string): boolean => {
      if (phase === "fixing") {
        return Boolean(wrongMap[wordId]);
      }

      const idx = orderedWordIds.indexOf(wordId);

      if (idx === -1) {
        return false;
      }

      for (let j = 0; j < idx; j++) {
        if ((safeInputs[orderedWordIds[j]] ?? "").trim().length === 0) {
          return false;
        }
      }

      return true;
    };
  }, [phase, orderedWordIds, safeInputs, wrongMap]);

  function resetRound(nextRoundIndex: number) {
    setRoundIndex(nextRoundIndex);
    setPhase("filling");
    reset({ inputs: {} });
    setWrongMap({});
    setLastCheckMap({});
    setHintedRoundMap({});
    setRevealedWordId(null);
    setPracticeError(null);
  }

  function markHintUsed(wordId: string) {
    setHintedRoundMap((prev) => ({
      ...prev,
      [wordId]: true,
    }));

    hintAccumulatorRef.current[wordId] = true;
  }

  function showHintTemporarily() {
    if (!activeWordId) {
      return;
    }

    markHintUsed(activeWordId);
    setRevealedWordId(activeWordId);

    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }

    hintTimeoutRef.current = setTimeout(() => {
      setRevealedWordId(null);
    }, 1200);
  }

  async function handleStartRecall() {
    if (!user || !setItem) {
      return;
    }

    setIsSaving(true);
    setPracticeError(null);

    try {
      const nextSessionId = await createSession(
        user.uid,
        setItem.id,
        setItem.status === "new" ? "learn" : "review",
        TOTAL_ROUNDS,
      );

      setSessionId(nextSessionId);
      setMode("recall");
      resetRound(0);
      wrongAccumulatorRef.current = {};
      hintAccumulatorRef.current = {};
      metricsRef.current = {
        totalChecks: 0,
        correctChecks: 0,
        wrongCount: 0,
        usedHintCount: 0,
      };
    } catch {
      setPracticeError("Không thể bắt đầu phiên luyện. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleInputChange(wordId: string, value: string) {
    if (practiceError) {
      setPracticeError(null);
    }

    setWrongMap((prev) => {
      if (!prev[wordId]) {
        return prev;
      }

      return {
        ...prev,
        [wordId]: false,
      };
    });

    setLastCheckMap((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, wordId)) {
        return prev;
      }

      const next = { ...prev };
      delete next[wordId];
      return next;
    });

    if (phase === "fixing") {
      if (!wrongMap[wordId]) {
        return;
      }

      setValue(`inputs.${wordId}`, value, {
        shouldDirty: true,
        shouldValidate: false,
      });
      return;
    }

    const idx = orderedWordIds.indexOf(wordId);

    if (idx === -1) {
      return;
    }

    const currentInputs = getValues("inputs") ?? {};

    for (let j = 0; j < idx; j++) {
      if ((currentInputs[orderedWordIds[j]] ?? "").trim().length === 0) {
        return;
      }
    }

    const next: Record<string, string> = { ...currentInputs, [wordId]: value };
    if (value.trim().length === 0) {
      for (let k = idx + 1; k < orderedWordIds.length; k++) {
        delete next[orderedWordIds[k]];
      }
    }
    reset({ inputs: next }, { keepDirty: true });
  }

  async function finalizeSession(currentSessionId: string) {
    if (!user || !setItem) {
      return;
    }

    const wordPerformances = words.map((word) => ({
      wordId: word.id,
      hadWrong: Boolean(wrongAccumulatorRef.current[word.id]),
      usedHint: Boolean(hintAccumulatorRef.current[word.id]),
    }));

    const metrics = metricsRef.current;
    const score =
      metrics.totalChecks === 0
        ? 100
        : Math.round((metrics.correctChecks / metrics.totalChecks) * 100);

    const sessionMetrics: SessionMetrics = {
      score,
      wrongCount: metrics.wrongCount,
      usedHintCount: metrics.usedHintCount,
    };

    await completeSession(
      user.uid,
      setItem.id,
      currentSessionId,
      wordPerformances,
      sessionMetrics,
    );

    router.replace(`/sets/${setItem.id}/result?sessionId=${currentSessionId}`);
  }

  async function runCheckRound() {
    if (!user || !setItem || !sessionId) {
      return;
    }

    setIsSaving(true);
    setPracticeError(null);

    try {
      const wordMap = new Map(words.map((word) => [word.id, word]));

      const attempts: RoundAttemptPayload[] = [];
      const nextWrongMap: Record<string, boolean> = {};
      const nextLastCheckMap: Record<string, boolean> = {};

      orderedWordIds.forEach((wordId) => {
        const word = wordMap.get(wordId);

        if (!word) {
          return;
        }

        const input = (safeInputs[wordId] ?? "").trim();
        const usedHint = Boolean(hintedRoundMap[wordId]);
        const isCorrect = isAnswerCorrect(input, word.answer);

        attempts.push({
          wordId,
          round: roundIndex + 1,
          input,
          isCorrect,
          usedHint,
        });

        nextWrongMap[wordId] = !isCorrect;
        nextLastCheckMap[wordId] = isCorrect;

        if (!isCorrect) {
          wrongAccumulatorRef.current[wordId] = true;
        }

        if (usedHint) {
          hintAccumulatorRef.current[wordId] = true;
        }
      });

      await saveRoundAttempts(user.uid, setItem.id, sessionId, attempts);

      const wrongCountInCheck = attempts.filter(
        (item) => !item.isCorrect,
      ).length;
      const hintCountInCheck = attempts.filter((item) => item.usedHint).length;

      metricsRef.current.totalChecks += attempts.length;
      metricsRef.current.correctChecks += attempts.length - wrongCountInCheck;
      metricsRef.current.wrongCount += wrongCountInCheck;
      metricsRef.current.usedHintCount += hintCountInCheck;

      setWrongMap(nextWrongMap);
      setLastCheckMap(nextLastCheckMap);

      if (wrongCountInCheck > 0) {
        setPhase("fixing");
        return;
      }

      if (roundIndex < TOTAL_ROUNDS - 1) {
        resetRound(roundIndex + 1);
        return;
      }

      await finalizeSession(sessionId);
    } catch {
      setPracticeError("Có lỗi khi lưu kết quả round. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleContinueOrCheck() {
    await runCheckRound();
  }

  if (loading) {
    return <LoadingState title="Đang tải màn luyện tập" />;
  }

  if (error || !setItem) {
    return (
      <p className="text-sm text-red-600">{error ?? "Không tìm thấy set."}</p>
    );
  }

  if (mode === "learn") {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <BackButton href="/dashboard" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">{setItem.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Mode learn: xem lại các từ trước khi bước vào active recall.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-2 font-semibold">Nghĩa tiếng Việt</th>
                <th className="px-4 py-2 font-semibold">Từ tiếng Anh</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id} className="border-t border-slate-200">
                  <td className="px-4 py-2">{word.meaning}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {word.answer}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {practiceError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {practiceError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleStartRecall}
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {isSaving ? "Đang khởi tạo..." : "Bắt đầu luyện"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <BackButton href="/dashboard" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{setItem.title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Round {roundIndex + 1}/{TOTAL_ROUNDS} - Điền lần lượt từ trên xuống; ô
          tiếp theo mở khi các ô phía trên đã có nội dung.
        </p>
      </div>

      <PracticeTable
        words={words}
        orderedWordIds={orderedWordIds}
        phase={phase}
        activeWordId={activeWordId}
        isInputEnabled={isInputEnabled}
        inputs={safeInputs}
        wrongMap={wrongMap}
        lastCheckMap={lastCheckMap}
        revealedWordId={revealedWordId}
        onInputChange={handleInputChange}
        registerInput={(wordId) => register(`inputs.${wordId}`)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <HintButton
          disabled={!activeWordId || isSaving}
          onHoldStart={() => {
            if (!activeWordId) {
              return;
            }

            markHintUsed(activeWordId);
            setRevealedWordId(activeWordId);
          }}
          onHoldEnd={() => {
            setRevealedWordId(null);
          }}
          onClickPeek={showHintTemporarily}
        />

        <button
          type="button"
          onClick={() => {
            void handleContinueOrCheck();
          }}
          disabled={actionDisabled}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {isSaving ? "Đang lưu..." : actionLabel}
        </button>
      </div>

      {practiceError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {practiceError}
        </p>
      ) : null}
    </div>
  );
}

export default function PracticePage() {
  return (
    <AuthGuard>
      <PracticeContent />
    </AuthGuard>
  );
}
