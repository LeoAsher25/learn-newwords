"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import SetCard from "@/components/SetCard";
import { useAuth } from "@/lib/auth";
import { getDueSetSummaries, getSets } from "@/lib/firestore";
import { DueSetSummary, SetItem } from "@/types";

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getDashboardStatus(set: SetItem, now: Date): string {
  if (set.status === "new") {
    return "Mới học";
  }

  if (set.nextReviewAt <= now) {
    return "Cần ôn";
  }

  if (set.lastPracticedAt && isSameDay(set.lastPracticedAt, now)) {
    return "Đã hoàn thành hôm nay";
  }

  return "Đang chờ lịch ôn";
}

function DashboardContent() {
  const { user } = useAuth();
  const [sets, setSets] = useState<SetItem[]>([]);
  const [dueSummaries, setDueSummaries] = useState<DueSetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [allSets, due] = await Promise.all([
          getSets(user.uid),
          getDueSetSummaries(user.uid),
        ]);
        setSets(allSets);
        setDueSummaries(due);
      } catch {
        setError("Không thể tải dashboard. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [user]);

  const dueMap = useMemo(() => {
    return new Map(dueSummaries.map((item) => [item.set.id, item.dueWords]));
  }, [dueSummaries]);

  if (loading) {
    return <LoadingState title="Đang tải dashboard" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Tạo set mới
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Cần ôn hôm nay</h2>
        {dueSummaries.length === 0 ? (
          <EmptyState
            title="Không có từ cần ôn hôm nay"
            description="Bạn có thể tạo set mới hoặc quay lại sau."
          />
        ) : (
          <div className="space-y-2">
            {dueSummaries.map((item) => (
              <div
                key={item.set.id}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-amber-900">{item.set.title}</p>
                <p className="text-xs text-amber-700">{item.dueWords} từ đến hạn ôn</p>
              </div>
            ))}
          </div>
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
          <div className="grid gap-3">
            {sets.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                dashboardStatus={getDashboardStatus(set, new Date())}
                dueWords={dueMap.get(set.id) ?? 0}
              />
            ))}
          </div>
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
