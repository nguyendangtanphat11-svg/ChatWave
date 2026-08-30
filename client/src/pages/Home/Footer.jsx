import React from 'react';
import { Link } from 'react-router-dom';

/** Component hiển thị footer của ứng dụng. */
const Footer = ({ ICONS = {} }) => (
    <footer id="contact" className="footer">
        <div className="footer-content">
            <div className="footer-column">
                <div className="logo">ChatWave</div>
                <p>Kết nối. Trò chuyện. Khám phá.</p>
            </div>
            <div className="footer-column">
                <h4>Menu</h4>
                <a href="/">Trang chủ</a>
                <Link to="/Introduce">Giới thiệu</Link>
            </div>
            <div className="footer-column">
                <h4>Pháp lý</h4>
                <Link to="/terms">Điều khoản dịch vụ</Link>
                <Link to="/privacy">Chính sách bảo mật</Link>
            </div>
            <div className="footer-column">
                <h4>Liên hệ</h4>
                <div className="social-links">
                    <a href="#facebook" aria-label="Facebook">{ICONS.facebook || 'FB'}</a>
                    <a href="#github" aria-label="GitHub">{ICONS.github || 'GH'}</a>
                    <a href="#email" aria-label="Email">{ICONS.email || 'Email'}</a>
                </div>
            </div>
        </div>
        <div className="footer-bottom"><p>&copy; {new Date().getFullYear()} ChatWave. All Rights Reserved.</p></div>
    </footer>
);

export default Footer;
