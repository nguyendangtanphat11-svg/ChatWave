import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import ProfileCover from '../../components/ProfilePage/ProfileCover';
import ProfileHeader from '../../components/ProfilePage/ProfileHeader';
import ProfileTabs from '../../components/ProfilePage/ProfileTabs';
import ProfileIntro from '../../components/ProfilePage/ProfileIntro';
import PersonalInfo from '../../components/ProfilePage/PersonalInfo';
import Statistics from '../../components/ProfilePage/Statistics';
import SecuritySettings from '../../components/ProfilePage/SecuritySettings';
import AppSettings from '../../components/ProfilePage/AppSettings';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Notification from '../../components/common/Notification/Notification';
import { useUser } from '../../contexts/UserContext';
import { updateAvatar, updateCover, updateProfile } from '../../services/userService';
import PostFeed from '../../components/posts/PostFeed';
import ProfileFriends from '../../components/ProfilePage/ProfileFriends';

const AVATAR_MAX_SIZE = 5 * 1024 * 1024;
const COVER_MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, setUser, refreshUser } = useUser();
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const [initialUser, setInitialUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('about');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    const showNotification = useCallback((message, type) => {
        setNotification({ message, type });
    }, []);

    const resetInput = (inputRef) => {
        if (inputRef.current) inputRef.current.value = '';
    };

    const fetchUserProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const refreshedUser = await refreshUser();
            if (!refreshedUser) {
                navigate('/login');
                return;
            }
            setInitialUser({ ...refreshedUser });
        } catch (error) {
            console.error('Không thể tải profile:', error);
            showNotification('Không thể tải thông tin người dùng.', 'error');
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setIsLoading(false);
        }
    }, [navigate, refreshUser, showNotification]);

    useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);

    useEffect(() => () => {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    }, [avatarPreview]);

    useEffect(() => () => {
        if (coverPreview) URL.revokeObjectURL(coverPreview);
    }, [coverPreview]);

    const validateImage = (file, maxSize) => {
        if (!file) return 'Vui lòng chọn một ảnh.';
        if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP.';
        if (file.size > maxSize) return `Dung lượng ảnh tối đa là ${maxSize / 1024 / 1024}MB.`;
        return null;
    };

    const handleImageChange = (event, setFile, setPreview, maxSize) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        const validationError = validateImage(file, maxSize);
        if (validationError) return showNotification(validationError, 'error');
        setFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleAvatarChange = (event) => {
        handleImageChange(event, setAvatarFile, setAvatarPreview, AVATAR_MAX_SIZE);
        setIsEditing(true);
    };

    const handleCoverChange = (event) => handleImageChange(event, setCoverFile, setCoverPreview, COVER_MAX_SIZE);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setUser((previousUser) => ({ ...previousUser, [name]: value }));
    };

    const clearAvatarDraft = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        resetInput(avatarInputRef);
    };

    const clearCoverDraft = () => {
        setCoverFile(null);
        setCoverPreview(null);
        resetInput(coverInputRef);
    };

    const syncProfile = async () => {
        const refreshedUser = await refreshUser();
        setInitialUser({ ...refreshedUser });
        return refreshedUser;
    };

    const handleSaveProfile = async () => {
        if (!user || !initialUser) return;
        setIsSaving(true);
        try {
            if (avatarFile) await updateAvatar(avatarFile);
            const changedData = ['username', 'fullName', 'gender', 'country'].reduce((result, key) => {
                if (user[key] !== initialUser[key]) result[key] = user[key];
                return result;
            }, {});
            if (Object.keys(changedData).length > 0) await updateProfile({ ...initialUser, ...changedData });
            if (!avatarFile && Object.keys(changedData).length === 0) {
                showNotification('Không có thay đổi để lưu.', 'info');
                return;
            }
            await syncProfile();
            clearAvatarDraft();
            setIsEditing(false);
            showNotification('Cập nhật thông tin thành công!', 'success');
        } catch (error) {
            console.error('Không thể cập nhật profile:', error);
            showNotification(error.response?.data?.message || 'Cập nhật thất bại.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCover = async () => {
        if (!coverFile) return;
        setIsSaving(true);
        try {
            await updateCover(coverFile);
            await syncProfile();
            clearCoverDraft();
            showNotification('Cập nhật ảnh bìa thành công!', 'success');
        } catch (error) {
            console.error('Không thể cập nhật ảnh bìa:', error);
            showNotification(error.response?.data?.message || 'Cập nhật ảnh bìa thất bại.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (initialUser) setUser({ ...initialUser });
        clearAvatarDraft();
        setIsEditing(false);
    };

    const handleLogout = () => {
        window.dispatchEvent(new Event('auth:logout'));
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    if (isLoading && !user) return <LoadingSpinner />;
    if (!user) return <div className="profile-container">Không tìm thấy thông tin người dùng.</div>;

    const showAbout = activeTab === 'about';
    const showSettings = activeTab === 'settings';

    return (
        <main className="profile-container profile-fade-in">
            {isLoading && <div className="profile-loading-overlay"><LoadingSpinner /></div>}
            {notification.message && <Notification message={notification.message} type={notification.type} />}
            <div className="profile-shell">
                <ProfileCover user={user} coverPreview={coverPreview} coverInputRef={coverInputRef} isSaving={isSaving} onCoverChange={handleCoverChange} onSave={handleSaveCover} onCancel={clearCoverDraft} />
                <ProfileHeader user={user} avatarPreview={avatarPreview} avatarInputRef={avatarInputRef} onAvatarChange={handleAvatarChange} onEdit={() => { setIsEditing(true); setActiveTab('about'); }} onLogout={handleLogout} isSaving={isSaving} />
                <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
                {(showAbout || showSettings) && (
                    <div className="profile-grid">
                        <aside className="profile-sidebar">
                            <ProfileIntro user={user} />
                            <Statistics user={user} />
                        </aside>
                        <section className="profile-main-content">
                            {showAbout && <PersonalInfo user={user} isEditing={isEditing} onInputChange={handleInputChange} />}
                            {(showAbout || showSettings) && <SecuritySettings userProvider={user.provider} showNotification={showNotification} />}
                            {showSettings && <AppSettings />}
                            {showAbout && <section className="profile-card"><div className="card-header"><h2>Hoạt động gần đây</h2></div><p className="empty-state">Các hoạt động gần đây sẽ xuất hiện tại đây.</p></section>}
                        </section>
                    </div>
                )}
                {activeTab === 'posts' && <PostFeed user={user} mine />}
                {activeTab === 'friends' && <ProfileFriends />}
                {!showAbout && !showSettings && activeTab !== 'posts' && activeTab !== 'friends' && <section className="profile-card profile-tab-placeholder"><h2>Ảnh</h2><p className="empty-state">Nội dung này sẽ sớm được cập nhật.</p></section>}
                {isEditing && <div className="profile-actions"><button type="button" className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button><button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>Hủy</button></div>}
            </div>
        </main>
    );
};

export default ProfilePage;
