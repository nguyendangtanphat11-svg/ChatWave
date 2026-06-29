const express = require("express");
const cors = require("cors");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes"); // Thêm route cho profile

const app = express();
const server = http.createServer(app);

/* ==========================
   EXPRESS
========================== */

app.use(cors({
    origin: [
        "https://chat-wave-theta-wheat.vercel.app"
    ],
    credentials: true
}));
app.use(express.json());

// Phục vụ file tĩnh từ thư mục public
app.use(express.static('public'));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/users", profileRoutes); // Sử dụng profile routes

app.get("/", (req, res) => {
    res.send("🚀 ChatWave Server đang hoạt động!");
});

/* ==========================
   SOCKET.IO
========================== */

const io = new Server(server, {
    cors: {
        origin: "https://chat-wave-theta-wheat.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
    }
});

let waitingQueue = [];
const activeMatches = new Map();

io.on("connection", (socket) => {

    console.log("================================");
    console.log("✅ Client Connected:", socket.id);
    console.log("================================");

    socket.on("joinQueue", (userInfo) => {

        console.log("Join Queue:", socket.id);

        socket.userInfo = {
            username: userInfo.username,
            avatar: userInfo.avatar,
            socketId: socket.id
        };

        const exists = waitingQueue.find(s => s.id === socket.id);

        if (!exists) {
            waitingQueue.push(socket);
        }

        console.log("Waiting:", waitingQueue.length);

        tryToMatch();

    });

    socket.on("cancelSearch", () => {

        waitingQueue = waitingQueue.filter(
            s => s.id !== socket.id
        );

    });

    socket.on("signal", (payload) => {

        io.to(payload.to).emit("signal", {
            from: socket.id,
            signal: payload.signal
        });

    });

    socket.on("chatMessage", (payload) => {

        const partnerId = activeMatches.get(socket.id);

        if (!partnerId) {
            console.log(`[Chat] Lỗi: Không tìm thấy partner cho ${socket.id}`);
            return;
        }

        console.log(`[Chat] ${socket.id} gửi tin nhắn tới ${partnerId}: "${payload.message}"`);

        io.to(partnerId).emit("chatMessage", {
            from: socket.id,
            message: payload.message,
            time: new Date()
        });

    });

    socket.on("mediaState", (payload) => {

        const partnerId = activeMatches.get(socket.id);

        if (!partnerId) return;

        io.to(partnerId).emit("partnerMediaState", payload);

    });

    function cleanup() {

        waitingQueue = waitingQueue.filter(
            s => s.id !== socket.id
        );

        const partnerId = activeMatches.get(socket.id);

        if (partnerId) {

            io.to(partnerId).emit("partnerDisconnected");

            activeMatches.delete(partnerId);

        }

        activeMatches.delete(socket.id);

    }

    socket.on("skip", cleanup);

    socket.on("endCall", cleanup);

    socket.on("disconnect", () => {

        console.log("Disconnect:", socket.id);

        cleanup();

    });

});

function tryToMatch() {

    if (waitingQueue.length < 2) return;

    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

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
    console.log("🚀 ChatWave Backend Started");
    console.log(`🌐 Local : http://localhost:${PORT}`);
    console.log("================================");

});