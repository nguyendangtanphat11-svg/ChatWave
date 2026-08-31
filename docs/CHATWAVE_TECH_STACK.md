# ChatWave — Technical Stack

## Phạm vi tài liệu

Tài liệu này được lập từ mã nguồn đang có trong workspace, không phải kết quả kiểm thử thủ công hay xác nhận một môi trường production. Phiên bản thư viện bên dưới lấy từ các tệp package.json hiện hành.

## Tổng quan

ChatWave là ứng dụng web chat/video gồm:

- Frontend SPA React chạy bằng Vite.
- Backend Node.js/Express, cung cấp REST API và Socket.IO trên cùng HTTP server.
- MySQL qua mysql2/promise.
- WebRTC cho video/audio P2P, Socket.IO chỉ dùng để signaling.
- Lưu tệp cục bộ trên filesystem của backend.

## Thành phần theo lớp

| Lớp | Công nghệ đang dùng | Vai trò trong source |
| --- | --- | --- |
| UI | React 19.2.7, React DOM 19.2.7 | Render các trang Home, Chat, Friends, Profile, đăng nhập/đăng ký và thông báo. |
| Routing | react-router-dom 7.18.0 | BrowserRouter, ProtectedRoute và các route của SPA. |
| Build/dev server | Vite 8.1.0, @vitejs/plugin-react | Build frontend; development server mặc định cổng 5173 và proxy API/Socket.IO về backend cổng 5000. |
| HTTP client | Axios 1.18.1 | Gọi REST API. Axios singleton được cấu hình base URL, withCredentials và Bearer token từ localStorage. |
| Realtime | socket.io-client 4.8.3, Socket.IO server 4.8.3 | Presence, random matching, chat realtime, signaling WebRTC, thông báo bạn bè và cập nhật bài viết. |
| Backend HTTP | Node.js, Express 5.2.1, CORS | REST API, static files và Socket.IO trên cùng HTTP server. Source không khai báo trường engines nên không đóng đinh một Node version cụ thể. |
| CSDL | MySQL 8.x schema, mysql2 3.22.5 | Users, friend requests, friend messages, posts, likes, comments và các bản ghi xoá/thu hồi. |
| Xác thực | jsonwebtoken 9.0.3, bcrypt 6.0.0 | JWT 30 ngày cho đăng nhập local; bcrypt cho mật khẩu; middleware REST và Socket.IO handshake đều xác minh JWT. |
| Google sign-in | @react-oauth/google 0.13.5, google-auth-library 10.9.0 | Google OAuth ở frontend và kiểm tra Google ID token ở backend. |
| Upload | multer 2.2.0, uuid 14.0.1 | Lưu ảnh/tệp vào disk với tên UUID; kiểm tra MIME, extension, giới hạn kích thước và chữ ký đầu tệp. |
| Video/audio | Browser MediaDevices, WebRTC RTCPeerConnection | Lấy camera/microphone, tạo media P2P cho random chat và cuộc gọi bạn bè. |
| UI phụ trợ | react-icons, bootstrap, emoji-picker-react | Icon, style và emoji picker. |

Gói simple-peer có trong dependencies nhưng luồng chat/call hiện đang tạo RTCPeerConnection native trực tiếp.

## Cấu hình runtime

### Frontend

| Biến | Mục đích | Hành vi mặc định trong source |
| --- | --- | --- |
| VITE_API_URL | Base URL REST | Khi dev và không đặt biến: http://localhost:5000. Khi build production và không đặt biến: URL tương đối. |
| VITE_SOCKET_URL | Base URL Socket.IO | Nếu không đặt, dùng cùng API URL. |
| VITE_GOOGLE_CLIENT_ID | GoogleOAuthProvider | Được truyền vào provider ở entry point frontend. |

Vite development proxy chuyển /api và /socket.io tới http://localhost:5000. Frontend không nên hard-code hostname upload: helper URL sẽ ghép đường dẫn tương đối với API URL cấu hình.

### Backend

| Biến | Mục đích |
| --- | --- |
| PORT | Cổng HTTP backend; mặc định 5000. |
| JWT_SECRET | Ký/xác minh JWT cho REST và Socket.IO. |
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Kết nối MySQL pool. |
| GOOGLE_CLIENT_ID | Xác minh Google ID token. |

Backend chỉ cho phép CORS từ Vercel origin được khai báo và localhost HTTPS/HTTP cổng 5173; request không có Origin vẫn được cho phép theo source. Không ghi giá trị bí mật vào tài liệu hoặc file mẫu public.

## Xác thực và phân quyền

- REST private routes dùng Authorization: Bearer token. Middleware xác minh JWT, truy vấn user theo decoded id, rồi gắn req.user.
- Socket.IO yêu cầu token trong handshake auth.token. Backend xác minh JWT và user trong database trước khi cho kết nối; thiếu/sai token trả lỗi UNAUTHORIZED.
- Sau handshake, server gắn socket.data.user và cho socket vào room user_<id>. Sự kiện registerUser chỉ còn tương thích ngược: payload định danh từ client bị bỏ qua.
- Quan hệ bạn bè accepted được kiểm tra ở API profile public, messages, friend call và các luồng hiển thị/tương tác post liên quan.
- Random-chat relay lấy partner từ active match ở server, không tin trường to do client gửi.
- Friend message realtime được server tải lại từ database theo message id và sender đã xác thực trước khi chuyển cho room người nhận.
- Friend-call signaling phải thuộc session callId hợp lệ, hai đầu là bạn bè và đúng socket đầu cuối của session.

JWT được lưu ở localStorage phía client theo source hiện tại. Đây là mô tả hiện trạng, không phải đánh giá rằng mô hình này thay thế các biện pháp phòng chống XSS hoặc quản lý phiên khác.

## Upload và static files

| Loại | Endpoint | Thư mục lưu | Giới hạn | Định dạng được phép |
| --- | --- | --- | --- | --- |
| Ảnh chat/post | POST /api/upload/image hoặc POST /api/posts | server/uploads/images | 5 MB | JPEG, PNG, WEBP, GIF |
| Tệp chat | POST /api/upload/file | server/uploads/files | 10 MB | PDF, TXT, DOC/DOCX, XLS/XLSX, PPT/PPTX |
| Avatar | PUT /api/users/avatar | server/uploads/images | 5 MB | JPEG, PNG, WEBP, GIF |
| Cover | PUT /api/users/cover | server/uploads/covers | 10 MB | JPEG, PNG, WEBP, GIF |

Các upload route yêu cầu JWT trước middleware upload. Multer chỉ nhận một file, tạo tên UUID, kiểm tra MIME khớp extension, sau đó đọc header tối đa 512 byte để kiểm tra signature cơ bản. Static /uploads tắt index/redirect, đặt X-Content-Type-Options: nosniff, và các file trong uploads/files được trả Content-Disposition: attachment.

Giới hạn đáng lưu ý:

- Tệp được lưu trên ổ đĩa local của backend, không có object storage, CDN, backup hoặc cơ chế đồng bộ nhiều instance trong source.
- Nếu deploy trên filesystem ephemeral hoặc redeploy mà không có persistent volume, upload có thể mất hoặc URL cũ có thể hỏng.
- DOCX/XLSX/PPTX chỉ được kiểm tra là ZIP container qua magic header; source không thực hiện kiểm tra sâu nội dung package Office.
- Validation phía client chỉ để phản hồi sớm; backend là lớp kiểm tra quyết định.

## WebRTC

Random chat và friend call lấy camera/microphone bằng navigator.mediaDevices.getUserMedia và tạo RTCPeerConnection native. Signaling đi qua Socket.IO, còn luồng media đi P2P khi WebRTC thiết lập thành công.

- Random chat cấu hình một Google STUN server: stun:stun.l.google.com:19302.
- Friend call cấu hình hai Google STUN server: stun:stun.l.google.com:19302 và stun:stun1.l.google.com:19302.
- Source không cấu hình TURN server, TURN credentials hay dịch vụ relay media.

Vì không có TURN, cuộc gọi có thể không thiết lập được giữa các mạng NAT/firewall hạn chế hoặc các môi trường không hỗ trợ kết nối P2P trực tiếp. Đây là giới hạn kiến trúc hiện tại, không phải trạng thái đã được kiểm thử thủ công trên mọi mạng.

## Chất lượng và giới hạn vận hành

- Socket.IO giới hạn maxHttpBufferSize là 1 MB; file đi qua HTTP upload thay vì socket.
- Random match, online socket map và friend-call session được giữ trong memory của process backend. Restart hoặc chạy nhiều instance không có shared state sẽ làm mất/không đồng bộ state này.
- MySQL pool có connectionLimit 10; SSL Aiven chỉ được bật khi DB_HOST chứa aivencloud.com.
- CORS, JWT secret, DB credentials và Google credential là cấu hình vận hành cần được cung cấp an toàn ở môi trường chạy.
- Tài liệu này không khẳng định build, lint, database migration, hai-browser call hay kiểm thử production đã PASS.
