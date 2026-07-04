import Link from "next/link";
import { SetItem } from "@/types";

interface SetCardProps {
  set: SetItem;
  dashboardStatus: string;
  dueWords?: number;
}

function formatDate(value: Date): string {
  return value.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SetCard({
  set,
  dashboardStatus,
  dueWords = 0,
}: SetCardProps) {
  const now = new Date();
  const setDay = new Date(
    set.nextReviewAt.getFullYear(),
    set.nextReviewAt.getMonth(),
    set.nextReviewAt.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isOverdue = setDay.getTime() < today.getTime() && dueWords > 0;
  const isInProgress = set.status === "learning" || set.status === "reviewing";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {set.title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Tạo lúc {formatDate(set.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {dashboardStatus}
          </span>
          {isOverdue ? (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
              Quá hạn
            </span>
          ) : isInProgress ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
              Learning/reviewing
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-(--text-normal)">
        <p>
          <span className="font-semibold text-(--text-strong)">Số từ:</span>{" "}
          {set.totalWords}
        </p>
        <p>
          <span className="font-semibold text-(--text-strong)">Cần ôn:</span>{" "}
          {dueWords}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/sets/${set.id}/practice`}
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Luyện tập
        </Link>
        <Link
          href={`/sets/${set.id}/edit`}
          className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Chỉnh sửa
        </Link>
      </div>
    </article>
  );
}
