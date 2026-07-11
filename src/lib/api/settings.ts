import {
  getUserReminderSettings,
  getUserReviewScheduleSettings,
  saveUserReminderSettings,
  saveUserReviewScheduleSettings,
} from "@/lib/firestore";
import { ReminderSettings, ReviewScheduleSettings } from "@/types";

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

export async function fetchReminderSettings(
  userId: string,
): Promise<ReminderSettings> {
  return getUserReminderSettings(userId);
}

export async function updateReminderSettings(
  userId: string,
  settings: ReminderSettings,
): Promise<void> {
  await saveUserReminderSettings(userId, settings);
}
