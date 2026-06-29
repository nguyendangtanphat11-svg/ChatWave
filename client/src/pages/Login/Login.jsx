import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import config from "../../config/config";
import './Login.css';

// Inline SVG Icons (replacing react-icons)
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.003 5.884L10.5 12.5l8.497-6.616A2 2 0 0017 4H7a2 2 0 00-1.997 1.884zM19 8.5V18a2 2 0 01-2 2H7a2 2 0 01-2-2V8.5l7 5.5 7-5.5z"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M1.323 11.447A8.958 8.958 0 012.2 10c1.574-2.427 3.996-4.328 6.257-5.424 1.424-.65 2.893-1.041 4.37-1.178 2.982-.239 5.562.469 8.011 1.953.321.197.62.44.893.757a.75.75 0 11-1.061 1.06c-.38-.36-.745-.66-1.13-.875-2.461-1.44-4.74-2.104-7.002-2.104-1.453 0-2.847.307-4.204.937-2.378 1.142-4.486 2.87-6.003 5.072a.75.75 0 01-.113.137zM12 18.75a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 5.25a.75.75 0 01-.75-.75V3a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM15.75 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM8.25 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM18.75 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.25 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 22.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 1.5a.75.75 0 01-.75-.75V0a.75.75 0 011.5 0v.75a.75.75 0 01-.75.75zM15.75 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM8.25 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM18.75 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.25 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM18.75 6a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.25 6a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 12a.75.75 0 01-.75-.75V9.75a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75z" clipRule="evenodd" /></svg>;
const EyeSlashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path fillRule="evenodd" d="M1.323 11.447A8.958 8.958 0 012.2 10c1.574-2.427 3.996-4.328 6.257-5.424 1.424-.65 2.893-1.041 4.37-1.178 2.982-.239 5.562.469 8.011 1.953.321.197.62.44.893.757a.75.75 0 11-1.061 1.06c-.38-.36-.745-.66-1.13-.875-2.461-1.44-4.74-2.104-7.002-2.104-1.453 0-2.847.307-4.204.937-2.378 1.142-4.486 2.87-6.003 5.072a.75.75 0 01-.113.137zM12 18.75a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 5.25a.75.75 0 01-.75-.75V3a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM15.75 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM8.25 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM18.75 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.25 12a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 22.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 1.5a.75.75 0 01-.75-.75V0a.75.75 0 011.5 0v.75a.75.75 0 01-.75.75zM15.75 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM8.25 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM18.75 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.25 18a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM18.75 6a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM5.25 6a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM12 12a.75.75 0 01-.75-.75V9.75a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75z" clipRule="evenodd" /></svg>;
 
const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
 
    const { email, password } = formData; 

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!email || !password) {
            setError('Vui lòng điền đầy đủ email và mật khẩu.');
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

        setLoading(true);
        try {
            const response = await fetch(`${config.API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng nhập thất bại.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleGoogleSuccess = async (credentialResponse) => {
    try {
        const res = await axios.post(
            `${config.API_URL}/api/auth/google`,
            {
                credential: credentialResponse.credential,
            }
        );

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        navigate("/");
    } catch (err) {
        setError(
            err.response?.data?.message || "Đăng nhập Google thất bại."
        );
    }
};

    return (
        <div className="auth-container">
            <div className="auth-card fade-in">
                <div className="auth-logo">ChatWave</div>
                <h2 className="auth-title">Đăng nhập vào ChatWave</h2>
                <p className="auth-description">Kết nối với mọi người trên toàn thế giới.</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={onSubmit} className="auth-form">
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
                    <div className="auth-options">
                        <label className="checkbox-container">
                            Ghi nhớ đăng nhập
                            <input
                                type="checkbox"
                                // Add state for remember me if needed
                            />
                            <span className="checkmark"></span>
                        </label>
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                    <div className="google-divider">
                        <span>Hoặc</span>
                        </div>

                    <div className="google-login">
                        <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                        onError={() => setError("Đăng nhập Google thất bại")}
                        />
                    </div>
                </form>
                <p className="auth-link-text">
                    Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;