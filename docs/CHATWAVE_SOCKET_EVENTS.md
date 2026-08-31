# ChatWave — Socket.IO Events

## Phạm vi và kết nối

Tài liệu này là contract theo source Socket.IO hiện có, không phải kết quả test manual. Socket dùng URL VITE_SOCKET_URL hoặc fallback VITE_API_URL; development proxy chuyển /socket.io về backend cổng 5000.

Client tạo socket singleton với:

- autoConnect: false.
- transports: websocket, polling.
- auth.token lấy từ localStorage.

Mọi kết nối phải qua Socket.IO middleware xác minh JWT và user trong database. Thiếu/sai token bị từ chối với error message UNAUTHORIZED và data.code là UNAUTHORIZED. Kết nối hợp lệ vào room user_<id>; id và thông tin user trong socket.data.user do server xác định, không nhận từ client.

Socket.IO server đặt maxHttpBufferSize là 1 MB. Không dùng Socket.IO để upload file; file đi qua REST upload API.

## Quy ước bảo mật/routing

- Không tin identity hoặc target do client tự gửi nếu server có thể suy ra từ state.
- Random-chat signal/chat/typing/media state chỉ đi tới partner trong active match server-side.
- Friend message được nạp lại từ database theo message id và sender đã xác thực, sau đó mới relay.
- Friend call phải có friendship accepted, session callId hợp lệ và socket đúng đầu của session.
- Sự kiện room user_<id> có thể tới tất cả tab/socket đang đăng nhập của user đó.
- Presence chỉ được phát tới room các bạn bè accepted; onlineCount là số user id online riêng biệt và được broadcast cho toàn bộ socket đã xác thực.

## Client → Server

| Event | Payload / acknowledgement | Xử lý server |
| --- | --- | --- |
| registerUser | Payload bất kỳ; acknowledgement tùy chọn | Tương thích ngược. Payload identity bị bỏ qua; ack trả ok và userId của handshake. |
| getOnlineCount | Không payload | Trả onlineCount riêng cho socket gọi. |
| joinQueue | preferences: gender, country | Thêm socket vào queue nếu chưa active match. User identity luôn từ handshake. Server chỉ match khi preference hai chiều đều khớp. |
| cancelSearch | Không payload | Xóa socket khỏi waiting queue. |
| signal | signal là object; client có thể gửi to nhưng server không dùng nó | Relay signal tới active random-chat partner và thêm from là socket id thật. |
| chatMessage | Text: type=text, message, time. Attachment: type=image hoặc file, url, fileName, size, mimeType, time | Chỉ relay khi active match. Server chuẩn hóa payload và chỉ nhận upload URL có pattern UUID được phép. Payload lỗi trả chatMessageError. |
| typing | Không payload | Relay tới active random-chat partner. |
| stopTyping | Không payload | Relay tới active random-chat partner. |
| mediaState | isCameraOff boolean, isMuted boolean, cameraFilter string | Lọc các trường hợp lệ và relay partnerMediaState tới active random-chat partner. |
| skip | Không payload | Kết thúc random match hiện tại hoặc bỏ khỏi queue; peer nhận partnerDisconnected nếu có match. |
| endCall | Random chat: không payload. Friend call: có to và callId | Không có trường to: cleanup random match. Có to: chỉ kết thúc friend-call session callId nếu caller/callee khớp session. |
| sendFriendMessage | id của friend_messages đã được REST tạo | Server tải bản ghi theo id và sender authenticated, từ chối bản ghi recalled hoặc không phải bạn bè, rồi phát receiveFriendMessage tới receiver room. |
| callUser | to, callId; acknowledgement trả ok, callId hoặc ok=false/message | Chỉ tạo session cho bạn bè accepted đang online. Server phát incomingCall vào room người được gọi. |
| acceptCall | to, callId | Chỉ callee của pending session được chấp nhận; server gắn callee socket và phát callAccepted thẳng tới caller socket. |
| rejectCall | to, callId | Chỉ callee pending hợp lệ được từ chối; server xóa session và phát callRejected cho caller. |
| webrtcSignal | callId, signal; client có thể gửi to | Server không chọn peer theo to. Nó chỉ relay signal giữa hai socket thuộc session callId đã được chấp nhận. signal có thể mang SDP hoặc ICE candidate. |
| logoutUser | Không payload | Kết thúc friend call liên quan, cleanup random match, cập nhật presence offline nếu là socket cuối và disconnect socket. |

## Server → Client

### Kết nối, presence và random chat

| Event | Payload chính | Đối tượng nhận / ý nghĩa |
| --- | --- | --- |
| connect | Socket.IO built-in, không payload app | Client đã kết nối thành công. |
| connect_error | Socket.IO Error | Ví dụ handshake không hợp lệ; app cần coi UNAUTHORIZED là phiên không hợp lệ. |
| disconnect | Socket.IO built-in reason | Transport bị đóng. Client random chat/friend call cleanup local media/peer theo component. |
| onlineCount | Số nguyên | Broadcast khi số user online thay đổi; cũng trả cho getOnlineCount. |
| friendPresence | userId, status online hoặc offline | Chỉ room bạn bè accepted của user đổi trạng thái. |
| matchFound | partner gồm id, username, fullName, avatar, gender, country, socketId; initiator boolean | Hai client được match. initiator tạo WebRTC offer. |
| signal | from là socket id đối phương; signal | Random-chat signaling relay từ partner active. |
| chatMessage | Normalized message payload | Random-chat message từ partner active. |
| chatMessageError | message | Sender gửi payload random-chat không hợp lệ. |
| typing | Không payload | Partner active đang nhập. |
| stopTyping | Không payload | Partner active đã dừng nhập. |
| partnerMediaState | isCameraOff, isMuted, cameraFilter (trường hợp lệ được gửi) | Trạng thái camera/mic/filter của active partner. |
| partnerDisconnected | Không payload | Partner skip/end/disconnect hoặc active match bị cleanup. |

### Bạn bè, messages và call

| Event | Payload chính | Đối tượng nhận / ý nghĩa |
| --- | --- | --- |
| friendRequestReceived | requestId, sender gồm id/username/fullName/avatar | Room người nhận lời mời. Event được tạo bởi REST send friend request. |
| friendRequestAccepted | userId, requestId | Room người đã gửi lời mời. Event được tạo bởi REST respond accepted. |
| friendRemoved | userId | Room người bạn vừa bị remove. |
| receiveFriendMessage | id, matchId, senderId, receiverId, message, recalled, createdAt | Room receiver của friend message đã được lưu qua REST. |
| friendMessageRecalled | Serialized friend message với recalled=true và message rỗng | Room sender và receiver của message. |
| incomingCall | from, callerName, callId | Room callee; một user nhiều tab có thể nhận ở nhiều socket. |
| callAccepted | from, callId | Caller socket của session đã chấp nhận. |
| callRejected | from, callId | Caller socket của session bị từ chối. |
| webrtcSignal | from, callId, signal | Chỉ socket đầu bên kia của accepted friend-call session. |
| callEnded | from, callId | Đầu còn lại của session. Nếu callee chưa accept, server có thể phát vào callee room. |

### Sự kiện bài viết phát sau REST mutation

Các event dưới đây chỉ phát cho room tác giả post và room những bạn bè accepted hiện tại của tác giả. Không phát io.emit toàn cục. Payload được tạo theo viewer khi quyền hiển thị khác nhau.

| Event | Payload chính | Ghi chú quyền |
| --- | --- | --- |
| postCreated | Post đã serialize: id, content, image, createdAt, recalled, likes, comments, liked, canDelete, author | canDelete đúng chỉ với viewer là tác giả. |
| postDeleted | postId | Bài chỉ có thể bị xóa bởi tác giả. |
| postRecalled | postId, recalled=true, recalledAt, canDelete | canDelete true chỉ với tác giả. |
| postCommentCreated | postId, comment | canRecall trong comment đúng chỉ với tác giả comment. |
| postCommentRecalled | postId, comment gồm id/recalled/content/canRecall=false, comments | comments là số comment chưa thu hồi còn lại. |

## Vòng đời random-chat

1. Client lấy local media trước, rồi gửi joinQueue với preference.
2. Server ghép cặp và phát matchFound; partner/socket id được server tạo.
3. Initiator gửi offer qua signal, hai phía relay answer và ICE qua signal.
4. Chat, typing, mediaState chỉ hoạt động khi active match còn tồn tại.
5. skip, endCall không có to, logoutUser hoặc disconnect cleanup map match và báo partnerDisconnected.

## Vòng đời friend-call

1. Caller tạo callId ở client, lấy media và phát callUser.
2. Server xác minh friendship accepted, online state và callId; tạo active friend-call session.
3. Callee acceptCall hoặc rejectCall. Accept gắn socket callee vào session.
4. Hai phía gửi webrtcSignal. Server chỉ chuyển khi socket gửi và socket nhận đúng session callId.
5. endCall với to/callId, logoutUser hoặc disconnect xóa session và phát callEnded cho phía còn lại.

## Event không phải server contract đang hoạt động

- ChatControls hiện phát send_friend_request sau khi REST POST /api/friends/send thành công, nhưng server Socket.IO không có listener cho tên event đó. Phần tạo lời mời thực tế là REST API; ứng dụng không nên phụ thuộc vào event socket này.
- Hook useSocket có listener rejoinQueue nhưng server hiện không phát event rejoinQueue. Đây không phải event contract có thể dùng để triển khai tính năng mới.

## Lưu ý WebRTC

Socket event chỉ dùng để signaling. Media không đi qua Socket.IO. Source có Google STUN nhưng không có TURN server; do đó state event thành công không bảo đảm stream P2P sẽ kết nối được trên NAT/firewall hạn chế. Tài liệu này không khẳng định cuộc gọi đã được kiểm thử thủ công trên các mạng đó.
