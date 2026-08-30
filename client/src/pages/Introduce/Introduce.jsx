import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaRegBell } from 'react-icons/fa';
import '../../styles/global.css';
import './Introduce.css';
import Footer from '../Home/Footer';

// --- DỮ LIỆU TĨNH ---
const ICONS = {
    video: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-2.25l3.44 1.72a.75.75 0 001.06-.62v-6.66a.75.75 0 00-1.06-.62l-3.44 1.72V7.5a3 3 0 00-3-3H4.5z" /></svg>,
    voice: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75a.75.75 0 01.75-.75z" /></svg>,
    shuffle: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M16.5 4.5a4.5 4.5 0 00-3.861 2.14l-2.895 4.26a.75.75 0 00.955 1.158l2.895-4.26A2.993 2.993 0 0116.5 6a3 3 0 013 3v.528A4.504 4.504 0 0015 12.128v-1.604a.75.75 0 00-1.5 0v1.604a4.5 4.5 0 003.452 4.372l-2.895 4.26a.75.75 0 10.955 1.158l2.895-4.26A4.5 4.5 0 0021 13.5a4.5 4.5 0 00-4.5-4.5zM4.5 4.5a4.5 4.5 0 00-3.861 2.14l-2.895 4.26a.75.75 0 00.955 1.158l2.895-4.26A2.993 2.993 0 014.5 6a3 3 0 013 3v.528A4.504 4.504 0 003 12.128v-1.604a.75.75 0 00-1.5 0v1.604a4.5 4.5 0 003.452 4.372l-2.895 4.26a.75.75 0 10.955 1.158l2.895-4.26A4.5 4.5 0 009 13.5a4.5 4.5 0 00-4.5-4.5z" clipRule="evenodd" /></svg>,
    realtime: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v4.257c0 .197-.08.387-.22.527l-1.94 1.94a.75.75 0 101.06 1.06l1.94-1.94c.38-.38.527-.87.527-1.41V6z" clipRule="evenodd" /></svg>,
    shield: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>,
    multiplatform: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25a.75.75 0 000 1.5h2.25a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3.75a.75.75 0 01.75-.75h2.25a.75.75 0 000-1.5z" /></svg>,
    star: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>,
    plus: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>,
    facebook: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>,
    github: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
    email: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" /></svg>,
    camera: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-2.25l3.44 1.72a.75.75 0 001.06-.62v-6.66a.75.75 0 00-1.06-.62l-3.44 1.72V7.5a3 3 0 00-3-3H4.5z" /></svg>,
    mic: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75a.75.75 0 01.75-.75z" /></svg>,
    chat: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.291 3.808v4.273c0 1.947-1.369 3.558-3.291 3.808a39.559 39.559 0 01-6.337.408 39.56 39.56 0 01-6.337-.408C2.993 14.297 1.624 12.686 1.624 10.739V6.466c0-1.947 1.369-3.558 3.291-3.808z" /></svg>,
    next: <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path fillRule="evenodd" d="M15.75 4.5a.75.75 0 01.75.75v13.5a.75.75 0 01-1.5 0V5.25a.75.75 0 01.75-.75zM4.72 6.47a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06-1.06L9.44 12 4.72 7.28a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
};

const STATS_DATA = [
    { value: "50.000+", label: "Người dùng" },
    { value: "180+", label: "Quốc gia" },
    { value: "2 triệu+", label: "Cuộc trò chuyện" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Hoạt động" },
];

const FEATURES_DATA = [
    { icon: ICONS.video, title: "Video Chat", desc: "Trải nghiệm cuộc gọi video HD mượt mà và rõ nét." },
    { icon: ICONS.voice, title: "Voice Chat", desc: "Trò chuyện bằng giọng nói với chất lượng âm thanh cao." },
    { icon: ICONS.shuffle, title: "Ghép ngẫu nhiên", desc: "Hệ thống thông minh giúp bạn kết nối với người phù hợp." },
    { icon: ICONS.realtime, title: "Real-time", desc: "Giao tiếp không độ trễ, mang lại trải nghiệm chân thực." },
    { icon: ICONS.shield, title: "Bảo mật", desc: "Mọi cuộc trò chuyện đều được mã hóa đầu cuối." },
    { icon: ICONS.multiplatform, title: "Đa nền tảng", desc: "Sử dụng trên mọi thiết bị, từ máy tính đến điện thoại." },
];

const STEPS_DATA = [
    { title: "Bước 1: Đăng nhập", desc: "Tạo tài khoản hoặc đăng nhập để bắt đầu." },
    { title: "Bước 2: Cấp quyền", desc: "Cho phép trình duyệt truy cập camera và micro." },
    { title: "Bước 3: Ghép cặp", desc: "Hệ thống sẽ tự động tìm một người bạn mới." },
    { title: "Bước 4: Trò chuyện", desc: "Bắt đầu cuộc gọi và chia sẻ câu chuyện của bạn." },
    { title: "Bước 5: Khám phá", desc: 'Nhấn "Next" để gặp gỡ người tiếp theo.' },
];

const COMPARISON_DATA = [
    { feature: "Chất lượng Video", competitor: "SD / 720p", chatwave: "Full HD 1080p" },
    { feature: "Bảo mật", competitor: "Cơ bản", chatwave: "Mã hóa đầu cuối (E2EE)" },
    { feature: "Quảng cáo", competitor: "Có", chatwave: "Không" },
    { feature: "Thời gian chờ", competitor: "Lâu", chatwave: "Dưới 1 giây" },
    { feature: "Hỗ trợ đa nền tảng", competitor: "Hạn chế", chatwave: "Có" },
];

const REVIEWS_DATA = [
    { name: "Jessica", img: "https://randomuser.me/api/portraits/women/44.jpg", text: "Tuyệt vời! Tôi đã gặp được rất nhiều người bạn thú vị từ khắp nơi trên thế giới." },
    { name: "Michael", img: "https://randomuser.me/api/portraits/men/32.jpg", text: "Giao diện mượt mà, chất lượng video rất tốt. Ứng dụng chat yêu thích của tôi." },
    { name: "Sarah", img: "https://randomuser.me/api/portraits/women/65.jpg", text: "Rất an toàn và dễ sử dụng. Tôi cảm thấy thoải mái khi trò chuyện trên ChatWave." },
];

const FAQ_DATA = [
    { q: "ChatWave có miễn phí không?", a: "Hoàn toàn miễn phí! Bạn có thể sử dụng tất cả các tính năng chính mà không tốn bất kỳ chi phí nào." },
    { q: "Dữ liệu của tôi có được bảo mật?", a: "Có, chúng tôi sử dụng mã hóa đầu cuối (E2EE) cho tất cả các cuộc gọi video, đảm bảo chỉ bạn và người đối diện mới có thể xem nội dung." },
    { q: "Tôi có thể sử dụng trên điện thoại không?", a: "Chắc chắn rồi. Giao diện của ChatWave được thiết kế để hoạt động mượt mà trên mọi thiết bị, từ máy tính đến điện thoại di động." },
    { q: "Làm thế nào để báo cáo người dùng vi phạm?", a: "Trong mỗi cuộc trò chuyện, sẽ có một nút báo cáo. Bạn có thể sử dụng nó để thông báo cho chúng tôi về bất kỳ hành vi không phù hợp nào." },
];

// --- COMPONENT CHÍNH ---
const Introduce = () => {
    const [activeFaq, setActiveFaq] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    // Giả lập thông tin user (hoặc lấy từ localStorage / context nếu có)
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const avatarSrc = user?.avatar || "https://via.placeholder.com/150";

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onNavigate = (path) => {
        navigate(path);
    };

    const onLogout = () => {
        window.dispatchEvent(new Event('auth:logout'));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    return (
        <div className="home-page">
            <div className="background-glows">
                <div className="glow-ball-1"></div>
                <div className="glow-ball-2"></div>
            </div>

            {/* HEADER */}
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
                        <button className="dash-icon-btn"><FaRegBell /></button>
                        {user ? (
                            <div className="user-menu-container" ref={menuRef}>
                                <button className="user-menu-trigger" onClick={() => setIsDropdownOpen(prev => !prev)}>
                                    <img src={avatarSrc} alt="Avatar" className="user-avatar" />
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

            {/* MAIN CONTENT */}
            <main>
               

                {/* Stats Section */}
                <section className="stats-section section">
                   
                </section>

                {/* Features Section */}
                <section id="features" className="features-section section">
                    <h2 className="section-title">Nền tảng cho mọi cuộc trò chuyện</h2>
                    <div className="features-grid">
                        {FEATURES_DATA.map((feat, idx) => (
                            <div className="feature-card" key={idx}>
                                <div className="feature-icon">{feat.icon}</div>
                                <h3 className="feature-title">{feat.title}</h3>
                                <p className="feature-description">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="how-it-works-section section">
                    <h2 className="section-title">Bắt đầu chỉ trong vài giây</h2>
                    <div className="timeline">
                        {STEPS_DATA.map((step, idx) => (
                            <div className="timeline-item" key={idx}>
                                <div className="timeline-content">
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Comparison Section */}
                <section className="comparison-section section">
                    <h2 className="section-title">Vượt trội hơn đối thủ</h2>
                    <div className="comparison-table-container">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Tính năng</th>
                                    <th>Đối thủ khác</th>
                                    <th className="chatwave-col">ChatWave</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_DATA.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.feature}</td>
                                        <td>{row.competitor}</td>
                                        <td className="chatwave-col">{row.chatwave}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Reviews Section */}
                <section className="reviews-section section">
                    <h2 className="section-title">Người dùng nói gì về chúng tôi</h2>
                    <div className="reviews-grid">
                        {REVIEWS_DATA.map((review, idx) => (
                            <div className="review-card" key={idx}>
                                <div className="review-header">
                                    <img src={review.img} alt={review.name} />
                                    <div>
                                        <h4>{review.name}</h4>
                                        <div className="stars">{[...Array(5)].map((_, i) => <span key={i}>{ICONS.star}</span>)}</div>
                                    </div>
                                </div>
                                <p>"{review.text}"</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="faq-section section">
                    <h2 className="section-title">Câu hỏi thường gặp</h2>
                    <div className="faq-accordion">
                        {FAQ_DATA.map((faq, index) => (
                            <div className="faq-item" key={index}>
                                <button className="faq-question" onClick={() => toggleFaq(index)}>
                                    <span>{faq.q}</span>
                                    <span className={`faq-icon ${activeFaq === index ? 'open' : ''}`}>{ICONS.plus}</span>
                                </button>
                                <div className={`faq-answer ${activeFaq === index ? 'open' : ''}`}>
                                    <p>{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="cta-section section">
                    <div className="cta-content">
                        <h2>Sẵn sàng gặp gỡ những người bạn mới?</h2>
                        <p>Tham gia cộng đồng ChatWave ngay hôm nay và bắt đầu hành trình kết nối của bạn.</p>
                        <button onClick={() => {
                            const token = localStorage.getItem('token');
                            navigate(token ? '/chat' : '/login');
                        }} className="btn btn-primary btn-large">Bắt đầu ngay</button>
                    </div>
                </section>
            </main>

            <Footer ICONS={ICONS} />
        </div>
    );
};

export default Introduce;
