export const queryKeys = {
  sets: (userId: string) => ["sets", userId] as const,
  dueSetSummaries: (userId: string) => ["due-set-summaries", userId] as const,
  dashboard: (userId: string) => ["dashboard", userId] as const,
  reviewScheduleSettings: (userId: string) => ["review-schedule-settings", userId] as const,
};
