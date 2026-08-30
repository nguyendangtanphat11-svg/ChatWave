const express = require('express');
const router = express.Router();

const { 
    getProfile, 
    updateProfile, 
    updateAvatar, 
    changePassword 
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');
const { uploadImage, validateUploadedFile } = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, uploadImage, validateUploadedFile, updateAvatar);
router.put('/password', protect, changePassword);

module.exports = router;
