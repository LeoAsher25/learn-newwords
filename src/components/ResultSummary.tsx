import Link from "next/link";
import { Session, Word } from "@/types";

interface ResultSummaryProps {
  setId: string;
  session: Session;
  words: Word[];
  wrongWordIds: string[];
  hintedWordIds: string[];
}

function statusLabel(status: Word["status"]): string {
  if (status === "mastered") {
    return "mastered";
  }

  if (status === "weak") {
    return "weak";
  }

  return "learning";
}

export default function ResultSummary({
  setId,
  session,
  words,
  wrongWordIds,
  hintedWordIds,
}: ResultSummaryProps) {
  const wrongSet = new Set(wrongWordIds);
  const hintedSet = new Set(hintedWordIds);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Kết quả luyện tập</h1>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Tổng round:</span> {session.totalRounds}
          </p>
          <p>
            <span className="font-semibold">Điểm:</span> {session.score}%
          </p>
          <p>
            <span className="font-semibold">Số lỗi:</span> {session.wrongCount}
          </p>
          <p>
            <span className="font-semibold">Số lần gợi ý:</span> {session.usedHintCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Chi tiết từng từ</h2>
        <div className="mt-3 space-y-2">
          {words.map((word) => (
            <div
              key={word.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{word.meaning}</p>
                <p className="text-xs text-slate-500">{word.answer}</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {wrongSet.has(word.id) ? (
                  <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-700">
                    Sai
                  </span>
                ) : null}
                {hintedSet.has(word.id) ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                    Dùng gợi ý
                  </span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                  {statusLabel(word.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/sets/${setId}/practice`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Luyện lại set này
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Về dashboard
        </Link>
      </div>
    </section>
  );
}
