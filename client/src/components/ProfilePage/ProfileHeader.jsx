import React, { useMemo } from 'react';
import { FaCamera, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';

const ProfileHeader = ({ user, avatarPreview, avatarInputRef, onAvatarChange, onEdit, onLogout, isSaving }) => {
    const avatarSrc = useMemo(() => {
        // 1. Ưu tiên cao nhất: Ảnh tạm thời khi vừa chọn từ máy (blob)
        if (avatarPreview && avatarPreview.startsWith('blob:')) {
            return avatarPreview;
        }

        // 2. Lấy link ảnh đã được xử lý sẵn từ user object hoặc ảnh mặc định
        return getAvatarUrl(user?.avatar, user?.username, user?.avatarVersion);
    }, [avatarPreview, user?.avatar, user?.avatarVersion, user?.username]);

    return (
        <header className="profile-header">
            <Link to="/" className="back-home-btn" title="Quay lại trang chủ">
                <FaArrowLeft /> Trang chủ
            </Link>

            <div className="avatar-container">
                <img 
                    src={avatarSrc} 
                    alt="Avatar" 
                    className="profile-avatar"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getInitialAvatarUrl(user?.username);
                    }}
                />
                <label htmlFor="avatar-input" className="avatar-upload-btn" title="Đổi ảnh đại diện">
                    <FaCamera />
                </label>
                <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    onClick={(event) => { event.currentTarget.value = ''; }}
                    onChange={onAvatarChange}
                />
            </div>
            <div>
                <h1 className="profile-name">
                    {user?.username}
                    {user?.provider === 'google' && (
                        <span className="verified-badge" title="Tài khoản đã xác minh qua Google">
                            <FaCheckCircle />
                        </span>
                    )}
                </h1>
                <p className="profile-email">{user?.email}</p>
                <span className={`status-badge ${user?.status === 'online' ? 'online' : 'offline'}`}>
                    {user?.status === 'online' ? 'Online' : 'Offline'}
                </span>
            </div>
            <div className="profile-header-actions">
                <button type="button" className="btn btn-primary" onClick={onEdit} disabled={isSaving}>Chỉnh sửa trang cá nhân</button>
                <button type="button" className="btn btn-secondary" onClick={onLogout} disabled={isSaving}>Đăng xuất</button>
            </div>
        </header>
    );
};

export default ProfileHeader;
