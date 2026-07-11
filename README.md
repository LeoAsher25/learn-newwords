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

Repo này là **Next.js App Router** — Vercel nhận diện tự động; file `vercel.json` chỉ cố định `install`/`build` chuẩn npm.

### Trước khi deploy

1. Đảm bảo production build chạy được:

   ```bash
   npm run build
   ```

2. **Firestore** đã được tạo trong Firebase Console và rules đã publish (không để rule `allow read, write: if false` cho toàn bộ DB).

### Kết nối repo và deploy

1. Push code lên GitHub / GitLab / Bitbucket.
2. Vào [Vercel Dashboard](https://vercel.com) → **Add New…** → **Project** → Import repo.
3. **Framework Preset**: Next.js (mặc định).
4. **Root Directory**: `./` (giữ nguyên nếu không monorepo).
5. **Build Command**: `npm run build` (trùng với `vercel.json`).
6. **Output Directory**: để trống (Vercel xử lý Next.js).

### Biến môi trường trên Vercel

Trong **Project → Settings → Environment Variables**, thêm **cùng bộ** như `.env.example` / `.env.local`:

| Name                                       | Environment                      |
| ------------------------------------------ | -------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Production, Preview, Development |

Sau khi lưu → **Redeploy** (hoặc push commit mới) để build nhận env.

### Firebase + domain Vercel (bắt buộc cho đăng nhập Google)

1. **Authentication → Settings → Authorized domains**: thêm domain deploy, ví dụ:
   - Production: `ten-du-an.vercel.app`
   - Custom domain (nếu có): `hoc-tu.example.com`

2. Mỗi **Preview deployment** có URL riêng (`*.vercel.app`). Nếu cần test OAuth trên preview, thêm từng hostname preview vào Authorized domains (Firebase không hỗ trợ wildcard đầy đủ cho mọi preview).

3. **Google Cloud Console** (Credentials → API key của Web client): nếu key bị giới hạn HTTP referrer, thêm origin `https://ten-du-an.vercel.app` (và preview nếu dùng).

### Kiểm tra sau deploy

- Mở URL production → Login Google → Dashboard → tạo set → practice (Firestore ghi được).

### CLI (tuỳ chọn)

```bash
npm i -g vercel
vercel login
vercel link   # trong thư mục project
vercel env pull .env.vercel.local   # đồng bộ env về máy (tuỳ chọn)
vercel --prod
```

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
npm run reminder:send
```

## Email reminder flow

Reminder được triển khai theo hướng server-side batch:

- User lưu cài đặt reminder trong `users/{uid}.reminderSettings`.
- Mỗi lần set thay đổi lịch ôn, app cập nhật `users/{uid}.reminderNextDueAt` (mốc sớm nhất).
- Job `scripts/send-reminders.ts` quét user có `reminderNextDueAt` gần hạn và gửi email.
- GitHub Actions chạy job định kỳ tại `.github/workflows/send-reminders.yml`.

### Biến môi trường cho reminder sender

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
REMINDER_FROM_EMAIL=no-reply@example.com
APP_BASE_URL=https://learn-newwords.vercel.app
```

### Chạy local (dry-run)

```bash
npm run reminder:send -- --dry-run --max-users=20
```
