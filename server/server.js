const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ĐƯA VỀ HTTP CHUẨN ĐỂ TRÁNH LỖI SSL/CIPHER MISMATCH TRÊN MÔI TRƯỜNG LOCAL
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const friendRoutes = require("./routes/friendRoutes");
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');

// Import middleware và controller upload trực tiếp để tránh lỗi phân giải module router
const { uploadImage, uploadFile, validateUploadedFile } = require("./middleware/upload");
const { uploadImageController, uploadFileController } = require("./controllers/uploadController");
const { protect } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

/* ==========================
    EXPRESS CONFIG
========================== */
const allowedOrigins = [
    "https://chat-wave-theta-wheat.vercel.app",
    "http://localhost:5173",
    "https://localhost:5173"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Phục vụ các file tĩnh trong thư mục uploads
const uploadFilesDir = path.join(__dirname, 'uploads', 'files');
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (path.dirname(filePath) === uploadFilesDir) {
            res.setHeader('Content-Disposition', 'attachment');
        }
    },
}));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/friends", friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/posts', postRoutes);

// Xử lý lỗi Multer trước khi đi vào Controller
const handleMulterError = (multerUpload) => (req, res, next) => {
    multerUpload(req, res, (err) => {
        if (err instanceof require('multer').MulterError) {
            req.multerError = err.message;
            req.multerErrorCode = err.code;
        } else if (err) {
            req.multerError = err.message;
            req.multerErrorCode = err.code;
        }
        next();
    });
};

// Đăng ký trực tiếp các endpoint upload để tránh lỗi router không nhận diện hàm
app.post("/api/upload/image", protect, handleMulterError(uploadImage), validateUploadedFile, uploadImageController);
app.post("/api/upload/file", protect, handleMulterError(uploadFile), validateUploadedFile, uploadFileController);

app.use((error, req, res, next) => {
    if (error) {
        const status = error.code === 'LIMIT_FILE_SIZE'
            ? 413
            : (Number.isInteger(error.status) ? error.status : (error.name === 'MulterError' ? 400 : 500));
        return res.status(status).json({ message: error.message || 'Không thể tải tệp lên.' });
    }
    return next();
});

app.get("/", (req, res) => {
    res.send("🚀 ChatWave Server đang hoạt động ổn định qua HTTP!");
});

/* ==========================
    SOCKET.IO
========================== */
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    // Uploads use HTTP; Socket.IO only receives bounded metadata and signaling.
    maxHttpBufferSize: 1 * 1024 * 1024,
});

let waitingQueue = [];
const activeMatches = new Map();
const onlineUserSockets = new Map();
const activeFriendCalls = new Map();

const normalizeUserId = (value) => {
    const userId = Number(value);
    return Number.isInteger(userId) && userId > 0 ? String(userId) : null;
};

const normalizeCallId = (value) => {
    if (typeof value !== 'string') return null;
    const callId = value.trim();
    return /^[a-zA-Z0-9_-]{16,128}$/.test(callId) ? callId : null;
};

const emitFriendCallEnded = (call, endedBySocketId, endedByUserId) => {
    const callerEndedCall = call.callerSocketId === endedBySocketId;
    const targetSocketId = callerEndedCall ? call.calleeSocketId : call.callerSocketId;
    const targetUserId = callerEndedCall ? call.calleeId : call.callerId;
    const payload = { from: String(endedByUserId), callId: call.callId };

    if (targetSocketId) {
        io.to(targetSocketId).emit('callEnded', payload);
    } else {
        io.to(`user_${targetUserId}`).emit('callEnded', payload);
    }
};

const endFriendCall = ({ callId, socketId, userId }) => {
    const call = activeFriendCalls.get(callId);
    if (!call) return false;

    const isCaller = call.callerSocketId === socketId && call.callerId === String(userId);
    const isAcceptedCallee = call.calleeSocketId === socketId && call.calleeId === String(userId);
    const isPendingCallee = !call.calleeSocketId && call.calleeId === String(userId);
    if (!isCaller && !isAcceptedCallee && !isPendingCallee) return false;

    activeFriendCalls.delete(callId);
    emitFriendCallEnded(call, socketId, userId);
    return true;
};

const endFriendCallsForSocket = (socketId, userId) => {
    [...activeFriendCalls.values()].forEach((call) => {
        if (call.callerSocketId === socketId || call.calleeSocketId === socketId) {
            endFriendCall({ callId: call.callId, socketId, userId });
        }
    });
};

const areAcceptedFriends = async (firstId, secondId) => {
    const [relations] = await db.query(
        `SELECT id FROM friend_requests
         WHERE status = 'accepted'
           AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
         LIMIT 1`,
        [firstId, secondId, secondId, firstId],
    );
    return relations.length > 0;
};

const getAcceptedFriendIds = async (userId) => {
    const [relations] = await db.query(
        `SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS friendId
         FROM friend_requests
         WHERE status = 'accepted' AND (sender_id = ? OR receiver_id = ?)`,
        [userId, userId, userId],
    );
    return relations.map((relation) => String(relation.friendId));
};

const emitFriendPresence = async (userId, status) => {
    try {
        const friendIds = await getAcceptedFriendIds(userId);
        friendIds.forEach((friendId) => {
            io.to(`user_${friendId}`).emit('friendPresence', { userId, status });
        });
    } catch (error) {
        console.error('Không thể cập nhật presence cho bạn bè:', error);
    }
};

const serializeFriendSocketMessage = (message) => ({
    id: message.id,
    matchId: message.conversation_id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    message: message.recalled_at ? '' : message.message,
    recalled: Boolean(message.recalled_at),
    createdAt: message.created_at,
});

const createSocketAuthenticationError = () => {
    const error = new Error('UNAUTHORIZED');
    error.data = { code: 'UNAUTHORIZED' };
    return error;
};

const createMessageTime = (value) => {
    const parsed = value ? new Date(value) : null;
    return parsed && !Number.isNaN(parsed.getTime())
        ? parsed.toISOString()
        : new Date().toISOString();
};

const randomUploadPathPatterns = {
    image: /^\/uploads\/images\/[0-9a-f-]{36}\.(?:jpe?g|png|webp|gif)$/i,
    file: /^\/uploads\/files\/[0-9a-f-]{36}\.(?:pdf|txt|docx?|xlsx?|pptx?)$/i,
};

const normalizeRandomUploadUrl = (value, type) => {
    if (typeof value !== 'string' || !randomUploadPathPatterns[type]) return '';
    try {
        const parsed = new URL(value, 'https://chatwave.invalid');
        const pathname = decodeURIComponent(parsed.pathname);
        return randomUploadPathPatterns[type].test(pathname) ? pathname : '';
    } catch {
        return '';
    }
};

const normalizeRandomChatMessage = (payload) => {
    if (!payload || typeof payload !== 'object') return null;

    if (payload.type === 'text') {
        const message = typeof payload.message === 'string' ? payload.message.trim() : '';
        if (!message) return null;
        return {
            type: 'text',
            message,
            time: createMessageTime(payload.time),
        };
    }

    if (!['image', 'file'].includes(payload.type)) return null;
    const url = normalizeRandomUploadUrl(payload.url, payload.type);
    if (!url) return null;

    const parsedSize = Number(payload.size);
    return {
        type: payload.type,
        url,
        fileName: typeof payload.fileName === 'string' ? payload.fileName : '',
        size: Number.isFinite(parsedSize) && parsedSize >= 0 ? parsedSize : 0,
        mimeType: typeof payload.mimeType === 'string' ? payload.mimeType : '',
        time: createMessageTime(payload.time),
    };
};

const broadcastOnlineCount = () => {
    io.emit('onlineCount', onlineUserSockets.size);
};

io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) {
        return next(createSocketAuthenticationError());
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = normalizeUserId(decoded?.id);
        if (!userId) return next(createSocketAuthenticationError());

        const [users] = await db.query(
            'SELECT id, username, fullName, avatar, gender, country FROM users WHERE id = ?',
            [userId],
        );
        if (!users.length) return next(createSocketAuthenticationError());

        const user = users[0];
        socket.user = { ...decoded, id: String(user.id) };
        socket.data.user = {
            id: String(user.id),
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            gender: user.gender || 'Khác',
            country: user.country || 'VN',
        };
        return next();
    } catch {
        return next(createSocketAuthenticationError());
    }
});

io.on("connection", (socket) => {
    console.log("================================");

    const markSocketUserOffline = () => {
        const userId = socket.data.user.id;
        const socketIds = onlineUserSockets.get(userId);
        if (!socketIds || !socketIds.delete(socket.id)) return;
        if (socketIds.size > 0) return;

        onlineUserSockets.delete(userId);
        broadcastOnlineCount();
        db.query('UPDATE users SET status = ? WHERE id = ?', ['offline', userId])
            .catch((error) => console.error('Không thể cập nhật offline:', error));
        emitFriendPresence(userId, 'offline');
    };

    const markSocketUserOnline = () => {
        const userId = socket.data.user.id;
        const socketIds = onlineUserSockets.get(userId) || new Set();
        const wasOnline = socketIds.size > 0;
        socketIds.add(socket.id);
        onlineUserSockets.set(userId, socketIds);

        if (wasOnline) return;

        broadcastOnlineCount();
        db.query('UPDATE users SET status = ? WHERE id = ?', ['online', userId])
            .catch((error) => console.error('Không thể cập nhật online:', error));
        emitFriendPresence(userId, 'online');
    };

    const resolveFriendTarget = async (candidateId) => {
        const friendId = normalizeUserId(candidateId);
        if (!friendId || friendId === socket.data.user.id) return null;
        return await areAcceptedFriends(socket.data.user.id, friendId) ? friendId : null;
    };

    console.log("✅ Client Connected:", socket.id);
    console.log("================================");

    socket.userInfo = { ...socket.data.user, socketId: socket.id };
    socket.join(`user_${socket.data.user.id}`);
    markSocketUserOnline();

    // Compatibility only: identity and room membership were already created
    // from the authenticated handshake, so client-provided user data is ignored.
    socket.on("registerUser", (_ignoredUserInfo, acknowledgement) => {
        if (typeof acknowledgement === 'function') {
            acknowledgement({ ok: true, userId: socket.data.user.id });
        }
    });

    socket.on('getOnlineCount', () => {
        socket.emit('onlineCount', onlineUserSockets.size);
    });

    socket.on("joinQueue", (payload) => {
        console.log("Join Queue:", socket.id);
        if (activeMatches.has(socket.id)) return;

        // Keep accepting the existing payload shape, but never use payload.user
        // as identity. The authenticated handshake is the only source of user data.
        const preferences = payload && typeof payload === 'object' && payload.preferences && typeof payload.preferences === 'object'
            ? payload.preferences
            : {};
        socket.matchPreferences = {
            gender: typeof preferences.gender === 'string' && preferences.gender.trim() ? preferences.gender.trim() : 'all',
            country: typeof preferences.country === 'string' && preferences.country.trim() ? preferences.country.trim() : 'all',
        };

        const exists = waitingQueue.find(s => s.id === socket.id);
        if (!exists) {
            waitingQueue.push(socket);
        }

        console.log("Waiting:", waitingQueue.length);
        tryToMatch();
    });

    socket.on("cancelSearch", () => {
        waitingQueue = waitingQueue.filter(s => s.id !== socket.id);
    });

    socket.on("signal", (payload) => {
        const partnerId = activeMatches.get(socket.id);
        if (!partnerId || !payload || typeof payload.signal !== 'object') return;

        io.to(partnerId).emit("signal", {
            from: socket.id,
            signal: payload.signal
        });
    });

    socket.on("chatMessage", (payload) => {
        const partnerId = activeMatches.get(socket.id);
        if (!partnerId) {
            console.log(`[Chat] Cảnh báo: Không tìm thấy partner cho socket ${socket.id}`);
            socket.emit("partnerDisconnected");
            return;
        }

        const message = normalizeRandomChatMessage(payload);
        if (!message) {
            socket.emit('chatMessageError', { message: 'Dữ liệu tin nhắn không hợp lệ.' });
            return;
        }

        const logMessage = message.type === 'text'
            ? message.message
            : `[${message.type}] ${message.fileName || message.url}`;
        console.log(`[Chat] ${socket.id} gửi tin nhắn tới ${partnerId}: "${logMessage}"`);

        io.to(partnerId).emit("chatMessage", message);
    });

    socket.on('typing', () => {
        const partnerId = activeMatches.get(socket.id);
        if (partnerId) io.to(partnerId).emit('typing');
    });

    socket.on('stopTyping', () => {
        const partnerId = activeMatches.get(socket.id);
        if (partnerId) io.to(partnerId).emit('stopTyping');
    });

    // Lắng nghe nhắn tin riêng giữa hai bạn bè (Friend Chat Box)
    socket.on("sendFriendMessage", async (payload) => {
        try {
            const messageId = Number(payload?.id);
            if (!Number.isInteger(messageId) || messageId <= 0) return;

            // The REST endpoint has already persisted the message. Reload it so
            // client-supplied sender, receiver, conversation and content cannot be forged.
            const [messages] = await db.query(
                'SELECT * FROM friend_messages WHERE id = ? AND sender_id = ? LIMIT 1',
                [messageId, socket.data.user.id],
            );
            const storedMessage = messages[0];
            if (!storedMessage || storedMessage.recalled_at) return;

            const receiverId = normalizeUserId(storedMessage.receiver_id);
            if (!receiverId || !await areAcceptedFriends(socket.data.user.id, receiverId)) return;

            const message = serializeFriendSocketMessage(storedMessage);
            io.to(`user_${receiverId}`).emit("receiveFriendMessage", message);
            console.log(`[FriendChat] Đã chuyển tin nhắn tới room user_${receiverId}`);
        } catch (error) {
            console.error("Lỗi lưu hoặc gửi tin nhắn friend chat:", error);
        }
    });

    /* ==========================
       XỬ LÝ GỌI VIDEO BẠN BÈ
    ========================== */
    socket.on("callUser", async (payload = {}, acknowledgement) => {
        try {
            const targetId = await resolveFriendTarget(payload.to);
            if (!targetId || !onlineUserSockets.has(targetId)) {
                if (typeof acknowledgement === 'function') {
                    acknowledgement({ ok: false, message: 'Người bạn này hiện không trực tuyến.' });
                }
                return;
            }

            const callerId = socket.data.user.id;
            const callerName = socket.data.user.fullName || socket.data.user.username;
            const callId = normalizeCallId(payload.callId) || randomUUID();
            if (activeFriendCalls.has(callId)) {
                if (typeof acknowledgement === 'function') {
                    acknowledgement({ ok: false, message: 'Phiên gọi không hợp lệ.' });
                }
                return;
            }

            activeFriendCalls.set(callId, {
                callId,
                callerId,
                callerSocketId: socket.id,
                calleeId: targetId,
                calleeSocketId: null,
            });
            console.log(`[VideoCall] User ${callerId} đang gọi cho user ${targetId}`);
            io.to(`user_${targetId}`).emit("incomingCall", {
                from: callerId,
                callerName,
                callId,
            });
            if (typeof acknowledgement === 'function') acknowledgement({ ok: true, callId });
        } catch (error) {
            console.error('Không thể khởi tạo cuộc gọi bạn bè:', error);
            if (typeof acknowledgement === 'function') {
                acknowledgement({ ok: false, message: 'Không thể khởi tạo cuộc gọi.' });
            }
        }
    });

    socket.on("acceptCall", async (payload = {}) => {
        try {
            const targetId = await resolveFriendTarget(payload.to);
            const callId = normalizeCallId(payload.callId);
            const call = callId ? activeFriendCalls.get(callId) : null;
            if (
                !targetId
                || !call
                || call.callerId !== targetId
                || call.calleeId !== socket.data.user.id
                || call.calleeSocketId
            ) return;

            call.calleeSocketId = socket.id;
            console.log(`[VideoCall] User đã chấp nhận cuộc gọi từ ${targetId}`);
            io.to(call.callerSocketId).emit("callAccepted", {
                from: socket.data.user.id,
                callId,
            });
        } catch (error) {
            console.error('Không thể chấp nhận cuộc gọi bạn bè:', error);
        }
    });

    socket.on("rejectCall", async (payload = {}) => {
        try {
            const targetId = await resolveFriendTarget(payload.to);
            const callId = normalizeCallId(payload.callId);
            const call = callId ? activeFriendCalls.get(callId) : null;
            if (
                !targetId
                || !call
                || call.callerId !== targetId
                || call.calleeId !== socket.data.user.id
                || call.calleeSocketId
            ) return;

            activeFriendCalls.delete(callId);
            console.log(`[VideoCall] User đã từ chối cuộc gọi`);
            io.to(call.callerSocketId).emit("callRejected", {
                from: socket.data.user.id,
                callId,
            });
        } catch (error) {
            console.error('Không thể từ chối cuộc gọi bạn bè:', error);
        }
    });

    socket.on("webrtcSignal", async (payload = {}) => {
        try {
            if (!payload.signal || typeof payload.signal !== 'object') return;
            const callId = normalizeCallId(payload.callId);
            const call = callId ? activeFriendCalls.get(callId) : null;
            if (!call) return;

            const isCaller = call.callerId === socket.data.user.id && call.callerSocketId === socket.id;
            const isCallee = call.calleeId === socket.data.user.id && call.calleeSocketId === socket.id;
            const targetSocketId = isCaller ? call.calleeSocketId : (isCallee ? call.callerSocketId : null);
            if (!targetSocketId) return;

            io.to(targetSocketId).emit("webrtcSignal", {
                from: socket.data.user.id,
                callId,
                signal: payload.signal,
            });
        } catch (error) {
            console.error('Không thể chuyển WebRTC signal:', error);
        }
    });

    socket.on("mediaState", (payload) => {
        const partnerId = activeMatches.get(socket.id);
        if (!partnerId || !payload || typeof payload !== 'object') return;

        const mediaState = {};
        if (typeof payload.isCameraOff === 'boolean') mediaState.isCameraOff = payload.isCameraOff;
        if (typeof payload.isMuted === 'boolean') mediaState.isMuted = payload.isMuted;
        if (typeof payload.cameraFilter === 'string') mediaState.cameraFilter = payload.cameraFilter;
        if (!Object.keys(mediaState).length) return;

        io.to(partnerId).emit("partnerMediaState", mediaState);
    });

    function cleanup() {
        waitingQueue = waitingQueue.filter(s => s.id !== socket.id);

        const partnerId = activeMatches.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit("partnerDisconnected");
            activeMatches.delete(partnerId);
        }

        activeMatches.delete(socket.id);
    }

    socket.on("skip", cleanup);
    socket.on("endCall", async (payload = {}) => {
        const isFriendCall = payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'to');
        if (isFriendCall) {
            try {
                const callId = normalizeCallId(payload.callId);
                if (callId) {
                    endFriendCall({
                        callId,
                        socketId: socket.id,
                        userId: socket.data.user.id,
                    });
                }
            } catch (error) {
                console.error('Không thể kết thúc cuộc gọi bạn bè:', error);
            }
            return;
        }

        cleanup();
    });

    socket.on('logoutUser', () => {
        endFriendCallsForSocket(socket.id, socket.data.user.id);
        cleanup();
        markSocketUserOffline();
        socket.disconnect(true);
    });

    socket.on("disconnect", () => {
        console.log("Disconnect:", socket.id);
        endFriendCallsForSocket(socket.id, socket.data.user.id);
        cleanup();
        markSocketUserOffline();
    });
});

function tryToMatch() {
    if (waitingQueue.length < 2) return;

    const matchesPreference = (searcher, candidate) => {
        const preferences = searcher.matchPreferences || {};
        const genderMatches = !preferences.gender || preferences.gender === 'all' || preferences.gender === candidate.userInfo?.gender;
        const countryMatches = !preferences.country || preferences.country === 'all' || preferences.country === candidate.userInfo?.country;
        return genderMatches && countryMatches;
    };

    let firstIndex = -1;
    let partnerIndex = -1;
    for (let index = 0; index < waitingQueue.length - 1 && firstIndex === -1; index += 1) {
        for (let candidateIndex = index + 1; candidateIndex < waitingQueue.length; candidateIndex += 1) {
            if (matchesPreference(waitingQueue[index], waitingQueue[candidateIndex]) && matchesPreference(waitingQueue[candidateIndex], waitingQueue[index])) {
                firstIndex = index;
                partnerIndex = candidateIndex;
                break;
            }
        }
    }

    if (firstIndex === -1) return;

    const user1 = waitingQueue[firstIndex];
    const user2 = waitingQueue[partnerIndex];
    waitingQueue.splice(partnerIndex, 1);
    waitingQueue.splice(firstIndex, 1);

    // Lưu chéo 2 chiều rõ ràng bằng socket.id
    activeMatches.set(user1.id, user2.id);
    activeMatches.set(user2.id, user1.id);

    console.log("================================");
    console.log("🎉 MATCH SUCCESS");
    console.log(user1.id, "<->", user2.id);
    console.log("================================");

    io.to(user1.id).emit("matchFound", {
        partner: user2.userInfo,
        initiator: true
    });

    io.to(user2.id).emit("matchFound", {
        partner: user1.userInfo,
        initiator: false
    });
}

/* ==========================
    START SERVER
========================== */
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("================================");
    console.log("🚀 ChatWave Backend Started (HTTP)");
    console.log(`🌐 Local : http://localhost:${PORT}`);
    console.log("================================");
});
app.set('io', io);
