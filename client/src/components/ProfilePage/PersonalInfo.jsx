import React from 'react';

const PersonalInfo = ({ user, isEditing, onInputChange }) => {
    return (
        <div className="profile-card">
            <div className="card-header">
                <h2>Thông tin cá nhân</h2>
            </div>
            <div className="personal-info-grid">
                <div className="form-group">
                    <label htmlFor="username">Tên người dùng</label>
                    <input type="text" id="username" name="username" value={user.username || ''} onChange={onInputChange} disabled={!isEditing} />
                </div>
                <div className="form-group">
                    <label htmlFor="fullName">Họ và tên</label>
                    <input type="text" id="fullName" name="fullName" value={user.fullName || ''} onChange={onInputChange} disabled={!isEditing} placeholder="Chưa cập nhật"/>
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={user.email || ''} disabled />
                </div>
                <div className="form-group">
                    <label htmlFor="gender">Giới tính</label>
                    {isEditing ? (
                        <select id="gender" name="gender" value={user.gender || 'other'} onChange={onInputChange}>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                        </select>
                    ) : (
                        <input type="text" value={user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'} disabled />
                    )}
                </div>
                <div className="form-group">
                    <label>Ngày tham gia</label>
                    <input type="text" value={new Date(user.created_at).toLocaleDateString('vi-VN')} disabled />
                </div>
                <div className="form-group">
                    <label>ID Người dùng</label>
                    <input type="text" value={user.id} disabled />
                </div>
            </div>
        </div>
    );
};

export default PersonalInfo;
