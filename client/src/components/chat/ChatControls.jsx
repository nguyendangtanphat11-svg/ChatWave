import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '../../contexts/NotificationContext';

// Import các icon có sẵn
const MicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 009 0v-.75a.75.75 0 011.5 0v.75a6 6 0 11-12 0v-.75a.75.75 0 01.75-.75z" /></svg>;
const MicOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2.25a.75.75 0 00-1.5 0v.358c0 .43.144.84.402 1.165l2.252 2.252a3.734 3.734 0 01-.402-1.165V2.25zM10.47 10.22a.75.75 0 00-1.06 1.06L12 13.88l2.647-2.647a.75.75 0 00-1.06-1.06L12 11.69l-1.53-1.47z" /><path fillRule="evenodd" d="M11.25 4.5a3.75 3.75 0 107.5 0v8.25a3.75 3.75 0 01-3.75 3.75.75.75 0 000 1.5 5.25 5.25 0 005.25-5.25V4.5a5.25 5.25 0 10-10.5 0v.375c0 .491.213.96.58 1.29l1.42-1.42A2.252 2.252 0 0111.25 4.5zM3.28 2.22a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM6 10.5a.75.75 0 01.75.75v.75a4.5 4.5 0 001.734 3.513l-1.42 1.42A6 6 0 016 12v-.75a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
const CameraIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-2.25l3.44 1.72a.75.75 0 001.06-.62v-6.66a.75.75 0 00-1.06-.62l-3.44 1.72V7.5a3 3 0 00-3-3H4.5z" /></svg>;
const CameraOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.512 3.002a3 3 0 00-2.88 2.133l-1.33 5.322a.75.75 0 00.37.833l.09.045a1.875 1.875 0 01.694 1.955l-1.293.97c-.135.101-.164.279-.087.431l4.258 7.373c.077.152.25.18.431.087l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.819V19.5a3 3 0 01-3 3h-2.25C6.55 22.5 1.5 17.45 1.5 10.5V8.25a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.33 5.322a.75.75 0 001.29.37l1.06-1.06-2.34-9.36a3 3 0 00-2.88-2.132zM21.75 8.62v6.76a.75.75 0 01-1.447.894l-3.44-1.72V15a3 3 0 01-3 3H9.362l-3.9-6.755a3.375 3.375 0 01.61-4.512l1.293-.97a3.375 3.375 0 013.52-.025l.09.045a2.25 2.25 0 001.588-.37l1.33-5.322a4.5 4.5 0 014.32-3.2h.378a.75.75 0 01.75.75v1.332l3.44-1.72a.75.75 0 011.06.621z" /></svg>;
const SkipIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>;
const EndCallIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 3.41l3-3a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 1 0 2.83l-3 3a16 16 0 0 1-17.32-17.32l3-3a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 1 0 2.83l-3 3z"></path><path d="m22 2-7 7"></path><path d="m15 2-7 7"></path></svg>;
const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const UserPlusIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>;

const ChatControls = ({ onMicToggle, onCameraToggle, onSkip, onEndCall, isMuted, isCameraOff, callState, targetUserId, socket, partnerInfo }) => {
    const { toast } = useNotifications();
    const navigate = useNavigate();
    const [friendStatus, setFriendStatus] = useState('none');

    const getResolvedUserId = () => {
        return targetUserId || partnerInfo?.id || partnerInfo?._id || partnerInfo?.userId || partnerInfo?.user_id;
    };

    useEffect(() => {
        const currentTargetId = getResolvedUserId();
        if (callState !== "in-call" || !currentTargetId || currentTargetId === 'undefined') {
            setFriendStatus('none');
            return;
        }

        const checkStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/friends/status/${currentTargetId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFriendStatus(res.data.status);
            } catch (error) {
                console.error('Lỗi kiểm tra trạng thái kết bạn:', error);
                setFriendStatus('none');
            }
        };

        checkStatus();
    }, [targetUserId, partnerInfo, callState]);

    const handleSendFriendRequest = async () => {
        const currentTargetId = getResolvedUserId();
        if (!currentTargetId) {
            toast('Không tìm thấy ID của đối phương!', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/friends/send', 
                { receiverId: currentTargetId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFriendStatus('request_sent');
            toast('Đã gửi lời mời kết bạn thành công!', 'success');

            if (socket) {
                socket.emit('send_friend_request', { receiverId: currentTargetId });
            }
        } catch (error) {
            console.error('Lỗi gửi kết bạn:', error);
            toast(error.response?.data?.message || 'Không thể gửi lời mời kết bạn.', 'error');
        }
    };

    const handleGoHome = () => {
        if (typeof onEndCall === 'function') {
            onEndCall();
        }
        navigate('/');
    };

    // Hàm bọc nút Camera để hiển thị thông báo trực quan khi bấm
    const handleCameraClick = () => {
        if (typeof onCameraToggle === 'function') {
            onCameraToggle();
        }
        // Thông báo trạng thái ngược lại của hiện tại
    };

    return (
        <div className="chat-main-controls">
            <button className="chat-control-btn home" onClick={handleGoHome} title="Về trang chủ">
                <HomeIcon />
            </button>
            
            <button
                className={`chat-control-btn ${isMuted ? "active" : ""}`}
                onClick={onMicToggle}
                title={isMuted ? "Bật micro" : "Tắt micro"}
            >
                {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>

            <button
                className={`chat-control-btn ${isCameraOff ? "active" : ""}`}
                onClick={handleCameraClick}
                title={isCameraOff ? "Bật camera" : "Tắt camera"}
            >
                {isCameraOff ? <CameraOffIcon /> : <CameraIcon />}
            </button>

            {callState === "in-call" && (
                <>
                    {friendStatus === 'friends' ? (
                        <span className="friend-badge" style={{ fontSize: '0.8rem', padding: '0 10px', color: '#10B981', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            ★ Bạn bè
                        </span>
                    ) : (
                        <button
                            className="chat-control-btn add-friend"
                            onClick={handleSendFriendRequest}
                            disabled={friendStatus === 'request_sent'}
                            title={friendStatus === 'request_sent' ? "Đã gửi lời mời kết bạn" : "Kết bạn"}
                            style={{ 
                                background: friendStatus === 'request_sent' ? '#6B7280' : '#4F46E5', 
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: friendStatus === 'request_sent' ? '0 10px' : '0'
                            }}
                        >
                            <UserPlusIcon />
                            {friendStatus === 'request_sent' && <span style={{ fontSize: '0.8rem' }}>Đã gửi</span>}
                        </button>
                    )}

                    <button
                        className="chat-control-btn skip"
                        onClick={onSkip}
                        title="Bỏ qua"
                    >
                        <SkipIcon />
                    </button>

                    <button
                        className="chat-control-btn end-call"
                        onClick={onEndCall}
                        title="Kết thúc"
                    >
                        <EndCallIcon />
                    </button>
                </>
            )}
        </div>
    );
};

export default ChatControls;
