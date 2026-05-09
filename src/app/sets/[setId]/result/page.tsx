"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { BackButton } from "@/components/BackButton";
import LoadingState from "@/components/LoadingState";
import ResultSummary from "@/components/ResultSummary";
import { useAuth } from "@/lib/auth";
import { getLatestSessionId, getResultData, getSet } from "@/lib/firestore";
import { ResultData } from "@/types";

function ResultContent() {
  const params = useParams<{ setId: string }>();
  const setId = params.setId;
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get("sessionId");

  const { user } = useAuth();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResult() {
      if (!user || !setId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let sessionId = initialSessionId;

        if (!sessionId) {
          const setItem = await getSet(user.uid, setId);
          sessionId = setItem?.lastSessionId ?? null;
        }

        if (!sessionId) {
          sessionId = await getLatestSessionId(user.uid, setId);
        }

        if (!sessionId) {
          setError("Chưa có phiên luyện tập nào cho set này.");
          return;
        }

        const nextData = await getResultData(user.uid, setId, sessionId);

        if (!nextData) {
          setError("Không thể tải kết quả phiên luyện tập.");
          return;
        }

        setData(nextData);
      } catch {
        setError("Đã xảy ra lỗi khi tải kết quả.");
      } finally {
        setLoading(false);
      }
    }

    void loadResult();
  }, [initialSessionId, setId, user]);

  const wrongWordIds = useMemo(() => {
    if (!data) {
      return [];
    }

    const wrong = new Set(
      data.attempts
        .filter((attempt) => !attempt.isCorrect)
        .map((attempt) => attempt.wordId),
    );

    return Array.from(wrong);
  }, [data]);

  const hintedWordIds = useMemo(() => {
    if (!data) {
      return [];
    }

    const hinted = new Set(
      data.attempts
        .filter((attempt) => attempt.usedHint)
        .map((attempt) => attempt.wordId),
    );

    return Array.from(hinted);
  }, [data]);

  if (loading) {
    return <LoadingState title="Đang tải kết quả" />;
  }

  if (error || !data) {
    return (
      <p className="text-sm text-red-600">
        {error ?? "Không có dữ liệu kết quả."}
      </p>
    );
  }

  const wordMap = new Map(data.words.map((word) => [word.id, word]));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <BackButton href={`/sets/${data.set.id}/practice`} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">Set: {data.set.title}</p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          Tổng kết session
        </h1>

        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="font-semibold">Những từ sai:</span>{" "}
            {wrongWordIds.length > 0
              ? wrongWordIds
                  .map((wordId) => wordMap.get(wordId)?.answer)
                  .filter(Boolean)
                  .join(", ")
              : "Không có"}
          </p>
          <p>
            <span className="font-semibold">Những từ đã dùng gợi ý:</span>{" "}
            {hintedWordIds.length > 0
              ? hintedWordIds
                  .map((wordId) => wordMap.get(wordId)?.answer)
                  .filter(Boolean)
                  .join(", ")
              : "Không có"}
          </p>
        </div>
      </div>

      <ResultSummary
        setId={setId}
        session={data.session}
        words={data.words}
        wrongWordIds={wrongWordIds}
        hintedWordIds={hintedWordIds}
      />
    </div>
  );
}

export default function ResultPage() {
  return (
    <AuthGuard>
      <ResultContent />
    </AuthGuard>
  );
}
