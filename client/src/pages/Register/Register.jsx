import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import config from "../../config/config";
import { useNotifications } from '../../contexts/useNotifications';
import './Register.css';

// Inline SVG Icons (replacing react-icons)
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.003 5.884L10.5 12.5l8.497-6.616A2 2 0 0017 4H7a2 2 0 00-1.997 1.884zM19 8.5V18a2 2 0 01-2 2H7a2 2 0 01-2-2V8.5l7 5.5 7-5.5z"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fillRule="evenodd" d="M1.323 11.447A11.846 11.846 0 0112 4.5c4.252 0 8.133 2.19 10.677 6.947a.75.75 0 11-1.28.768A10.346 10.346 0 0012 6c-3.72 0-7.133 2.023-9.397 6.215a.75.75 0 01-1.28-.768z" clipRule="evenodd" /></svg>;
const EyeSlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M4.125 12.06c.069-.175.14-.348.213-.52a23.394 23.394 0 012.13-3.933 2.25 2.25 0 014.034 0 23.393 23.393 0 012.13 3.933c.074.172.144.345.213.52a.75.75 0 01-1.28.768 21.898 21.898 0 00-1.58-3.054.75.75 0 00-1.33 0 21.898 21.898 0 00-1.58 3.054.75.75 0 11-1.28-.768z" clipRule="evenodd" /><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const GenderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v4.257c0 .197-.08.387-.22.527l-1.94 1.94a.75.75 0 101.06 1.06l1.94-1.94c.38-.38.527-.87.527-1.41V6z" clipRule="evenodd" /></svg>;

const RegisterPage = () => {
    const { toast } = useNotifications();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: 'Khác',
        termsAccepted: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { username, email, password, confirmPassword, gender, termsAccepted } = formData;

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!username || !email || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }
        if (username.length < 3) {
            setError('Tên người dùng phải có ít nhất 3 ký tự.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email không đúng định dạng.');
            return;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        if (!termsAccepted) {
            setError('Bạn phải đồng ý với điều khoản để đăng ký.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${config.API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, gender }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại.');
            }

            // Registration successful, navigate to login page with a success message
            toast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-logo">ChatWave</div>
                <h2 className="auth-title">Tạo tài khoản ChatWave</h2>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit} className="auth-form">
                    <div className="input-group">
                        <span className="input-icon"><UserIcon /></span>
                        <input
                            type="text"
                            className="auth-input"
                            name="username"
                            value={username}
                            onChange={onChange}
                            placeholder="Tên người dùng"
                            aria-label="Tên người dùng"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <span className="input-icon"><MailIcon /></span>
                        <input
                            type="email"
                            className="auth-input"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Email"
                            aria-label="Email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <span className="input-icon"><LockIcon /></span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="auth-input"
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Mật khẩu"
                            aria-label="Mật khẩu"
                            required
                        />
                        <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </span>
                    </div>
                    <div className="input-group">
                        <span className="input-icon"><LockIcon /></span>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="auth-input"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            placeholder="Xác nhận mật khẩu"
                            aria-label="Xác nhận mật khẩu"
                            required
                        />
                        <span className="password-toggle-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </span>
                    </div>
                    <div className="input-group">
                        <span className="input-icon"><GenderIcon /></span>
                        <select className="auth-input" name="gender" value={gender} onChange={onChange} aria-label="Giới tính">
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <div className="auth-options">
                        <label className="checkbox-container">
                            Tôi đồng ý với điều khoản
                            <input
                                type="checkbox"
                                name="termsAccepted"
                                checked={termsAccepted}
                                onChange={onChange}
                                required
                            />
                            <span className="checkmark"></span>
                        </label>
                        <p className="register-legal-copy">
                            Bằng việc tạo tài khoản, bạn xác nhận đã đọc và đồng ý với{' '}
                            <Link to="/terms" className="register-legal-link" onClick={(event) => event.stopPropagation()}>
                                Điều khoản dịch vụ
                            </Link>{' '}
                            và{' '}
                            <Link to="/privacy" className="register-legal-link" onClick={(event) => event.stopPropagation()}>
                                Chính sách bảo mật
                            </Link>.
                        </p>
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>
                <p className="auth-link-text">
                    Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
