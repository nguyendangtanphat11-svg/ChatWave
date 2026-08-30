import React from 'react';

const PersonalInfo = ({ user, isEditing, onInputChange }) => {
    // Xử lý an toàn cho ngày tham gia tránh lỗi khi chưa có dữ liệu
    const formattedJoinDate = user?.created_at 
        ? new Date(user.created_at).toLocaleDateString('vi-VN') 
        : 'Chưa cập nhật';

    // Chuẩn hóa giá trị giới tính hiển thị khi không chỉnh sửa
    const getGenderDisplay = (gender) => {
        if (gender === 'Nam' || gender === 'Nữ' || gender === 'Khác') return gender;
        return 'Khác';
    };

    return (
        <div className="profile-card">
            <div className="card-header">
                <h2>Thông tin cá nhân</h2>
            </div>
            <div className="personal-info-grid">
                <div className="form-group">
                    <label htmlFor="username">Tên người dùng</label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        value={user?.username || ''} 
                        onChange={onInputChange} 
                        disabled={!isEditing} 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="fullName">Họ và tên</label>
                    <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        value={user?.fullName || ''} 
                        onChange={onInputChange} 
                        disabled={!isEditing} 
                        placeholder="Chưa cập nhật"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={user?.email || ''} 
                        disabled 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="gender">Giới tính</label>
                    {isEditing ? (
                        <select 
                            id="gender" 
                            name="gender" 
                            value={user?.gender || 'Khác'} 
                            onChange={onInputChange}
                        >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            value={getGenderDisplay(user?.gender)} 
                            disabled 
                        />
                    )}
                </div>
                <div className="form-group">
                    <label>Ngày tham gia</label>
                    <input 
                        type="text" 
                        value={formattedJoinDate} 
                        disabled 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="country">Quốc gia</label>
                    {isEditing ? (
                        <select id="country" name="country" value={user?.country || 'VN'} onChange={onInputChange}>
                            <option value="VN">Việt Nam</option>
                            <option value="US">Hoa Kỳ</option>
                            <option value="JP">Nhật Bản</option>
                            <option value="KR">Hàn Quốc</option>
                            <option value="GB">Vương quốc Anh</option>
                            <option value="AU">Úc</option>
                            <option value="CA">Canada</option>
                        </select>
                    ) : (
                        <input type="text" value={user?.country || 'VN'} disabled />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalInfo;
