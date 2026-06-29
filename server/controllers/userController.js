const db = require('../config/db');

/**
 * @desc    Tìm kiếm người dùng theo username
 * @route   GET /api/users/search
 * @access  Private (yêu cầu đăng nhập)
 */
exports.searchUsers = async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Vui lòng cung cấp từ khóa tìm kiếm.' });
    }

    try {
        // Tìm kiếm người dùng có username chứa từ khóa, loại trừ chính người dùng hiện tại
        const searchQuery = `SELECT id, username, avatar, status FROM users WHERE username LIKE ? AND id != ?`;
        const [users] = await db.query(searchQuery, [`%${query}%`, req.user.id]);

        // Chuyển đổi đường dẫn avatar thành URL đầy đủ
        const usersWithFullAvatarUrl = users.map(user => {
            if (user.avatar && !user.avatar.startsWith('http')) {
                user.avatar = `${req.protocol}://${req.get('host')}/${user.avatar}`;
            }
            return user;
        });

        res.json(usersWithFullAvatarUrl);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm người dùng:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};