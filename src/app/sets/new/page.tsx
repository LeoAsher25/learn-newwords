"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import AuthGuard from "@/components/AuthGuard";
import WordInputTable from "@/components/WordInputTable";
import { useAuth } from "@/lib/auth";
import { createSetWithWords } from "@/lib/firestore";
import { WordCreatePayload, WordInput } from "@/types";

const MIN_WORDS = 5;

function getDefaultSetTitle(): string {
  return new Date().toLocaleDateString("en-GB");
}

function createInitialWords(): WordInput[] {
  return Array.from({ length: MIN_WORDS }, () => ({
    meaning: "",
    answer: "",
  }));
}

function NewSetContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{ title: string; words: WordInput[] }>({
    defaultValues: {
      title: getDefaultSetTitle(),
      words: createInitialWords(),
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "words",
  });
  const words = watch("words");

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  function handleWordChange(index: number, field: "meaning" | "answer", value: string) {
    setValue(`words.${index}.${field}`, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (formError) {
      setFormError(null);
    }
  }

  function handleAddWord() {
    append({ meaning: "", answer: "" });
  }

  function handleRemoveWord(index: number) {
    if (fields.length <= MIN_WORDS) {
      return;
    }
    remove(index);
    if (formError) {
      setFormError(null);
    }
  }

  async function onSubmit(values: { title: string; words: WordInput[] }) {
    if (!user) {
      return;
    }

    setFormError(null);
    if (values.words.length < MIN_WORDS) {
      setFormError(`Cần tối thiểu ${MIN_WORDS} từ trong một set.`);
      return;
    }

    const payload: WordCreatePayload[] = values.words.map((word, index) => ({
      index: index + 1,
      meaning: word.meaning.trim(),
      answer: word.answer.trim(),
    }));

    try {
      const setId = await createSetWithWords(
        user.uid,
        values.title.trim(),
        payload,
      );
      router.push(`/sets/${setId}/practice`);
    } catch {
      setFormError("Không thể tạo set. Vui lòng thử lại.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Tạo set mới</h1>
        <p className="mt-1 text-sm text-slate-600">
          Nhập tối thiểu {MIN_WORDS} từ gồm nghĩa tiếng Việt và đáp án tiếng
          Anh.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tên set</span>
            <input
              type="text"
              {...register("title", {
                validate: (value) =>
                  value.trim().length > 0 || "Tên set không được để trống.",
                onChange: () => {
                  if (formError) {
                    setFormError(null);
                  }
                },
              })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 ${
                errors.title ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="Ví dụ: Travel Vocabulary"
            />
            {errors.title ? (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            ) : null}
          </label>
        </div>

        <WordInputTable
          words={words ?? []}
          errors={
            Array.isArray(errors.words)
              ? Object.fromEntries(
                  errors.words.map((rowError, index) => [
                    index,
                    {
                      meaning: rowError?.meaning?.message,
                      answer: rowError?.answer?.message,
                    },
                  ]),
                )
              : undefined
          }
          onChange={handleWordChange}
          onRemove={handleRemoveWord}
          canRemove={fields.length > MIN_WORDS}
          registerField={(index, field) =>
            register(`words.${index}.${field}`, {
              validate: (value) =>
                value.trim().length > 0 ||
                (field === "meaning"
                  ? "Nghĩa tiếng Việt là bắt buộc."
                  : "Từ tiếng Anh là bắt buộc."),
              onChange: () => {
                if (formError) {
                  setFormError(null);
                }
              },
            })
          }
        />

        <div className="flex items-center gap-4 w-full justify-end">
          <button
            type="button"
            onClick={handleAddWord}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Thêm từ
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
            {isSubmitting ? "Đang tạo set..." : "Tạo set"}
          </button>
        </div>

        {formError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        ) : null}
      </form>
    </div>
  );
}

export default function NewSetPage() {
  return (
    <AuthGuard>
      <NewSetContent />
    </AuthGuard>
  );
}
