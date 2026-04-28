import { WordInput } from "@/types";

interface WordInputErrors {
  meaning?: string;
  answer?: string;
}

interface WordInputTableProps {
  words: WordInput[];
  errors?: Record<number, WordInputErrors>;
  onChange: (index: number, field: "meaning" | "answer", value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export default function WordInputTable({
  words,
  errors,
  onChange,
  onRemove,
  canRemove,
}: WordInputTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="w-14 px-4 py-3 font-semibold text-center align-middle">
              #
            </th>
            <th className="px-4 py-3 font-semibold">Nghĩa tiếng Việt</th>
            <th className="px-4 py-3 font-semibold">Từ tiếng Anh</th>
            <th className="w-16 px-4 py-3 text-center font-semibold align-middle">
              Xóa
            </th>
          </tr>
        </thead>
        <tbody>
          {words.map((word, index) => {
            const rowError = errors?.[index];

            return (
              <tr key={index} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 text-sm font-medium text-slate-500 text-center align-middle">
                  {index + 1}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={word.meaning}
                    onChange={(event) =>
                      onChange(index, "meaning", event.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-1 h-10 text-sm outline-none transition focus:ring-2 focus:ring-slate-200 ${
                      rowError?.meaning ? "border-red-400" : "border-slate-300"
                    }`}
                    placeholder="Ví dụ: sự phát triển"
                  />
                  {rowError?.meaning ? (
                    <p className="mt-1 text-xs text-red-600">
                      {rowError.meaning}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={word.answer}
                    onChange={(event) =>
                      onChange(index, "answer", event.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-1 h-10 text-sm outline-none transition focus:ring-2 focus:ring-slate-200 ${
                      rowError?.answer ? "border-red-400" : "border-slate-300"
                    }`}
                    placeholder="Ví dụ: development"
                  />
                  {rowError?.answer ? (
                    <p className="mt-1 text-xs text-red-600">
                      {rowError.answer}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    disabled={!canRemove}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-300 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Xóa từ số ${index + 1}`}>
                    x
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
