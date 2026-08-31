import { FaCamera } from 'react-icons/fa';
import { getCoverUrl } from '../../utils/imageUrl';

const ProfileCover = ({ user, coverPreview, coverInputRef, isSaving, onCoverChange, onSave, onCancel }) => {
    const coverUrl = coverPreview || getCoverUrl(user?.coverImage, user?.coverVersion);

    return (
        <section className="profile-cover" style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}>
            <div className="profile-cover-overlay" />
            <input ref={coverInputRef} id="cover-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={onCoverChange} />
            {coverPreview ? (
                <div className="cover-actions">
                    <button type="button" className="btn btn-primary" onClick={onSave} disabled={isSaving}>Lưu ảnh bìa</button>
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>Hủy</button>
                </div>
            ) : (
                <label htmlFor="cover-input" className="cover-edit-button"><FaCamera /> Chỉnh sửa ảnh bìa</label>
            )}
        </section>
    );
};

export default ProfileCover;
