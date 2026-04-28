Bạn là senior full-stack engineer. Hãy xây dựng MVP web app học từ vựng theo phương pháp active recall + spaced repetition.

Tech stack bắt buộc:

- Next.js App Router
- TypeScript
- TailwindCSS
- Firebase Authentication
- Cloud Firestore
- Deploy-ready cho Vercel
- Không dùng backend riêng
- Không dùng database khác ngoài Firestore

Mục tiêu sản phẩm:
App giúp người dùng học từ vựng theo set 7 từ. Người dùng nhập nghĩa tiếng Việt và từ tiếng Anh tương ứng. Sau đó app ẩn đáp án tiếng Anh và yêu cầu người dùng nhập lại nhiều lượt theo các thứ tự khác nhau. App lưu kết quả, trạng thái từ, lịch ôn và hiển thị những set/từ cần ôn hôm nay.

Luồng chính:

1. Authentication

- Người dùng có thể đăng nhập bằng Google qua Firebase Auth.
- Nếu chưa đăng nhập thì redirect về trang login.
- Nếu đã đăng nhập thì vào dashboard.

2. Dashboard
   Hiển thị:

- Nút “Tạo set mới”
- Danh sách set đã tạo
- Danh sách set/từ cần ôn hôm nay
- Với mỗi set hiển thị:
  - tên set
  - số lượng từ
  - ngày tạo
  - trạng thái: mới học / cần ôn / đã hoàn thành hôm nay
  - nút “Luyện tập”

3. Tạo set mới
   Route: /sets/new

Form gồm:

- title: tên set
- 7 dòng nhập từ
  Mỗi dòng có:
- meaning: nghĩa tiếng Việt
- answer: từ tiếng Anh chính
- acceptedAnswers: các đáp án khác, optional, phân tách bằng dấu phẩy

Validation:

- title không được rỗng
- đủ 7 từ
- meaning và answer của từng dòng không được rỗng
- trim khoảng trắng
- acceptedAnswers convert thành array string

Sau khi submit:

- Tạo document set trong Firestore
- Tạo 7 word documents trong subcollection words
- Redirect sang màn luyện tập ngày 0

4. Màn luyện tập
   Route: /sets/[setId]/practice

Có 2 mode:

- learn: nạp từ
- recall: luyện nhớ

Mode learn:

- Hiển thị bảng 2 cột:
  - Nghĩa tiếng Việt
  - Từ tiếng Anh
- Người dùng xem lại 7 từ vừa nhập
- Có nút “Bắt đầu luyện”
- Khi bấm, chuyển sang recall round 1

Mode recall:

- Chỉ hiển thị nghĩa tiếng Việt và ô input để nhập đáp án tiếng Anh
- Không hiển thị đáp án gốc
- Có nút “Gợi ý”
- Có nút “Kiểm tra / Tiếp tục”

Cách hoạt động recall:

- Có nhiều round luyện trong một session
- Round 1 order: [1,2,3,4,5,6,7]
- Round 2 order: [1,3,5,7,2,4,6]
- Round 3 order: [7,5,3,1,6,4,2]
- Mỗi round chỉ enable từng ô theo thứ tự hiện tại
- Người dùng phải nhập ô hiện tại trước rồi mới sang ô tiếp theo
- Sau khi nhập đủ 7 ô, nút “Kiểm tra” được enable
- Khi kiểm tra:
  - So sánh input với answer và acceptedAnswers
  - Không phân biệt hoa thường
  - Bỏ khoảng trắng đầu/cuối
  - Collapse nhiều khoảng trắng thành một
- Nếu sai:
  - Highlight ô sai màu đỏ
  - Hiển thị đáp án đúng nhỏ bên dưới sau khi check
  - Cho phép sửa và check lại
- Nếu đúng hết:
  - Lưu kết quả round
  - Chuyển sang round tiếp theo
- Sau 3 round:
  - Hoàn thành session
  - Cập nhật nextReviewAt cho set/từ
  - Redirect về trang kết quả

Nút Gợi ý:

- Khi người dùng nhấn giữ hoặc click “Gợi ý”, hiển thị mờ đáp án đúng của ô hiện tại
- Nếu dùng gợi ý thì attempt của từ đó đánh dấu usedHint = true
- Đúng nhưng dùng gợi ý không được tính là nhớ chắc

5. Trang kết quả
   Route: /sets/[setId]/result

Hiển thị:

- Tổng số round
- Số câu đúng/sai
- Những từ sai
- Những từ đã dùng gợi ý
- Trạng thái từng từ:
  - mastered
  - learning
  - weak
- Nút:
  - “Luyện lại set này”
  - “Về dashboard”

6. Spaced repetition đơn giản
   Mỗi word có:

- status: "new" | "learning" | "weak" | "mastered"
- reviewLevel: number
- nextReviewAt: timestamp
- lastReviewedAt: timestamp

Logic cập nhật:

- Nếu trả lời đúng tất cả round và không dùng gợi ý:
  - status = mastered
  - reviewLevel += 1
- Nếu đúng nhưng có dùng gợi ý:
  - status = learning
- Nếu sai:
  - status = weak
  - reviewLevel = max(0, reviewLevel - 1)

Khoảng ôn:

- reviewLevel 0: ôn lại sau 1 ngày
- reviewLevel 1: sau 2 ngày
- reviewLevel 2: sau 7 ngày
- reviewLevel 3: sau 14 ngày
- reviewLevel >= 4: sau 30 ngày

Dashboard query các set/từ có nextReviewAt <= hôm nay.

7. Firestore data model

Collection:
users/{userId}

Subcollections:

users/{userId}/sets/{setId}
Fields:

- title: string
- createdAt: timestamp
- updatedAt: timestamp
- totalWords: number
- status: "new" | "learning" | "reviewing" | "completed"
- nextReviewAt: timestamp
- lastPracticedAt: timestamp | null

users/{userId}/sets/{setId}/words/{wordId}
Fields:

- index: number
- meaning: string
- answer: string
- acceptedAnswers: string[]
- status: "new" | "learning" | "weak" | "mastered"
- reviewLevel: number
- nextReviewAt: timestamp
- lastReviewedAt: timestamp | null
- createdAt: timestamp
- updatedAt: timestamp

users/{userId}/sets/{setId}/sessions/{sessionId}
Fields:

- type: "learn" | "review"
- startedAt: timestamp
- completedAt: timestamp | null
- totalRounds: number
- score: number
- usedHintCount: number
- wrongCount: number

users/{userId}/sets/{setId}/sessions/{sessionId}/attempts/{attemptId}
Fields:

- wordId: string
- round: number
- input: string
- isCorrect: boolean
- usedHint: boolean
- createdAt: timestamp

8. Firebase security rules
   Viết file firestore.rules:

- User chỉ được đọc/ghi dữ liệu trong users/{userId} nếu request.auth.uid == userId
- Không cho user đọc/ghi dữ liệu của user khác

9. UI yêu cầu
   Style:

- Clean, minimal
- Mobile-first
- TailwindCSS
- Card layout
- Button rõ ràng
- Input dễ dùng
- Highlight lỗi màu đỏ
- Highlight đúng màu xanh
- Không làm UI quá phức tạp

Các component nên có:

- AuthGuard
- Navbar
- SetCard
- WordInputTable
- PracticeTable
- HintButton
- ResultSummary
- LoadingState
- EmptyState

10. File structure mong muốn

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

11. Yêu cầu code

- Dùng TypeScript strict
- Tách logic ra lib/
- Không hardcode Firebase config trực tiếp trong code
- Dùng .env.local với:
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
- Tạo file .env.example
- Có README hướng dẫn setup Firebase, chạy local và deploy Vercel

12. Logic quan trọng cần implement

normalizeAnswer(input):

- lowercase
- trim
- replace multiple spaces with one space

isAnswerCorrect(input, answer, acceptedAnswers):

- normalize input
- normalize answer
- normalize acceptedAnswers
- return true nếu input match answer hoặc một acceptedAnswer

generatePracticeOrders():
return [
[1,2,3,4,5,6,7],
[1,3,5,7,2,4,6],
[7,5,3,1,6,4,2]
]

calculateNextReview(reviewLevel, performance):

- Nếu wrong: +1 day
- Nếu usedHint: +2 days
- Nếu correct clean:
  - level 0: +1 day
  - level 1: +2 days
  - level 2: +7 days
  - level 3: +14 days
  - level >=4: +30 days

13. Acceptance criteria
    Hoàn thành khi:

- User login được bằng Google
- User tạo được set 7 từ
- User luyện được 3 round recall
- App check đúng/sai chính xác
- Gợi ý hoạt động và được lưu vào attempt
- Kết quả session được lưu vào Firestore
- Dashboard hiển thị set đã tạo và set cần ôn hôm nay
- Security rules đảm bảo user chỉ truy cập dữ liệu của mình
- App chạy được bằng npm run dev
- Không có lỗi TypeScript
- README đầy đủ

Hãy triển khai từng bước:

1. Khởi tạo project và dependencies
2. Cấu hình Firebase
3. Tạo types và helper functions
4. Tạo auth flow
5. Tạo dashboard
6. Tạo set creation
7. Tạo practice flow
8. Tạo result page
9. Viết Firestore rules
10. Viết README

Sau khi code xong, hãy chạy typecheck/lint nếu có thể và sửa lỗi phát sinh.
