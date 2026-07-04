"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import WordInputTable from "@/components/WordInputTable";
import { WordCreatePayload, WordInput } from "@/types";

export const MIN_WORDS = 5;

interface SetEditorFormProps {
  initialTitle: string;
  initialWords: WordInput[];
  heading: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  addWordLabel: string;
  onSubmit: (values: {
    title: string;
    words: WordCreatePayload[];
  }) => Promise<void>;
}

function createInitialWords(words: WordInput[]): WordInput[] {
  if (words.length > 0) {
    return words.map((word) => ({
      meaning: word.meaning,
      answer: word.answer,
      examples: word.examples.length > 0 ? word.examples : [""],
    }));
  }

  return Array.from({ length: MIN_WORDS }, () => ({
    meaning: "",
    answer: "",
    examples: [""],
  }));
}

function normalizeWords(words: WordInput[]): WordCreatePayload[] {
  return words.map((word, index) => ({
    index: index + 1,
    meaning: word.meaning.trim(),
    answer: word.answer.trim(),
    examples: word.examples
      .map((example) => example.trim())
      .filter((example) => example.length > 0),
  }));
}

export default function SetEditorForm({
  initialTitle,
  initialWords,
  heading,
  description,
  submitLabel,
  submittingLabel,
  addWordLabel,
  onSubmit,
}: SetEditorFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<{ title: string; words: WordInput[] }>({
    defaultValues: {
      title: initialTitle,
      words: createInitialWords(initialWords),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "words",
  });
  const words = useWatch({ control, name: "words" });

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  function handleWordChange(
    index: number,
    field: "meaning" | "answer",
    value: string,
  ) {
    setValue(`words.${index}.${field}`, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (formError) {
      setFormError(null);
    }
  }

  function handleExampleChange(
    wordIndex: number,
    exampleIndex: number,
    value: string,
  ) {
    setValue(`words.${wordIndex}.examples.${exampleIndex}`, value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (formError) {
      setFormError(null);
    }
  }

  function handleAddExample(wordIndex: number) {
    const currentExamples = words?.[wordIndex]?.examples ?? [];
    setValue(`words.${wordIndex}.examples`, [...currentExamples, ""], {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (formError) {
      setFormError(null);
    }
  }

  function handleRemoveExample(wordIndex: number, exampleIndex: number) {
    const currentExamples = words?.[wordIndex]?.examples ?? [];

    if (currentExamples.length <= 1) {
      setValue(`words.${wordIndex}.examples.${exampleIndex}`, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (formError) {
        setFormError(null);
      }
      return;
    }

    setValue(
      `words.${wordIndex}.examples`,
      currentExamples.filter(
        (_, currentIndex) => currentIndex !== exampleIndex,
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );

    if (formError) {
      setFormError(null);
    }
  }

  function handleAddWord() {
    append({ meaning: "", answer: "", examples: [""] });
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

  async function onFormSubmit(values: { title: string; words: WordInput[] }) {
    setFormError(null);

    if (values.words.length < MIN_WORDS) {
      setFormError(`Cần tối thiểu ${MIN_WORDS} từ trong một set.`);
      return;
    }

    const normalizedValues = {
      title: values.title.trim(),
      words: normalizeWords(values.words),
    };

    try {
      await onSubmit(normalizedValues);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Không thể lưu set. Vui lòng thử lại.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{heading}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

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
        rowKeys={fields?.map((field) => field.id) ?? []}
        errors={
          Array.isArray(errors.words)
            ? errors.words.reduce<
                Record<number, { meaning?: string; answer?: string }>
              >((acc, rowError, index) => {
                if (!rowError) {
                  return acc;
                }

                acc[index] = {
                  meaning: rowError.meaning?.message,
                  answer: rowError.answer?.message,
                };

                return acc;
              }, {})
            : undefined
        }
        onChange={handleWordChange}
        onExampleChange={handleExampleChange}
        onAddExample={handleAddExample}
        onRemoveExample={handleRemoveExample}
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

      <div className="flex w-full items-center justify-end gap-4">
        <button
          type="button"
          onClick={handleAddWord}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          {addWordLabel}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>

      {formError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
