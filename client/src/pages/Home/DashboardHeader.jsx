import { Link } from 'react-router-dom';
import { FaRegBell } from 'react-icons/fa'; // Hoặc thư viện icon bạn đang dùng
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';

/**
 * Component hiển thị Header của Dashboard
 */
const DashboardHeader = ({ user, scrolled, isDropdownOpen, setIsDropdownOpen, isNotificationsOpen, setIsNotificationsOpen, notifications, onNotificationClick, menuRef, onLogout, onNavigate }) => {
    const avatarSrc = getAvatarUrl(user?.avatar, user?.username, user?.avatarVersion);

    return (
        <header className={`dash-header ${scrolled ? "scrolled" : ""}`}>
            <div className="header-content" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <div className="dash-logo logo" onClick={() => onNavigate('/Dashboard')} style={{ cursor: 'pointer' }}>
                    <h2>ChatWave</h2>
                </div>

                <nav className="main-nav">
                    <a href="#home" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>Trang Chủ</a>
                    <a href="#chat" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('/chat'); }}>Chat</a>
                    <a href="#friends" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('/friends'); }}>Bạn Bè</a>
                    <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigate('/Introduce'); }}>Giới thiệu</a>
                </nav>

                <div className="dash-user-menu" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="dash-notification-wrap">
                        <button className="dash-icon-btn dash-notification-trigger" type="button" onClick={() => setIsNotificationsOpen((open) => !open)} aria-label="Thông báo" aria-expanded={isNotificationsOpen}>
                            <FaRegBell />
                            {notifications.some((notification) => !notification.read) && <span className="dash-notification-badge">{notifications.filter((notification) => !notification.read).length}</span>}
                        </button>
                        {isNotificationsOpen && <div className="dash-notification-menu" role="menu">
                            <div className="dash-notification-title"><strong>Thông báo</strong><span>{notifications.filter((notification) => !notification.read).length ? 'Mới' : 'Đã xem tất cả'}</span></div>
                            {notifications.length ? notifications.slice(0, 8).map((notification) => <button type="button" role="menuitem" key={notification.id} className={`dash-notification-item ${notification.read ? '' : 'unread'}`} onClick={() => onNotificationClick(notification)}>
                                <span className={`dash-notification-icon ${notification.type}`}>{notification.type === 'call' ? '☎' : notification.type === 'friend' ? '＋' : '✦'}</span>
                                <span><strong>{notification.title}</strong><small>{notification.message}</small></span>
                            </button>) : <p className="dash-notification-empty">Chưa có thông báo mới.</p>}
                        </div>}
                    </div>
                    {user ? (
                        <div className="user-menu-container" ref={menuRef}>
                            <button className="user-menu-trigger" onClick={() => setIsDropdownOpen(prev => !prev)}>
                                <img
                                    src={avatarSrc}
                                    alt={`Avatar của ${user.username || 'người dùng'}`}
                                    className="user-avatar"
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = getInitialAvatarUrl(user.username);
                                    }}
                                />
                                <div className="user-info">
                                    <span className="username">{user?.username || "Tài khoản"}</span>
                                    <span className="user-status">Online</span>
                                </div>
                                <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                            </button>
                            {isDropdownOpen && (
                                <div className="user-dropdown">
                                    <Link to="/profile" className="dropdown-item">👤 Hồ sơ cá nhân</Link>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={onLogout} className="dropdown-item logout">🚪 Đăng xuất</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="header-actions">
                            <Link to="/login" className="nav-link">Đăng nhập</Link>
                            <Link to="/register" className="nav-button-primary">Đăng ký</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
