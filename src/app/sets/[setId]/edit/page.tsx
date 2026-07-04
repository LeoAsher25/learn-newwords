"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { BackButton } from "@/components/BackButton";
import LoadingState from "@/components/LoadingState";
import SetEditorForm from "@/components/SetEditorForm";
import { useAuth } from "@/lib/auth";
import { getSet, getWords, updateSetWithWords } from "@/lib/firestore";
import { SetItem, WordInput } from "@/types";

function EditSetContent() {
  const params = useParams<{ setId: string }>();
  const setId = params.setId;
  const { user } = useAuth();
  const router = useRouter();

  const [setItem, setSetItem] = useState<SetItem | null>(null);
  const [words, setWords] = useState<WordInput[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user || !setId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [nextSet, nextWords] = await Promise.all([
          getSet(user.uid, setId),
          getWords(user.uid, setId),
        ]);

        if (!nextSet || nextWords.length === 0) {
          setError("Không tìm thấy set hoặc dữ liệu từ vựng.");
          return;
        }

        setSetItem(nextSet);
        setWords(
          nextWords.map((word) => ({
            meaning: word.meaning,
            answer: word.answer,
            examples: word.examples.length > 0 ? word.examples : [""],
          })),
        );
      } catch {
        setError("Không thể tải dữ liệu set cần chỉnh sửa.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [setId, user]);

  if (loading) {
    return <LoadingState title="Đang tải set cần chỉnh sửa" />;
  }

  if (error || !setItem || !words) {
    return (
      <p className="text-sm text-red-600">
        {error ?? "Không thể tải dữ liệu set."}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <BackButton href="/dashboard" />
      </div>

      <SetEditorForm
        initialTitle={setItem.title}
        initialWords={words}
        heading="Chỉnh sửa set"
        description="Cập nhật tên set, nghĩa, đáp án và các ví dụ cho từng từ. Khi lưu, dữ liệu hiện tại của set sẽ được thay thế bằng nội dung mới."
        submitLabel="Lưu thay đổi"
        submittingLabel="Đang lưu..."
        addWordLabel="Thêm từ"
        onSubmit={async (values) => {
          if (!user) {
            throw new Error("Bạn cần đăng nhập để chỉnh sửa set.");
          }

          await updateSetWithWords(
            user.uid,
            setItem.id,
            values.title,
            values.words,
          );
          router.push(`/sets/${setItem.id}/practice`);
        }}
      />
    </div>
  );
}

export default function EditSetPage() {
  return (
    <AuthGuard>
      <EditSetContent />
    </AuthGuard>
  );
}
