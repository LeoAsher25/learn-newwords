# Data Model (Firestore)

## Root

- `users/{userId}`

## Subcollections

- `users/{userId}/sets/{setId}`
- `users/{userId}/sets/{setId}/words/{wordId}`
- `users/{userId}/sets/{setId}/sessions/{sessionId}`
- `users/{userId}/sets/{setId}/sessions/{sessionId}/attempts/{attemptId}`

## Set document

Các field chính:

- `title`, `totalWords`
- `status`: `new | learning | reviewing | completed`
- `createdAt`, `updatedAt`
- `nextReviewAt`, `lastPracticedAt`
- `lastSessionId`

## Word document

Các field chính:

- `index`, `meaning`, `answer`, `acceptedAnswers`
- `status`: `new | learning | weak | mastered`
- `reviewLevel`
- `nextReviewAt`, `lastReviewedAt`
- `createdAt`, `updatedAt`

## Session document

Các field chính:

- `type`: `learn | review`
- `startedAt`, `completedAt`
- `totalRounds`, `score`, `wrongCount`, `usedHintCount`

## Attempt document

Các field chính:

- `wordId`, `round`
- `input`
- `isCorrect`, `usedHint`
- `createdAt`

## Security rules

`firestore.rules` giới hạn truy cập:

- User chỉ đọc/ghi dưới `users/{userId}` khi `request.auth.uid == userId`.
- Từ chối mọi đường dẫn khác.
