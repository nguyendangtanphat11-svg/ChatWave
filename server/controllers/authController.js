const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm trợ giúp để tạo token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token hết hạn sau 30 ngày
    });
};

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { username, email, password, gender } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ username, email và password.' });
    }

    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc username đã tồn tại.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (username, email, password, gender, status) VALUES (?, ?, ?, ?, ?)', 
            [username, email, hashedPassword, gender || 'Khác', 'offline']
        );

        res.status(201).json({
            message: "Đăng ký thành công! Vui lòng đăng nhập."
        });

    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ email và password.' });
    }

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // Cập nhật trạng thái thành 'online' trong MySQL khi đăng nhập
        await db.query('UPDATE users SET status = ? WHERE id = ?', ['online', user.id]);

        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            gender: user.gender,
            country: user.country || 'VN',
            status: 'online',
            provider: user.provider
        };

        res.status(200).json({
            message: "Đăng nhập thành công",
            token: generateToken(user.id),
            user: userResponse
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

/**
 * @desc    Đăng nhập qua Google
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const username = payload.name;
        const avatar = payload.picture;

        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        let user;

        if (users.length === 0) {
            const [result] = await db.query(
                `INSERT INTO users (username, email, password, avatar, gender, provider, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [username, email, "", avatar, "Khác", "google", "online"]
            );

            user = {
                id: result.insertId,
                username,
                email,
                avatar,
                gender: "Khác",
                country: 'VN',
                status: "online",
                provider: "google"
            };
        } else {
            user = users[0];
            const updateAvatarQuery = (!user.avatar || user.avatar === "default.png") ? avatar : user.avatar;
            
            await db.query(
                "UPDATE users SET avatar = ?, status = ? WHERE id = ?",
                [updateAvatarQuery, 'online', user.id]
            );

            user.avatar = updateAvatarQuery;
            user.status = 'online';
        }

        res.json({
            token: generateToken(user.id),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                gender: user.gender,
                country: user.country || 'VN',
                status: user.status,
                provider: user.provider
            }
        });

    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(500).json({
            message: "Google Login Error"
        });
    }
};

/**
 * @desc    Đăng xuất người dùng (Cập nhật status thành offline)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
    try {
        const userId = req.user.id; 

        // Cập nhật trạng thái thành 'offline' khi đăng xuất
        await db.query('UPDATE users SET status = ? WHERE id = ?', ['offline', userId]);

        res.status(200).json({ message: "Đăng xuất thành công" });
    } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    logoutUser
};
