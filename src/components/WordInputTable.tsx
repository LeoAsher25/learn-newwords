import { WordInput } from "@/types";
import { UseFormRegisterReturn } from "react-hook-form";

interface WordInputErrors {
  meaning?: string;
  answer?: string;
}

interface WordInputTableProps {
  words: WordInput[];
  rowKeys: string[];
  errors?: Record<number, WordInputErrors>;
  onChange: (index: number, field: "meaning" | "answer", value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  registerField: (
    index: number,
    field: "meaning" | "answer",
  ) => UseFormRegisterReturn;
}

export default function WordInputTable({
  words,
  rowKeys,
  errors,
  onChange,
  onRemove,
  canRemove,
  registerField,
}: WordInputTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="w-8 md:w-14 px-4 py-3 font-semibold text-center align-middle">
              #
            </th>
            <th className="px-4 py-3 font-semibold">Nghĩa tiếng Việt</th>
            <th className="px-4 py-3 font-semibold">Từ tiếng Anh</th>
            <th className="w-11 md:w-16 px-4 py-3 text-center font-semibold align-middle">
              Xóa
            </th>
          </tr>
        </thead>
        <tbody>
          {rowKeys.map((rowKey, index) => {
            const word = words[index] ?? { meaning: "", answer: "" };
            const rowError = errors?.[index];

            return (
              <tr key={rowKey} className="border-t border-slate-200 align-top">
                <td className="px-1 md:px-3 py-2 text-sm font-medium text-slate-500 text-center align-middle">
                  {index + 1}
                </td>
                <td className="px-1 md:px-3 py-2">
                  <input
                    type="text"
                    value={word.meaning}
                    {...registerField(index, "meaning")}
                    onChange={(event) =>
                      onChange(index, "meaning", event.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-1 h-10 text-sm outline-none transition focus:ring-2 focus:ring-slate-200 ${
                      rowError?.meaning ? "border-red-400" : "border-slate-300"
                    }`}
                    placeholder="Ex: học"
                  />
                  {rowError?.meaning ? (
                    <p className="mt-1 text-xs text-red-600">
                      {rowError.meaning}
                    </p>
                  ) : null}
                </td>
                <td className="px-1 md:px-3 py-2">
                  <input
                    type="text"
                    value={word.answer}
                    {...registerField(index, "answer")}
                    onChange={(event) =>
                      onChange(index, "answer", event.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-1 h-10 text-sm outline-none transition focus:ring-2 focus:ring-slate-200 ${
                      rowError?.answer ? "border-red-400" : "border-slate-300"
                    }`}
                    placeholder="Ex: learn"
                  />
                  {rowError?.answer ? (
                    <p className="mt-1 text-xs text-red-600">
                      {rowError.answer}
                    </p>
                  ) : null}
                </td>
                <td className="px-1 md:px-3 py-2 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={!canRemove}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-rose-500/35 text-sm text-rose-500/85 hover:bg-rose-500/12 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Xóa từ số ${index + 1}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="size-4">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
