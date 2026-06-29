import React from 'react';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';

const EmojiIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-1.024.26-1.313.69a.75.75 0 001.138.975c.05-.087.14-.165.275-.165.135 0 .225.078.275.165a.75.75 0 001.138-.974A1.875 1.875 0 009.375 8.25zm5.25 0c-.54 0-1.024.26-1.313.69a.75.75 0 101.138.975c.05-.087.14-.165.275-.165.135 0 .225.078.275.165a.75.75 0 101.138-.974A1.875 1.875 0 0014.625 8.25zM12 15.75a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01.75.75H9.75a.75.75 0 01.75-.75v-.008a.75.75 0 01.75-.75h.008a.75.75 0 01.75-.75v-.008a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const SendIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>;

const ChatSidebar = ({ messages, inputValue, setInputValue, handleSendMessage, partnerInfo, user, chatBoxRef, isPartnerTyping, callState }) => {
    return (
        <aside className="chat-sidebar">
            <div className="chat-header-sidebar">Chat với {partnerInfo ? partnerInfo.username : 'người lạ'}</div>
            <div className="chat-messages" ref={chatBoxRef}>
                {messages.map((msg, index) => (
                    <MessageItem key={index} msg={msg} user={user} partnerInfo={partnerInfo} />
                ))}
                {isPartnerTyping && <TypingIndicator />}
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <div className="chat-input-wrapper">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={setInputValue}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                        placeholder="Nhập tin nhắn..."
                        className="chat-input"
                        disabled={callState !== 'in-call'}
                    />
                    <div className="chat-input-actions">
                        <button type="button"><EmojiIcon /></button>
                        <button type="submit" disabled={callState !== 'in-call'}><SendIcon /></button>
                    </div>
                </div>
            </form>
        </aside>
    );
};

export default ChatSidebar;