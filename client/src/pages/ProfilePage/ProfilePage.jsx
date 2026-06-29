import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

import ProfileHeader from "../../components/ProfilePage/ProfileHeader";
import PersonalInfo from "../../components/ProfilePage/PersonalInfo";
import Statistics from "../../components/ProfilePage/Statistics";
import SecuritySettings from "../../components/ProfilePage/SecuritySettings";
import AppSettings from "../../components/ProfilePage/AppSettings";

import LoadingSpinner from "../../components/common/LoadingSpinner/LoadingSpinner";
import Notification from "../../components/common/Notification/Notification";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [initialUser, setInitialUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const navigate = useNavigate();

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const fetchUserProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const { data } = await axios.get(`${API_URL}/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(data);
            setInitialUser(data);
            setAvatarPreview(data.avatar);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            showNotification('Không thể tải thông tin người dùng.', 'error');
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser({ ...user, [name]: value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            if (!isEditing) setIsEditing(true); // Tự động bật chế độ chỉnh sửa khi chọn ảnh
        } else if (file) {
            showNotification('Vui lòng chọn một file ảnh hợp lệ.', 'error');
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            let profileUpdated = false;

            // 1. Update avatar if changed
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                await axios.put(`${API_URL}/users/avatar`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                });
                profileUpdated = true;
            }

            // 2. Update profile info if changed
            const changedData = Object.keys(user).reduce((acc, key) => {
                if (user[key] !== initialUser[key] && ['username', 'fullName', 'gender'].includes(key)) {
                    acc[key] = user[key];
                }
                return acc;
            }, {});

            if (Object.keys(changedData).length > 0) {
                 await axios.put(`${API_URL}/users/profile`, changedData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                profileUpdated = true;
            }
            
            if (profileUpdated) {
                showNotification('Cập nhật thông tin thành công!', 'success');
                setIsEditing(false);
                await fetchUserProfile(); // Tải lại dữ liệu mới nhất
            } else {
                 showNotification('Không có gì để cập nhật.', 'info');
                 setIsEditing(false);
            }

        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification(error.response?.data?.message || 'Cập nhật thất bại.', 'error');
        } finally {
            setIsLoading(false);
            setAvatarFile(null);
        }
    };
    
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
            showNotification('Chức năng xóa tài khoản đang được phát triển.', 'info');
        }
    };

    const handleCancel = () => {
        setUser(initialUser);
        setAvatarPreview(initialUser.avatar);
        setAvatarFile(null);
        setIsEditing(false);
    };

    if (isLoading && !user) { // Chỉ hiển thị loading toàn trang khi chưa có dữ liệu
        return <LoadingSpinner />;
    }

    if (!user) {
        return <div className="profile-container">Không tìm thấy thông tin người dùng.</div>;
    }

    return (
        <div className="profile-container fade-in">
            {isLoading && <LoadingSpinner />}
            {notification.message && <Notification message={notification.message} type={notification.type} />}
            
            <ProfileHeader 
                user={user} 
                avatarPreview={avatarPreview}
                onAvatarChange={handleAvatarChange}
            />

            <div className="profile-grid">
                <div className="profile-main-content">
                    <PersonalInfo 
                        user={user} 
                        isEditing={isEditing}
                        onInputChange={handleInputChange}
                    />
                    <SecuritySettings userProvider={user.provider} showNotification={showNotification} />
                    <AppSettings />
                </div>
                <div className="profile-sidebar">
                    <Statistics user={user} />
                </div>
            </div>

            <div className="profile-actions">
                {isEditing ? (
                    <>
                        <button onClick={handleUpdateProfile} className="btn btn-primary">Lưu thay đổi</button>
                        <button onClick={handleCancel} className="btn btn-secondary">Hủy</button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="btn btn-secondary">Chỉnh sửa thông tin</button>
                )}
                <button onClick={handleLogout} className="btn btn-secondary">Đăng xuất</button>
                <button onClick={handleDeleteAccount} className="btn btn-danger">Xóa tài khoản</button>
            </div>
        </div>
    );
};

export default ProfilePage;
