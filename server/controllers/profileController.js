const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');

const getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, avatar, gender, provider, status FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const user = users[0];

        // Chuẩn hóa avatar trả về đường dẫn tương đối ổn định, tránh thay đổi state liên tục ở frontend
        if (user.avatar) {
            if (user.avatar.startsWith('http')) {
                // Giữ nguyên URL ngoài (Google avatar)
                user.avatar = user.avatar;
            } else {
                // Đảm bảo luôn bắt đầu bằng dấu / và không bị lặp thư mục
                const cleanPath = user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`;
                user.avatar = cleanPath;
            }
        } else {
            user.avatar = '/default.png';
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin profile:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, gender } = req.body;

        await db.query(
            'UPDATE users SET username = ?, gender = ? WHERE id = ?',
            [username, gender, req.user.id]
        );

        res.status(200).json({ message: 'Cập nhật thông tin thành công!' });
    } catch (error) {
        console.error('Lỗi khi cập nhật profile:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const updateAvatar = async (req, res) => {
    try {
        console.log("FILES CHECK - req.file:", req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng tải lên một file ảnh.' });
        }

        // Lưu đường dẫn tương đối chuẩn vào Database
        const avatarPath = path.posix.join('uploads', 'images', req.file.filename);
        const dbAvatarPath = `/${avatarPath}`;

        await db.query(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [dbAvatarPath, req.user.id]
        );

        res.status(200).json({ 
            message: 'Cập nhật ảnh đại diện thành công!',
            avatar: dbAvatarPath
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật avatar:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const user = users[0];

        if (!user.password) {
            return res.status(400).json({ message: 'Tài khoản đăng nhập qua mạng xã hội không hỗ trợ đổi mật khẩu.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    updateAvatar,
    changePassword
};