"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOutFromApp, useAuth } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAuthed = Boolean(user);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOutFromApp();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link href={isAuthed ? "/dashboard" : "/login"} className="text-sm font-bold tracking-tight text-slate-900">
          Active Recall Vocab
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? null : isAuthed ? (
            <>
              {pathname !== "/dashboard" ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Dashboard
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
