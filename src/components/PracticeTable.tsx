import { Word } from "@/types";

export type PracticePhase = "filling" | "fixing";

interface PracticeTableProps {
  words: Word[];
  orderedWordIds: string[];
  phase: PracticePhase;
  activeWordId: string | null;
  isInputEnabled: (wordId: string) => boolean;
  inputs: Record<string, string>;
  wrongMap: Record<string, boolean>;
  lastCheckMap: Record<string, boolean>;
  revealedWordId: string | null;
  onInputChange: (wordId: string, value: string) => void;
}

export default function PracticeTable({
  words,
  orderedWordIds,
  phase,
  activeWordId,
  isInputEnabled,
  inputs,
  wrongMap,
  lastCheckMap,
  revealedWordId,
  onInputChange,
}: PracticeTableProps) {
  const wordMap = new Map(words.map((word) => [word.id, word]));
  const orderedWords = orderedWordIds
    .map((wordId) => wordMap.get(wordId))
    .filter((word): word is Word => Boolean(word));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="w-1/2 px-4 py-2 font-semibold">Nghĩa tiếng Việt</th>
            <th className="w-1/2 px-4 py-2 font-semibold">Từ tiếng Anh</th>
          </tr>
        </thead>
        <tbody>
          {orderedWords.map((word, index) => {
            const isActive = phase === "filling" && activeWordId === word.id;
            const isEditable = isInputEnabled(word.id);

            const inputBorderClass = wrongMap[word.id]
              ? "border-red-400 bg-red-50"
              : lastCheckMap[word.id]
                ? "border-emerald-400 bg-emerald-50"
                : "border-slate-300 bg-white";

            return (
              <tr key={word.id} className="border-t border-slate-200 align-top">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-slate-500">{index + 1}.</span>
                    <span className="font-medium text-slate-900">{word.meaning}</span>
                    {isActive ? (
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        hiện tại
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={inputs[word.id] ?? ""}
                    onChange={(event) => onInputChange(word.id, event.target.value)}
                    disabled={!isEditable}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 ${inputBorderClass}`}
                    placeholder="Nhập từ tiếng Anh"
                  />

                  {revealedWordId === word.id ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Gợi ý: <span className="italic">{word.answer}</span>
                    </p>
                  ) : null}

                  {wrongMap[word.id] ? (
                    <p className="mt-1 text-xs text-red-600">Đáp án đúng: {word.answer}</p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
