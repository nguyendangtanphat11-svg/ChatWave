import { useEffect, useState } from 'react';
import { FaComments, FaHeart, FaRegCommentDots, FaUserFriends, FaCalendarAlt } from 'react-icons/fa';
import { getUserStatistics } from '../../services/userService';

export default function Statistics({ user }) {
    const [stats, setStats] = useState(null);
    useEffect(() => { let active = true; getUserStatistics().then((data) => { if (active) setStats(data); }).catch(() => { if (active) setStats({ friends: 0, posts: 0, receivedLikes: 0, receivedComments: 0, messages: 0 }); }); return () => { active = false; }; }, []);
    const items = [
        { id: 'posts', icon: <FaRegCommentDots />, value: stats?.posts, label: 'Bài viết' },
        { id: 'friends', icon: <FaUserFriends />, value: stats?.friends, label: 'Bạn bè' },
        { id: 'likes', icon: <FaHeart />, value: stats?.receivedLikes, label: 'Lượt thích nhận được' },
        { id: 'messages', icon: <FaComments />, value: stats?.messages, label: 'Tin nhắn' },
    ];
    return <div className="profile-card"><div className="card-header"><h2>Thống kê</h2></div><div className="stats-grid">{items.map((item) => <div key={item.id} className="stat-card"><div className="stat-icon">{item.icon}</div><div className="stat-value">{stats ? item.value : '—'}</div><div className="stat-label">{item.label}</div></div>)}</div><div className="stat-card" style={{ marginTop: '1rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '1rem' }}><div className="stat-icon"><FaCalendarAlt /></div><div><div className="stat-value" style={{ fontSize: '1.2rem' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</div><div className="stat-label">Ngày tham gia</div></div></div></div>;
}
