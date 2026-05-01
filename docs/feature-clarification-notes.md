# Learn New Words - Feature Clarification Notes

Tài liệu này tổng hợp các tính năng hiện có, những quyết định logic đã chốt trong code, và các điểm còn phân vân cần clarify với khách hàng.

## 1) Xác thực người dùng

### Hiện có
- Đăng nhập Google.
- Tạo/cập nhật user document khi đăng nhập.
- Mọi dữ liệu học nằm dưới `users/{userId}`.

### Cần clarify
- Có cần thêm đăng nhập bằng email/password hay provider khác không.
- Có cần profile công khai/chia sẻ hay chỉ dùng nội bộ cá nhân.

---

## 2) Tạo set từ vựng

### Hiện có
- Tạo set mới với tối thiểu 5 từ.
- Input gồm: nghĩa tiếng Việt + từ tiếng Anh.
- Sau khi tạo xong có thể vào luyện ngay.

### Cần clarify
- Có cần cho phép set dưới 5 từ không.
- Có cần chống trùng từ trong cùng set không.
- Có cần import CSV/Excel không.

---

## 3) Luyện tập (Practice Session)

### Hiện có
- Session nhiều round (3 round).
- Có hint, ghi nhận wrong/hint/correct.
- Lưu attempts + metrics (score, wrongCount, usedHintCount).
- Hoàn thành session sẽ cập nhật trạng thái từ/set và lịch ôn.

### Cần clarify
- Có cần cho user tự chọn số round không.
- Có cần chế độ học nhanh (bỏ round) không.
- Có cần hiển thị giải thích vì sao từ bị đánh `weak/learning/mastered` không.

---

## 4) Spaced Repetition & lịch ôn

### Hiện có
- Thang interval khi làm đúng sạch (`correctClean`): 1, 2, 3, 7, 14, 30 ngày.
- Sai hoặc dùng hint: lịch gần (`+1 ngày`).
- Có cấu hình `dueMode`:
  - `precise_ms`
  - `cross_day`
  - `fixed_time`
- Có lưu `timezone` và `fixedReviewTime`.

### Rule đã chốt trong code
- **Fixed time cutoff rule**: nếu chưa qua mốc fixed time hôm nay thì cutoff vẫn là mốc hôm qua.
- **Option đang dùng để xử lý ôn lặp**:  
  - **Option 2** = chỉ cập nhật SRS khi item đang due.
  - Nếu item chưa due mà user ôn thêm thì giữ nguyên `status/reviewLevel/nextReviewAt`.

### Cần clarify
- Khi item chưa due mà user làm sai, có nên vẫn cho giảm level hay vẫn giữ nguyên hoàn toàn.
- Có cần migration/backfill dữ liệu cũ (`nextReviewAt`) khi đổi mode không.
- `timezone` hiện đang được lưu, nhưng cần xác nhận business kỳ vọng timezone theo profile user hay theo timezone thiết bị mỗi lần truy cập.

---

## 5) Dashboard

### Hiện có
- Learning path hôm nay:
  - Quá hạn
  - Đến hạn hôm nay
  - Đã luyện hôm nay
- Khu `Cần ôn hôm nay` hiển thị số từ đến hạn theo set.
- Khu `Kế hoạch 7 ngày tới` hiển thị mốc "Ôn lại vào" (đã có ngày + giờ/phút).
- Khu `Tất cả set` hiển thị card tổng quan, có badge trạng thái phụ (quá hạn / learning-reviewing).
- Card `Cần ôn hôm nay` có dòng `Ôn lần cuối`.

### Cần clarify
- `Cần ôn hôm nay` hiện đang bao gồm cả overdue; có cần đổi tên khu để tránh hiểu nhầm không.
- `Kế hoạch 7 ngày tới` hiện chưa hiển thị số từ đến hạn tương lai; có cần backend trả thêm field này không.

---

## 6) Cài đặt (Settings)

### Hiện có
- Có trang `Cài đặt` riêng.
- View mode -> bấm `Cập nhật` -> Edit form.
- Có `Huỷ` / `Lưu`.
- Lưu config theo user (`reviewScheduleSettings`).
- Chọn `fixed_time` thì hiện input chọn giờ.

### Cần clarify
- Có cần onboarding bắt buộc chọn mode/timezone từ lần đầu không.
- Có cần lịch sử thay đổi cài đặt (audit) không.

---

## 7) Form handling

### Hiện có
- Các form chính đã chuyển sang `react-hook-form`.
- Validate hiển thị realtime tốt hơn so với state thủ công.

### Cần clarify
- Có cần chuẩn hóa toàn bộ rule validate bằng schema (`zod`) để dễ maintain không.

---

## 8) Các điểm có thể gây tranh luận nghiệp vụ

1. Định nghĩa "đến hạn hôm nay" vs "quá hạn" theo ngày hay theo mốc giờ.
2. User ôn thêm khi chưa due có được ảnh hưởng lịch hay không (**hiện đang khóa theo Option 2**).
3. Khi đổi cấu hình schedule, có áp dụng hồi tố cho dữ liệu cũ không.
4. `fixed_time` nên ưu tiên timezone profile hay timezone runtime của thiết bị.

---

## Kết luận ngắn để trao đổi với khách hàng

- Hiện hệ thống đã có đầy đủ flow học/ôn/cài đặt lịch.
- Logic nhạy cảm nhất là SRS và due calculation đã chọn:
  - **Fixed time cutoff**: chưa qua mốc hôm nay -> dùng mốc hôm qua.
  - **Ôn lặp khi chưa due**: **Option 2** (không đổi lịch).
- Cần khách hàng chốt rõ các điểm hồi tố dữ liệu cũ, timezone, và hành vi khi luyện thêm ngoài kỳ due.
