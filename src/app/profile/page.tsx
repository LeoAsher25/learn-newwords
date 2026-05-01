"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth";

function ProfileContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Thông tin tài khoản hiện tại.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Tên hiển thị</dt>
            <dd className="text-slate-900">{user?.displayName ?? "Chưa cập nhật"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd className="text-slate-900">{user?.email ?? "Không có email"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">UID</dt>
            <dd className="break-all text-slate-900">{user?.uid ?? "-"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
