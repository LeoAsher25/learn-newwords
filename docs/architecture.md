# Architecture

## High-level

App dùng kiến trúc client-first:

- Next.js App Router render UI và routing.
- Firebase SDK chạy phía client cho Auth + Firestore.
- Không có backend riêng.

## Các layer

### 1) UI Layer

- Nằm ở `src/app/*` và `src/components/*`.
- Route pages chịu trách nhiệm orchestration state/loading/error.
- Components tập trung vào render + callback.

### 2) Domain/Logic Layer

- `src/lib/normalizeAnswer.ts`: normalize và so khớp đáp án.
- `src/lib/practice.ts`: sinh thứ tự round luyện tập.
- `src/lib/spacedRepetition.ts`: tính lịch ôn tiếp theo.

### 3) Data Access Layer

- `src/lib/firebase.ts`: khởi tạo app/auth/db từ env.
- `src/lib/firestore.ts`: toàn bộ CRUD/query/batch write cho sets/words/sessions/attempts.

## Auth strategy

- `AuthProvider` theo dõi `onAuthStateChanged`.
- App không chờ Firestore để xác nhận auth state (tránh kẹt loading UX).
- `AuthGuard` bảo vệ các page yêu cầu đăng nhập.

## Tối ưu/đánh đổi hiện tại

- Ưu tiên đơn giản và trực quan cho MVP.
- Một số query có thể N+1 (ví dụ due summaries) và có thể tối ưu ở phiên bản sau.
