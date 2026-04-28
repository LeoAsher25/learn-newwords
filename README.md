# Active Recall Vocab MVP

MVP web app học từ vựng theo phương pháp Active Recall + Spaced Repetition.

## Tech stack

- Next.js App Router
- TypeScript (strict)
- TailwindCSS
- Firebase Authentication (Google Sign-in)
- Cloud Firestore
- Deploy-ready trên Vercel
- Không dùng backend riêng

## Tính năng chính

- Đăng nhập Google bằng Firebase Auth
- Dashboard:
  - Tạo set mới
  - Danh sách set đã tạo
  - Danh sách set/từ cần ôn hôm nay
- Tạo set 7 từ (`/sets/new`)
  - title
  - 7 dòng từ: `meaning`, `answer`, `acceptedAnswers`
  - validation đầy đủ + trim
- Practice flow (`/sets/[setId]/practice`)
  - Learn mode: xem bảng nghĩa/đáp án
  - Recall mode: 3 round theo thứ tự cố định
  - Gợi ý theo từ hiện tại (hold/click)
  - Check đúng/sai với normalize input
  - Lưu `sessions` + `attempts`
  - Cập nhật `status`, `reviewLevel`, `nextReviewAt`
- Result page (`/sets/[setId]/result`)
  - tổng kết round
  - từ sai
  - từ dùng gợi ý
  - trạng thái từng từ

## Cấu trúc thư mục

```txt
src/
  app/
    layout.tsx
    page.tsx
    login/page.tsx
    dashboard/page.tsx
    sets/new/page.tsx
    sets/[setId]/practice/page.tsx
    sets/[setId]/result/page.tsx
  components/
    AuthGuard.tsx
    Navbar.tsx
    SetCard.tsx
    WordInputTable.tsx
    PracticeTable.tsx
    HintButton.tsx
    ResultSummary.tsx
    LoadingState.tsx
    EmptyState.tsx
  lib/
    firebase.ts
    firestore.ts
    auth.ts
    practice.ts
    spacedRepetition.ts
    normalizeAnswer.ts
  types/
    index.ts
```

## Firestore data model

Dữ liệu được lưu theo cấu trúc:

- `users/{userId}`
- `users/{userId}/sets/{setId}`
- `users/{userId}/sets/{setId}/words/{wordId}`
- `users/{userId}/sets/{setId}/sessions/{sessionId}`
- `users/{userId}/sets/{setId}/sessions/{sessionId}/attempts/{attemptId}`

## Cài đặt local

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

3. Điền các biến Firebase vào `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. Chạy app:

```bash
npm run dev
```

App chạy tại `http://localhost:3000`.

## Setup Firebase

1. Tạo project Firebase.
2. Bật Authentication -> Sign-in method -> Google.
3. Tạo Cloud Firestore (Production hoặc Test mode tùy môi trường).
4. Tạo Web App trong Firebase Project Settings để lấy config env.
5. Cập nhật Firestore Rules từ file `firestore.rules`.

Nếu bạn dùng Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Security rules

File: `firestore.rules`

- Chỉ cho phép đọc/ghi dưới `users/{userId}` khi `request.auth.uid == userId`
- Từ chối toàn bộ paths khác.

## Deploy lên Vercel

1. Push repo lên GitHub/GitLab/Bitbucket.
2. Import project vào Vercel.
3. Set đầy đủ biến môi trường giống `.env.local` trong phần Environment Variables của Vercel.
4. Deploy.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```
