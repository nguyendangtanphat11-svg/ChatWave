# ChatWave — Architecture

## Phạm vi

Sơ đồ và mô tả này phản ánh cấu trúc source hiện tại. Chúng không xác nhận rằng từng luồng đã được kiểm thử thủ công, chạy qua hai trình duyệt, hay triển khai production.

## Sơ đồ thành phần

~~~mermaid
flowchart LR
    U[Người dùng] --> B[Trình duyệt]

    subgraph FE[Frontend SPA]
        B --> R[React 19 + React Router]
        R --> UC[UserContext / localStorage]
        R --> AX[Axios config]
        R --> SC[Socket.IO client singleton]
        R --> RTC[MediaDevices + RTCPeerConnection]
    end

    AX -->|REST + Bearer JWT| API
    SC -->|Socket.IO handshake auth.token| SO
    RTC -->|Signaling qua Socket.IO| SO
    RTC <-->|Audio/video P2P khi kết nối được| RTCPEER[Trình duyệt peer]

    subgraph BE[Node.js backend]
        API[Express REST routes] --> AM[protect middleware]
        API --> CT[Controllers]
        SO[Socket.IO server] --> SA[JWT handshake + socket.data.user]
        SO --> RM[Rooms user_ID / match map / call map]
        CT --> DB[(MySQL)]
        SA --> DB
        CT --> FS[server/uploads trên local disk]
        API --> ST[uploads static]
        ST --> FS
    end

    R --> GO[Google OAuth UI]
    GO --> GA[Google ID-token verification]
    GA --> API
    RTC --> STUN[Google STUN]
~~~

REST API và Socket.IO dùng chung HTTP server backend. Vite chỉ đóng vai trò dev server/build tool; ở development, Vite proxy /api và /socket.io về backend cổng 5000.

## Tổ chức source

| Khu vực | Trách nhiệm chính |
| --- | --- |
| client/src/AppRoutes.jsx | Socket singleton, lifecycle connect/disconnect dựa trên user/token và route tree. |
| client/src/contexts | UserContext và NotificationContext. UserContext đồng bộ profile với localStorage. |
| client/src/pages/Chat | Random video chat, queue/match preferences, native WebRTC, media controls và sidebar mobile. |
| client/src/components/friends/FriendChatBox.jsx | Lịch sử friend message, upload attachment, call session và native WebRTC friend-to-friend. |
| client/src/pages/Home và client/src/pages/FriendsPage | Dashboard, online count, friend notifications/presence và mở FriendChatBox. |
| client/src/components/posts | Feed, tạo/xoá/thu hồi post, like, comment và socket cập nhật. |
| client/src/services | Axios client và canonical user service tại /api/users. |
| server/server.js | Express app, CORS/static upload, Socket.IO authentication, random match, presence, message relay và call relay. |
| server/routes | Khai báo REST route theo auth, users, friends, messages, posts. |
| server/controllers | Truy vấn MySQL, phân quyền nghiệp vụ và phát Socket.IO event sau mutation. |
| server/middleware | JWT protect và upload validation. |
| database | SQL dump và migration của MySQL schema. |

## Các ranh giới dữ liệu và quyền

### HTTP

1. Client Axios thêm Bearer token nếu localStorage có token.
2. Middleware protect xác minh JWT, tra user theo id trong database và gắn req.user.
3. Route/controller quyết định quyền tài nguyên. Ví dụ: private profile là của chủ sở hữu; profile/public friends và post feed của người khác yêu cầu friendship accepted; friend message yêu cầu hai bên là bạn bè.
4. Controller trả response HTTP, và với các mutation realtime có thể phát event thông qua io đã gắn vào Express app.

### Socket.IO

1. Client tạo một socket dùng chung, autoConnect false, truyền token trong handshake auth.token.
2. Server verify JWT và truy vấn users. Kết nối không hợp lệ bị từ chối với UNAUTHORIZED.
3. Kết nối hợp lệ được gắn socket.data.user, vào room user_<id>, và được theo dõi trong map online đa tab.
4. Các sự kiện riêng tư dùng room user_<id>, active match server-side hoặc friend-call session thay vì tin user id/partner id do client tự khai.

## Luồng chính

### Đăng nhập và khởi tạo phiên

~~~mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth API
    participant D as MySQL
    participant S as Socket.IO

    C->>A: POST /api/auth/login hoặc /google
    A->>D: Kiểm tra user / mật khẩu hoặc Google token
    A-->>C: JWT và user
    C->>C: Lưu token/user vào localStorage
    C->>S: Handshake auth.token
    S->>D: Xác minh user từ JWT id
    S-->>C: Kết nối; join room user_ID
~~~

Đăng xuất UI phát auth:logout, AppRoutes gửi logoutUser khi socket đang kết nối rồi disconnect. REST logout cũng có endpoint riêng để cập nhật status.

### Random video chat

~~~mermaid
sequenceDiagram
    participant A as Client A
    participant S as Socket.IO
    participant B as Client B

    A->>A: getUserMedia
    A->>S: joinQueue với gender/country preference
    B->>B: getUserMedia
    B->>S: joinQueue với gender/country preference
    S-->>A: matchFound, initiator true
    S-->>B: matchFound, initiator false
    A->>S: signal offer / ICE
    S->>B: signal từ active match
    B->>S: signal answer / ICE
    S->>A: signal từ active match
    A-->>B: WebRTC media P2P nếu ICE kết nối được
~~~

Server chỉ match khi preference của cả hai bên đều khớp gender/country của đối phương. Queue và active match chỉ nằm trong memory server. Chat text/attachment metadata, typing và media state cũng chỉ relay đến active partner.

### Friend message và friend call

Friend message được lưu trước bằng REST. Sau khi có message id, client gửi sendFriendMessage; server tải lại bản ghi theo sender đã xác thực, kiểm tra friendship accepted rồi chuyển vào room người nhận. Thu hồi message được phát vào room của cả sender và receiver.

Friend call có hai lớp:

1. Server chỉ mở session callId cho bạn bè accepted đang online.
2. Caller/callee xác nhận bằng callUser, acceptCall hoặc rejectCall.
3. Server relay webrtcSignal duy nhất giữa hai socket đang thuộc session callId.
4. Client dùng RTCPeerConnection native và hàng đợi ICE/signaling để xử lý candidate đến sớm.
5. logout/disconnect kết thúc session liên quan và báo callEnded cho đầu còn lại.

## Bài viết và realtime audience

Feed và profile post áp dụng phạm vi author + friendship accepted. Các thao tác like, đọc/tạo/thu hồi comment trước hết xác minh post còn hiển thị với requester; cùng một response 404 được dùng cho id mất, recalled hoặc không có quyền để không tiết lộ sự tồn tại của post.

Khi tạo/xoá/thu hồi post hoặc tạo/thu hồi comment, backend phát event theo room của tác giả và các bạn bè accepted hiện tại của tác giả. Không phát toàn bộ server. Payload được tạo theo viewer khi cần để các cờ canDelete/canRecall không bị sai quyền.

## Upload và lưu trữ

Upload đi theo HTTP, không đi qua Socket.IO. Tệp được đặt trong server/uploads/images, server/uploads/covers hoặc server/uploads/files; database chỉ lưu relative URL. Static /uploads phục vụ nội dung đó và files được ép tải dạng attachment.

Lưu trữ này là filesystem local của backend. Kiến trúc không có object storage, persistent volume, backup hoặc shared file service. Do đó cần cung cấp persistent storage phù hợp trước khi chạy nhiều instance hoặc deploy trên môi trường filesystem ephemeral.

## WebRTC và giới hạn mạng

Socket.IO chỉ mang signaling, không relay audio/video. Random chat dùng một Google STUN endpoint và friend call dùng hai Google STUN endpoints; source không có TURN server. Kết nối P2P vì vậy có thể thất bại với NAT/firewall hạn chế. Một dịch vụ TURN và credential quản lý an toàn sẽ là yêu cầu vận hành nếu cần độ phủ kết nối cao hơn.

## State không bền vững

| State | Nơi giữ | Hệ quả |
| --- | --- | --- |
| Waiting queue random chat | Biến trong server process | Mất khi restart và không được chia sẻ giữa nhiều backend instance. |
| Active random matches | Map trong server process | Mất khi restart; không có persistence. |
| Online users/sockets | Map user id sang Set socket id | Chỉ phản ánh process hiện tại; hỗ trợ nhiều tab trong một process. |
| Friend call sessions | Map theo callId | Mất khi restart; signaling không được lưu database. |
| Media stream | Browser memory | Track được dừng khi cleanup/unmount phù hợp; không lưu trên server. |
| Upload bytes | Local disk backend | Phụ thuộc vào lifecycle của disk/volume triển khai. |
