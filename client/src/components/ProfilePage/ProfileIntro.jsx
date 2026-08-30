import React from 'react';
import { FaCalendarAlt, FaCircle } from 'react-icons/fa';

const ProfileIntro = ({ user }) => {
    const joinedAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
    return (
        <section className="profile-card profile-intro">
            <div className="card-header"><h2>Giới thiệu</h2></div>
            <p>{user?.fullName || user?.username}</p>
            <p className="intro-row"><FaCircle className={user?.status === 'online' ? 'online-dot' : ''} /> {user?.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
            <p className="intro-row"><FaCalendarAlt /> Tham gia từ {joinedAt}</p>
        </section>
    );
};

export default ProfileIntro;
