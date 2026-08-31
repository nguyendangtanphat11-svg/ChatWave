import { FaComment, FaUserMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';

const FriendCard = ({ friend, onChat, onRemove }) => {
    const navigate = useNavigate();
    const friendId = friend.id || friend._id;
    return (
        <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--card-bg, #242526)', borderRadius: '12px', border: '1px solid var(--border-color, #393a3b)' }}>
            <button type="button" onClick={() => navigate(`/profile/${friendId}`)} title="Xem hồ sơ" aria-label={`Xem hồ sơ ${friend.fullName || friend.username}`} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}><img src={getAvatarUrl(friend.avatar, friend.username)} alt={friend.username} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--profile-accent, #4F46E5)' }} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(friend.username); }} /></button>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 4px 0', color: 'var(--profile-text-primary, #e4e6eb)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <button type="button" onClick={() => navigate(`/profile/${friendId}`)} style={{ padding: 0, border: 0, background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer' }}>{friend.fullName || friend.username}</button>
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--profile-text-secondary, #b0b3b8)' }}>@{friend.username}</p>
                <span className={`status-badge ${friend.status}`} style={{ marginTop: '6px', fontSize: '0.7rem', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', background: friend.status === 'online' ? '#22c55e20' : '#64748b20', color: friend.status === 'online' ? '#22c55e' : '#94a3b8' }}>
                    {friend.status === 'online' ? 'Online' : 'Offline'}
                </span>
            </div>
            <button 
                className="btn btn-primary" 
                style={{ padding: '0.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4F46E5', color: 'white', border: 'none', cursor: 'pointer' }}
                title="Nhắn tin"
                onClick={() => onChat(friendId)}
            >
                <FaComment />
            </button>
            <button type="button" style={{ padding: '0.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#7f1d1d', color: 'white', border: 'none', cursor: 'pointer' }} title="Xóa bạn" aria-label={`Xóa bạn ${friend.fullName || friend.username}`} onClick={() => onRemove?.(friend)}><FaUserMinus /></button>
        </div>
    );
};

export default FriendCard;
