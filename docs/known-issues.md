# Known Issues & Operational Notes

## Firestore `channel?...` requests

- Đây là hành vi bình thường của Firestore Web SDK (WebChannel).
- Nhiều request không đồng nghĩa app lỗi.

## `CONFIGURATION_NOT_FOUND` khi login Google

Nguyên nhân thường gặp:

- Firebase Auth chưa bật Google provider.
- Authorized domains chưa đủ (`localhost`, `<project>.firebaseapp.com`).
- API key/project bị mismatch hoặc bị restrict sai ở Google Cloud.

## Auth loading bị treo (đã xử lý)

Đã áp dụng:

- Không block auth state bởi Firestore call.
- `ensureUserDocument` chạy nền để UI phản hồi nhanh.

## Offline errors khi bootstrap user (đã giảm nhiễu)

Đã áp dụng:

- Tránh read-before-write trong `ensureUserDocument`.
- Bỏ log lỗi cho case tạm thời unavailable để không spam terminal.

## Hướng tối ưu tiếp theo

- Giảm N+1 query ở dashboard due summaries.
- Bổ sung telemetry nhẹ cho latency (Auth init, dashboard load, create set).
- Thêm UI fallback rõ ràng hơn cho trạng thái mạng yếu/offline.
