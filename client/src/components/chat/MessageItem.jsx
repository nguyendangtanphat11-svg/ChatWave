import React from 'react';

const MessageItem = ({ msg, user, partnerInfo }) => {
    const isMe = msg.sender === 'me';
    const senderInfo = isMe ? user : partnerInfo;
    const avatarUrl = senderInfo?.avatar || `https://ui-avatars.com/api/?name=${senderInfo?.username || '?'}&background=4F46E5&color=fff`;

    return (
        <div className={`chat-message-group ${isMe ? 'me' : ''}`}>
            {!isMe && <img className="chat-avatar" src={avatarUrl} alt="avatar" />}
            <div className="chat-message-content">
                <div className="chat-message-header">
                    <span className="chat-username">{isMe ? 'Bạn' : senderInfo?.username}</span>
                    <span className="chat-timestamp">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="chat-message-text">{msg.text}</p>
            </div>
            {isMe && <img className="chat-avatar" src={avatarUrl} alt="avatar" />}
        </div>
    );
};

export default MessageItem;