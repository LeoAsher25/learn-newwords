import { alignNextReviewDateToSchedule, DEFAULT_REVIEW_SCHEDULE_SETTINGS } from "@/lib/reviewSchedule";
import { ReviewScheduleSettings } from "@/types";

export type ReviewPerformance = "wrong" | "usedHint" | "correctClean";

function getDaysForCorrectClean(reviewLevel: number): number {
  if (reviewLevel <= 0) {
    return 1;
  }

  if (reviewLevel === 1) {
    return 2;
  }

  if (reviewLevel === 2) {
    return 3;
  }

  if (reviewLevel === 3) {
    return 7;
  }

  if (reviewLevel === 4) {
    return 14;
  }

  return 30;
}

export function calculateNextReview(
  reviewLevel: number,
  performance: ReviewPerformance,
  from: Date = new Date(),
  settings: ReviewScheduleSettings = DEFAULT_REVIEW_SCHEDULE_SETTINGS,
): Date {
  let days = 1;

  if (performance === "wrong") {
    days = 1;
  } else if (performance === "usedHint") {
    // Hint means recall was not fully stable; schedule an immediate next-day revisit.
    days = 1;
  } else {
    days = getDaysForCorrectClean(reviewLevel);
  }

  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return alignNextReviewDateToSchedule(next, from, settings);
}
