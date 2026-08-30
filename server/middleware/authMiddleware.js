const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            const [users] = await db.query('SELECT id FROM users WHERE id = ?', [decoded.id]);
            if (users.length === 0) {
                return res.status(401).json({ message: 'Không được phép, người dùng không tồn tại' });
            }
            req.user = users[0];
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Không được phép, token không hợp lệ' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Không được phép, không có token' });
    }
};

// Sửa thành export dưới dạng object để khớp với lệnh import { protect } bên authRoutes.js
module.exports = { protect };