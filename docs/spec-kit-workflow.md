# Spec Kit Workflow

Spec Kit hỗ trợ quy trình phát triển theo hướng đặc tả trước, triển khai sau:

```text
Ý tưởng
  ↓
spec.md          Điều gì cần xây, cho ai, tiêu chí thành công
  ↓
plan.md          Xây bằng cách nào, kiến trúc và quyết định kỹ thuật
  ↓
tasks.md         Danh sách công việc theo thứ tự phụ thuộc
  ↓
Source code      Codex thực hiện từng task và chạy kiểm thử
```

## Flow chuẩn

```text
constitution (thường chỉ cần lúc đầu dự án)
        ↓
specify
        ↓
clarify (tùy chọn)
        ↓
plan
        ↓
checklist (tùy chọn)
        ↓
tasks
        ↓
analyze (khuyến nghị)
        ↓
implement
```

## Cheat sheet câu lệnh

| Lệnh | Khi nào dùng | Kết quả chính |
|---|---|---|
| `$speckit-constitution` | Thiết lập hoặc cập nhật nguyên tắc toàn dự án | `.specify/memory/constitution.md` |
| `$speckit-specify <yêu cầu>` | Bắt đầu một feature hoặc thay đổi lớn | `spec.md`, requirements checklist và feature branch |
| `$speckit-clarify` | Spec còn mơ hồ hoặc có nhiều cách hiểu | Cập nhật câu trả lời vào `spec.md` |
| `$speckit-plan` | Spec đã rõ và cần thiết kế kỹ thuật | `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` |
| `$speckit-checklist` | Cần kiểm tra một khía cạnh như UX, security hoặc API | Checklist tùy chỉnh trong thư mục feature |
| `$speckit-tasks` | Plan đã duyệt và cần chia việc triển khai | `tasks.md` theo dependency và user story |
| `$speckit-analyze` | Trước khi code, cần tìm mâu thuẫn hoặc phần bị bỏ sót | Báo cáo tính nhất quán giữa spec, plan và tasks |
| `$speckit-implement` | Bắt đầu viết code | Thực thi và đánh dấu từng task `[X]` |
| `$speckit-taskstoissues` | Muốn đưa task lên GitHub Issues | Các GitHub issue tương ứng |

## Vai trò của từng giai đoạn

### 1. Constitution

```text
$speckit-constitution
```

Thiết lập các nguyên tắc áp dụng cho toàn dự án, chẳng hạn:

- Quy chuẩn TypeScript và Next.js.
- Yêu cầu bảo mật Firebase.
- Quy tắc kiểm thử.
- Tiêu chuẩn UX và performance.

Kết quả được lưu tại `.specify/memory/constitution.md`. Thông thường chỉ cần chạy lúc bắt đầu dự án hoặc khi nguyên tắc kỹ thuật thay đổi.

### 2. Specify

```text
$speckit-specify Thêm chế độ luyện từ bằng flashcard
```

Spec Kit sẽ:

- Tạo feature branch, ví dụ `001-flashcard-practice`.
- Tạo thư mục feature trong `specs/`.
- Viết user stories, functional requirements, edge cases và success criteria vào `spec.md`.
- Tạo checklist kiểm tra chất lượng đặc tả.

Giai đoạn này tập trung vào **cần xây cái gì**, chưa quyết định component, API hoặc cách triển khai cụ thể.

### 3. Clarify

```text
$speckit-clarify
```

Đây là bước tùy chọn. Codex xác định các phần quan trọng còn mơ hồ, hỏi những câu làm rõ cần thiết và ghi câu trả lời trở lại `spec.md`.

### 4. Plan

```text
$speckit-plan
```

Codex đọc spec, constitution và codebase hiện tại để tạo thiết kế kỹ thuật. Tùy feature, kết quả có thể gồm:

```text
specs/001-feature-name/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

Đây là lúc quyết định route, component, model, Firebase schema, thư viện và chiến lược kiểm thử. `AGENTS.md` cũng được cập nhật để trỏ tới plan hiện tại.

### 5. Checklist

```text
$speckit-checklist Tạo checklist về UX và accessibility
```

Bước tùy chọn này tạo checklist chuyên biệt để review requirements. Checklist dùng để đánh giá chất lượng yêu cầu, không thay thế cho test implementation.

### 6. Tasks

```text
$speckit-tasks
```

Biến plan thành danh sách công việc có thể thực thi:

```markdown
- [ ] T001 Chuẩn bị cấu trúc feature
- [ ] T002 [P] [US1] Tạo component trong src/components/...
- [ ] T003 [US1] Kết nối component với practice flow
- [ ] T004 [US1] Viết kiểm thử cho luồng trả lời
```

Các task được:

- Nhóm theo user story.
- Sắp xếp theo dependency.
- Đánh dấu `[P]` nếu có thể làm song song.
- Gắn đường dẫn file cụ thể.
- Chỉ rõ phạm vi MVP.

### 7. Analyze

```text
$speckit-analyze
```

Bước tùy chọn nhưng nên chạy trước khi implement. Nó kiểm tra sự nhất quán giữa `spec.md`, `plan.md` và `tasks.md`, ví dụ requirement bị thiếu task hoặc plan mâu thuẫn với constitution.

### 8. Implement

```text
$speckit-implement
```

Codex đọc toàn bộ artifacts, kiểm tra checklist, thực hiện lần lượt từng task, chạy validation và đánh dấu task hoàn thành thành `[X]`.

### 9. Tasks to Issues

```text
$speckit-taskstoissues
```

Chuyển các mục trong `tasks.md` thành GitHub Issues. Bước này dùng sau `$speckit-tasks` khi nhóm muốn quản lý công việc trên GitHub.

## Các flow thường dùng

### Feature mới đầy đủ

Phù hợp cho feature lớn hoặc yêu cầu chưa rõ:

```text
$speckit-specify Thêm chế độ luyện từ bằng flashcard
$speckit-clarify
$speckit-plan
$speckit-checklist Tạo checklist về UX và accessibility
$speckit-tasks
$speckit-analyze
$speckit-implement
```

Nên review kết quả sau `specify`, `plan` và `tasks`.

### Feature nhỏ nhưng vẫn cần tài liệu

Khi yêu cầu đã tương đối rõ:

```text
$speckit-specify Thêm bộ lọc từ vựng theo trạng thái
$speckit-plan
$speckit-tasks
$speckit-implement
```

Có thể bỏ `clarify`, `checklist` và `analyze`.

### Refactor lớn

```text
$speckit-specify Refactor spaced repetition nhưng giữ nguyên hành vi hiện tại
$speckit-clarify
$speckit-plan
$speckit-tasks
$speckit-analyze
$speckit-implement
```

Trong spec nên nói rõ:

- Hành vi nào phải giữ nguyên.
- Vấn đề hiện tại cần giải quyết.
- Phạm vi không được thay đổi.
- Tiêu chí hiệu năng và regression.

### Bug phức tạp

```text
$speckit-specify Sửa lỗi lịch ôn tập bị lệch ngày theo timezone
$speckit-plan
$speckit-tasks
$speckit-implement
```

Chỉ nên dùng Spec Kit khi bug liên quan nhiều module, yêu cầu chưa rõ hoặc cần quyết định thiết kế. Bug nhỏ đã rõ nguyên nhân thường phù hợp với prompt trực tiếp hơn.

### Chỉ thiết kế, chưa code

```text
$speckit-specify Thêm tính năng chia sẻ bộ từ
$speckit-clarify
$speckit-plan
```

Dừng tại đây để review hoặc bàn giao cho người khác.

### Chuyển kế hoạch thành GitHub Issues

```text
$speckit-specify Thêm tính năng chia sẻ bộ từ
$speckit-plan
$speckit-tasks
$speckit-taskstoissues
```

## Các lệnh Git hỗ trợ

Các lệnh này chủ yếu được Git extension gọi trong quá trình chạy workflow:

| Lệnh | Tác dụng |
|---|---|
| `$speckit-git-initialize` | Khởi tạo Git nếu dự án chưa có |
| `$speckit-git-feature` | Tạo feature branch có số thứ tự |
| `$speckit-git-validate` | Kiểm tra tên branch |
| `$speckit-git-remote` | Phát hiện Git remote |
| `$speckit-git-commit` | Commit thay đổi của một giai đoạn |

Trong repo này, `$speckit-specify` sẽ gọi hook tạo feature branch. Các hook commit là tùy chọn và tính năng auto-commit đang tắt mặc định.

## Khi nào không cần Spec Kit

Không cần dùng Spec Kit cho những thay đổi nhỏ và đã rõ cách thực hiện, ví dụ:

- Sửa typo hoặc CSS nhỏ.
- Đổi tên biến.
- Fix bug đã rõ nguyên nhân và chỉ chạm vài dòng.
- Nâng dependency đơn giản.

Quy tắc nhanh: nếu thay đổi cần thảo luận **phải làm gì**, **phạm vi đến đâu**, **thiết kế thế nào** và **chia task ra sao**, hãy dùng Spec Kit. Nếu đã biết chính xác file và thay đổi cần làm, prompt trực tiếp thường nhanh hơn.

## Cách gọi lệnh

Không cần thêm `$speckit-*` vào mọi prompt. Chỉ dùng nó khi bắt đầu một giai đoạn mới. Trong lúc Codex đang hỏi thêm hoặc đang tiếp tục cùng một giai đoạn, có thể trả lời bình thường.

Có thể gọi rõ ràng:

```text
$speckit-specify Thêm chế độ luyện từ bằng flashcard
```

Hoặc yêu cầu bằng ngôn ngữ tự nhiên:

```text
Dùng Spec Kit tạo spec cho tính năng luyện từ bằng flashcard.
```

Gọi `$speckit-*` trực tiếp sẽ giúp đảm bảo Codex chọn đúng workflow.

## Quy tắc ghi nhớ nhanh

```text
WHAT  → $speckit-specify
CLEAR → $speckit-clarify
HOW   → $speckit-plan
WORK  → $speckit-tasks
CHECK → $speckit-analyze
CODE  → $speckit-implement
```
