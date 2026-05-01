"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutFromApp, useAuth } from "@/lib/auth";

function getInitials(nameOrEmail: string): string {
  const normalized = nameOrEmail.trim();

  if (!normalized) {
    return "U";
  }

  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return normalized.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isAuthed = Boolean(user);
  const profileName = user?.displayName ?? user?.email ?? "User";
  const avatarInitials = getInitials(profileName);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOutFromApp();
      setIsMenuOpen(false);
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link
          href={isAuthed ? "/dashboard" : "/login"}
          className="text-sm font-bold tracking-tight text-slate-900">
          Active Recall Vocab
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? null : isAuthed ? (
            <>
              {pathname !== "/dashboard" ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Dashboard
                </Link>
              ) : null}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200">
                  {user?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt={profileName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    avatarInitials
                  )}
                </button>

                {isMenuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    <p className="truncate px-3 py-2 text-xs text-slate-500">
                      {user?.email ?? "Không có email"}
                    </p>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                      Cài đặt
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                      {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
