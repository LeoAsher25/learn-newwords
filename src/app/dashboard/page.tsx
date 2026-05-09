"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import { PaginationControls } from "@/components/PaginationControls";
import SetCard from "@/components/SetCard";
import { useDashboardData } from "@/hooks/queries/useDashboardData";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_REVIEW_SCHEDULE_SETTINGS,
  isReviewDue,
} from "@/lib/reviewSchedule";
import { SetItem } from "@/types";

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBeforeDay(left: Date, right: Date): boolean {
  const leftStart = new Date(
    left.getFullYear(),
    left.getMonth(),
    left.getDate(),
  );
  const rightStart = new Date(
    right.getFullYear(),
    right.getMonth(),
    right.getDate(),
  );
  return leftStart.getTime() < rightStart.getTime();
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function getDashboardStatus(set: SetItem, now: Date): string {
  if (set.status === "new") {
    return "Mới học";
  }

  if (isReviewDue(set.nextReviewAt, now, DEFAULT_REVIEW_SCHEDULE_SETTINGS)) {
    return "Cần ôn";
  }

  if (set.lastPracticedAt && isSameDay(set.lastPracticedAt, now)) {
    return "Đã hoàn thành hôm nay";
  }

  return "Đang chờ lịch ôn";
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

function formatLastPracticed(value: Date | null): string {
  if (!value) {
    return "Chưa ôn lần nào";
  }

  return value.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DashboardContent() {
  const { user } = useAuth();
  const dashboardQuery = useDashboardData(user?.uid);

  // Pagination state
  const [dueSummaryPage, setDueSummaryPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [allSetsPage, setAllSetsPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  const sets = useMemo(
    () => dashboardQuery.data?.sets ?? [],
    [dashboardQuery.data?.sets],
  );
  const dueSummaries = useMemo(
    () => dashboardQuery.data?.dueSummaries ?? [],
    [dashboardQuery.data?.dueSummaries],
  );
  const loading = dashboardQuery.isLoading;
  const error = dashboardQuery.isError;

  const dueMap = useMemo(() => {
    return new Map(dueSummaries.map((item) => [item.set.id, item.dueWords]));
  }, [dueSummaries]);

  const now = useMemo(() => new Date(), []);
  const nextWeek = useMemo(() => addDays(now, 7), [now]);

  const overdueSets = useMemo(
    () => sets.filter((set) => isBeforeDay(set.nextReviewAt, now)),
    [sets, now],
  );
  const dueTodaySets = useMemo(
    () =>
      sets.filter(
        (set) =>
          isSameDay(set.nextReviewAt, now) &&
          isReviewDue(set.nextReviewAt, now, DEFAULT_REVIEW_SCHEDULE_SETTINGS),
      ),
    [sets, now],
  );
  const upcomingSets = useMemo(
    () =>
      sets.filter(
        (set) =>
          !isReviewDue(
            set.nextReviewAt,
            now,
            DEFAULT_REVIEW_SCHEDULE_SETTINGS,
          ) && set.nextReviewAt <= nextWeek,
      ),
    [sets, now, nextWeek],
  );
  const practicedTodaySets = useMemo(
    () =>
      sets.filter(
        (set) => set.lastPracticedAt && isSameDay(set.lastPracticedAt, now),
      ),
    [sets, now],
  );
  if (loading) {
    return <LoadingState title="Đang tải dashboard" />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Không thể tải dashboard. Vui lòng thử lại.
      </p>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý set từ vựng và ôn tập theo spaced repetition.
            </p>
          </div>

          <Link
            href="/sets/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Tạo set mới
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Learning path hôm nay
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
              Quá hạn
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-900">
              {overdueSets.length}
            </p>
            <p className="text-xs text-rose-700">set cần xử lý ngay</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Đến hạn hôm nay
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-900">
              {dueTodaySets.length}
            </p>
            <p className="text-xs text-amber-700">set theo lịch ôn</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Đã luyện hôm nay
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              {practicedTodaySets.length}
            </p>
            <p className="text-xs text-emerald-700">set đã hoàn thành phiên</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Cần ôn hôm nay
        </h2>
        {dueSummaries.length === 0 ? (
          <EmptyState
            title="Không có từ cần ôn hôm nay"
            description="Bạn có thể tạo set mới hoặc quay lại sau."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {dueSummaries
                .slice(
                  (dueSummaryPage - 1) * ITEMS_PER_PAGE,
                  dueSummaryPage * ITEMS_PER_PAGE,
                )
                .map((item) => (
                  <article
                    key={item.set.id}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      {item.set.title}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      {item.dueWords} từ đến hạn ôn
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Ôn lần cuối:{" "}
                      {formatLastPracticed(item.set.lastPracticedAt)}
                    </p>
                    <Link
                      href={`/sets/${item.set.id}/practice`}
                      className="mt-3 inline-flex rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                      Vào luyện
                    </Link>
                  </article>
                ))}
            </div>
            {Math.ceil(dueSummaries.length / ITEMS_PER_PAGE) > 1 && (
              <PaginationControls
                currentPage={dueSummaryPage}
                totalPages={Math.ceil(dueSummaries.length / ITEMS_PER_PAGE)}
                onPageChange={setDueSummaryPage}
              />
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Kế hoạch 7 ngày tới
        </h2>
        {upcomingSets.length === 0 ? (
          <EmptyState
            title="Chưa có lịch ôn trong 7 ngày tới"
            description="Khi hoàn thành phiên luyện, lịch ôn tiếp theo sẽ xuất hiện ở đây."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {upcomingSets
                .slice(
                  (upcomingPage - 1) * ITEMS_PER_PAGE,
                  upcomingPage * ITEMS_PER_PAGE,
                )
                .map((set) => (
                  <div
                    key={set.id}
                    className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                    <p className="text-sm font-semibold text-violet-900">
                      {set.title}
                    </p>
                    <p className="text-xs text-violet-700">
                      Ôn lại vào {formatDate(set.nextReviewAt)}
                    </p>
                  </div>
                ))}
            </div>
            {Math.ceil(upcomingSets.length / ITEMS_PER_PAGE) > 1 && (
              <PaginationControls
                currentPage={upcomingPage}
                totalPages={Math.ceil(upcomingSets.length / ITEMS_PER_PAGE)}
                onPageChange={setUpcomingPage}
              />
            )}
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Tất cả set</h2>
        {sets.length === 0 ? (
          <EmptyState
            title="Bạn chưa có set nào"
            description="Tạo set 7 từ đầu tiên để bắt đầu luyện tập."
            actionLabel="Tạo set mới"
            actionHref="/sets/new"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {sets
                .slice(
                  (allSetsPage - 1) * ITEMS_PER_PAGE,
                  allSetsPage * ITEMS_PER_PAGE,
                )
                .map((set) => (
                  <SetCard
                    key={set.id}
                    set={set}
                    dashboardStatus={getDashboardStatus(set, new Date())}
                    dueWords={dueMap.get(set.id) ?? 0}
                  />
                ))}
            </div>
            {Math.ceil(sets.length / ITEMS_PER_PAGE) > 1 && (
              <PaginationControls
                currentPage={allSetsPage}
                totalPages={Math.ceil(sets.length / ITEMS_PER_PAGE)}
                onPageChange={setAllSetsPage}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
