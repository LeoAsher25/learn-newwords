"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [title, setTitle] = useState(getDefaultSetTitle);
  const [words, setWords] = useState<WordInput[]>(createInitialWords);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [wordErrors, setWordErrors] = useState<
    Record<number, { meaning?: string; answer?: string }>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  function handleWordChange(
    index: number,
    field: "meaning" | "answer",
    value: string,
  ) {
    setWords((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  }

  function handleAddWord() {
    setWords((prev) => [...prev, { meaning: "", answer: "" }]);
  }

  function handleRemoveWord(index: number) {
    setWords((prev) => {
      if (prev.length <= MIN_WORDS) {
        return prev;
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function validateForm(): {
    isValid: boolean;
    payload: WordCreatePayload[];
    titleValue: string;
  } {
    const nextWordErrors: Record<
      number,
      { meaning?: string; answer?: string }
    > = {};
    const payload: WordCreatePayload[] = [];

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setTitleError("Tên set không được để trống.");
    } else {
      setTitleError(null);
    }

    words.forEach((word, index) => {
      const meaning = word.meaning.trim();
      const answer = word.answer.trim();

      if (!meaning) {
        nextWordErrors[index] = {
          ...nextWordErrors[index],
          meaning: "Nghĩa tiếng Việt là bắt buộc.",
        };
      }

      if (!answer) {
        nextWordErrors[index] = {
          ...nextWordErrors[index],
          answer: "Từ tiếng Anh là bắt buộc.",
        };
      }

      payload.push({
        index: index + 1,
        meaning,
        answer,
      });
    });

    setWordErrors(nextWordErrors);

    const hasErrors =
      Boolean(Object.keys(nextWordErrors).length) ||
      !normalizedTitle ||
      words.length < MIN_WORDS;

    return {
      isValid: !hasErrors,
      payload,
      titleValue: normalizedTitle,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setFormError(null);
    setWordErrors({});
    const result = validateForm();

    if (!result.isValid) {
      if (words.length < MIN_WORDS) {
        setFormError(`Cần tối thiểu ${MIN_WORDS} từ trong một set.`);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const setId = await createSetWithWords(
        user.uid,
        result.titleValue,
        result.payload,
      );
      router.push(`/sets/${setId}/practice`);
    } catch {
      setFormError("Không thể tạo set. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tên set</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 ${
                titleError ? "border-red-400" : "border-slate-300"
              }`}
              placeholder="Ví dụ: Travel Vocabulary"
            />
            {titleError ? (
              <p className="text-xs text-red-600">{titleError}</p>
            ) : null}
          </label>
        </div>

        <WordInputTable
          words={words}
          errors={wordErrors}
          onChange={handleWordChange}
          onRemove={handleRemoveWord}
          canRemove={words.length > MIN_WORDS}
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
