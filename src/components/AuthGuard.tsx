"use client";

import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/lib/auth";

export default function AuthGuard({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <LoadingState title="Đang kiểm tra đăng nhập" />;
  }

  return <>{children}</>;
}
