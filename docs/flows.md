# Core Flows

## 1) Authentication

1. Người dùng vào app.
2. `AuthProvider` nhận auth state từ Firebase.
3. Nếu chưa đăng nhập -> chuyển `/login`.
4. Nếu đã đăng nhập -> vào `/dashboard`.

## 2) Dashboard

- Tải danh sách set của user.
- Tải danh sách set đến hạn ôn.
- Hiển thị CTA tạo set mới và danh sách set hiện có.

## 3) Create Set (`/sets/new`)

1. Người dùng nhập `title` + 7 từ.
2. Validate và normalize dữ liệu (trim, parse accepted answers).
3. Ghi 1 set + 7 words bằng batch write.
4. Redirect sang practice của set vừa tạo.

## 4) Practice (`/sets/[setId]/practice`)

### Learn mode

- Hiển thị bảng 2 cột nghĩa/đáp án để xem lại.
- Bấm "Bắt đầu luyện" để tạo session.

### Recall mode

- 3 round với order cố định từ `generatePracticeOrders()`.
- Chỉ cho nhập theo thứ tự ô đang active.
- Check đáp án bằng `isAnswerCorrect()`.
- Có hint; dùng hint được lưu vào attempts.
- Nếu sai: highlight và cho check lại.
- Hoàn tất 3 round -> cập nhật word status + review schedule + session metrics.

## 5) Result (`/sets/[setId]/result`)

- Hiển thị tổng kết session: score, wrong count, used hint count.
- Liệt kê từ sai, từ dùng gợi ý, trạng thái từng từ.
- Cho phép luyện lại set hoặc quay dashboard.
