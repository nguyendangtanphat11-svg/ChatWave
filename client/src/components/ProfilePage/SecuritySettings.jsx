import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { updatePassword } from '../../services/userService';

const SecuritySettings = ({ userProvider, showNotification }) => {
    const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordChange = (e) => {
        setPassword((previous) => ({ ...previous, [e.target.name]: e.target.value }));
    };

    const toggleShowPassword = (field) => {
        setShowPassword((previous) => ({ ...previous, [field]: !previous[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.new !== password.confirm) {
            showNotification('Mật khẩu mới không khớp.', 'error');
            return;
        }
        if (password.new.length < 6) {
            showNotification('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await updatePassword({
                currentPassword: password.current,
                newPassword: password.new,
            });
            showNotification('Đổi mật khẩu thành công!', 'success');
            setPassword({ current: '', new: '', confirm: '' });
        } catch (error) {
            showNotification(error.response?.data?.message || 'Đã xảy ra lỗi.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="profile-card">
            <div className="card-header">
                <h2>Bảo mật</h2>
            </div>
            {userProvider === 'google' ? (
                <div className="google-login-message">
                    Bạn đang đăng nhập bằng tài khoản Google nên không thể đổi mật khẩu tại đây.
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="current">Mật khẩu hiện tại</label>
                        <div className="password-input-container">
                            <input type={showPassword.current ? 'text' : 'password'} id="current" name="current" value={password.current} onChange={handlePasswordChange} required />
                            <span onClick={() => toggleShowPassword('current')} className="password-toggle-icon">
                                {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="new">Mật khẩu mới</label>
                        <div className="password-input-container">
                            <input type={showPassword.new ? 'text' : 'password'} id="new" name="new" value={password.new} onChange={handlePasswordChange} required />
                            <span onClick={() => toggleShowPassword('new')} className="password-toggle-icon">
                                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm">Xác nhận mật khẩu mới</label>
                        <div className="password-input-container">
                            <input type={showPassword.confirm ? 'text' : 'password'} id="confirm" name="confirm" value={password.confirm} onChange={handlePasswordChange} required />
                            <span onClick={() => toggleShowPassword('confirm')} className="password-toggle-icon">
                                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SecuritySettings;
