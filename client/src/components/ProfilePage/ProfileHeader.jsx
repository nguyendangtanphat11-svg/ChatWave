import React from 'react';
import { FaCamera, FaCheckCircle } from 'react-icons/fa';

const ProfileHeader = ({ user, avatarPreview, onAvatarChange }) => {
    return (
        <header className="profile-header">
            <div className="avatar-container">
                <img src={avatarPreview || '/default-avatar.png'} alt="Avatar" className="profile-avatar" />
                <label htmlFor="avatar-input" className="avatar-upload-btn" title="Đổi ảnh đại diện">
                    <FaCamera />
                </label>
                <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                />
            </div>
            <div>
                <h1 className="profile-name">
                    {user.username}
                    {user.provider === 'google' && (
                        <span className="verified-badge" title="Tài khoản đã xác minh qua Google">
                            <FaCheckCircle />
                        </span>
                    )}
                </h1>
                <p className="profile-email">{user.email}</p>
                <span className={`status-badge ${user.status === 'online' ? 'online' : 'offline'}`}>
                    {user.status === 'online' ? 'Online' : 'Offline'}
                </span>
            </div>
        </header>
    );
};

export default ProfileHeader;
