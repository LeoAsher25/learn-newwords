"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReviewScheduleSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/react-query/queryKeys";

export function useReviewScheduleSettings(userId?: string) {
  return useQuery({
    queryKey: userId
      ? queryKeys.reviewScheduleSettings(userId)
      : ["review-schedule-settings", "anonymous"],
    queryFn: async () => fetchReviewScheduleSettings(userId!),
    enabled: Boolean(userId),
    refetchOnMount: "always",
  });
}
