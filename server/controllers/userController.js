const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const profileFields = 'id, username, email, avatar, cover_image AS coverImage, gender, country, provider, status, fullName, created_at, updated_at AS updatedAt';

const toUserResponse = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    coverImage: user.coverImage,
    gender: user.gender,
    country: user.country || 'VN',
    provider: user.provider,
    status: user.status,
    fullName: user.fullName,
    created_at: user.created_at,
    updatedAt: user.updatedAt,
});

const getUserProfile = async (req, res) => {
    try {
        const [users] = await db.query(`SELECT ${profileFields} FROM users WHERE id = ?`, [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        return res.status(200).json(toUserResponse(users[0]));
    } catch (error) {
        console.error('Lỗi khi lấy profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const targetId = Number(req.params.id);
        if (!Number.isInteger(targetId) || targetId <= 0) return res.status(400).json({ message: 'Người dùng không hợp lệ.' });
        if (targetId !== Number(req.user.id)) {
            const [relations] = await db.query(`SELECT id FROM friend_requests WHERE status = 'accepted' AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`, [req.user.id, targetId, targetId, req.user.id]);
            if (!relations.length) return res.status(403).json({ message: 'Bạn chỉ có thể xem hồ sơ của bạn bè.' });
        }
        const [users] = await db.query('SELECT id, username, fullName, avatar, cover_image AS coverImage, gender, country, status, created_at FROM users WHERE id = ?', [targetId]);
        if (!users.length) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        return res.json(users[0]);
    } catch (error) {
        console.error('Không thể lấy hồ sơ công khai:', error);
        return res.status(500).json({ message: 'Không thể tải hồ sơ.' });
    }
};

const getPublicFriends = async (req, res) => {
    try {
        const targetId = Number(req.params.id);
        const [relations] = await db.query(`SELECT id FROM friend_requests WHERE status = 'accepted' AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`, [req.user.id, targetId, targetId, req.user.id]);
        if (targetId !== Number(req.user.id) && !relations.length) return res.status(403).json({ message: 'Bạn chỉ có thể xem bạn bè của người đã kết bạn.' });
        const [friends] = await db.query(`SELECT u.id,u.username,u.fullName,u.avatar,u.status FROM friend_requests fr JOIN users u ON u.id = CASE WHEN fr.sender_id = ? THEN fr.receiver_id ELSE fr.sender_id END WHERE fr.status = 'accepted' AND (fr.sender_id = ? OR fr.receiver_id = ?) LIMIT 24`, [targetId, targetId, targetId]);
        return res.json({ friends });
    } catch (error) { return res.status(500).json({ message: 'Không thể tải bạn bè.' }); }
};

const getUserStatistics = async (req, res) => {
    try {
        const userId = req.user.id;
        const results = await Promise.all([
            db.query(`SELECT COUNT(*) count FROM friend_requests WHERE status = 'accepted' AND (sender_id = ? OR receiver_id = ?)`, [userId, userId]),
            db.query('SELECT COUNT(*) count FROM posts WHERE user_id = ?', [userId]),
            db.query('SELECT COUNT(*) count FROM post_likes pl JOIN posts p ON p.id = pl.post_id WHERE p.user_id = ?', [userId]),
            db.query('SELECT COUNT(*) count FROM post_comments pc JOIN posts p ON p.id = pc.post_id WHERE p.user_id = ?', [userId]),
            db.query('SELECT COUNT(*) count FROM friend_messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]),
        ]);
        const [friends, posts, likes, comments, messages] = results.map(([rows]) => rows[0]);
        return res.json({ friends: Number(friends.count), posts: Number(posts.count), receivedLikes: Number(likes.count), receivedComments: Number(comments.count), messages: Number(messages.count) });
    } catch (error) {
        console.error('Không thể lấy thống kê:', error);
        return res.status(500).json({ message: 'Không thể tải thống kê.' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { username, fullName, gender, country } = req.body;
        if (!username || !username.trim()) return res.status(400).json({ message: 'Tên người dùng không được để trống.' });
        if (!['Nam', 'Nữ', 'Khác'].includes(gender)) return res.status(400).json({ message: 'Giới tính không hợp lệ.' });

        const allowedCountries = ['VN', 'US', 'JP', 'KR', 'GB', 'AU', 'CA'];
        if (country && !allowedCountries.includes(country)) return res.status(400).json({ message: 'Quốc gia không hợp lệ.' });

        await db.query('UPDATE users SET username = ?, fullName = ?, gender = ?, country = ? WHERE id = ?', [username.trim(), fullName?.trim() || null, gender, country || 'VN', req.user.id]);
        const [users] = await db.query(`SELECT ${profileFields} FROM users WHERE id = ?`, [req.user.id]);
        return res.status(200).json({ message: 'Cập nhật thông tin thành công!', user: toUserResponse(users[0]) });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Tên người dùng đã tồn tại.' });
        console.error('Lỗi khi cập nhật profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật profile' });
    }
};

const deleteLocalUpload = (relativePath) => {
    if (!relativePath || /^https?:\/\//i.test(relativePath) || relativePath === 'default.png') return;
    const normalized = relativePath.replace(/^\/+/, '');
    if (!normalized.startsWith('uploads/')) return;
    const absolutePath = path.join(__dirname, '..', normalized);
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
};

const updateImage = (field, directory, successMessage) => async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng tải lên một ảnh hợp lệ.' });
        const [users] = await db.query(`SELECT ${field} FROM users WHERE id = ?`, [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

        const imagePath = `/uploads/${directory}/${req.file.filename}`;
        await db.query(`UPDATE users SET ${field} = ? WHERE id = ?`, [imagePath, req.user.id]);
        deleteLocalUpload(users[0][field]);
        const [updatedUsers] = await db.query(`SELECT ${profileFields} FROM users WHERE id = ?`, [req.user.id]);
        return res.status(200).json({ message: successMessage, user: toUserResponse(updatedUsers[0]) });
    } catch (error) {
        console.error(`Lỗi khi cập nhật ${field}:`, error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const updateUserAvatar = updateImage('avatar', 'images', 'Cập nhật ảnh đại diện thành công!');
const updateUserCover = updateImage('cover_image', 'covers', 'Cập nhật ảnh bìa thành công!');

const changeUserPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }
        if (Buffer.byteLength(newPassword, 'utf8') > 72) {
            return res.status(400).json({ message: 'Mật khẩu mới không được vượt quá 72 byte.' });
        }

        const [users] = await db.query('SELECT id, password FROM users WHERE id = ?', [req.user.id]);
        if (!users.length) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

        const user = users[0];
        if (!user.password) {
            return res.status(400).json({ message: 'Tài khoản đăng nhập qua mạng xã hội không hỗ trợ đổi mật khẩu.' });
        }

        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        return res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const searchUsers = async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Vui lòng cung cấp từ khóa tìm kiếm.' });
    try {
        const [users] = await db.query('SELECT id, username, avatar, status FROM users WHERE username LIKE ? AND id != ?', [`%${query}%`, req.user.id]);
        return res.json(users);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm người dùng:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

module.exports = { getUserProfile, getPublicProfile, getPublicFriends, getUserStatistics, updateUserProfile, updateUserAvatar, updateUserCover, changeUserPassword, searchUsers };
