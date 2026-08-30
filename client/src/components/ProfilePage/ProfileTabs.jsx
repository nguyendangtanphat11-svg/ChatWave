import React from 'react';

const tabs = [
    ['posts', 'Bài viết'],
    ['about', 'Giới thiệu'],
    ['friends', 'Bạn bè'],
    ['photos', 'Ảnh'],
    ['settings', 'Cài đặt'],
];

const ProfileTabs = ({ activeTab, onChange }) => (
    <nav className="profile-tabs" aria-label="Điều hướng hồ sơ">
        {tabs.map(([id, label]) => (
            <button key={id} type="button" className={activeTab === id ? 'active' : ''} onClick={() => onChange(id)}>{label}</button>
        ))}
    </nav>
);

export default ProfileTabs;
