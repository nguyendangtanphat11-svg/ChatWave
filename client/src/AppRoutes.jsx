import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/Home/Home";
import LoginPage from "./pages/Login/Login";
import RegisterPage from "./pages/Register/Register";
import ChatPage from "./pages/Chat/Chat";
import ProfilePage from "./pages/ProfilePage/ProfilePage";

import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Trang chủ */}
                <Route path="/" element={<HomePage />} />

                {/* Đăng nhập */}
                <Route path="/login" element={<LoginPage />} />

                {/* Đăng ký */}
                <Route path="/register" element={<RegisterPage />} />

                {/* Chat (cần đăng nhập) */}
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <ChatPage />
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
            </Routes>
        </Router>
    );
};

export default AppRoutes;