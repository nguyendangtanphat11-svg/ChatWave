# ChatWave Database Reference

Tài liệu này được đối chiếu từ `database/chatwave_latest.sql`, các file trong `database/migrations/`, và các truy vấn của backend hiện đang chạy. Mục tiêu là phân biệt rõ schema có trong dump với table thực sự được mã backend sử dụng.

## Phạm vi và cách đọc

- Driver hiện dùng `mysql2/promise`; các biến kết nối là `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`.
- `database/chatwave_latest.sql` là **snapshot import** của database `chatwave` tại thời điểm dump, không phải migration runner. Nó có dữ liệu mẫu/thực tế cũ, vì vậy phải được xử lý như dữ liệu nhạy cảm và không dùng làm credential/fixture mới.
- Các migrations hiện là SQL thẳng, không có bảng theo dõi version. Nhiều câu lệnh không idempotent. Không chạy cả dump cuối cùng lẫn các migration tương ứng trên cùng schema mà không kiểm tra trước, vì sẽ gặp lỗi “table/column already exists”.
- “ACTIVE” bên dưới nghĩa là backend hiện có truy vấn table đó (`server.js`, controller hoặc middleware). “LEGACY/UNUSED” nghĩa là table có trong dump nhưng không có truy vấn backend hiện tại; đây không khẳng định dữ liệu có thể xóa an toàn.

## Quan hệ chính

```text
users
 ├─< friend_requests >─ users
 ├─< friend_messages (sender_id, receiver_id) >─ users
 ├─< friend_message_deletions >─ friend_messages
 ├─< posts
 │   ├─< post_likes >─ users
 │   └─< post_comments >─ users
 └─< [legacy: matches, reports]
```

Random chat hiện ghép cặp trong bộ nhớ của Socket.IO (`waitingQueue` và `activeMatches`), không ghi vào `matches` hoặc `messages`.

## Bảng ACTIVE

### `users`

Nguồn: schema dump và toàn bộ xác thực/hồ sơ/socket presence.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `id` | `INT`, PK, auto increment | ID người dùng, được đặt trong JWT và dùng làm khóa ngoại. |
| `username` | `VARCHAR(50)`, unique, not null | Tên hiển thị/định danh đăng nhập; profile update và search sử dụng. |
| `fullName` | `VARCHAR(100)`, nullable | Tên đầy đủ hiển thị ở profile, friend, post, socket call. |
| `email` | `VARCHAR(100)`, unique, not null | Đăng nhập local/đối chiếu Google. |
| `password` | `VARCHAR(255)`, not null | Hash bcrypt cho local login; Google user đang được tạo với chuỗi rỗng. Không bao giờ trả cột này trong API. |
| `avatar` | `VARCHAR(255)`, default `default.png` | URL/path avatar. |
| `cover_image` | `VARCHAR(255)`, nullable | URL/path ảnh bìa, API alias thành `coverImage`. |
| `gender` | enum `Nam`, `Nữ`, `Khác` | Lọc random match và validate profile update. |
| `country` | `VARCHAR(2)`, default `VN` | Lọc random match; route cập nhật hồ sơ canonical giới hạn các code đang hỗ trợ. |
| `status` | enum `online`, `offline` | Login/logout và Socket.IO presence cập nhật. |
| `created_at` | timestamp | Thời điểm tạo. |
| `updated_at` | timestamp, auto-update | Thời điểm cập nhật schema-level. |
| `provider` | enum `local`, `google` | Nguồn đăng nhập. |

### `friend_requests`

Nguồn: friend controller, message authorization, post visibility và socket presence/call authorization.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `id` | `INT`, PK, auto increment | ID lời mời. |
| `sender_id` | `INT`, FK → `users.id`, cascade delete | Người gửi lời mời. |
| `receiver_id` | `INT`, FK → `users.id`, cascade delete | Người nhận lời mời. |
| `status` | enum `pending`, `accepted`, `rejected`; default `pending` | Quan hệ chỉ được xem là bạn bè khi `accepted`. Code từ chối hiện xóa row thay vì lưu `rejected`. |
| `created_at` | timestamp | Thời điểm tạo lời mời. |

Index tồn tại trên `sender_id` và `receiver_id`. Hiện schema không có unique constraint cho một cặp user; controller kiểm tra trước khi insert nhưng không thay thế được ràng buộc ở mức CSDL khi có race condition.

### `friend_messages`

Nguồn: REST message controller và Socket.IO relay của friend chat.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `id` | `BIGINT`, PK, auto increment | ID message. |
| `conversation_id` | `VARCHAR(64)`, not null | Cặp ID đã chuẩn hóa theo thứ tự số, ví dụ `12_37`. |
| `sender_id` | `INT`, FK → `users.id`, cascade delete | Người gửi. |
| `receiver_id` | `INT`, FK → `users.id`, cascade delete | Người nhận. |
| `message` | `TEXT`, not null | Nội dung do REST tạo; payload socket được reload từ row này thay vì tin dữ liệu client. |
| `created_at` | timestamp | Thứ tự lịch sử. |
| `recalled_at` | timestamp, nullable | Soft recall; API trả nội dung rỗng khi đã recall. |

Index `(conversation_id, created_at)` phục vụ tải lịch sử; các index khóa ngoại tồn tại trên sender/receiver.

### `friend_message_deletions`

Nguồn: thao tác “xóa cho tôi” của REST message.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `message_id` | `BIGINT`, FK → `friend_messages.id`, cascade delete | Message bị ẩn với một user. |
| `user_id` | `INT`, FK → `users.id`, cascade delete | Người ẩn message. |
| `deleted_at` | timestamp | Thời điểm ẩn. |

Khóa chính ghép `(message_id, user_id)` đảm bảo một user chỉ có một record xóa riêng cho mỗi message.

### `posts`

Nguồn: post controller, thống kê user và Socket.IO event post.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `id` | `BIGINT`, PK, auto increment | ID post. |
| `user_id` | `INT`, FK → `users.id`, cascade delete | Tác giả và căn cứ cấp quyền. |
| `content` | `TEXT`, nullable | Nội dung text; post phải có text hoặc image ở controller. |
| `image` | `VARCHAR(255)`, nullable | Path ảnh uploaded. |
| `recalled_at` | `DATETIME`, nullable | Soft recall. Feed/interactions loại post này; danh sách “mine” vẫn trả nó để UI biết trạng thái. |
| `created_at` | timestamp | Dùng sắp xếp feed; có index `idx_posts_created`. |

### `post_likes`

Nguồn: toggle like, post aggregate và thống kê số like nhận được.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `post_id` | `BIGINT`, FK → `posts.id`, cascade delete | Post được thích. |
| `user_id` | `INT`, FK → `users.id`, cascade delete | Người thích. |

Khóa chính ghép `(post_id, user_id)` giới hạn một lượt thích cho mỗi cặp user/post.

### `post_comments`

Nguồn: create/list/recall comment, post aggregate và thống kê user.

| Cột | Kiểu / ràng buộc | Vai trò hiện tại |
| --- | --- | --- |
| `id` | `BIGINT`, PK, auto increment | ID comment. |
| `post_id` | `BIGINT`, FK → `posts.id`, cascade delete | Post chứa comment. |
| `user_id` | `INT`, FK → `users.id`, cascade delete | Tác giả comment. |
| `content` | `TEXT`, not null | Nội dung comment. |
| `recalled_at` | `DATETIME`, nullable | Soft recall; list giữ row nhưng API che nội dung. |
| `created_at` | timestamp | Thứ tự comment. |

Schema có index trên `post_id` và `user_id`.

## Bảng LEGACY / UNUSED bởi backend hiện tại

| Bảng | Có trong dump | Tình trạng theo source hiện tại | Lưu ý |
| --- | --- | --- | --- |
| `matches` | Có | Không có truy vấn backend | Random match dùng map trong bộ nhớ Socket.IO, nên table này không lưu session hiện tại. |
| `messages` | Có | Không có truy vấn backend | Friend chat dùng `friend_messages`; random chat chỉ relay qua socket, không persist. |
| `reports` | Có | Không có route/controller/truy vấn backend | Chức năng report chưa được triển khai trong backend hiện tại. |

Không xóa các bảng này chỉ vì trạng thái trên: có thể còn dữ liệu lịch sử hoặc sử dụng ngoài repository. Hãy tạo backup và kiểm tra production workload trước mọi migration/destructive change.

## Migrations có trong repository

| File | Thay đổi schema | Ghi chú phụ thuộc |
| --- | --- | --- |
| `20260802_add_posts.sql` | Tạo `posts` | Cần `users` đã tồn tại. |
| `20260802_add_post_interactions.sql` | Tạo `post_likes`, `post_comments` | Cần `posts` và `users`. |
| `20260802_add_post_recall.sql` | Thêm `posts.recalled_at` | Chạy sau khi có `posts`. |
| `20260802_add_comment_recall.sql` | Thêm `post_comments.recalled_at` | Chạy sau khi có `post_comments`. |
| `20260802_add_friend_messages.sql` | Tạo `friend_messages` (`IF NOT EXISTS`) | Cần `users`. |
| `20260802_add_message_controls.sql` | Thêm `friend_messages.recalled_at`; tạo `friend_message_deletions` | Chạy sau `friend_messages`. |
| `20260802_add_user_country.sql` | Thêm `users.country` | Cần `users`. |
| `20260802_add_profile_cover.sql` | Thêm `users.cover_image`, `users.updated_at` | Cần `users`. |

Tên file cùng ngày không tự thể hiện thứ tự an toàn. Với một database cũ, cần kiểm tra schema hiện hữu rồi áp dụng dependency order; với database mới, dùng dump cuối cùng **hoặc** một migration baseline được kiểm chứng, không áp dụng chồng mù quáng.

## Ghi chú vận hành và dữ liệu

- CSDL lưu metadata/path upload, còn bytes tệp nằm trong `server/uploads/`; đây là local disk nên không có độ bền hay shared storage giữa nhiều instance.
- Foreign key cascade hiện có cho các quan hệ user → friend/message/post và post → like/comment. Xóa user/post ở tầng CSDL sẽ kéo theo dữ liệu phụ thuộc theo schema; controller post delete cũng dựa vào cascade đó.
- Các trường `message` và `content` là `TEXT`; controller đảm nhiệm validation tối thiểu (trim/non-empty ở luồng tạo tương ứng), không có schema-level length policy bổ sung.
- Query hiện tại dựa vào schema MySQL trong dump. Trước deploy cần xác nhận charset/collation đã dùng cho enum tiếng Việt (`Nữ`, `Khác`) khớp với database đích.
