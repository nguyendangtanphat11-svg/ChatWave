const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, recallMessage, deleteMessageForMe } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:matchId', protect, getMessages);
router.post('/send', protect, sendMessage);
router.patch('/:id/recall', protect, recallMessage);
router.delete('/:id', protect, deleteMessageForMe);

module.exports = router;
