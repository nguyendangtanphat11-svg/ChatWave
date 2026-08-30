const express = require('express');
const router = express.Router();
const { getUserProfile, getPublicProfile, getPublicFriends, getUserStatistics, updateUserProfile, updateUserAvatar, updateUserCover, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, uploadCover, validateUploadedFile } = require('../middleware/upload');

router.get('/profile', protect, getUserProfile);
router.get('/statistics', protect, getUserStatistics);
router.get('/public/:id', protect, getPublicProfile);
router.get('/public/:id/friends', protect, getPublicFriends);
router.put('/profile', protect, updateUserProfile);
router.put('/avatar', protect, uploadImage, validateUploadedFile, updateUserAvatar);
router.put('/cover', protect, uploadCover, validateUploadedFile, updateUserCover);
router.get('/search', protect, searchUsers);

module.exports = router;
