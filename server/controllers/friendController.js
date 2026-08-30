const db = require('../config/db');

// Gửi lời mời kết bạn
const sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;

        if (senderId === parseInt(receiverId)) {
            return res.status(400).json({ message: 'Không thể tự kết bạn với chính mình.' });
        }

        // Kiểm tra xem đã tồn tại lời mời hoặc quan hệ nào chưa
        const [existing] = await db.query(
            'SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)',
            [senderId, receiverId, receiverId, senderId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Lời mời kết bạn đã tồn tại hoặc đã là bạn bè.' });
        }

        const [result] = await db.query(
            'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, "pending")',
            [senderId, receiverId]
        );

        const [senders] = await db.query('SELECT id, username, fullName, avatar FROM users WHERE id = ?', [senderId]);
        req.app.get('io')?.to(`user_${String(receiverId)}`).emit('friendRequestReceived', {
            requestId: result.insertId,
            sender: senders[0]
        });

        res.status(200).json({ message: 'Đã gửi lời mời kết bạn thành công!' });
    } catch (error) {
        console.error('Lỗi gửi lời mời kết bạn:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Phản hồi lời mời kết bạn (Chấp nhận / Từ chối)
const respondFriendRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId, status } = req.body; // status: 'accepted' hoặc 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
        }

        const [request] = await db.query(
            'SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?',
            [requestId, userId]
        );

        if (request.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn.' });
        }

        if (status === 'accepted') {
            await db.query('UPDATE friend_requests SET status = "accepted" WHERE id = ?', [requestId]);
            req.app.get('io')?.to(`user_${String(request[0].sender_id)}`).emit('friendRequestAccepted', { userId, requestId });
            res.status(200).json({ message: 'Đã chấp nhận kết bạn!' });
        } else {
            await db.query('DELETE FROM friend_requests WHERE id = ?', [requestId]);
            res.status(200).json({ message: 'Đã từ chối lời mời kết bạn.' });
        }
    } catch (error) {
        console.error('Lỗi phản hồi kết bạn:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Lấy danh sách bạn bè và lời mời đang chờ
const getFriendsAndRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Lấy danh sách bạn bè (status = 'accepted')
        const [friends] = await db.query(
            `SELECT u.id, u.username, u.fullName, u.avatar, u.status 
             FROM friend_requests fr 
             JOIN users u ON (u.id = CASE WHEN fr.sender_id = ? THEN fr.receiver_id ELSE fr.sender_id END)
             WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = 'accepted'`,
            [userId, userId, userId]
        );

        // Lấy danh sách lời mời kết bạn gửi đến đang chờ duyệt (status = 'pending')
        const [pendingRequests] = await db.query(
            `SELECT fr.id as requestId, u.id, u.username, u.fullName, u.avatar 
             FROM friend_requests fr 
             JOIN users u ON u.id = fr.sender_id 
             WHERE fr.receiver_id = ? AND fr.status = 'pending'`,
            [userId]
        );

        res.status(200).json({ friends, pendingRequests });
    } catch (error) {
        console.error('Lỗi lấy danh sách bạn bè:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Kiểm tra trạng thái kết bạn với một user cụ thể (Giải quyết lỗi 404 cho giao diện video chat)
const getFriendStatus = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = parseInt(req.params.id);

        if (currentUserId === targetUserId) {
            return res.status(200).json({ status: 'self' });
        }

        const [rows] = await db.query(
            `SELECT * FROM friend_requests 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?)`,
            [currentUserId, targetUserId, targetUserId, currentUserId]
        );

        if (rows.length === 0) {
            return res.status(200).json({ status: 'none' });
        }

        const relation = rows[0];

        if (relation.status === 'accepted') {
            return res.status(200).json({ status: 'friends' });
        } else if (relation.status === 'pending') {
            if (relation.sender_id === currentUserId) {
                return res.status(200).json({ status: 'request_sent', requestId: relation.id });
            } else {
                return res.status(200).json({ status: 'request_received', requestId: relation.id });
            }
        }

        res.status(200).json({ status: 'none' });
    } catch (error) {
        console.error('Lỗi kiểm tra trạng thái kết bạn:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

const removeFriend = async (req, res) => {
    try {
        const friendId = Number(req.params.id);
        if (!Number.isInteger(friendId) || friendId <= 0 || friendId === Number(req.user.id)) return res.status(400).json({ message: 'Người dùng không hợp lệ.' });
        const [result] = await db.query(`DELETE FROM friend_requests WHERE status = 'accepted' AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`, [req.user.id, friendId, friendId, req.user.id]);
        if (!result.affectedRows) return res.status(404).json({ message: 'Hai người hiện không phải bạn bè.' });
        req.app.get('io')?.to(`user_${friendId}`).emit('friendRemoved', { userId: req.user.id });
        return res.status(204).end();
    } catch (error) {
        console.error('Không thể xóa bạn bè:', error);
        return res.status(500).json({ message: 'Không thể xóa bạn bè.' });
    }
};

module.exports = {
    sendFriendRequest,
    respondFriendRequest,
    getFriendsAndRequests,
    getFriendStatus,
    removeFriend
};
