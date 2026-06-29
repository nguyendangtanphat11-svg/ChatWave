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

    // 1. Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ username, email và password.' });
    }

    try {
        // 2. Kiểm tra xem email hoặc username đã tồn tại chưa
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email hoặc username đã tồn tại.' });
        }

        // 3. Băm mật khẩu (sử dụng bcrypt thay vì bcryptjs)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Lưu người dùng vào database
        const [result] = await db.query('INSERT INTO users (username, email, password, gender) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, gender || 'Khác']);
        

        // 5. Trả về thông báo thành công
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
        // 1. Tìm người dùng bằng email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // 2. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }

        // Exclude password from the returned user object
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            gender: user.gender
        };

        // 3. Trả về thông tin người dùng và token
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
                `INSERT INTO users
                (username,email,password,avatar,gender,provider)
                VALUES (?,?,?,?,?,?)`,
                [
                    username,
                    email,
                    "",
                    avatar,
                    "Khác",
                    "google"
                ]
            );

            user = {
                id: result.insertId,
                username,
                email,
                avatar,
                gender: "Khác"
            };

        } else {

            user = users[0];

            // Nếu chưa có avatar thì cập nhật avatar Google
            if (!user.avatar || user.avatar === "default.png") {
                await db.query(
                    "UPDATE users SET avatar=? WHERE id=?",
                    [avatar, user.id]
                );

                user.avatar = avatar;
            }
        }

        res.json({
            token: generateToken(user.id),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                gender: user.gender
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Google Login Error"
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin
};