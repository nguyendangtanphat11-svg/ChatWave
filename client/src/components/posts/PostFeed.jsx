import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaEllipsisH, FaHeart, FaImage, FaPaperPlane, FaRegComment, FaRegHeart, FaTimes, FaTrash, FaUndo } from 'react-icons/fa';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';
import { CHAT_IMAGE_ACCEPT, validateChatUpload } from '../../utils/uploadValidation';
import { useNotifications } from '../../contexts/useNotifications';
import './PostFeed.css';
import './PostInteractions.css';
import './PostFacebook.css';
import './PostFacebookV2.css';
import './PostMedia.css';

const COMMENT_PREFIX = 'comment:v1:';
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const parseComment = (content = '') => {
    if (content.startsWith(COMMENT_PREFIX)) {
        try { return JSON.parse(content.slice(COMMENT_PREFIX.length)); } catch { return { text: content }; }
    }
    return content.startsWith('image:') ? { image: content.slice(6) } : { text: content };
};

function CommentContent({ content }) {
    const { text, image } = parseComment(content);
    return <>
        {text && (/^https?:\/\//i.test(text) ? <a href={text} target="_blank" rel="noreferrer">{text}</a> : <span>{text}</span>)}
        {image && <img className="comment-image" src={getAvatarUrl(image)} alt="Ảnh bình luận" />}
    </>;
}

function PostCard({ post, socket, onDelete, onRecall }) {
    const { toast, confirm } = useNotifications();
    const [postUpdates, setPostUpdates] = useState({});
    const currentPost = { ...post, ...postUpdates };
    const [comments, setComments] = useState([]);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentImage, setCommentImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [actionPending, setActionPending] = useState(false);
    const [activeCommentId, setActiveCommentId] = useState(null);
    const [recallingCommentId, setRecallingCommentId] = useState(null);
    const commentImageRef = useRef(null);

    useEffect(() => {
        if (!socket) return undefined;
        const handleCommentRecalled = ({ postId, comment, comments: commentCount }) => {
            if (Number(postId) !== Number(currentPost.id)) return;
            setComments((previous) => previous.map((item) => Number(item.id) === Number(comment.id) ? { ...item, ...comment, recalled: true, content: '' } : item));
            if (Number.isFinite(commentCount)) setPostUpdates((previous) => ({ ...previous, comments: commentCount }));
        };
        socket.on('postCommentRecalled', handleCommentRecalled);
        return () => socket.off('postCommentRecalled', handleCommentRecalled);
    }, [socket, currentPost.id]);

    const handleInteractionError = (error, fallbackMessage) => {
        if (error.response?.status === 404) onRecall(currentPost.id);
        toast(error.response?.data?.message || fallbackMessage, 'error');
    };

    const toggleLike = async () => {
        try {
            const response = await axios.post(`/api/posts/${currentPost.id}/like`, {}, authHeaders());
            setPostUpdates((previous) => ({ ...previous, ...response.data }));
        } catch (error) { handleInteractionError(error, 'Không thể cập nhật lượt thích.'); }
    };

    const toggleComments = async () => {
        try {
            if (!commentsOpen) {
                const response = await axios.get(`/api/posts/${currentPost.id}/comments`, authHeaders());
                setComments(response.data.comments || []);
            }
            setCommentsOpen((open) => !open);
        } catch (error) { handleInteractionError(error, 'Không thể tải bình luận.'); }
    };

    const sendComment = async (event) => {
        event.preventDefault();
        const text = commentText.trim();
        if ((!text && !commentImage) || uploading) return;
        const content = `${COMMENT_PREFIX}${JSON.stringify({ text, image: commentImage?.url || null })}`;
        try {
            const response = await axios.post(`/api/posts/${currentPost.id}/comments`, { content }, authHeaders());
            setComments((previous) => [...previous, response.data.comment]);
            setPostUpdates((previous) => ({ ...previous, comments: Number(currentPost.comments || 0) + 1 }));
            setCommentText('');
            setCommentImage(null);
        } catch (error) { handleInteractionError(error, 'Không thể gửi bình luận.'); }
    };

    const uploadCommentImage = async (event) => {
        const image = event.target.files?.[0];
        if (!image) return;
        const validationError = validateChatUpload(image, 'image');
        if (validationError) {
            toast(validationError, 'error');
            event.target.value = '';
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('image', image);
            const response = await axios.post('/api/upload/image', form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' } });
            setCommentImage({ url: response.data.url || response.data.filePath, name: image.name });
        } catch (error) { toast(error.response?.data?.message || 'Không thể tải ảnh bình luận. Vui lòng thử lại.', 'error'); }
        finally { setUploading(false); event.target.value = ''; }
    };

    const deletePost = async () => {
        if (!await confirm({ title: 'Xóa bài viết?', message: 'Hành động này không thể hoàn tác.', confirmLabel: 'Xóa vĩnh viễn', danger: true })) return;
        setActionPending(true);
        try { await axios.delete(`/api/posts/${currentPost.id}`, authHeaders()); onDelete(currentPost.id); }
        catch (error) { toast(error.response?.data?.message || 'Không thể xóa bài viết.', 'error'); }
        finally { setActionPending(false); }
    };

    const recallPost = async () => {
        if (!await confirm({ title: 'Thu hồi bài viết?', message: 'Bài viết sẽ biến mất khỏi bảng tin của mọi người.', confirmLabel: 'Thu hồi', danger: true })) return;
        setActionPending(true);
        try { await axios.patch(`/api/posts/${currentPost.id}/recall`, {}, authHeaders()); onRecall(currentPost.id); setActionsOpen(false); }
        catch (error) { toast(error.response?.data?.message || 'Không thể thu hồi bài viết.', 'error'); }
        finally { setActionPending(false); }
    };

    const recallComment = async (commentId) => {
        if (!await confirm({ title: 'Thu hồi bình luận?', message: 'Mọi người sẽ thấy bình luận đã được thu hồi.', confirmLabel: 'Thu hồi', danger: true })) return;
        setRecallingCommentId(commentId);
        try {
            const response = await axios.patch(`/api/posts/${currentPost.id}/comments/${commentId}/recall`, {}, authHeaders());
            setComments((previous) => previous.map((comment) => Number(comment.id) === Number(commentId) ? { ...comment, recalled: true, content: '' } : comment));
            setPostUpdates((previous) => ({ ...previous, comments: Number(response.data.comments) }));
        } catch (error) { toast(error.response?.data?.message || 'Không thể thu hồi bình luận.', 'error'); }
        finally { setRecallingCommentId(null); setActiveCommentId(null); }
    };

    const ownerMenu = currentPost.canDelete && <div className="post-owner-actions">
        <button type="button" className="post-more-button" onClick={() => setActionsOpen((open) => !open)} aria-expanded={actionsOpen} aria-label="Tùy chọn bài viết" title="Tùy chọn bài viết"><FaEllipsisH /></button>
        {actionsOpen && <div className="post-owner-menu">
            <button type="button" onClick={recallPost} disabled={currentPost.recalled || actionPending}><FaUndo /> Thu hồi bài viết</button>
            <button type="button" className="post-danger-action" onClick={deletePost} disabled={actionPending}><FaTrash /> Xóa vĩnh viễn</button>
        </div>}
    </div>;

    return <article className="post-card">
        <header>
            <img src={getAvatarUrl(currentPost.author?.avatar, currentPost.author?.username)} alt="" onError={(event) => { event.currentTarget.src = getInitialAvatarUrl(currentPost.author?.username); }} />
            <div><strong>{currentPost.author?.fullName || currentPost.author?.username}</strong><small>{new Date(currentPost.createdAt).toLocaleString('vi-VN')}</small></div>
            {ownerMenu}
        </header>
        {currentPost.recalled ? <div className="post-recalled">Bài viết này đã được thu hồi.</div> : <>
            {currentPost.content && <p>{currentPost.content}</p>}
            {currentPost.image && <div className="post-media"><img className="post-image" src={getAvatarUrl(currentPost.image)} alt="Ảnh bài viết" loading="lazy" /></div>}
            <div className="post-stats">{currentPost.likes} lượt thích · {currentPost.comments} bình luận</div>
            <div className="post-actions"><button onClick={toggleLike} className={currentPost.liked ? 'liked' : ''}>{currentPost.liked ? <FaHeart /> : <FaRegHeart />} Thích</button><button onClick={toggleComments}><FaRegComment /> Bình luận</button></div>
            {commentsOpen && <div className="post-comments">
                {comments.map((comment) => <div className="post-comment" key={comment.id}><img src={getAvatarUrl(comment.avatar, comment.username)} alt="" onError={(event) => { event.currentTarget.src = getInitialAvatarUrl(comment.username); }} /><p><strong>{comment.fullName || comment.username}</strong> {comment.recalled ? <em className="comment-recalled">Bình luận đã được thu hồi.</em> : <CommentContent content={comment.content} />}</p>{comment.canRecall && !comment.recalled && <div className="comment-owner-actions"><button type="button" aria-label="Tùy chọn bình luận" title="Tùy chọn bình luận" onClick={() => setActiveCommentId((id) => Number(id) === Number(comment.id) ? null : comment.id)}><FaEllipsisH /></button>{Number(activeCommentId) === Number(comment.id) && <div className="comment-owner-menu"><button type="button" disabled={Number(recallingCommentId) === Number(comment.id)} onClick={() => recallComment(comment.id)}><FaUndo /> {Number(recallingCommentId) === Number(comment.id) ? 'Đang thu hồi...' : 'Thu hồi'}</button></div>}</div>}</div>)}
                {commentImage && <div className="comment-attachment-preview"><img className="comment-draft-image" src={getAvatarUrl(commentImage.url)} alt="Ảnh chờ gửi" /><button type="button" onClick={() => setCommentImage(null)} aria-label="Bỏ ảnh"><FaTimes /></button></div>}
                <form onSubmit={sendComment}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Viết bình luận..." /><input ref={commentImageRef} type="file" accept={CHAT_IMAGE_ACCEPT} hidden onChange={uploadCommentImage} /><button type="button" onClick={() => commentImageRef.current?.click()} disabled={uploading}>{uploading ? '...' : 'Ảnh'}</button><button type="submit" disabled={uploading || (!commentText.trim() && !commentImage)}>Gửi</button></form>
            </div>}
        </>}
    </article>;
}

export default function PostFeed({ user, mine = false, socket }) {
    const { toast } = useNotifications();
    const [posts, setPosts] = useState([]);
    const [composerOpen, setComposerOpen] = useState(false);
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const imageRef = useRef(null);

    useEffect(() => { axios.get(mine ? '/api/posts/mine' : '/api/posts/feed', authHeaders()).then((response) => setPosts(response.data.posts || [])).catch(() => setPosts([])); }, [mine]);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    useEffect(() => {
        if (!socket) return undefined;
        const removePost = ({ postId }) => setPosts((previous) => previous.filter((post) => Number(post.id) !== Number(postId)));
        const recallPost = ({ postId }) => setPosts((previous) => mine ? previous.map((post) => Number(post.id) === Number(postId) ? { ...post, recalled: true } : post) : previous.filter((post) => Number(post.id) !== Number(postId)));
        socket.on('postDeleted', removePost);
        socket.on('postRecalled', recallPost);
        return () => { socket.off('postDeleted', removePost); socket.off('postRecalled', recallPost); };
    }, [socket, mine]);

    const selectPostImage = (event) => {
        const next = event.target.files?.[0];
        if (!next) return;
        const validationError = validateChatUpload(next, 'image');
        if (validationError) {
            toast(validationError, 'error');
            event.target.value = '';
            return;
        }
        if (preview) URL.revokeObjectURL(preview);
        setImage(next);
        setPreview(URL.createObjectURL(next));
    };

    const submitPost = async () => {
        if ((!content.trim() && !image) || saving) return;
        setSaving(true);
        try {
            const form = new FormData();
            form.append('content', content);
            if (image) form.append('image', image);
            const response = await axios.post('/api/posts', form, authHeaders());
            setPosts((previous) => [response.data.post, ...previous]);
            if (preview) URL.revokeObjectURL(preview);
            setContent(''); setImage(null); setPreview(null); setComposerOpen(false);
        } catch (error) { toast(error.response?.data?.message || 'Không thể đăng bài viết.', 'error'); }
        finally { setSaving(false); }
    };

    const removePost = (postId) => setPosts((previous) => previous.filter((post) => Number(post.id) !== Number(postId)));
    const markRecalled = (postId) => setPosts((previous) => mine ? previous.map((post) => Number(post.id) === Number(postId) ? { ...post, recalled: true } : post) : previous.filter((post) => Number(post.id) !== Number(postId)));

    return <section className="post-feed">
        {!mine && <>
            <button className="post-create-button" onClick={() => setComposerOpen(true)}><span>+</span>Tạo bài viết</button>
            {composerOpen && <div className="post-modal"><div className="post-composer"><header><strong>Tạo bài viết</strong><button type="button" onClick={() => setComposerOpen(false)} aria-label="Đóng">×</button></header><div><img src={getAvatarUrl(user?.avatar, user?.username)} alt="" /><textarea autoFocus value={content} onChange={(event) => setContent(event.target.value)} placeholder="Bạn đang nghĩ gì?" /></div>{preview && <img className="post-preview" src={preview} alt="Xem trước" />}<footer><label><FaImage />Ảnh<input ref={imageRef} type="file" accept={CHAT_IMAGE_ACCEPT} onChange={selectPostImage} /></label><button disabled={saving || (!content.trim() && !image)} onClick={submitPost}><FaPaperPlane />Đăng bài</button></footer></div></div>}
        </>}
        {posts.map((post) => <PostCard key={post.id} post={post} socket={socket} onDelete={removePost} onRecall={markRecalled} />)}
    </section>;
}
