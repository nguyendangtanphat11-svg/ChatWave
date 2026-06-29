import React, { useState } from 'react';

const AppSettings = () => {
    const [settings, setSettings] = useState({
        showOnline: true,
        allowStrangerMessages: false,
        notifications: true,
        darkMode: true,
    });

    const handleToggle = (setting) => {
        setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const settingItems = [
        { id: 'showOnline', label: 'Hiển thị trạng thái Online' },
        { id: 'allowStrangerMessages', label: 'Cho phép người lạ nhắn tin' },
        { id: 'notifications', label: 'Nhận thông báo' },
        { id: 'darkMode', label: 'Chế độ tối' },
    ];

    return (
        <div className="profile-card">
            <div className="card-header">
                <h2>Cài đặt ứng dụng</h2>
            </div>
            <div className="settings-list">
                {settingItems.map(item => (
                    <div key={item.id} className="setting-item">
                        <span>{item.label}</span>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={settings[item.id]}
                                onChange={() => handleToggle(item.id)}
                                disabled={item.id === 'darkMode'} // Dark mode is default
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppSettings;
