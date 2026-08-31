# ChatWave — Project Audit

## Phạm vi và mức xác minh

Tài liệu này là audit kỹ thuật dựa trên source tree hiện có, đặc biệt là `client/src`, `server`, `database` và các thay đổi khắc phục đang có trong workspace. Mục tiêu của ChatWave là một ứng dụng web xã hội nhỏ cho người dùng đã đăng nhập: ghép đôi trò chuyện ngẫu nhiên có video, nhắn tin/gọi cho bạn bè và chia sẻ bài viết.

**Không có kết luận kiểm thử end-to-end thủ công trong báo cáo này.** Luồng hai trình duyệt, đăng nhập bằng JWT thật, upload thật, random call và friend call trên các mạng khác nhau đều **NOT VERIFIED** cho đến khi được chạy và ghi nhận riêng. Việc mã nguồn có xử lý một tình huống không đồng nghĩa tình huống đó đã được xác nhận PASS trong môi trường chạy.

## Người dùng và chức năng chính

| Nhóm | Nhu cầu được source hỗ trợ |
| --- | --- |
| Người chưa đăng nhập | Đăng ký, đăng nhập mật khẩu hoặc Google OAuth, sau đó vào các route được bảo vệ. |
| Người dùng đã đăng nhập | Quản lý hồ sơ/avatar/cover/mật khẩu, tìm người dùng, gửi và phản hồi lời mời kết bạn. |
| Người ghép đôi ngẫu nhiên | Chọn lọc giới tính/quốc gia, vào hàng đợi, chat text/đính kèm, bật tắt mic/camera và video P2P. |
| Bạn bè đã chấp nhận | Nhắn tin có lịch sử/thu hồi, hiện diện online và gọi WebRTC có signaling được ràng buộc phiên. |
| Bạn bè trong mạng xã hội | Xem feed/profile post trong phạm vi bạn bè, tạo/xóa/thu hồi post, thích và bình luận. |

## Cấu trúc và kiến trúc nguồn

| Khu vực | Vai trò |
| --- | --- |
| `client/src/pages`, `components`, `contexts` | React SPA, route bảo vệ, UI chat/profile/friends/posts và state người dùng/thông báo. |
| `client/src/services` và `config` | Axios singleton, URL API/Socket theo biến Vite, dịch vụ `/api/users` canonical. |
| `server/server.js` | Express, static upload, Socket.IO, JWT handshake, presence, random-match và friend-call state. |
| `server/routes`, `controllers`, `middleware` | REST contract, truy vấn MySQL, phân quyền và upload validation. |
| `database/chatwave_latest.sql`, `database/migrations` | Schema và lịch sử migration cho người dùng, friendship, messages, posts, likes/comments. |

Frontend dùng React 19, Vite, React Router, Axios, Socket.IO client, `RTCPeerConnection` native và MediaDevices. Backend dùng Node.js/Express, Socket.IO, MySQL qua `mysql2`, JWT, bcrypt, Multer và Google ID-token verification. REST và Socket.IO cùng chạy trên một HTTP server; WebRTC media không đi qua backend sau khi P2P được thiết lập.

## Dữ liệu, xác thực và realtime

- MySQL lưu `users`, `friend_requests`, `friend_messages`, `friend_message_deletions`, `posts`, `post_likes`, `post_comments` và các bảng/migration liên quan. Queue random, online socket map, active match và friend-call session là state trong bộ nhớ process, không phải database.
- REST private routes đi qua middleware `protect`: kiểm tra Bearer JWT, tải user từ database rồi gắn `req.user`.
- Socket.IO cũng bắt buộc `auth.token` trong handshake. Backend kiểm tra JWT và user trước khi kết nối, gắn `socket.data.user` và join room `user_<id>`; payload định danh phía client không được dùng để quyết định identity.
- Presence hỗ trợ nhiều tab qua map user → tập socket. Random chat chỉ relay signal/chat/typing/media state đến partner trong active match do server giữ. Friend message chỉ relay sau khi server đọc lại message đã lưu và kiểm tra quan hệ bạn bè.
- Random matching so khớp hai chiều preference giới tính/quốc gia. UI Home truyền filter sang màn Chat, và Chat dùng filter đó khi vào queue; giới tính được chuẩn hóa về các giá trị DB `Nam`, `Nữ`, `Khác`.

## Upload, gọi video và social

### Upload

Ảnh chat/post/avatar dùng JPEG, PNG, WEBP hoặc GIF; file chat cho phép PDF, TXT và nhóm Office được liệt kê trong middleware. Upload đi qua HTTP có JWT trước Multer, giới hạn 5 MB cho ảnh và 10 MB cho file/cover, tên UUID, kiểm tra extension/MIME và header magic cơ bản. Static `/uploads` tắt directory index/redirect, thêm `nosniff`; file download được phục vụ dạng attachment.

### WebRTC

Random chat và friend call lấy media bằng `getUserMedia`, dùng `RTCPeerConnection` native và Socket.IO chỉ để signaling. Code hiện có cleanup track/peer khi rời màn hình, xử lý signaling/ICE đến sớm bằng hàng đợi, và dùng generation/ref để bỏ qua kết quả media/peer cũ. Friend call có `callId` được server kiểm tra cùng với friendship và socket endpoints; disconnect/logout kết thúc session liên quan.

Source chỉ cấu hình Google STUN. **Không có TURN** hoặc credential relay media, vì vậy cuộc gọi có thể thất bại trên NAT/firewall hạn chế dù signaling thành công.

### Friends và posts

Friendship accepted là điều kiện của public profile, message, call và phạm vi post. Feed/user-post được giới hạn author hoặc bạn bè. Like, đọc/tạo/thu hồi comment kiểm tra post còn hiển thị với người gọi; id không tồn tại, post recalled và post không có quyền cùng trả 404 để không lộ sự tồn tại của post. Event post không còn broadcast toàn server: server phát vào room tác giả và các bạn bè accepted, tạo payload theo viewer để các cờ `canDelete`/`canRecall` đúng quyền.

## Lỗi đã tìm thấy và đã vá trong source hiện tại

| Vấn đề audit | Khắc phục đang có |
| --- | --- |
| Socket có thể tin token/identity/target do client tự gửi | JWT handshake bắt buộc; identity lấy từ server; random target suy ra từ active match; friend-call dùng session `callId`. |
| Presence sai khi cùng user mở nhiều tab | Map mỗi user tới tập socket, chỉ offline khi socket cuối cùng rời đi. |
| Random-chat bị mất filter từ Home hoặc ghép sai giá trị giới tính | Query filter được chuẩn hóa và truyền vào queue; server so khớp preference hai phía. |
| Sidebar random chat không mở/đóng đáng tin cậy ở màn hẹp | State mở/đóng được giữ ở Chat, nút header/close có ARIA và CSS responsive không còn bị style component ghi đè. |
| Upload có route không bảo vệ, tên đoán được hoặc tin MIME đơn thuần | JWT trước upload, UUID, allow-list + giới hạn kích thước + kiểm tra chữ ký file; URL attachment được kiểm soát. |
| API profile bị phân tán giữa `/api/profile` và `/api/users` | Password được hợp nhất vào `PUT /api/users/password`; client dùng user service canonical, legacy profile route không còn được mount. |
| Like/comment có thể tác động post ngoài phạm vi; socket post lộ toàn cục | Helper visibility kiểm tra friendship/recalled và event được phát theo audience room thay cho `io.emit`. |
| Race/cleanup WebRTC và relay friend call thiếu ràng buộc | Quản lý lifecycle media/peer, ICE queue, call session và endpoint socket đã được bổ sung. |

Các mục trên là đánh giá thay đổi ở mức source review; cần test hành vi để xác nhận không tạo regression.

## Bảo mật và vận hành

- CORS hiện allow-list origin cụ thể cộng localhost; Socket.IO giới hạn `maxHttpBufferSize` 1 MB để file đi qua HTTP thay vì event socket lớn.
- JWT hiện được lưu tại `localStorage` ở client. Đây là thiết kế hiện trạng, không thay thế biện pháp phòng XSS hoặc chính sách session production.
- Source không thể hiện lớp rate-limit/Helmet/CSRF tập trung. Cần đánh giá và bổ sung theo threat model triển khai thực tế.
- Dùng `.env.example` làm mẫu. Không commit `.env`, DB password, JWT secret, OAuth secret/token thật. Nếu credential từng xuất hiện trong working tree hay lịch sử Git, phải **rotate ngay** (JWT secret, DB user/password, Google OAuth credential liên quan) trước production; thêm vào `.gitignore` không xóa secret khỏi lịch sử.
- Upload nằm ở local disk `server/uploads`. Không có object storage, CDN, backup, persistent-volume abstraction hay đồng bộ nhiều instance. Redeploy/filesystem ephemeral có thể làm mất file hoặc làm URL cũ hỏng.

## Giới hạn còn lại và hướng phát triển

1. Chạy test matrix thủ công: hai user hợp lệ/không hợp lệ, nhiều tab, quyền bạn bè/non-friend, upload loại hợp lệ/bị chặn, recall, random matching và friend call.
2. Bổ sung test tự động cho REST authorization, Socket.IO handshake/relay và post visibility; source hiện không cho thấy test suite backend/frontend chuyên biệt.
3. Thêm TURN được vận hành an toàn nếu cần độ phủ WebRTC cao; test lại trên NAT/firewall thực tế.
4. Nếu scale ngang, chuyển queue/presence/call session sang shared state (ví dụ adapter/store phù hợp) và upload sang persistent object storage kèm backup.
5. Thêm rate limit, security headers, observability, health checks, chiến lược migration/backup và quy trình xoay secret trước deploy.
6. Rà soát database dump dữ liệu phát triển trước khi chia sẻ/deploy, áp dụng migration theo môi trường và không chạy script destructive thiếu backup.

## Kết luận

Source hiện đã có các ràng buộc quan trọng hơn cho auth socket, upload, audience post, profile API, mobile sidebar và lifecycle WebRTC. Tuy nhiên đây chưa phải xác nhận production-ready: các kiểm thử end-to-end thủ công nêu ở đầu tài liệu vẫn **NOT VERIFIED**, và các giới hạn TURN, local disk, in-memory realtime state và hardening vận hành cần được xử lý trước khi coi là triển khai production hoàn chỉnh.
