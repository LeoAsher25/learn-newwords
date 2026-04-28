# Overview

## Mục tiêu sản phẩm

`learn-newwords` là MVP học từ vựng theo phương pháp:

- Active recall (người dùng tự nhập lại đáp án)
- Spaced repetition (lên lịch ôn theo mức độ nhớ)

## Tech stack

- Next.js App Router + React
- TypeScript (`strict`)
- TailwindCSS
- Firebase Authentication (Google Sign-in)
- Cloud Firestore

## Cấu trúc chính

- `src/app`: route pages (`/login`, `/dashboard`, `/sets/new`, `/sets/[setId]/practice`, `/sets/[setId]/result`)
- `src/components`: UI components dùng lại
- `src/lib`: business logic, Firebase init, Firestore operations
- `src/types`: kiểu dữ liệu dùng chung
- `firestore.rules`: security rules cho Firestore

## Trạng thái hiện tại

- Đã có đầy đủ flow MVP từ login đến practice/result.
- Practice UI đã được chuyển sang bảng 2 cột theo spec.
- Auth init đã được tối ưu để không block UI khi Firestore chậm/offline.
