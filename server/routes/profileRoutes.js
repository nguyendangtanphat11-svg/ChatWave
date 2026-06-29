const express = require('express');
const router = express.Router();
const { 
    getProfile, 
    updateProfile, 
    updateAvatar, 
    changePassword 
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Cấu hình Multer để xử lý upload file ảnh
const storage = multer.memoryStorage(); // Lưu file vào bộ nhớ tạm
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn file 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
        }
    }
});

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/avatar', authMiddleware, upload.single('avatar'), updateAvatar);
router.put('/password', authMiddleware, changePassword);

module.exports = router;