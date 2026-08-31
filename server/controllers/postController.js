const db = require('../config/db');

const serialize = (post) => ({
    id: post.id,
    content: post.content,
    image: post.image,
    createdAt: post.created_at,
    recalled: Boolean(post.recalled_at),
    likes: Number(post.likes || 0),
    comments: Number(post.comments || 0),
    liked: Boolean(post.liked),
    canDelete: Number(post.user_id) === Number(post.viewer_id),
    author: {
        id: post.user_id,
        username: post.username,
        fullName: post.fullName,
        avatar: post.avatar,
    },
});

const serializeComment = (comment) => ({
    ...comment,
    content: comment.recalled_at ? '' : comment.content,
    recalled: Boolean(comment.recalled_at),
    canRecall: Number(comment.user_id) === Number(comment.viewer_id),
});

const selectPosts = `SELECT p.*, ? viewer_id, u.username, u.fullName, u.avatar,
    COUNT(DISTINCT pl.user_id) likes,
    COUNT(DISTINCT CASE WHEN pc.recalled_at IS NULL THEN pc.id END) comments,
    MAX(pl.user_id = ?) liked
    FROM posts p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN post_likes pl ON pl.post_id = p.id
    LEFT JOIN post_comments pc ON pc.post_id = p.id`;

const postNotFound = (res) => res.status(404).json({ message: 'Không tìm thấy bài viết.' });
const toPositiveId = (value) => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const getAcceptedFriendIds = async (userId) => {
    const [rows] = await db.query(
        `SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS user_id
         FROM friend_requests
         WHERE status = 'accepted' AND (sender_id = ? OR receiver_id = ?)`,
        [userId, userId, userId],
    );

    return rows
        .map((row) => Number(row.user_id))
        .filter((id) => Number.isSafeInteger(id) && id > 0);
};

// Posts are private to their author and accepted friends. Generate each
// payload per recipient because canDelete/canRecall are viewer-specific.
const emitToPostAudience = async (req, authorId, eventName, payloadForViewer) => {
    const io = req.app.get('io');
    if (!io) return;

    try {
        const audience = new Set([Number(authorId), ...(await getAcceptedFriendIds(authorId))]);
        for (const viewerId of audience) {
            if (!Number.isSafeInteger(viewerId) || viewerId <= 0) continue;
            io.to(`user_${viewerId}`).emit(eventName, payloadForViewer(viewerId));
        }
    } catch (error) {
        // A Socket.IO delivery failure must not roll back a completed HTTP
        // mutation, but it should remain visible in server logs.
        console.error(`Không thể phát sự kiện ${eventName}:`, error);
    }
};

// Missing, recalled, and unauthorized posts deliberately use one 404 response
// so an arbitrary ID cannot disclose whether a post exists.
const findVisiblePost = async (req, res) => {
    const postId = toPositiveId(req.params.id);
    if (!postId) {
        postNotFound(res);
        return null;
    }

    const [posts] = await db.query(
        `SELECT p.id, p.user_id
         FROM posts p
         WHERE p.id = ?
           AND p.recalled_at IS NULL
           AND (
               p.user_id = ?
               OR EXISTS (
                   SELECT 1
                   FROM friend_requests fr
                   WHERE fr.status = 'accepted'
                     AND (
                         (fr.sender_id = p.user_id AND fr.receiver_id = ?)
                         OR (fr.receiver_id = p.user_id AND fr.sender_id = ?)
                     )
               )
           )
         LIMIT 1`,
        [postId, req.user.id, req.user.id, req.user.id],
    );

    if (!posts.length) {
        postNotFound(res);
        return null;
    }

    return posts[0];
};

exports.getFeed = async (req, res) => {
    try {
        const [posts] = await db.query(
            `${selectPosts}
             WHERE p.recalled_at IS NULL
               AND (
                   p.user_id = ?
                   OR EXISTS (
                       SELECT 1 FROM friend_requests fr
                       WHERE fr.status = 'accepted'
                         AND ((fr.sender_id = p.user_id AND fr.receiver_id = ?)
                              OR (fr.receiver_id = p.user_id AND fr.sender_id = ?))
                   )
               )
             GROUP BY p.id
             ORDER BY p.created_at DESC
             LIMIT 50`,
            [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id],
        );
        return res.json({ posts: posts.map(serialize) });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể tải bảng tin.' });
    }
};

exports.getMyPosts = async (req, res) => {
    try {
        const [posts] = await db.query(
            `${selectPosts} WHERE p.user_id = ? GROUP BY p.id ORDER BY p.created_at DESC`,
            [req.user.id, req.user.id, req.user.id],
        );
        return res.json({ posts: posts.map(serialize) });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể tải bài viết.' });
    }
};

exports.getUserPosts = async (req, res) => {
    try {
        const userId = toPositiveId(req.params.id);
        if (!userId) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

        const [relation] = await db.query(
            `SELECT id FROM friend_requests
             WHERE status = 'accepted'
               AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`,
            [req.user.id, userId, userId, req.user.id],
        );
        if (userId !== Number(req.user.id) && !relation.length) {
            return res.status(403).json({ message: 'Bạn chỉ có thể xem bài viết của bạn bè.' });
        }

        const [posts] = await db.query(
            `${selectPosts}
             WHERE p.recalled_at IS NULL AND p.user_id = ?
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
            [req.user.id, req.user.id, userId],
        );
        return res.json({ posts: posts.map(serialize) });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể tải bài viết.' });
    }
};

exports.createPost = async (req, res) => {
    try {
        const content = String(req.body.content || '').trim();
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Bài viết cần có nội dung hoặc ảnh.' });
        }

        const image = req.file ? `/uploads/images/${req.file.filename}` : null;
        const [result] = await db.query(
            'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
            [req.user.id, content || null, image],
        );
        const [posts] = await db.query(
            `${selectPosts} WHERE p.id = ? GROUP BY p.id`,
            [req.user.id, req.user.id, result.insertId],
        );
        const rawPost = posts[0];
        const post = serialize(rawPost);

        await emitToPostAudience(req, req.user.id, 'postCreated', (viewerId) => (
            serialize({ ...rawPost, viewer_id: viewerId })
        ));

        return res.status(201).json({ post });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể tạo bài viết.' });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const postId = toPositiveId(req.params.id);
        if (!postId) return postNotFound(res);

        const [result] = await db.query(
            'DELETE FROM posts WHERE id = ? AND user_id = ?',
            [postId, req.user.id],
        );
        if (!result.affectedRows) return postNotFound(res);

        await emitToPostAudience(req, req.user.id, 'postDeleted', () => ({ postId }));
        return res.status(204).end();
    } catch (error) {
        return res.status(500).json({ message: 'Không thể xóa bài viết.' });
    }
};

exports.recallPost = async (req, res) => {
    try {
        const postId = toPositiveId(req.params.id);
        if (!postId) return postNotFound(res);

        const [result] = await db.query(
            `UPDATE posts
             SET recalled_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ? AND recalled_at IS NULL`,
            [postId, req.user.id],
        );
        if (!result.affectedRows) return postNotFound(res);

        const event = { postId, recalled: true, recalledAt: new Date().toISOString() };
        await emitToPostAudience(req, req.user.id, 'postRecalled', (viewerId) => ({
            ...event,
            canDelete: Number(viewerId) === Number(req.user.id),
        }));
        return res.json({ post: event });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể thu hồi bài viết.' });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const post = await findVisiblePost(req, res);
        if (!post) return;

        const [likes] = await db.query(
            'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?',
            [post.id, req.user.id],
        );
        if (likes.length) {
            await db.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, req.user.id]);
        } else {
            await db.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post.id, req.user.id]);
        }

        const [[count]] = await db.query('SELECT COUNT(*) count FROM post_likes WHERE post_id = ?', [post.id]);
        return res.json({ liked: !likes.length, likes: Number(count.count) });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể cập nhật lượt thích.' });
    }
};

exports.getComments = async (req, res) => {
    try {
        const post = await findVisiblePost(req, res);
        if (!post) return;

        const [comments] = await db.query(
            `SELECT pc.*, ? viewer_id, u.username, u.fullName, u.avatar
             FROM post_comments pc
             JOIN users u ON u.id = pc.user_id
             WHERE pc.post_id = ?
             ORDER BY pc.created_at ASC`,
            [req.user.id, post.id],
        );
        return res.json({ comments: comments.map(serializeComment) });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể tải bình luận.' });
    }
};

exports.createComment = async (req, res) => {
    try {
        const post = await findVisiblePost(req, res);
        if (!post) return;

        const content = String(req.body.content || '').trim();
        if (!content) return res.status(400).json({ message: 'Bình luận trống.' });

        const [result] = await db.query(
            'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [post.id, req.user.id, content],
        );
        const [[comment]] = await db.query(
            `SELECT pc.*, ? viewer_id, u.username, u.fullName, u.avatar
             FROM post_comments pc
             JOIN users u ON u.id = pc.user_id
             WHERE pc.id = ?`,
            [req.user.id, result.insertId],
        );
        const serialized = serializeComment(comment);

        await emitToPostAudience(req, post.user_id, 'postCommentCreated', (viewerId) => ({
            postId: Number(post.id),
            comment: serializeComment({ ...comment, viewer_id: viewerId }),
        }));

        return res.status(201).json({ comment: serialized });
    } catch (error) {
        return res.status(500).json({ message: 'Không thể bình luận.' });
    }
};

exports.recallComment = async (req, res) => {
    try {
        const post = await findVisiblePost(req, res);
        if (!post) return;

        const commentId = toPositiveId(req.params.commentId);
        if (!commentId) return postNotFound(res);

        const [result] = await db.query(
            `UPDATE post_comments
             SET recalled_at = CURRENT_TIMESTAMP
             WHERE id = ? AND post_id = ? AND user_id = ? AND recalled_at IS NULL`,
            [commentId, post.id, req.user.id],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Không tìm thấy bình luận để thu hồi.' });
        }

        const [[counter]] = await db.query(
            'SELECT COUNT(*) count FROM post_comments WHERE post_id = ? AND recalled_at IS NULL',
            [post.id],
        );
        const event = {
            postId: Number(post.id),
            comment: { id: commentId, recalled: true, content: '', canRecall: false },
            comments: Number(counter.count),
        };
        await emitToPostAudience(req, post.user_id, 'postCommentRecalled', () => event);
        return res.json(event);
    } catch (error) {
        return res.status(500).json({ message: 'Không thể thu hồi bình luận.' });
    }
};
