import React from 'react';
import { FaComments, FaVideo, FaUserFriends, FaClock, FaCalendarAlt } from 'react-icons/fa';

const Statistics = ({ user }) => {
    // Dữ liệu giả, bạn sẽ thay thế bằng dữ liệu thật từ API sau này
    const stats = [
        { id: 1, icon: <FaComments />, value: user.totalChats || 128, label: 'Cuộc trò chuyện' },
        { id: 2, icon: <FaVideo />, value: user.totalCalls || 42, label: 'Cuộc gọi video' },
        { id: 3, icon: <FaUserFriends />, value: user.totalFriends || 12, label: 'Bạn bè' },
        { id: 4, icon: <FaClock />, value: `${user.usageTime || 96}h`, label: 'Thời gian sử dụng' },
    ];

    return (
        <div className="profile-card">
            <div className="card-header">
                <h2>Thống kê</h2>
            </div>
            <div className="stats-grid">
                {stats.map(stat => (
                    <div key={stat.id} className="stat-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>
             <div className="stat-card" style={{marginTop: '1rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div className="stat-icon"><FaCalendarAlt /></div>
                <div>
                    <div className="stat-value" style={{fontSize: '1.2rem'}}>{new Date(user.created_at).toLocaleDateString('vi-VN')}</div>
                    <div className="stat-label">Ngày tham gia</div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
