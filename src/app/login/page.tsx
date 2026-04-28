"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { signInWithGoogle, useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState title="Đang kiểm tra phiên đăng nhập" />;
  }

  if (user) {
    return <LoadingState title="Đang chuyển vào dashboard" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Đăng nhập</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đăng nhập bằng Google để bắt đầu học từ vựng.
        </p>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isSubmitting}
          className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập với Google"}
        </button>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
