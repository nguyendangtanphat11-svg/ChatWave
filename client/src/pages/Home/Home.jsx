import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserFriends, FaUserPlus } from 'react-icons/fa';
import FriendCard from '../../components/friends/FriendCard';
import RequestCard from '../../components/friends/RequestCard';
import FriendChatBox from '../../components/friends/FriendChatBox';
import PostFeed from '../../components/posts/PostFeed';

// Import Header và Footer đã được tách file (điều chỉnh đường dẫn './' cho phù hợp với cấu trúc thư mục của bạn)
import DashboardHeader from './DashboardHeader';
import Footer from './Footer';
import { useUser } from '../../contexts/useUser';
import { useNotifications } from '../../contexts/useNotifications';

import '../../styles/global.css';
import './Home.css';

const getFriendsSnapshot = async () => {
    const token = localStorage.getItem('token');
    if (!token) return { friends: [], pendingRequests: [] };

    const response = await axios.get('/api/friends/list', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return {
        friends: response.data.friends || [],
        pendingRequests: response.data.pendingRequests || [],
    };
};

// SVG Icons được đưa ra ngoài component để tránh khởi tạo lại mỗi lần render
const ICONS = {
    mic: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75a.75.75 0 01.75-.75z" /></svg>,
    chat: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.75 6.75 0 006.75-6.75v-2.5a.75.75 0 011.5 0v2.5a8.25 8.25 0 01-8.25 8.25c-1.33 0-2.605-.308-3.746-.882a.75.75 0 01.293-1.376z" clipRule="evenodd" /><path d="M12 2.25a.75.75 0 01.75.75v6.94l2.28-2.28a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L8.47 7.97a.75.75 0 111.06-1.06l2.28 2.28V3a.75.75 0 01.75-.75z" /></svg>,
    next: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" /></svg>,
     facebook: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>,
    github: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
    email: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" /></svg>,
    camera: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-2.25l3.44 1.72a.75.75 0 001.06-.62v-6.66a.75.75 0 00-1.06-.62l-3.44 1.72V7.5a3 3 0 00-3-3H4.5z" /></svg>,
};

/**
 * Component Hero Section
 */
const HeroSection = ({ onNavigate, socket }) => {
    // State lưu số lượng người online thật
    const [onlineCount, setOnlineCount] = useState(0);

    // State cho các bộ lọc (Giới tính, Quốc gia)
    const [gender, setGender] = useState('all'); // 'all', 'male', 'female'
    const [country, setCountry] = useState('all'); // 'all', 'VN', 'US', ...

    // Trạng thái mở/đóng dropdown lọc
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    // Lắng nghe dữ liệu trực tuyến thật từ Socket.io
    useEffect(() => {
        if (!socket) return;

        // Lắng nghe sự kiện cập nhật số lượng người online từ server
        const handleOnlineCount = (count) => {
            setOnlineCount(count);
        };

        socket.on('onlineCount', handleOnlineCount);

        // Gửi yêu cầu lọc ban đầu nếu cần
        socket.emit('getOnlineCount');

        return () => {
            socket.off('onlineCount', handleOnlineCount);
        };
    }, [socket]);

    // Xử lý khi thay đổi bộ lọc
    const handleSelectGender = (selectedGender) => {
        setGender(selectedGender);
        setShowGenderDropdown(false);
    };

    const handleSelectCountry = (selectedCountry) => {
        setCountry(selectedCountry);
        setShowCountryDropdown(false);
    };

    return (
        <section className="hero-section section" id="home">
            <div className="hero-content">
                <h1 className="hero-title">Kết nối với mọi người trên toàn thế giới</h1>
                <p className="hero-description">
                    ChatWave là nền tảng trò chuyện video ngẫu nhiên giúp bạn kết nối với mọi người trên khắp thế giới một cách nhanh chóng, miễn phí và an toàn.
                </p>
                <div className="hero-buttons">
                    <button onClick={() => onNavigate('/chat')} className="btn btn-primary">Bắt đầu trò chuyện</button>
                    <button onClick={() => onNavigate('/Introduce')} className="btn btn-secondary">Giới thiệu</button>
                </div>
            </div>

            <div className="hero-video-mockup" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#0b0b0b', borderRadius: '24px', overflow: 'hidden', padding: '2rem', minHeight: '400px' }}>
                
                {/* Các icon góc trên bên trái */}
              

                {/* Logo ở giữa & Số liệu thật */}
                <div style={{ textAlign: 'center', margin: 'auto' }}>
                    <h2 style={{ fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-1px', color: '#3a3b3c', marginBottom: '12px', fontFamily: 'sans-serif' }}>ChatWave</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#e4e6eb', fontSize: '0.95rem', fontWeight: '500' }}>
                        <span className="status-dot online" style={{ width: '8px', height: '8px', backgroundColor: '#31a24c', borderRadius: '50%', display: 'inline-block' }}></span>
                        <span>{onlineCount.toLocaleString()} đang trực tuyến kết hợp ngay bây giờ!</span>
                    </div>
                </div>

                {/* Thanh điều khiển & Bộ lọc phía dưới */}
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', position: 'relative' }}>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Nút Lọc Giới Tính */}
                        <div style={{ position: 'relative' }}>
                            <button 
                                type="button" 
                                onClick={() => { setShowGenderDropdown(!showGenderDropdown); setShowCountryDropdown(false); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', padding: '10px 16px', borderRadius: '20px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                            >
                                <span>⚧ Giới tính: {gender === 'all' ? 'Tất cả' : gender}</span> <span>{showGenderDropdown ? '∧' : '∨'}</span>
                            </button>
                            
                            {showGenderDropdown && (
                                <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#242526', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 10, minWidth: '140px' }}>
                                    <div onClick={() => handleSelectGender('all')} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #3a3b3c' }}>Tất cả</div>
                                    <div onClick={() => handleSelectGender('Nam')} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #3a3b3c' }}>Nam</div>
                                    <div onClick={() => handleSelectGender('Nữ')} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer' }}>Nữ</div>
                                </div>
                            )}
                        </div>

                        {/* Nút Lọc Quốc Gia */}
                        <div style={{ position: 'relative' }}>
                            <button 
                                type="button" 
                                onClick={() => { setShowCountryDropdown(!showCountryDropdown); setShowGenderDropdown(false); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', padding: '10px 16px', borderRadius: '20px', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                            >
                                <span>🌐 Quốc gia: {country === 'all' ? 'Tất cả' : country}</span> <span>{showCountryDropdown ? '∧' : '∨'}</span>
                            </button>

                            {showCountryDropdown && (
                                <div style={{ position: 'absolute', bottom: '110%', left: 0, background: '#242526', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 10, minWidth: '140px' }}>
                                    <div onClick={() => handleSelectCountry('all')} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #3a3b3c' }}>Tất cả</div>
                                    <div onClick={() => handleSelectCountry('VN')} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #3a3b3c' }}>Việt Nam (VN)</div>
                                    <div onClick={() => handleSelectCountry('US')} style={{ padding: '10px 16px', color: '#fff', cursor: 'pointer' }}>Mỹ (US)</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nút Bắt đầu chat video kèm theo thông tin bộ lọc */}
                    <div>
                        <button 
                            onClick={() => onNavigate(`/chat?gender=${gender}&country=${country}`)} 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', color: '#000000', border: 'none', padding: '10px 9px', borderRadius: '20px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                        >
                            <span>📹</span> Bắt đầu chat video
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};

/**
 * Component Quản lý Bạn bè & Lời mời
 */
const FriendsSection = ({ 
    activeTab, 
    setActiveTab, 
    friends, 
    pendingRequests, 
    loadingFriends, 
    onSelectFriend, 
    onRespondRequest,
    onRemoveFriend
}) => (
    <section className="messenger-container-section" id="friends" style={{ padding: '2rem 5%', background: 'var(--bg-color, #d6d6d60c),'}}>
        <div style={{ background: 'var(--card-bg, #242526)', padding: '2rem', borderRadius: '16px' }}>
            <h2 style={{ color: 'var(--profile-text-primary, #e4e6eb)', marginBottom: '1.5rem' }}>Quản lý bạn bè</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                    className={`btn ${activeTab === 'friends' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('friends')}
                    style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', border: 'none' }}
                >
                    <FaUserFriends /> Bạn bè ({friends.length})
                </button>
                <button 
                    className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('requests')}
                    style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', border: 'none' }}
                >
                    <FaUserPlus /> Lời mời ({pendingRequests.length})
                </button>
            </div>

            {loadingFriends ? (
                <p style={{ color: '#b0b3b8' }}>Đang tải danh sách...</p>
            ) : activeTab === 'friends' ? (
                friends.length === 0 ? <p style={{ color: '#b0b3b8' }}>Chưa có bạn bè nào.</p> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {friends.map(f => (
                        <FriendCard key={f.id || f._id} friend={f} onRemove={onRemoveFriend} onChat={(id) => {
                            const found = friends.find(item => (item.id || item._id) === id);
                            if (found) onSelectFriend(found);
                        }} />
                    ))}
                </div>
            ) : (
                pendingRequests.length === 0 ? <p style={{ color: '#b0b3b8' }}>Không có lời mời nào.</p> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {pendingRequests.map(req => (
                        <RequestCard key={req.requestId} request={req} onRespond={onRespondRequest} />
                    ))}
                </div>
            )}
        </div>
    </section>
);

/**
 * Main Dashboard Component
 */
const Dashboard = ({ socket }) => {
    const { toast, confirm } = useNotifications();
    const navigate = useNavigate();
    const menuRef = useRef(null);

    // States
    const { user, setUser, refreshUser } = useUser();
    const [scrolled, setScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Friends & Chat States
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const pushNotification = useCallback((notification) => {
        setNotifications((previous) => [{ ...notification, id: `${notification.type}-${Date.now()}-${Math.random()}`, read: false }, ...previous].slice(0, 30));
    }, []);

    // 1. Đồng bộ user mới nhất khi Dashboard được mở và lắng nghe sự kiện Scroll
    useEffect(() => {
        if (localStorage.getItem('token')) {
            refreshUser().catch((error) => {
                console.error('Không thể đồng bộ hồ sơ người dùng:', error);
            });
        }

        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [refreshUser]);

    // 2. Lắng nghe tin nhắn ngầm toàn cục
    useEffect(() => {
        if (!socket) return;

        const handleGlobalMessage = (data) => {
            console.log("🔔 Dashboard nhận tin nhắn ngầm:", data);
        };

        const notifyOnMessage = (data) => {
            handleGlobalMessage(data);
            pushNotification({ type: 'message', title: 'Tin nhắn mới', message: 'Bạn có một tin nhắn mới.', senderId: data.senderId });
        };
        socket.on("receiveFriendMessage", notifyOnMessage);
        return () => {
            socket.off("receiveFriendMessage", notifyOnMessage);
        };
    }, [socket, pushNotification]);

    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (call) => {
            const caller = friends.find((friend) => String(friend.id || friend._id) === String(call.from));
            pushNotification({ type: 'call', title: 'Cuộc gọi đến', message: `${call.callerName || 'Bạn bè'} đang gọi cho bạn.`, senderId: call.from });
            if (caller) {
                setSelectedFriend(caller);
                setIncomingCall({ ...call, receivedAt: Date.now() });
            }
        };

        socket.on('incomingCall', handleIncomingCall);
        return () => socket.off('incomingCall', handleIncomingCall);
    }, [socket, friends, pushNotification]);

    useEffect(() => {
        if (!socket) return;
        const handleFriendPresence = ({ userId, status }) => {
            setFriends((previousFriends) => previousFriends.map((friend) => (
                String(friend.id || friend._id) === String(userId) ? { ...friend, status } : friend
            )));
            setSelectedFriend((previousFriend) => (
                previousFriend && String(previousFriend.id || previousFriend._id) === String(userId)
                    ? { ...previousFriend, status }
                    : previousFriend
            ));
        };
        socket.on('friendPresence', handleFriendPresence);
        return () => socket.off('friendPresence', handleFriendPresence);
    }, [socket]);

    // 4. Lấy dữ liệu bạn bè & lời mời kết bạn từ API
    const fetchFriendsData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('/api/friends/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriends(res.data.friends || []);
            setPendingRequests(res.data.pendingRequests || []);
        } catch (error) {
            console.error('Lỗi tải dữ liệu bạn bè:', error);
        } finally {
            setLoadingFriends(false);
        }
    }, []);

    useEffect(() => {
        let isCurrent = true;
        const loadInitialFriends = async () => {
            try {
                const { friends: nextFriends, pendingRequests: nextPendingRequests } = await getFriendsSnapshot();
                if (!isCurrent) return;
                setFriends(nextFriends);
                setPendingRequests(nextPendingRequests);
            } catch (error) {
                console.error('Không thể tải dữ liệu bạn bè:', error);
            } finally {
                if (isCurrent) setLoadingFriends(false);
            }
        };

        void loadInitialFriends();
        return () => { isCurrent = false; };
    }, []);

    useEffect(() => {
        if (!socket) return undefined;
        const handleFriendRequest = ({ sender }) => {
            pushNotification({ type: 'friend', title: 'Lời mời kết bạn', message: `${sender?.fullName || sender?.username || 'Một người dùng'} đã gửi lời mời kết bạn.`, senderId: sender?.id });
            fetchFriendsData();
        };
        const handleFriendAccepted = () => {
            pushNotification({ type: 'friend', title: 'Kết bạn thành công', message: 'Lời mời kết bạn của bạn đã được chấp nhận.' });
            fetchFriendsData();
        };
        socket.on('friendRequestReceived', handleFriendRequest);
        socket.on('friendRequestAccepted', handleFriendAccepted);
        return () => {
            socket.off('friendRequestReceived', handleFriendRequest);
            socket.off('friendRequestAccepted', handleFriendAccepted);
        };
    }, [socket, pushNotification, fetchFriendsData]);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Xử lý hành động
    const handleLogout = () => {
        window.dispatchEvent(new Event('auth:logout'));
        localStorage.clear();
        setUser(null);
        navigate('/login');
    };

    const handleRespondRequest = async (requestId, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/friends/respond', { requestId, status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFriendsData();
        } catch (error) {
            toast(error.response?.data?.message || 'Có lỗi xảy ra', 'error');
        }
    };

    const handleRemoveFriend = async (friend) => {
        if (!await confirm({ title: 'Xóa bạn bè?', message: `Xóa ${friend.fullName || friend.username} khỏi danh sách bạn bè?`, confirmLabel: 'Xóa bạn', danger: true })) return;
        try {
            await axios.delete(`/api/friends/${friend.id || friend._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setFriends((previous) => previous.filter((item) => String(item.id || item._id) !== String(friend.id || friend._id)));
            setSelectedFriend((previous) => String(previous?.id || previous?._id) === String(friend.id || friend._id) ? null : previous);
        } catch (error) { toast(error.response?.data?.message || 'Không thể xóa bạn bè.', 'error'); }
    };

    const handleNotificationClick = (notification) => {
        setNotifications((previous) => previous.map((item) => item.id === notification.id ? { ...item, read: true } : item));
        setIsNotificationsOpen(false);
        const relatedFriend = friends.find((friend) => String(friend.id || friend._id) === String(notification.senderId));
        if (relatedFriend && notification.type !== 'friend') {
            setSelectedFriend(relatedFriend);
            if (notification.type === 'call') setIncomingCall({ from: notification.senderId, callerName: relatedFriend.fullName || relatedFriend.username, receivedAt: Date.now() });
            return;
        }
        setActiveTab('requests');
        document.getElementById('friends')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="chatwave-dashboard">
            {/* Sử dụng Component Header */}
            <DashboardHeader 
                user={user}
                scrolled={scrolled}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                isNotificationsOpen={isNotificationsOpen}
                setIsNotificationsOpen={setIsNotificationsOpen}
                notifications={notifications}
                onNotificationClick={handleNotificationClick}
                menuRef={menuRef}
                onLogout={handleLogout}
                onNavigate={navigate}
            />

            <HeroSection onNavigate={navigate} socket={socket} />

            <FriendsSection 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                friends={friends}
                pendingRequests={pendingRequests}
                loadingFriends={loadingFriends}
                onSelectFriend={setSelectedFriend}
                onRespondRequest={handleRespondRequest}
                onRemoveFriend={handleRemoveFriend}
            />

            <section className="home-news-section" id="news">
                <div className="home-news-heading">
                    <div><p>BẢNG TIN CHATWAVE</p><h2>Tin tức từ bạn bè</h2><span>Chia sẻ khoảnh khắc và theo dõi cập nhật từ những người bạn của bạn.</span></div>
                </div>
                <PostFeed user={user} socket={socket} />
            </section>

            {selectedFriend && user && (
                <FriendChatBox 
                    currentUser={user} 
                    friend={selectedFriend} 
                    socket={socket} 
                    incomingCall={incomingCall}
                    onClose={() => { setSelectedFriend(null); setIncomingCall(null); }} 
                    variant="floating"
                />
            )}

            {/* Sử dụng Component Footer */}
            <Footer ICONS={ICONS} />
        </div>
    );
};

export default Dashboard;
