import React, { useState } from 'react';
import ImageMessage from './ImageMessage';
import FileMessage from './FileMessage';
import UploadButton from './UploadButton';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';
import './ChatSidebar.css';

const ChatSidebar = ({
    messages,
    inputValue,
    handleSendMessage, // <--- Nhận prop này ở đây
    handleInputChange,
    partnerInfo,
    user,
    chatBoxRef,
    isPartnerTyping,
    callState,
    isOpen,
    onClose,
    onUploadComplete
}) => {
    // State ẩn/hiện bảng chọn Emoji (nếu bạn dùng thư viện hoặc custom popup)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const renderMessage = (msg, index) => {
        const isMe = msg.sender === 'me';
        
        // Xác định ảnh đại diện (avatar) hiển thị
        const avatarUser = isMe ? user : partnerInfo;
        const avatarSrc = getAvatarUrl(avatarUser?.avatar, avatarUser?.username);

        return (
            <div key={index} className={`message-wrapper ${isMe ? 'sent' : 'received'}`}>
                {/* Avatar của người gửi (nếu là đối phương thì hiện bên trái, của mình có thể ẩn hoặc hiện bên phải) */}
                {!isMe && (
                    <img src={avatarSrc} alt="Avatar" className="message-avatar" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(partnerInfo?.username); }} />
                )}

                <div className={`message-content-container ${isMe ? 'sent' : 'received'}`}>
                    {msg.type === 'image' ? (
                        <ImageMessage url={msg.url} sender={msg.sender} />
                    ) : msg.type === 'file' ? (
                        <FileMessage url={msg.url} fileName={msg.fileName} size={msg.size} sender={msg.sender} />
                    ) : (
                        <div className="message-bubble">
                            {msg.message}
                        </div>
                    )}
                </div>

                {isMe && (
                    <img src={avatarSrc} alt="Avatar" className="message-avatar" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(user?.username); }} />
                )}
            </div>
        );
    };

    return (
        <aside id="random-chat-sidebar" className={`chat-sidebar ${callState === 'in-call' ? 'active' : ''} ${isOpen ? 'open' : ''}`} aria-label="Trò chuyện ngẫu nhiên">
            {/* Header */}
            <div className="chat-header-sidebar">
                <h5>Trò chuyện với {partnerInfo?.username || 'người lạ'}</h5>
                <button type="button" className="chat-sidebar-close mobile-only" onClick={onClose} aria-label="Đóng trò chuyện">×</button>
            </div>

            {/* Khung chat */}
            <div className="chat-box" ref={chatBoxRef}>
                {messages.map(renderMessage)}
                
                {isPartnerTyping && (
                    <div className="message-wrapper received">
                        <img src={getAvatarUrl(partnerInfo?.avatar, partnerInfo?.username)} alt="Avatar" className="message-avatar" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(partnerInfo?.username); }} />
                        <div className="message-content-container received">
                            <div className="message-bubble typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Khu vực nhập liệu */}
            <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-form">
                    {/* Nhóm các icon tiện ích bên trái (Gửi ảnh/file qua UploadButton tùy chỉnh hoặc nút icon) */}
                    <div className="chat-actions-left">
                        {/* Tích hợp nút upload file/ảnh */}
                        <div className="upload-wrapper" title="Đính kèm file hoặc ảnh">
                            <UploadButton onUploadComplete={onUploadComplete} />
                        </div>

                        {/* Nút biểu cảm Emoji */}
                        <button 
                            type="button" 
                            className="action-icon-btn" 
                            title="Chèn biểu cảm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Ô nhập tin nhắn */}
                  <input
    type="text"
    className="form-control"
    placeholder="Nhập tin nhắn..."
    value={inputValue}
    onChange={handleInputChange} // Dùng hàm xử lý sự kiện gõ phím kèm typing ở đây
    disabled={callState !== 'in-call'}
/>

                    {/* Nút Gửi */}
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={!inputValue.trim() || callState !== 'in-call'}
                        title="Gửi tin nhắn"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </aside>
    );
};

export default ChatSidebar;
