import { ReviewScheduleSettings } from "@/types";

export const DEFAULT_REVIEW_SCHEDULE_SETTINGS: ReviewScheduleSettings = {
  dueMode: "precise_ms",
  timezone: "Asia/Ho_Chi_Minh",
  fixedReviewTime: null,
};

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date): Date {
  const nextDay = startOfDay(value);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setMilliseconds(nextDay.getMilliseconds() - 1);
  return nextDay;
}

function parseFixedReviewTime(value: string | null): { hour: number; minute: number } | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

function fixedTimeAtDay(reference: Date, hour: number, minute: number): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

function getFixedTimeCutoff(
  now: Date,
  settings: ReviewScheduleSettings,
): Date {
  const parsed = parseFixedReviewTime(settings.fixedReviewTime);
  if (!parsed) {
    return now;
  }

  const todayFixedTime = fixedTimeAtDay(now, parsed.hour, parsed.minute);
  // Business rule: when current time has not passed today's fixed time yet,
  // cutoff stays on yesterday's fixed time.
  if (now <= todayFixedTime) {
    const yesterdayFixedTime = new Date(todayFixedTime);
    yesterdayFixedTime.setDate(yesterdayFixedTime.getDate() - 1);
    return yesterdayFixedTime;
  }

  return todayFixedTime;
}

export function getReviewDueCutoff(
  now: Date = new Date(),
  settings: ReviewScheduleSettings = DEFAULT_REVIEW_SCHEDULE_SETTINGS,
): Date {
  switch (settings.dueMode) {
    case "cross_day":
      return endOfDay(now);
    case "fixed_time":
      return getFixedTimeCutoff(now, settings);
    case "precise_ms":
    default:
      return now;
  }
}

export function alignNextReviewDateToSchedule(
  target: Date,
  from: Date,
  settings: ReviewScheduleSettings = DEFAULT_REVIEW_SCHEDULE_SETTINGS,
): Date {
  if (settings.dueMode !== "fixed_time") {
    return target;
  }

  const parsed = parseFixedReviewTime(settings.fixedReviewTime);
  if (!parsed) {
    return target;
  }

  const aligned = fixedTimeAtDay(target, parsed.hour, parsed.minute);

  // Keep next review strictly after "from" to avoid same-day immediate due.
  if (aligned <= from) {
    aligned.setDate(aligned.getDate() + 1);
  }

  return aligned;
}

export function isReviewDue(
  nextReviewAt: Date,
  now: Date = new Date(),
  settings: ReviewScheduleSettings = DEFAULT_REVIEW_SCHEDULE_SETTINGS,
): boolean {
  return nextReviewAt <= getReviewDueCutoff(now, settings);
}
