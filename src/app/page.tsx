"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/dashboard" : "/login");
    }
  }, [loading, router, user]);

  return <LoadingState title="Đang điều hướng" />;
}
