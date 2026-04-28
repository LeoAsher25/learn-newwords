import Link from "next/link";
import { SetItem } from "@/types";

interface SetCardProps {
  set: SetItem;
  dashboardStatus: string;
  dueWords?: number;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function SetCard({ set, dashboardStatus, dueWords = 0 }: SetCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{set.title}</h3>
          <p className="mt-1 text-xs text-slate-500">Tạo ngày {formatDate(set.createdAt)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {dashboardStatus}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">Số từ:</span> {set.totalWords}
        </p>
        <p>
          <span className="font-semibold text-slate-800">Cần ôn:</span> {dueWords}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/sets/${set.id}/practice`}
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Luyện tập
        </Link>
      </div>
    </article>
  );
}
