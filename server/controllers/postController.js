const db = require('../config/db');

const serialize = (post) => ({ id: post.id, content: post.content, image: post.image, createdAt: post.created_at, recalled: Boolean(post.recalled_at), likes: Number(post.likes || 0), comments: Number(post.comments || 0), liked: Boolean(post.liked), canDelete: Number(post.user_id) === Number(post.viewer_id), author: { id: post.user_id, username: post.username, fullName: post.fullName, avatar: post.avatar } });
const serializeComment = (comment) => ({ ...comment, content: comment.recalled_at ? '' : comment.content, recalled: Boolean(comment.recalled_at), canRecall: Number(comment.user_id) === Number(comment.viewer_id) });
const selectPosts = `SELECT p.*, ? viewer_id, u.username, u.fullName, u.avatar, COUNT(DISTINCT pl.user_id) likes, COUNT(DISTINCT CASE WHEN pc.recalled_at IS NULL THEN pc.id END) comments, MAX(pl.user_id = ?) liked FROM posts p JOIN users u ON u.id=p.user_id LEFT JOIN post_likes pl ON pl.post_id=p.id LEFT JOIN post_comments pc ON pc.post_id=p.id`;

exports.getFeed = async (req, res) => {
    try {
        const [posts] = await db.query(`${selectPosts} WHERE p.recalled_at IS NULL AND (p.user_id = ? OR EXISTS (SELECT 1 FROM friend_requests fr WHERE fr.status='accepted' AND ((fr.sender_id=p.user_id AND fr.receiver_id=?) OR (fr.receiver_id=p.user_id AND fr.sender_id=?)))) GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50`, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);
        res.json({ posts: posts.map(serialize) });
    } catch (error) { res.status(500).json({ message: 'Không thể tải bảng tin.' }); }
};

exports.getMyPosts = async (req, res) => {
    try {
        const [posts] = await db.query(`${selectPosts} WHERE p.user_id = ? GROUP BY p.id ORDER BY p.created_at DESC`, [req.user.id, req.user.id, req.user.id]);
        res.json({ posts: posts.map(serialize) });
    } catch (error) { res.status(500).json({ message: 'Không thể tải bài viết.' }); }
};

exports.getUserPosts = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const [relation] = await db.query(`SELECT id FROM friend_requests WHERE status='accepted' AND ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))`, [req.user.id, userId, userId, req.user.id]);
        if (userId !== Number(req.user.id) && !relation.length) return res.status(403).json({ message: 'Bạn chỉ có thể xem bài viết của bạn bè.' });
        const [posts] = await db.query(`${selectPosts} WHERE p.recalled_at IS NULL AND p.user_id = ? GROUP BY p.id ORDER BY p.created_at DESC`, [req.user.id, req.user.id, userId]);
        return res.json({ posts: posts.map(serialize) });
    } catch (error) { return res.status(500).json({ message: 'Không thể tải bài viết.' }); }
};

exports.createPost = async (req, res) => {
    try {
        const content = String(req.body.content || '').trim();
        if (!content && !req.file) return res.status(400).json({ message: 'Bài viết cần có nội dung hoặc ảnh.' });
        const image = req.file ? `/uploads/images/${req.file.filename}` : null;
        const [result] = await db.query('INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)', [req.user.id, content || null, image]);
        const [posts] = await db.query(`${selectPosts} WHERE p.id = ? GROUP BY p.id`, [req.user.id, req.user.id, result.insertId]);
        const post = serialize(posts[0]);
        req.app.get('io')?.emit('postCreated', post);
        res.status(201).json({ post });
    } catch (error) { res.status(500).json({ message: 'Không thể tạo bài viết.' }); }
};

exports.deletePost = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM posts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(403).json({ message: 'Bạn chỉ có thể xóa bài viết do mình tạo.' });
        req.app.get('io')?.emit('postDeleted', { postId: Number(req.params.id) });
        return res.status(204).end();
    } catch (error) { return res.status(500).json({ message: 'Không thể xóa bài viết.' }); }
};

exports.recallPost = async (req, res) => {
    try {
        const [result] = await db.query('UPDATE posts SET recalled_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND recalled_at IS NULL', [req.params.id, req.user.id]);
        if (!result.affectedRows) return res.status(403).json({ message: 'Bạn chỉ có thể thu hồi bài viết do mình tạo.' });
        const post = { postId: Number(req.params.id), recalled: true, recalledAt: new Date().toISOString() };
        req.app.get('io')?.emit('postRecalled', post);
        return res.json({ post });
    } catch (error) { return res.status(500).json({ message: 'Không thể thu hồi bài viết.' }); }
};

exports.toggleLike = async (req, res) => { try { const [rows] = await db.query('SELECT 1 FROM post_likes WHERE post_id=? AND user_id=?', [req.params.id, req.user.id]); if (rows.length) await db.query('DELETE FROM post_likes WHERE post_id=? AND user_id=?', [req.params.id, req.user.id]); else await db.query('INSERT INTO post_likes (post_id,user_id) VALUES (?,?)', [req.params.id, req.user.id]); const [[count]] = await db.query('SELECT COUNT(*) count FROM post_likes WHERE post_id=?', [req.params.id]); res.json({ liked: !rows.length, likes: count.count }); } catch { res.status(500).json({ message: 'Không thể cập nhật lượt thích.' }); } };
exports.getComments = async (req, res) => { try { const [comments] = await db.query('SELECT pc.*, ? viewer_id, u.username, u.fullName, u.avatar FROM post_comments pc JOIN users u ON u.id=pc.user_id WHERE pc.post_id=? ORDER BY pc.created_at ASC', [req.user.id, req.params.id]); res.json({ comments: comments.map(serializeComment) }); } catch { res.status(500).json({ message: 'Không thể tải bình luận.' }); } };
exports.createComment = async (req, res) => { try { const content=String(req.body.content||'').trim(); if(!content) return res.status(400).json({message:'Bình luận trống.'}); const [result]=await db.query('INSERT INTO post_comments (post_id,user_id,content) VALUES (?,?,?)',[req.params.id,req.user.id,content]); const [[comment]]=await db.query('SELECT pc.*, ? viewer_id, u.username, u.fullName, u.avatar FROM post_comments pc JOIN users u ON u.id=pc.user_id WHERE pc.id=?',[req.user.id,result.insertId]); const serialized = serializeComment(comment); req.app.get('io')?.emit('postCommentCreated',{postId:Number(req.params.id),comment:serialized}); res.status(201).json({comment:serialized}); } catch { res.status(500).json({message:'Không thể bình luận.'}); } };
exports.recallComment = async (req, res) => { try { const [result] = await db.query('UPDATE post_comments SET recalled_at=CURRENT_TIMESTAMP WHERE id=? AND post_id=? AND user_id=? AND recalled_at IS NULL', [req.params.commentId, req.params.id, req.user.id]); if (!result.affectedRows) return res.status(403).json({ message: 'Bạn chỉ có thể thu hồi bình luận do mình viết.' }); const [[counter]] = await db.query('SELECT COUNT(*) count FROM post_comments WHERE post_id=? AND recalled_at IS NULL', [req.params.id]); const event = { postId: Number(req.params.id), comment: { id: Number(req.params.commentId), recalled: true, content: '' }, comments: Number(counter.count) }; req.app.get('io')?.emit('postCommentRecalled', event); return res.json(event); } catch { return res.status(500).json({ message: 'Không thể thu hồi bình luận.' }); } };
