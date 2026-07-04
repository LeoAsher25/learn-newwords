"use client";

import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { BackButton } from "@/components/BackButton";
import SetEditorForm, { MIN_WORDS } from "@/components/SetEditorForm";
import { useAuth } from "@/lib/auth";
import { createSetWithWords } from "@/lib/firestore";

function getDefaultSetTitle(): string {
  return new Date().toLocaleDateString("en-GB");
}

function NewSetContent() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <BackButton href="/dashboard" />
      </div>
      <SetEditorForm
        initialTitle={getDefaultSetTitle()}
        initialWords={[]}
        heading="Tạo set mới"
        description={`Nhập tối thiểu ${MIN_WORDS} từ gồm nghĩa tiếng Việt, đáp án tiếng Anh và ví dụ tuỳ chọn.`}
        submitLabel="Tạo set"
        submittingLabel="Đang tạo set..."
        addWordLabel="Thêm từ"
        onSubmit={async (values) => {
          if (!user) {
            throw new Error("Bạn cần đăng nhập để tạo set.");
          }

          const setId = await createSetWithWords(
            user.uid,
            values.title,
            values.words,
          );

          router.push(`/sets/${setId}/practice`);
        }}
      />
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
