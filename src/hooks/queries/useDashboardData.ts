"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/react-query/queryKeys";

export function useDashboardData(userId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.dashboard(userId) : ["dashboard", "anonymous"],
    queryFn: async () => fetchDashboardData(userId!),
    enabled: Boolean(userId),
  });
}
