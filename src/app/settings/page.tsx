"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import AuthGuard from "@/components/AuthGuard";
import LoadingState from "@/components/LoadingState";
import { useReminderSettings } from "@/hooks/queries/useReminderSettings";
import { useReviewScheduleSettings } from "@/hooks/queries/useReviewScheduleSettings";
import { useAuth } from "@/lib/auth";
import {
  updateReminderSettings,
  updateReviewScheduleSettings,
} from "@/lib/api/settings";
import { DEFAULT_REMINDER_SETTINGS } from "@/lib/reminderSettings";
import { DEFAULT_REVIEW_SCHEDULE_SETTINGS } from "@/lib/reviewSchedule";
import { queryKeys } from "@/lib/react-query/queryKeys";
import {
  ReminderSettings,
  ReviewDueMode,
  ReviewScheduleSettings,
} from "@/types";

function detectTimezone(): string {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh"
    );
  } catch {
    return "Asia/Ho_Chi_Minh";
  }
}

function modeLabel(mode: ReviewDueMode): string {
  if (mode === "precise_ms") {
    return "Chính xác đến mili-giây";
  }
  if (mode === "cross_day") {
    return "Chỉ cần qua ngày";
  }
  return "Mốc giờ cố định trong ngày";
}

interface SettingsFormValues {
  dueMode: ReviewDueMode;
  timezone: string;
  fixedReviewTime: string;
  emailEnabled: boolean;
  leadTimeMinutes: number;
}

function SettingsContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const detectedTimezone = useMemo(() => detectTimezone(), []);
  const settingsQuery = useReviewScheduleSettings(user?.uid);
  const reminderSettingsQuery = useReminderSettings(user?.uid);

  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    defaultValues: {
      dueMode: DEFAULT_REVIEW_SCHEDULE_SETTINGS.dueMode,
      timezone: detectedTimezone,
      fixedReviewTime: "",
      emailEnabled: DEFAULT_REMINDER_SETTINGS.emailEnabled,
      leadTimeMinutes: DEFAULT_REMINDER_SETTINGS.leadTimeMinutes,
    },
  });

  const currentSettings = useMemo<ReviewScheduleSettings>(() => {
    if (!settingsQuery.data) {
      return {
        ...DEFAULT_REVIEW_SCHEDULE_SETTINGS,
        timezone: detectedTimezone,
      };
    }

    return settingsQuery.data;
  }, [settingsQuery.data, detectedTimezone]);

  const currentReminderSettings = useMemo<ReminderSettings>(() => {
    if (!reminderSettingsQuery.data) {
      return DEFAULT_REMINDER_SETTINGS;
    }

    return reminderSettingsQuery.data;
  }, [reminderSettingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: ReviewScheduleSettings) =>
      updateReviewScheduleSettings(user!.uid, settings),
    onSuccess: async (_data, settings) => {
      queryClient.setQueryData(
        queryKeys.reviewScheduleSettings(user!.uid),
        settings,
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.reviewScheduleSettings(user!.uid),
      });
    },
  });

  const saveReminderSettingsMutation = useMutation({
    mutationFn: async (settings: ReminderSettings) =>
      updateReminderSettings(user!.uid, settings),
    onSuccess: async (_data, settings) => {
      queryClient.setQueryData(queryKeys.reminderSettings(user!.uid), settings);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.reminderSettings(user!.uid),
      });
    },
  });

  function startEdit() {
    reset({
      dueMode: currentSettings.dueMode,
      timezone: currentSettings.timezone || detectedTimezone,
      fixedReviewTime: currentSettings.fixedReviewTime ?? "",
      emailEnabled: currentReminderSettings.emailEnabled,
      leadTimeMinutes: currentReminderSettings.leadTimeMinutes,
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    reset({
      dueMode: currentSettings.dueMode,
      timezone: currentSettings.timezone || detectedTimezone,
      fixedReviewTime: currentSettings.fixedReviewTime ?? "",
      emailEnabled: currentReminderSettings.emailEnabled,
      leadTimeMinutes: currentReminderSettings.leadTimeMinutes,
    });
    saveSettingsMutation.reset();
    saveReminderSettingsMutation.reset();
    setIsEditing(false);
  }

  async function onSubmit(formValues: SettingsFormValues) {
    const trimmedTimezone = formValues.timezone.trim();
    const reviewSettings: ReviewScheduleSettings = {
      dueMode: formValues.dueMode,
      timezone: trimmedTimezone,
      fixedReviewTime:
        formValues.dueMode === "fixed_time"
          ? formValues.fixedReviewTime.trim()
          : null,
    };
    const reminderSettings: ReminderSettings = {
      emailEnabled: formValues.emailEnabled,
      leadTimeMinutes: Math.min(
        1440,
        Math.max(0, Math.round(formValues.leadTimeMinutes)),
      ),
    };

    await Promise.all([
      saveSettingsMutation.mutateAsync(reviewSettings),
      saveReminderSettingsMutation.mutateAsync(reminderSettings),
    ]);

    setIsEditing(false);
  }

  const dueMode = useWatch({ control, name: "dueMode" });

  if (settingsQuery.isLoading || reminderSettingsQuery.isLoading) {
    return <LoadingState title="Đang tải cài đặt" />;
  }

  if (settingsQuery.isError || reminderSettingsQuery.isError) {
    return (
      <p className="text-sm text-red-600">
        Không thể tải cài đặt. Vui lòng thử lại.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cấu hình cách xác định lịch ôn tập theo tài khoản của bạn.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {!isEditing ? (
          <div className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Mode</dt>
                <dd className="text-right font-medium text-slate-900">
                  {modeLabel(currentSettings.dueMode)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Timezone</dt>
                <dd className="text-right font-medium text-slate-900">
                  {currentSettings.timezone || "-"}
                </dd>
              </div>
              {currentSettings.dueMode === "fixed_time" ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Mốc giờ cố định</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {currentSettings.fixedReviewTime || "-"}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Email reminder</dt>
                <dd className="text-right font-medium text-slate-900">
                  {currentReminderSettings.emailEnabled ? "Bật" : "Tắt"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Nhắc trước</dt>
                <dd className="text-right font-medium text-slate-900">
                  {currentReminderSettings.leadTimeMinutes} phút
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={startEdit}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Cập nhật
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">
                Chế độ đến hạn ôn tập
              </span>
              <select
                {...register("dueMode")}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500">
                <option value="precise_ms">Chính xác đến mili-giây</option>
                <option value="cross_day">Chỉ cần qua ngày</option>
                <option value="fixed_time">Mốc giờ cố định trong ngày</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">Timezone</span>
              <input
                type="text"
                {...register("timezone", {
                  validate: (value) =>
                    value.trim().length > 0 || "Timezone không được để trống.",
                })}
                placeholder="Asia/Ho_Chi_Minh"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500"
              />
              {errors.timezone ? (
                <p className="text-sm text-red-600">
                  {errors.timezone.message}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">
                Timezone detect từ máy hiện tại:{" "}
                <span className="font-medium">{detectedTimezone}</span>
              </p>
            </label>

            {dueMode === "fixed_time" ? (
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-slate-700">
                  Mốc thời gian cố định
                </span>
                <input
                  type="time"
                  {...register("fixedReviewTime", {
                    validate: (value) =>
                      dueMode !== "fixed_time" ||
                      value.trim().length > 0 ||
                      "Vui lòng chọn mốc thời gian cố định.",
                  })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500"
                />
                {errors.fixedReviewTime ? (
                  <p className="text-sm text-red-600">
                    {errors.fixedReviewTime.message}
                  </p>
                ) : null}
              </label>
            ) : null}

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">Email reminder</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("emailEnabled")}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <span className="text-slate-700">Bật nhắc qua email</span>
              </div>
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">
                Nhắc trước (phút)
              </span>
              <input
                type="number"
                min={0}
                max={1440}
                step={5}
                {...register("leadTimeMinutes", {
                  valueAsNumber: true,
                  validate: (value) =>
                    Number.isFinite(value) && value >= 0 && value <= 1440
                      ? true
                      : "Giá trị phải nằm trong khoảng 0-1440.",
                })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-slate-500"
              />
              {errors.leadTimeMinutes ? (
                <p className="text-sm text-red-600">
                  {errors.leadTimeMinutes.message}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">
                Ví dụ: 60 = nhắc trước 1 giờ khi set sắp đến hạn.
              </p>
            </label>

            {saveSettingsMutation.isError ||
            saveReminderSettingsMutation.isError ? (
              <p className="text-sm text-red-600">
                Lưu cài đặt thất bại. Vui lòng thử lại.
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={
                  saveSettingsMutation.isPending ||
                  saveReminderSettingsMutation.isPending ||
                  isSubmitting
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                Huỷ
              </button>
              <button
                type="submit"
                disabled={
                  saveSettingsMutation.isPending ||
                  saveReminderSettingsMutation.isPending ||
                  isSubmitting
                }
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                {saveSettingsMutation.isPending ||
                saveReminderSettingsMutation.isPending ||
                isSubmitting
                  ? "Đang lưu..."
                  : "Lưu"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
