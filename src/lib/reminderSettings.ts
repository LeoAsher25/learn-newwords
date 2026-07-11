import { ReminderSettings } from "@/types";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  emailEnabled: true,
  leadTimeMinutes: 60,
};

export function normalizeReminderSettings(
  value: Partial<ReminderSettings> | undefined,
): ReminderSettings {
  const leadTimeMinutesRaw = Number(value?.leadTimeMinutes);
  const leadTimeMinutes = Number.isFinite(leadTimeMinutesRaw)
    ? Math.min(1440, Math.max(0, Math.round(leadTimeMinutesRaw)))
    : DEFAULT_REMINDER_SETTINGS.leadTimeMinutes;

  return {
    emailEnabled:
      typeof value?.emailEnabled === "boolean"
        ? value.emailEnabled
        : DEFAULT_REMINDER_SETTINGS.emailEnabled,
    leadTimeMinutes,
  };
}
