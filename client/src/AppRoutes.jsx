import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import config from "./config/config";
import { useUser } from "./contexts/UserContext";

import HomePage from "./pages/Home/Home";
import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";
import ChatPage from "./pages/Chat/Chat";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage/PublicProfilePage";
import FriendsPage from "./pages/FriendsPage/FriendsPage";
import Introduce from "./pages/Introduce/Introduce"; // 1. Import trang Dashboard
import LegalPage from "./pages/Legal/LegalPage";

import ProtectedRoute from "./components/ProtectedRoute";

// Socket dùng chung cho toàn bộ ứng dụng. URL chỉ được lấy từ config để dev
// dùng localhost còn production dùng biến môi trường Vite.
const socket = io(config.SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket", "polling"],
    auth: (callback) => callback({ token: localStorage.getItem('token') || '' }),
});

const AppRoutes = () => {
    const { user } = useUser();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) {
            socket.disconnect();
            return;
        }

        socket.connect();
    }, [user]);

    useEffect(() => {
        const handleConnect = () => {
            console.log("⚡ Client đã kết nối tới Socket Server thành công với ID:", socket.id);
        };

        const handleLogoutSocket = () => {
            if (socket.connected) socket.emit('logoutUser');
            socket.disconnect();
        };

        socket.on("connect", handleConnect);
        window.addEventListener('auth:logout', handleLogoutSocket);

        return () => {
            socket.off("connect", handleConnect);
            window.removeEventListener('auth:logout', handleLogoutSocket);
        };
    }, []);

    return (
        <Router>
            <Routes>
                {/* Trang chủ */}
                <Route path="/" element={<HomePage socket={socket} />} />

                {/* Đăng nhập */}
                <Route path="/login" element={<LoginPage />} />

                {/* Đăng ký */}
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="/privacy" element={<LegalPage />} />

                {/* Dashboard (cần đăng nhập) */}
                <Route
                    path="/Introduce"
                    element={
                        <ProtectedRoute>
                            <Introduce />
                        </ProtectedRoute>
                    }
                />

                {/* Chat (cần đăng nhập) */}
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage socket={socket} />
                        </ProtectedRoute>
                    }
                />

                {/* Hồ sơ */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/profile/:id" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />

                {/* Bạn bè (cần đăng nhập) */}
                <Route
                    path="/friends"
                    element={
                        <ProtectedRoute>
                            <FriendsPage socket={socket} />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
