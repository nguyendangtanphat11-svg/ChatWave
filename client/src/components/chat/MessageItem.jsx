import React from 'react';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';

const MessageItem = ({ msg, user, partnerInfo }) => {
    const isMe = msg.sender === 'me';
    const senderInfo = isMe ? user : partnerInfo;
    const avatarUrl = getAvatarUrl(senderInfo?.avatar, senderInfo?.username);

    return (
        <div className={`chat-message-group ${isMe ? 'me' : ''}`}>
            {!isMe && <img className="chat-avatar" src={avatarUrl} alt="avatar" onError={(event) => { event.currentTarget.src = getInitialAvatarUrl(senderInfo?.username); }} />}
            <div className="chat-message-content">
                <div className="chat-message-header">
                    <span className="chat-username">{isMe ? 'Bạn' : senderInfo?.username}</span>
                    <span className="chat-timestamp">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="chat-message-text">{msg.message}</p>
            </div>
            {isMe && <img className="chat-avatar" src={avatarUrl} alt="avatar" onError={(event) => { event.currentTarget.src = getInitialAvatarUrl(senderInfo?.username); }} />}
        </div>
    );
};

export default MessageItem;
