import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaComment, FaUserMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';
import { useNotifications } from '../../contexts/NotificationContext';
import './ProfileFriends.css';

export default function ProfileFriends() {
    const { toast, confirm } = useNotifications();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;
        axios.get('/api/friends/list', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            .then((response) => { if (active) setFriends(response.data.friends || []); })
            .catch(() => { if (active) setFriends([]); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const removeFriend = async (friend) => {
        if (!await confirm({ title: 'Xóa bạn bè?', message: `Xóa ${friend.fullName || friend.username} khỏi danh sách bạn bè?`, confirmLabel: 'Xóa bạn', danger: true })) return;
        try {
            await axios.delete(`/api/friends/${friend.id || friend._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setFriends((previous) => previous.filter((item) => String(item.id || item._id) !== String(friend.id || friend._id)));
        } catch (error) { toast(error.response?.data?.message || 'Không thể xóa bạn bè.', 'error'); }
    };

    return <section className="profile-card profile-friends-card">
        <div className="card-header"><div><h2>Bạn bè</h2><p>{friends.length} bạn bè</p></div></div>
        {loading ? <p className="empty-state">Đang tải danh sách bạn bè…</p> : friends.length ? <div className="profile-friends-grid">{friends.map((friend) => <article className="profile-friend-item" key={friend.id || friend._id}><button type="button" className="profile-friend-link" onClick={() => navigate(`/profile/${friend.id || friend._id}`)}><img src={getAvatarUrl(friend.avatar, friend.username)} alt={`Avatar ${friend.fullName || friend.username}`} onError={(event) => { event.currentTarget.src = getInitialAvatarUrl(friend.username); }} /><span><strong>{friend.fullName || friend.username}</strong><small>{friend.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}</small></span></button><div className="profile-friend-actions"><button type="button" title="Nhắn tin" onClick={() => navigate('/friends')}><FaComment /></button><button type="button" title="Xóa bạn" className="remove" onClick={() => removeFriend(friend)}><FaUserMinus /></button></div></article>)}</div> : <p className="empty-state">Bạn chưa có bạn bè nào.</p>}
    </section>;
}
