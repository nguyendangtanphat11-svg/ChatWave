const express = require('express');
const router = express.Router();
const { searchUsers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Route để tìm kiếm người dùng, yêu cầu xác thực (đăng nhập)
router.get('/search', authMiddleware, searchUsers);

module.exports = router;