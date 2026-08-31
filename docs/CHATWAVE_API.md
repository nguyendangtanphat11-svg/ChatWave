# ChatWave API Reference

Tài liệu này mô tả các HTTP endpoint **đang được mount** bởi `server/server.js` tại thời điểm cập nhật tài liệu. Đây là tài liệu theo mã nguồn, không phải một hợp đồng OpenAPI đã được kiểm thử bằng môi trường production.

## Quy ước chung

- Base URL: `${API_URL}` (mặc định backend chạy cổng `5000`); các endpoint bên dưới đã bao gồm tiền tố `/api`.
- Nội dung JSON dùng `Content-Type: application/json`, trừ các endpoint ghi `multipart/form-data`.
- Mọi endpoint ghi **Có** tại cột Auth yêu cầu header `Authorization: Bearer <JWT>`.
- JWT do đăng nhập trả về, chỉ mang `id` người dùng và được backend ký với thời hạn 30 ngày. Middleware cũng kiểm tra người dùng đó còn tồn tại trong bảng `users`.
- Lỗi thường trả về `{ "message": "..." }`. Mã `500` biểu thị lỗi máy chủ; bảng chỉ liệt kê các trường hợp lỗi/validation thể hiện rõ trong controller, không phải danh sách tuyệt đối.
- Các ID đường dẫn phải là ID nội bộ trong CSDL, không phải `username`.

## Endpoint gốc và tệp tĩnh

| Method | Path | Auth | Mô tả / phản hồi chính |
| --- | --- | --- | --- |
| GET | `/` | Không | Health text đơn giản của Express server. |
| GET | `/uploads/:path` | Không ở tầng static middleware | Phục vụ tệp đã upload. `X-Content-Type-Options: nosniff` được đặt; tệp trong `/uploads/files` có `Content-Disposition: attachment`. Client chỉ nên sử dụng URL do API trả về. |

## Xác thực — `/api/auth`

| Method | Path | Auth | Request | Phản hồi thành công |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Không | `{ username, email, password, gender? }` | `201 { message }`. Backend kiểm tra thiếu trường bắt buộc và email/username trùng. `gender` mặc định là `Khác` nếu không gửi. |
| POST | `/api/auth/login` | Không | `{ email, password }` | `200 { message, token, user }`; `user` có `id`, `username`, `email`, `avatar`, `gender`, `country`, `status`, `provider`. |
| POST | `/api/auth/google` | Không | `{ credential }`, là Google ID credential | `200 { token, user }` sau khi Google credential được xác minh với `GOOGLE_CLIENT_ID`. |
| POST | `/api/auth/logout` | Có | Không cần body | `200 { message }`; cập nhật trạng thái người dùng thành `offline`. |

Các lỗi đáng chú ý: login thiếu thông tin trả `400`, sai tài khoản/mật khẩu trả `401`; đăng ký trùng/trống trả `400`. Lỗi xác minh Google hiện được trả `500` bởi controller.

## Người dùng và hồ sơ — `/api/users`

| Method | Path | Auth | Request | Phản hồi thành công / quyền |
| --- | --- | --- | --- | --- |
| GET | `/api/users/profile` | Có | — | Hồ sơ của chính người gọi: `id`, `username`, `email`, `avatar`, `coverImage`, `gender`, `country`, `provider`, `status`, `fullName`, `created_at`, `updatedAt`. |
| GET | `/api/users/statistics` | Có | — | `{ friends, posts, receivedLikes, receivedComments, messages }`. Các số đếm được tính từ dữ liệu hiện có. |
| GET | `/api/users/public/:id` | Có | — | Hồ sơ công khai rút gọn của bản thân hoặc bạn bè đã được chấp nhận. Người không phải bạn bè nhận `403`. |
| GET | `/api/users/public/:id/friends` | Có | — | `{ friends: [...] }`, tối đa 24 bạn bè của chính người gọi hoặc của người đã là bạn bè với người gọi. |
| PUT | `/api/users/profile` | Có | `{ username, fullName?, gender, country? }` | `{ message, user }`. `username` không được rỗng; `gender` phải là `Nam`, `Nữ` hoặc `Khác`; `country` (nếu có) thuộc `VN`, `US`, `JP`, `KR`, `GB`, `AU`, `CA`. Username trùng trả `409`. |
| PUT | `/api/users/password` | Có | `{ currentPassword, newPassword }` | `{ message }`. Mật khẩu mới tối thiểu 6 ký tự, tối đa 72 byte UTF-8. Tài khoản không có mật khẩu cục bộ (ví dụ Google) không hỗ trợ thao tác này. |
| PUT | `/api/users/avatar` | Có | `multipart/form-data`, trường `image` | `{ message, user }`; thay avatar của người gọi. |
| PUT | `/api/users/cover` | Có | `multipart/form-data`, trường `cover` | `{ message, user }`; thay ảnh bìa của người gọi. |
| GET | `/api/users/search?query=...` | Có | Query `query` bắt buộc | Mảng `{ id, username, avatar, status }`, loại trừ chính người gọi. |

### Quy tắc upload ảnh cho avatar/cover

- Avatar dùng cùng giới hạn ảnh thường: tối đa 5 MiB.
- Cover tối đa 10 MiB.
- Chấp nhận JPEG/JPG, PNG, WEBP, GIF khi MIME type, phần mở rộng và chữ ký đầu tệp phù hợp.

## Bạn bè — `/api/friends`

| Method | Path | Auth | Request | Phản hồi thành công / quyền |
| --- | --- | --- | --- | --- |
| GET | `/api/friends/status/:id` | Có | — | `{ status }`, có thể là `self`, `none`, `friends`, `request_sent`, hoặc `request_received`; hai trạng thái request có thêm `requestId`. |
| POST | `/api/friends/send` | Có | `{ receiverId }` | `200 { message }`. Không thể gửi cho chính mình hoặc tạo quan hệ đã tồn tại. |
| POST | `/api/friends/respond` | Có | `{ requestId, status }` | `200 { message }`. Chỉ người nhận lời mời có thể phản hồi; `status` là `accepted` hoặc `rejected`. Từ chối xóa lời mời, chấp nhận đổi trạng thái thành `accepted`. |
| GET | `/api/friends/list` | Có | — | `{ friends, pendingRequests }`. Mỗi friend gồm thông tin hiển thị; pending request gồm `requestId` và người gửi. |
| DELETE | `/api/friends/:id` | Có | — | `204 No Content`; chỉ xóa quan hệ bạn bè đã được chấp nhận với ID đó. |

Các mutation bạn bè cũng có thể phát Socket.IO event vào room của người liên quan; xem `CHATWAVE_SOCKET_EVENTS.md` để biết luồng realtime.

## Tin nhắn bạn bè — `/api/messages`

`matchId` của REST message là ID hội thoại dạng hai user ID, ví dụ `12_37`. Controller chuẩn hóa thứ tự số trước khi truy vấn. Người gọi phải là một trong hai ID và hai người phải là bạn bè đã được chấp nhận.

| Method | Path | Auth | Request | Phản hồi thành công / quyền |
| --- | --- | --- | --- | --- |
| GET | `/api/messages/:matchId` | Có | — | `{ messages }`; bỏ qua các message mà chính người gọi đã “xóa cho tôi”. Message đã thu hồi có `recalled: true` và nội dung rỗng. |
| POST | `/api/messages/send` | Có | `{ receiverId, message }` | `201 { message }`; chỉ gửi cho bạn bè, `message` phải có nội dung sau khi trim. |
| PATCH | `/api/messages/:id/recall` | Có | — | `{ message }`; chỉ người gửi mới được thu hồi, một message chỉ thu hồi một lần. |
| DELETE | `/api/messages/:id` | Có | — | `204 No Content`; chỉ ghi nhận xóa riêng cho người gọi, không xóa bản ghi của người còn lại. |

Định dạng một message trả về: `{ id, matchId, senderId, receiverId, message, recalled, createdAt }`.

## Bài viết — `/api/posts`

Post trong code hiện có phạm vi xem là **tác giả và bạn bè đã được chấp nhận**. Feed, xem post của người khác, like và comment đều áp dụng kiểm tra này; post bị thu hồi không còn là post có thể tương tác. Với ID post không tồn tại, đã thu hồi hoặc không có quyền, các thao tác tương tác trả cùng `404` để không làm lộ trạng thái post.

| Method | Path | Auth | Request | Phản hồi thành công / quyền |
| --- | --- | --- | --- | --- |
| GET | `/api/posts/feed` | Có | — | `{ posts }`; post của chính người gọi và bạn bè, chưa thu hồi, tối đa 50, mới trước. |
| GET | `/api/posts/mine` | Có | — | `{ posts }`; tất cả post của chính người gọi, gồm cả post đã thu hồi để UI có thể biểu thị trạng thái đó. |
| GET | `/api/posts/user/:id` | Có | — | `{ posts }`; chỉ bản thân hoặc bạn bè đã được chấp nhận; chỉ trả post chưa thu hồi. |
| POST | `/api/posts` | Có | `multipart/form-data`: `content` và/hoặc trường ảnh `image` | `201 { post }`. Ít nhất một trong hai phải có; ảnh dùng chính sách ảnh tối đa 5 MiB. |
| DELETE | `/api/posts/:id` | Có | — | `204 No Content`; chỉ tác giả. Đây là xóa bản ghi post, các bản ghi phụ thuộc theo khóa ngoại sẽ cascade. |
| PATCH | `/api/posts/:id/recall` | Có | — | `{ post: { postId, recalled, recalledAt } }`; chỉ tác giả và chỉ post chưa thu hồi. |
| POST | `/api/posts/:id/like` | Có | — | `{ liked, likes }`; bật/tắt lượt thích của người gọi trên post đang nhìn thấy. |
| GET | `/api/posts/:id/comments` | Có | — | `{ comments }`; chỉ post đang nhìn thấy. Comment đã thu hồi vẫn được trả với nội dung rỗng và cờ `recalled`. |
| POST | `/api/posts/:id/comments` | Có | `{ content }` | `201 { comment }`; chỉ post đang nhìn thấy, nội dung phải không rỗng sau khi trim. |
| PATCH | `/api/posts/:id/comments/:commentId/recall` | Có | — | `{ postId, comment, comments }`; chỉ tác giả của comment và chỉ với post đang nhìn thấy. |

Post trả về có dạng rút gọn `{ id, content, image, createdAt, recalled, likes, comments, liked, canDelete, author }`; `author` có `id`, `username`, `fullName`, `avatar`. Cờ `canDelete` và `canRecall` phụ thuộc người xem, không nên cache/reuse payload của một user cho user khác.

Các mutation tạo/xóa/thu hồi post và comment phát Socket.IO event **chỉ** tới tác giả cùng bạn bè đã được chấp nhận của tác giả post, với payload được tạo theo từng người nhận.

## Upload tệp chat — `/api/upload`

Hai endpoint này được mount trực tiếp trong `server/server.js`; file router cũ tồn tại trong mã nguồn nhưng không được mount riêng.

| Method | Path | Auth | Request | Phản hồi thành công |
| --- | --- | --- | --- | --- |
| POST | `/api/upload/image` | Có | `multipart/form-data`, trường `image` | `200 { url, type: "image", fileName, size, mimeType }`. |
| POST | `/api/upload/file` | Có | `multipart/form-data`, trường `file` | `200 { url, type: "file", fileName, size, mimeType }`. |

Chính sách server hiện tại:

- Image: JPEG/JPG, PNG, WEBP, GIF; tối đa 5 MiB.
- File: PDF, TXT, DOC/DOCX, XLS/XLSX, PPT/PPTX; tối đa 10 MiB.
- MIME type và phần mở rộng phải khớp allow-list; server kiểm tra chữ ký đầu tệp trước khi chấp nhận.
- Tên lưu trên disk là UUID; `fileName` trả về được làm sạch để hiển thị. Không dùng `fileName` làm đường dẫn server.

## Route không còn là API hoạt động

- `server/routes/profileRoutes.js` và `server/controllers/profileController.js` còn trong repository nhưng **không được import/mount** trong `server/server.js`; không dùng chúng làm tài liệu API.
- `server/routes/uploadRoutes.js` cũng không được mount. Hai URL upload ở trên vẫn hoạt động vì được đăng ký trực tiếp tại `server/server.js`.

