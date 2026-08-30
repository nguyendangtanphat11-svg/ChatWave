const db = require('../config/db');

const normalizeConversationId = (firstId, secondId) => [String(firstId), String(secondId)].sort((a, b) => Number(a) - Number(b)).join('_');

const areFriends = async (firstId, secondId) => {
    const [rows] = await db.query(
        `SELECT id FROM friend_requests WHERE status = 'accepted'
         AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`,
        [firstId, secondId, secondId, firstId],
    );
    return rows.length > 0;
};

const serializeMessage = (message) => ({
    id: message.id,
    matchId: message.conversation_id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    message: message.recalled_at ? '' : message.message,
    recalled: Boolean(message.recalled_at),
    createdAt: message.created_at,
});

const belongsToConversation = async (messageId, userId) => {
    const [rows] = await db.query(
        'SELECT * FROM friend_messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
        [messageId, userId, userId],
    );
    return rows[0];
};

const getMessages = async (req, res) => {
    try {
        const [firstId, secondId] = String(req.params.matchId).split('_');
        if (!firstId || !secondId || ![firstId, secondId].includes(String(req.user.id))) return res.status(400).json({ message: 'Cuộc trò chuyện không hợp lệ.' });
        if (!await areFriends(firstId, secondId)) return res.status(403).json({ message: 'Bạn chưa là bạn bè với người dùng này.' });

        const conversationId = normalizeConversationId(firstId, secondId);
        const [messages] = await db.query(
            `SELECT fm.* FROM friend_messages fm
             WHERE fm.conversation_id = ?
             AND NOT EXISTS (SELECT 1 FROM friend_message_deletions fmd WHERE fmd.message_id = fm.id AND fmd.user_id = ?)
             ORDER BY fm.created_at ASC, fm.id ASC`,
            [conversationId, req.user.id],
        );
        return res.status(200).json({ messages: messages.map(serializeMessage) });
    } catch (error) {
        console.error('Lỗi khi lấy lịch sử chat bạn bè:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, message } = req.body;
        if (!receiverId || !String(message || '').trim()) return res.status(400).json({ message: 'Tin nhắn không hợp lệ.' });
        if (!await areFriends(senderId, receiverId)) return res.status(403).json({ message: 'Bạn chỉ có thể nhắn tin cho bạn bè.' });

        const conversationId = normalizeConversationId(senderId, receiverId);
        const [result] = await db.query(
            'INSERT INTO friend_messages (conversation_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)',
            [conversationId, senderId, receiverId, String(message).trim()],
        );
        const [messages] = await db.query('SELECT * FROM friend_messages WHERE id = ?', [result.insertId]);
        return res.status(201).json({ message: serializeMessage(messages[0]) });
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn bạn bè:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const recallMessage = async (req, res) => {
    try {
        const message = await belongsToConversation(req.params.id, req.user.id);
        if (!message) return res.status(404).json({ message: 'Không tìm thấy tin nhắn.' });
        if (Number(message.sender_id) !== Number(req.user.id)) return res.status(403).json({ message: 'Bạn chỉ có thể thu hồi tin nhắn do mình gửi.' });
        const [result] = await db.query('UPDATE friend_messages SET recalled_at = CURRENT_TIMESTAMP WHERE id = ? AND recalled_at IS NULL', [message.id]);
        if (!result.affectedRows) return res.status(409).json({ message: 'Tin nhắn này đã được thu hồi.' });
        const updated = { ...serializeMessage({ ...message, recalled_at: new Date() }), recalled: true };
        req.app.get('io')?.to(`user_${message.sender_id}`).to(`user_${message.receiver_id}`).emit('friendMessageRecalled', updated);
        return res.json({ message: updated });
    } catch (error) {
        console.error('Lỗi khi thu hồi tin nhắn:', error);
        return res.status(500).json({ message: 'Không thể thu hồi tin nhắn.' });
    }
};

const deleteMessageForMe = async (req, res) => {
    try {
        const message = await belongsToConversation(req.params.id, req.user.id);
        if (!message) return res.status(404).json({ message: 'Không tìm thấy tin nhắn.' });
        await db.query('INSERT IGNORE INTO friend_message_deletions (message_id, user_id) VALUES (?, ?)', [message.id, req.user.id]);
        return res.status(204).end();
    } catch (error) {
        console.error('Lỗi khi xóa tin nhắn:', error);
        return res.status(500).json({ message: 'Không thể xóa tin nhắn.' });
    }
};

module.exports = { getMessages, sendMessage, recallMessage, deleteMessageForMe };
