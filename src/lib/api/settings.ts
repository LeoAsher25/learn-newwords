import {
  getUserReviewScheduleSettings,
  saveUserReviewScheduleSettings,
} from "@/lib/firestore";
import { ReviewScheduleSettings } from "@/types";

export async function fetchReviewScheduleSettings(
  userId: string,
): Promise<ReviewScheduleSettings> {
  return getUserReviewScheduleSettings(userId);
}

export async function updateReviewScheduleSettings(
  userId: string,
  settings: ReviewScheduleSettings,
): Promise<void> {
  await saveUserReviewScheduleSettings(userId, settings);
}
