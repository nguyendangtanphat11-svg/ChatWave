const express = require('express');
const router = express.Router();
const { sendFriendRequest, respondFriendRequest, getFriendsAndRequests, getFriendStatus, removeFriend } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.get('/status/:id', protect, getFriendStatus);
router.post('/send', protect, sendFriendRequest);
router.post('/respond', protect, respondFriendRequest);
router.get('/list', protect, getFriendsAndRequests);
router.delete('/:id', protect, removeFriend);

module.exports = router;
