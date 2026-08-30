import React from 'react';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';

const LogoutIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 00-1.5 0v3.75a.75.75 0 01-.75.75h-6a.75.75 0 01-.75-.75V5.25a.75.75 0 01.75-.75h6a.75.75 0 01.75.75V9A.75.75 0 0015 9V5.25a1.5 1.5 0 00-1.5-1.5h-6z" clipRule="evenodd" /><path fillRule="evenodd" d="M16.72 12.72a.75.75 0 001.06 0l3.75-3.75a.75.75 0 000-1.06l-3.75-3.75a.75.75 0 10-1.06 1.06l2.47 2.47H9.75a.75.75 0 000 1.5h9.44l-2.47 2.47a.75.75 0 000 1.06z" clipRule="evenodd" /></svg>;
const MenuIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;

const ChatHeader = ({ callState, onLogout, onToggleSidebar, isSidebarOpen, user }) => {
    const getStatusBadge = () => {
        switch (callState) {
            case 'searching':
                return <div className="chat-status-badge searching">Searching</div>;
            case 'in-call':
                return <div className="chat-status-badge connected">In Call</div>;
            case 'disconnected':
                return <div className="chat-status-badge disconnected">Offline</div>;
            default:
                return <div className="chat-status-badge online">Online</div>;
        }
    };

    return (
        <header className="chat-header">
            <div className="chat-header-left">
                <div className="chat-logo">ChatWave</div>
            </div>
            <div className="chat-header-center">
                <div className="chat-connection-status">
                    {getStatusBadge()}
                    {callState === 'in-call' && (
                        <>
                            <span className="chat-header-separator">|</span>
                            <span>Ping: 24ms</span>
                        </>
                    )}
                </div>
            </div>
            <div className="chat-header-right">
                <img 
                    src={getAvatarUrl(user?.avatar, user?.username)}
                    alt={user?.username} 
                    className="chat-header-avatar"
                    onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(user?.username); }}
                />
                <button className="chat-header-icon-btn" onClick={onLogout} title="Đăng xuất"><LogoutIcon /></button>
                <button
                    type="button"
                    className="chat-header-icon-btn mobile-only"
                    title={isSidebarOpen ? 'Đóng trò chuyện' : 'Mở trò chuyện'}
                    aria-label={isSidebarOpen ? 'Đóng trò chuyện' : 'Mở trò chuyện'}
                    aria-controls="random-chat-sidebar"
                    aria-expanded={isSidebarOpen}
                    onClick={onToggleSidebar}
                >
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};

export default ChatHeader;
