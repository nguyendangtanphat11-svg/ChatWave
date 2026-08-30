import React, { useState } from 'react';
import axios from 'axios';
import { FaExclamationTriangle, FaFileAlt, FaShieldAlt, FaTimes } from 'react-icons/fa';
import { getAvatarUrl } from '../../utils/imageUrl';
import { useNotifications } from '../../contexts/NotificationContext';
import './ConversationInfo.css';

const decodeAttachment = (message = '') => {
    if (message.startsWith('chat:v1:')) { try { return JSON.parse(message.slice(8)).attachment; } catch { return null; } }
    const image = message.match(/<img\s+[^>]*src=["']([^"']+)["']/i);
    if (image) return { type: 'image', url: image[1], name: 'Ảnh' };
    const file = message.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
    return file ? { type: 'file', url: file[1], name: file[2].replace(/<[^>]+>/g, '').trim() || 'Tệp đính kèm' } : null;
};

export default function ConversationInfo({ currentUser, friend, onRemoveFriend }) {
    const { toast } = useNotifications();
    const [panel, setPanel] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const matchId = [currentUser?.id || currentUser?._id, friend?.id || friend?._id].sort((a, b) => Number(a) - Number(b)).join('_');

    const openMedia = async () => {
        setPanel('media');
        setLoading(true);
        try {
            const response = await axios.get(`/api/messages/${matchId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setAttachments((response.data.messages || []).map((item) => decodeAttachment(item.message)).filter(Boolean));
        } catch (error) { toast(error.response?.data?.message || 'Không thể tải file và phương tiện.', 'error'); }
        finally { setLoading(false); }
    };

    return <>
        <div className="friends-detail-section">
            <h3>Thông tin trò chuyện</h3>
            <button type="button" onClick={openMedia}><FaFileAlt /> File và phương tiện</button>
            <button type="button" onClick={() => setPanel('privacy')}><FaShieldAlt /> Quyền riêng tư và hỗ trợ</button>
        </div>
        {panel && <div className="conversation-info-overlay" role="dialog" aria-modal="true">
            <section className="conversation-info-modal">
                <header><h2>{panel === 'media' ? 'File và phương tiện' : 'Quyền riêng tư và hỗ trợ'}</h2><button type="button" onClick={() => setPanel(null)} aria-label="Đóng"><FaTimes /></button></header>
                {panel === 'media' ? <div className="conversation-media-grid">{loading ? <p>Đang tải…</p> : attachments.length ? attachments.map((attachment, index) => attachment.type === 'image' ? <a href={getAvatarUrl(attachment.url)} target="_blank" rel="noreferrer" key={`${attachment.url}-${index}`}><img src={getAvatarUrl(attachment.url)} alt={attachment.name} /></a> : <a className="conversation-file" href={getAvatarUrl(attachment.url)} target="_blank" rel="noreferrer" key={`${attachment.url}-${index}`}><FaFileAlt /> {attachment.name}</a>) : <p>Chưa có ảnh hoặc tệp nào được chia sẻ.</p>}</div> : <div className="conversation-privacy"><p>Quản lý an toàn cho cuộc trò chuyện với <strong>{friend.fullName || friend.username}</strong>.</p><button type="button" onClick={() => { setPanel(null); onRemoveFriend(friend); }}><FaExclamationTriangle /> Xóa bạn và dừng nhắn tin</button><button type="button" onClick={() => toast('Báo cáo đã được ghi nhận. Chúng tôi sẽ xem xét nội dung cuộc trò chuyện.', 'success')}><FaShieldAlt /> Báo cáo người dùng</button></div>}
            </section>
        </div>}
    </>;
}
