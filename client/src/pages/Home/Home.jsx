import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const [user, setUser] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUserData = localStorage.getItem('user');
        if (storedUserData && storedUserData !== 'undefined' && storedUserData !== 'null') {
            try {
                const parsedUser = JSON.parse(storedUserData);
                setUser(parsedUser);
            } catch (error) {
                console.error("Failed to parse user data from localStorage:", error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setUser(null);
            }
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 60);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
        
    }, []);

    const menuRef = useRef(null);

    // Đóng dropdown khi click ra ngoài hoặc nhấn ESC
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsDropdownOpen(false);
        navigate('/login');
    };

    const toggleFaq = (index) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    // Inline SVG Icons
    const icons = {
        video: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-2.25l3.44 1.72a.75.75 0 001.06-.62v-6.66a.75.75 0 00-1.06-.62l-3.44 1.72V7.5a3 3 0 00-3-3H4.5z" /></svg>,
        voice: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75a.75.75 0 01.75-.75z" /></svg>,
        shuffle: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M16.5 4.5a4.5 4.5 0 00-3.861 2.14l-2.895 4.26a.75.75 0 00.955 1.158l2.895-4.26A2.993 2.993 0 0116.5 6a3 3 0 013 3v.528A4.504 4.504 0 0015 12.128v-1.604a.75.75 0 00-1.5 0v1.604a4.5 4.5 0 003.452 4.372l-2.895 4.26a.75.75 0 10.955 1.158l2.895-4.26A4.5 4.5 0 0021 13.5a4.5 4.5 0 00-4.5-4.5zM4.5 4.5a4.5 4.5 0 00-3.861 2.14l-2.895 4.26a.75.75 0 00.955 1.158l2.895-4.26A2.993 2.993 0 014.5 6a3 3 0 013 3v.528A4.504 4.504 0 003 12.128v-1.604a.75.75 0 00-1.5 0v1.604a4.5 4.5 0 003.452 4.372l-2.895 4.26a.75.75 0 10.955 1.158l2.895-4.26A4.5 4.5 0 009 13.5a4.5 4.5 0 00-4.5-4.5z" clipRule="evenodd" /></svg>,
        realtime: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v4.257c0 .197-.08.387-.22.527l-1.94 1.94a.75.75 0 101.06 1.06l1.94-1.94c.38-.38.527-.87.527-1.41V6z" clipRule="evenodd" /></svg>,
        shield: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>,
        multiplatform: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5h-2.25a.75.75 0 000 1.5h2.25a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3.75a.75.75 0 01.75-.75h2.25a.75.75 0 000-1.5z" /></svg>,
        camera: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-2.25l3.44 1.72a.75.75 0 001.06-.62v-6.66a.75.75 0 00-1.06-.62l-3.44 1.72V7.5a3 3 0 00-3-3H4.5z" /></svg>,
        mic: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75a.75.75 0 01.75-.75z" /></svg>,
        chat: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.75 6.75 0 006.75-6.75v-2.5a.75.75 0 011.5 0v2.5a8.25 8.25 0 01-8.25 8.25c-1.33 0-2.605-.308-3.746-.882a.75.75 0 01.293-1.376z" clipRule="evenodd" /><path d="M12 2.25a.75.75 0 01.75.75v6.94l2.28-2.28a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L8.47 7.97a.75.75 0 111.06-1.06l2.28 2.28V3a.75.75 0 01.75-.75z" /></svg>,
        next: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" /></svg>,
        star: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>,
        plus: <svg viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>,
        facebook: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>,
        github: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>,
        email: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" /></svg>,
    };

    return (
        <div className="home-page">
            <div className="background-glows">
                <div className="glow-ball-1"></div>
                <div className="glow-ball-2"></div>
            </div>

            <header className={`header ${scrolled ? "scrolled" : ""}`}>
            <div className="header-content">
                    <div className="logo">ChatWave</div>
                    <nav className="main-nav">
                        <a href="#home" className="nav-link">Trang chủ</a>
                        <a href="#features" className="nav-link">Tính năng</a>
                        <a href="#how-it-works" className="nav-link">Hướng dẫn</a>
                        <a href="#faq" className="nav-link">FAQ</a>
                        <a href="#contact" className="nav-link">Liên hệ</a>
                    </nav>
                    <div className="header-actions">
                        {user ? (
                            <div className="user-menu-container" ref={menuRef}>
                                <button className="user-menu-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <img 
                                        src={user.avatar && user.avatar !== 'default.png' ? user.avatar : `https://ui-avatars.com/api/?name=${user.username}&background=4F46E5&color=fff`} 
                                        alt={user.username} 
                                        className="user-avatar" 
                                    />
                                    <div className="user-info">
                                        <span className="username">{user?.username || 'User'}</span>
                                        <span className="user-status">Online</span>
                                    </div>
                                    <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                                </button>
                                {isDropdownOpen && (
                                    <div className="user-dropdown">
                                        <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>👤 Hồ sơ cá nhân</Link>
                                        <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>⚙ Cài đặt</Link>
                                        <Link to="/chat" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>💬 Chat ngay</Link>
                                        <div className="dropdown-divider"></div>
                                        <button onClick={handleLogout} className="dropdown-item logout">
                                            🚪 Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="nav-link">Đăng nhập</Link>
                                <Link to="/register" className="nav-button-primary">Đăng ký</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>
            

            <main>
                <section id="home" className="hero-section section">
                    <div className="hero-content">
                        <h1 className="hero-title">Kết nối với mọi người trên toàn thế giới</h1>
                        <p className="hero-description">
                            ChatWave là nền tảng trò chuyện video ngẫu nhiên giúp bạn kết nối với mọi người trên khắp thế giới một cách nhanh chóng, miễn phí và an toàn.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/chat" className="btn btn-primary">Bắt đầu trò chuyện</Link>
                            <a href="#features" className="btn btn-secondary">Khám phá</a>
                        </div>
                    </div>
                    <div className="hero-video-mockup">
                        <div className="video-window-main">
                            <div className="video-placeholder"></div>
                            <div className="video-info">
                                <span className="status-dot online"></span>
                                <span className="status-text">Online</span>
                                <span className="status-separator">|</span>
                                <span className="status-text">Ping: 24ms</span>
                                <span className="status-separator">|</span>
                                <span className="status-text">VN</span>
                            </div>
                        </div>
                        <div className="video-window-self">
                            <div className="video-placeholder self"></div>
                        </div>
                        <div className="video-controls">
                            <button className="control-btn">{icons.camera}</button>
                            <button className="control-btn">{icons.mic}</button>
                            <button className="control-btn">{icons.chat}</button>
                            <button className="control-btn next-btn">{icons.next}</button>
                        </div>
                    </div>
                </section>

                <section className="stats-section section">
                    <div className="stat-card"><h3>50.000+</h3><p>Người dùng</p></div>
                    <div className="stat-card"><h3>180+</h3><p>Quốc gia</p></div>
                    <div className="stat-card"><h3>2 triệu+</h3><p>Cuộc trò chuyện</p></div>
                    <div className="stat-card"><h3>99.9%</h3><p>Uptime</p></div>
                    <div className="stat-card"><h3>24/7</h3><p>Hoạt động</p></div>
                </section>

                <section id="features" className="features-section section">
                    <h2 className="section-title">Nền tảng cho mọi cuộc trò chuyện</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">{icons.video}</div>
                            <h3 className="feature-title">Video Chat</h3>
                            <p className="feature-description">Trải nghiệm cuộc gọi video HD mượt mà và rõ nét.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">{icons.voice}</div>
                            <h3 className="feature-title">Voice Chat</h3>
                            <p className="feature-description">Trò chuyện bằng giọng nói với chất lượng âm thanh cao.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">{icons.shuffle}</div>
                            <h3 className="feature-title">Ghép ngẫu nhiên</h3>
                            <p className="feature-description">Hệ thống thông minh giúp bạn kết nối với người phù hợp.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">{icons.realtime}</div>
                            <h3 className="feature-title">Real-time</h3>
                            <p className="feature-description">Giao tiếp không độ trễ, mang lại trải nghiệm chân thực.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">{icons.shield}</div>
                            <h3 className="feature-title">Bảo mật</h3>
                            <p className="feature-description">Mọi cuộc trò chuyện đều được mã hóa đầu cuối.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">{icons.multiplatform}</div>
                            <h3 className="feature-title">Đa nền tảng</h3>
                            <p className="feature-description">Sử dụng trên mọi thiết bị, từ máy tính đến điện thoại.</p>
                        </div>
                    </div>
                </section>

                <section id="how-it-works" className="how-it-works-section section">
                    <h2 className="section-title">Bắt đầu chỉ trong vài giây</h2>
                    <div className="timeline">
                        <div className="timeline-item"><div className="timeline-content"><h3>Bước 1: Đăng nhập</h3><p>Tạo tài khoản hoặc đăng nhập để bắt đầu.</p></div></div>
                        <div className="timeline-item"><div className="timeline-content"><h3>Bước 2: Cấp quyền</h3><p>Cho phép trình duyệt truy cập camera và micro.</p></div></div>
                        <div className="timeline-item"><div className="timeline-content"><h3>Bước 3: Ghép cặp</h3><p>Hệ thống sẽ tự động tìm một người bạn mới.</p></div></div>
                        <div className="timeline-item"><div className="timeline-content"><h3>Bước 4: Trò chuyện</h3><p>Bắt đầu cuộc gọi và chia sẻ câu chuyện của bạn.</p></div></div>
                        <div className="timeline-item"><div className="timeline-content"><h3>Bước 5: Khám phá</h3><p>Nhấn "Next" để gặp gỡ người tiếp theo.</p></div></div>
                    </div>
                </section>

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
                                <tr><td>Chất lượng Video</td><td>SD / 720p</td><td className="chatwave-col">Full HD 1080p</td></tr>
                                <tr><td>Bảo mật</td><td>Cơ bản</td><td className="chatwave-col">Mã hóa đầu cuối (E2EE)</td></tr>
                                <tr><td>Quảng cáo</td><td>Có</td><td className="chatwave-col">Không</td></tr>
                                <tr><td>Thời gian chờ</td><td>Lâu</td><td className="chatwave-col">Dưới 1 giây</td></tr>
                                <tr><td>Hỗ trợ đa nền tảng</td><td>Hạn chế</td><td className="chatwave-col">Có</td></tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="reviews-section section">
                    <h2 className="section-title">Người dùng nói gì về chúng tôi</h2>
                    <div className="reviews-grid">
                        <div className="review-card">
                            <div className="review-header">
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" />
                                <div><h4>Jessica</h4><div className="stars">{[...Array(5)].map((_, i) => <span key={i}>{icons.star}</span>)}</div></div>
                            </div>
                            <p>"Tuyệt vời! Tôi đã gặp được rất nhiều người bạn thú vị từ khắp nơi trên thế giới."</p>
                        </div>
                        <div className="review-card">
                            <div className="review-header">
                                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
                                <div><h4>Michael</h4><div className="stars">{[...Array(5)].map((_, i) => <span key={i}>{icons.star}</span>)}</div></div>
                            </div>
                            <p>"Giao diện mượt mà, chất lượng video rất tốt. Ứng dụng chat yêu thích của tôi."</p>
                        </div>
                        <div className="review-card">
                            <div className="review-header">
                                <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="User" />
                                <div><h4>Sarah</h4><div className="stars">{[...Array(5)].map((_, i) => <span key={i}>{icons.star}</span>)}</div></div>
                            </div>
                            <p>"Rất an toàn và dễ sử dụng. Tôi cảm thấy thoải mái khi trò chuyện trên ChatWave."</p>
                        </div>
                    </div>
                </section>

                <section id="faq" className="faq-section section">
                    <h2 className="section-title">Câu hỏi thường gặp</h2>
                    <div className="faq-accordion">
                        {[
                            { q: "ChatWave có miễn phí không?", a: "Hoàn toàn miễn phí! Bạn có thể sử dụng tất cả các tính năng chính mà không tốn bất kỳ chi phí nào." },
                            { q: "Dữ liệu của tôi có được bảo mật?", a: "Có, chúng tôi sử dụng mã hóa đầu cuối (E2EE) cho tất cả các cuộc gọi video, đảm bảo chỉ bạn và người đối diện mới có thể xem nội dung." },
                            { q: "Tôi có thể sử dụng trên điện thoại không?", a: "Chắc chắn rồi. Giao diện của ChatWave được thiết kế để hoạt động mượt mà trên mọi thiết bị, từ máy tính để bàn đến điện thoại di động." },
                            { q: "Làm thế nào để báo cáo người dùng vi phạm?", a: "Trong mỗi cuộc trò chuyện, sẽ có một nút báo cáo. Bạn có thể sử dụng nó để thông báo cho chúng tôi về bất kỳ hành vi không phù hợp nào." },
                        ].map((faq, index) => (
                            <div className="faq-item" key={index}>
                                <button className="faq-question" onClick={() => toggleFaq(index)}>
                                    <span>{faq.q}</span>
                                    <span className={`faq-icon ${activeFaq === index ? 'open' : ''}`}>{icons.plus}</span>
                                </button>
                                <div className={`faq-answer ${activeFaq === index ? 'open' : ''}`}>
                                    <p>{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="cta-section section">
                    <div className="cta-content">
                        <h2>Sẵn sàng gặp gỡ những người bạn mới?</h2>
                        <p>Tham gia cộng đồng ChatWave ngay hôm nay và bắt đầu hành trình kết nối của bạn.</p>
                        <Link to="/register" className="btn btn-primary btn-large">Bắt đầu ngay</Link>
                    </div>
                </section>
            </main>

            <footer id="contact" className="footer">
                <div className="footer-content">
                    <div className="footer-column">
                        <div className="logo">ChatWave</div>
                        <p>Kết nối. Trò chuyện. Khám phá.</p>
                    </div>
                    <div className="footer-column">
                        <h4>Menu</h4>
                        <a href="#home">Trang chủ</a>
                        <a href="#features">Tính năng</a>
                        <a href="#faq">FAQ</a>
                    </div>
                    <div className="footer-column">
                        <h4>Pháp lý</h4>
                        <a href="#">Điều khoản dịch vụ</a>
                        <a href="#">Chính sách bảo mật</a>
                    </div>
                    <div className="footer-column">
                        <h4>Liên hệ</h4>
                        <div className="social-links">
                            <a href="#" aria-label="Facebook">{icons.facebook}</a>
                            <a href="#" aria-label="GitHub">{icons.github}</a>
                            <a href="#" aria-label="Email">{icons.email}</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} ChatWave. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;