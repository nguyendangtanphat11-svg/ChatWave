const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Hàm helper để đảm bảo thư mục tồn tại
const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, email, avatar, gender, status, provider, created_at, fullName FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        const user = rows[0];
        // Tạo URL đầy đủ cho avatar nếu nó không phải là URL từ Google
        if (user.avatar && !user.avatar.startsWith('http')) {
            user.avatar = `${req.protocol}://${req.get('host')}/${user.avatar}`;
        }
        res.json(user);
    } catch (error) {
        console.error('Lỗi khi lấy profile:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateProfile = async (req, res) => {
    const { username, fullName, gender } = req.body;
    try {
        // Kiểm tra username đã tồn tại chưa (nếu có thay đổi)
        if (username) {
            const [existingUser] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'Username đã tồn tại' });
            }
        }

        const fieldsToUpdate = {};
        if (username) fieldsToUpdate.username = username;
        if (typeof fullName !== 'undefined') fieldsToUpdate.fullName = fullName;
        if (gender) fieldsToUpdate.gender = gender;

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ message: 'Không có thông tin để cập nhật' });
        }

        await db.query('UPDATE users SET ? WHERE id = ?', [fieldsToUpdate, req.user.id]);
        res.json({ message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        console.error('Lỗi khi cập nhật profile:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng tải lên một file ảnh' });
    }

    try {
        const filename = `avatars/${uuidv4()}-${req.file.originalname.replace(/\s+/g, '-')}`;
        const filePath = path.join(__dirname, '..', 'public', filename);
        
        ensureDirectoryExistence(filePath);
        fs.writeFileSync(filePath, req.file.buffer);

        await db.query('UPDATE users SET avatar = ? WHERE id = ?', [filename, req.user.id]);
        
        const avatarUrl = `${req.protocol}://${req.get('host')}/${filename}`;
        res.json({ message: 'Cập nhật ảnh đại diện thành công', avatarUrl });
    } catch (error) {
        console.error('Lỗi khi cập nhật avatar:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật ảnh đại diện' });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const [rows] = await db.query('SELECT password, provider FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const user = rows[0];

        if (user.provider === 'google') {
            return res.status(400).json({ message: 'Tài khoản Google không thể đổi mật khẩu' });
        }

        if (!user.password) {
             return res.status(400).json({ message: 'Tài khoản này không có mật khẩu. Vui lòng liên hệ hỗ trợ.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

