"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchReminderSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/react-query/queryKeys";

export function useReminderSettings(userId?: string) {
  return useQuery({
    queryKey: userId
      ? queryKeys.reminderSettings(userId)
      : ["reminder-settings", "anonymous"],
    queryFn: async () => fetchReminderSettings(userId!),
    enabled: Boolean(userId),
    refetchOnMount: "always",
  });
}
