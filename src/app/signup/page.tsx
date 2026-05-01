"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { signInWithGoogle, signUpWithEmail, useAuth } from "@/lib/auth";

interface SignupFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleGoogleSignup() {
    setError(null);
    setIsSubmittingGoogle(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch {
      setError("Đăng ký bằng Google thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmittingGoogle(false);
    }
  }

  async function onSubmit(values: SignupFormValues) {
    setError(null);
    try {
      await signUpWithEmail(
        values.displayName.trim(),
        values.email.trim(),
        values.password,
      );
      router.replace("/dashboard");
    } catch {
      setError("Không thể tạo tài khoản. Vui lòng thử lại.");
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
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
        <div className="mb-5 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
          <p className="text-sm text-slate-600">
            Bắt đầu học từ vựng mỗi ngày với lộ trình cá nhân hóa.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Display name</span>
            <input
              type="text"
              {...register("displayName", {
                validate: (value) =>
                  value.trim().length > 0 || "Display name là bắt buộc.",
              })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Ví dụ: Leo Asher"
            />
            {errors.displayName ? (
              <p className="text-xs text-red-600">{errors.displayName.message}</p>
            ) : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              {...register("email", {
                validate: (value) => value.trim().length > 0 || "Email là bắt buộc.",
              })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="you@example.com"
            />
            {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Mật khẩu</span>
            <input
              type="password"
              {...register("password", {
                validate: (value) => {
                  if (!value.trim()) {
                    return "Mật khẩu là bắt buộc.";
                  }
                  if (value.length < 6) {
                    return "Mật khẩu tối thiểu 6 ký tự.";
                  }
                  return true;
                },
              })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="••••••••"
            />
            {errors.password ? (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Nhập lại mật khẩu</span>
            <input
              type="password"
              {...register("confirmPassword", {
                validate: (value) =>
                  value === password || "Mật khẩu nhập lại chưa khớp.",
              })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="••••••••"
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            ) : null}
          </label>

          {error ? (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-center text-sm text-red-500/90">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isSubmittingGoogle}
            className="mt-1 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">hoặc</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={isSubmittingGoogle || isSubmitting}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {isSubmittingGoogle ? "Đang đăng ký..." : "Đăng ký bằng Google"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Đăng nhập
          </Link>
        </p>

      </div>
    </div>
  );
}
