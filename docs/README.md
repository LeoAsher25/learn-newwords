# Project Documentation

Tài liệu này mô tả những gì đang có trong project `learn-newwords` ở thời điểm hiện tại, bám theo code đã triển khai.

## Danh mục

- `overview.md`: Tổng quan sản phẩm, tech stack, cấu trúc thư mục.
- `architecture.md`: Kiến trúc app theo App Router + Firebase client SDK.
- `data-model.md`: Mô hình dữ liệu Firestore và ý nghĩa từng collection.
- `flows.md`: Các luồng chính (auth, dashboard, tạo set, practice, result).
- `known-issues.md`: Các lưu ý vận hành, lỗi thường gặp, và hướng xử lý.

## Lưu ý

- Đây là tài liệu kỹ thuật nội bộ, phản ánh code hiện tại (không phải bản product spec).
- Khi đổi logic nghiệp vụ ở `src/lib/*` hoặc route trong `src/app/*`, hãy cập nhật lại docs tương ứng.
