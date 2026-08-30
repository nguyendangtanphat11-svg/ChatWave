import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
    FaTimes, FaImage, FaPaperclip, FaSmile, FaVideo, 
    FaVideoSlash, FaMicrophone, FaMicrophoneSlash, 
    FaPhone, FaPhoneSlash, FaExpand, FaCompress, FaPaperPlane, FaEllipsisH, FaTrash, FaUndo
} from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';
import { CHAT_FILE_ACCEPT, CHAT_IMAGE_ACCEPT, validateChatUpload } from '../../utils/uploadValidation';
import { useNotifications } from '../../contexts/NotificationContext';
import './FriendChatBox.css';
import './FriendChatFacebook.css';

const CHAT_PREFIX = 'chat:v1:';
const encodeChatMessage = ({ text, attachment }) => `${CHAT_PREFIX}${JSON.stringify({ text, attachment })}`;
const sameId = (first, second) => String(first) === String(second);
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};
const createCallId = () => (
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `call-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`
);
const parseChatMessage = (message = '') => {
    if (message.startsWith(CHAT_PREFIX)) {
        try { return JSON.parse(message.slice(CHAT_PREFIX.length)); } catch { return { text: message }; }
    }
    const legacyImage = message.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (legacyImage) return { text: '', attachment: { type: 'image', url: legacyImage[1], name: 'Ảnh đính kèm' } };
    const legacyFile = message.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
    if (legacyFile) return { text: '', attachment: { type: 'file', url: legacyFile[1], name: legacyFile[2].replace(/<[^>]+>/g, '').trim() || 'Tệp đính kèm' } };
    return { text: message };
};

export default function FriendChatBox({ currentUser, friend, socket, onClose, incomingCall, variant = 'floating' }) {
    const { toast, confirm } = useNotifications();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [recallingMessageId, setRecallingMessageId] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const [callStatus, setCallStatus] = useState('idle');
    const [incomingCaller, setIncomingCaller] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const messagesEndRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const localStreamRequestRef = useRef(null);
    const localStreamGenerationRef = useRef(0);
    const pendingIceCandidatesRef = useRef([]);
    const signalingQueueRef = useRef(Promise.resolve());
    const callStatusRef = useRef('idle');
    const activeCallIdRef = useRef(null);
    const activeCallFriendIdRef = useRef(null);
    const dismissedIncomingCallIdRef = useRef(null);

    const currentUserId = currentUser?.id || currentUser?._id;
    const friendId = friend?.id || friend?._id;
    const isOnline = friend?.status === 'online';
    const matchId = friend?.matchId || [currentUserId, friendId].sort((first, second) => Number(first) - Number(second)).join('_');
    const friendName = friend?.fullName || friend?.username || 'Bạn bè';

    // Tải lịch sử tin nhắn từ API
    useEffect(() => {
        if (!matchId) return;
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/messages/${matchId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const messageData = res.data?.messages || res.data;
                setMessages(Array.isArray(messageData) ? messageData : []);
            } catch (err) {
                console.error("Lỗi tải lịch sử chat:", err);
                setMessages([]);
            }
        };
        fetchMessages();
    }, [matchId]);

    const updateCallStatus = useCallback((status) => {
        callStatusRef.current = status;
        setCallStatus(status);
    }, []);

    const stopLocalStream = useCallback(() => {
        localStreamGenerationRef.current += 1;
        localStreamRequestRef.current = null;
        const stream = localStreamRef.current;
        localStreamRef.current = null;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        setLocalStream(null);
    }, []);

    const ensureLocalStream = useCallback(async () => {
        const existingStream = localStreamRef.current;
        if (existingStream?.getTracks().some((track) => track.readyState === 'live')) {
            return existingStream;
        }

        if (localStreamRequestRef.current) {
            return localStreamRequestRef.current.promise;
        }

        const generation = ++localStreamGenerationRef.current;
        const promise = navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (localStreamGenerationRef.current !== generation) {
                    stream.getTracks().forEach((track) => track.stop());
                    return null;
                }
                localStreamRef.current = stream;
                setLocalStream(stream);
                return stream;
            })
            .finally(() => {
                if (localStreamRequestRef.current?.generation === generation) {
                    localStreamRequestRef.current = null;
                }
            });

        localStreamRequestRef.current = { generation, promise };
        return promise;
    }, []);

    const closePeerConnection = useCallback(() => {
        pendingIceCandidatesRef.current = [];
        signalingQueueRef.current = Promise.resolve();
        const pc = peerConnectionRef.current;
        peerConnectionRef.current = null;
        if (pc) {
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.onnegotiationneeded = null;
            pc.onconnectionstatechange = null;
            pc.close();
        }
        setRemoteStream(null);
    }, []);

    const endCallCleanup = useCallback((notifyPeer = true) => {
        const callId = activeCallIdRef.current;
        const peerId = activeCallFriendIdRef.current || friendId;
        activeCallIdRef.current = null;
        activeCallFriendIdRef.current = null;
        if (callId) dismissedIncomingCallIdRef.current = callId;

        closePeerConnection();
        stopLocalStream();
        updateCallStatus('idle');
        setIncomingCaller(null);
        setIsMuted(false);
        setIsVideoOff(false);

        if (notifyPeer && socket?.connected && peerId && callId) {
            socket.emit("endCall", { to: peerId, callId });
        }
    }, [closePeerConnection, friendId, socket, stopLocalStream, updateCallStatus]);

    const flushPendingIceCandidates = useCallback(async (pc, callId) => {
        while (
            peerConnectionRef.current === pc
            && activeCallIdRef.current === callId
            && pendingIceCandidatesRef.current.length > 0
        ) {
            const candidate = pendingIceCandidatesRef.current.shift();
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.warn('Không thể thêm ICE candidate đã chờ:', error);
            }
        }
    }, []);

    const createPeerConnection = useCallback((stream, isInitiator, callId) => {
        const existingPeer = peerConnectionRef.current;
        if (existingPeer && existingPeer.connectionState !== 'closed') return existingPeer;
        if (existingPeer) closePeerConnection();

        pendingIceCandidatesRef.current = [];
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;
        const isCurrentPeer = () => (
            peerConnectionRef.current === pc
            && activeCallIdRef.current === callId
            && sameId(activeCallFriendIdRef.current, friendId)
        );

        stream.getTracks()
            .filter((track) => track.readyState === 'live')
            .forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (!isCurrentPeer()) return;
            setRemoteStream(event.streams[0] || new MediaStream([event.track]));
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && isCurrentPeer() && socket?.connected) {
                socket.emit("webrtcSignal", {
                    to: friendId,
                    callId,
                    signal: { candidate: event.candidate },
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (!isCurrentPeer() || pc.connectionState !== 'failed') return;
            endCallCleanup(true);
        };

        if (isInitiator) {
            pc.onnegotiationneeded = async () => {
                if (!isCurrentPeer() || pc.signalingState !== 'stable') return;
                try {
                    const offer = await pc.createOffer();
                    if (!isCurrentPeer()) return;
                    await pc.setLocalDescription(offer);
                    if (isCurrentPeer() && socket?.connected) {
                        socket.emit("webrtcSignal", {
                            to: friendId,
                            callId,
                            signal: { sdp: pc.localDescription },
                        });
                    }
                } catch (error) {
                    if (isCurrentPeer()) {
                        console.error("Lỗi tạo offer:", error);
                    }
                }
            };
        }

        return pc;
    }, [closePeerConnection, endCallCleanup, friendId, socket]);

    const startWebRTC = useCallback(async (isInitiator, callId) => {
        try {
            const currentStream = localStreamRef.current;
            const stream = currentStream?.getTracks().some((track) => track.readyState === 'live')
                ? currentStream
                : await ensureLocalStream();
            if (!stream || activeCallIdRef.current !== callId) return false;
            createPeerConnection(stream, isInitiator, callId);
            return true;
        } catch (error) {
            console.error("Không thể truy cập Camera/Micro:", error);
            toast('Vui lòng cấp quyền sử dụng Camera và Micro.', 'error');
            return false;
        }
    }, [createPeerConnection, ensureLocalStream, toast]);

    const prepareIncomingCall = useCallback((call) => {
        const callId = call?.callId;
        if (!callId || !sameId(call?.from, friendId) || dismissedIncomingCallIdRef.current === callId) {
            return;
        }

        if (callStatusRef.current !== 'idle') {
            if (activeCallIdRef.current !== callId && socket?.connected) {
                socket.emit('rejectCall', { to: call.from, callId });
            }
            return;
        }

        activeCallIdRef.current = callId;
        activeCallFriendIdRef.current = friendId;
        setIncomingCaller({ from: call.from, callerName: call.callerName, callId });
        updateCallStatus('incoming');
    }, [friendId, socket, updateCallStatus]);

    const processWebrtcSignal = useCallback(async ({ from, callId, signal } = {}) => {
        if (
            !sameId(from, friendId)
            || activeCallIdRef.current !== callId
            || !signal
            || typeof signal !== 'object'
        ) return;

        const pc = peerConnectionRef.current;
        const isCurrentPeer = () => (
            peerConnectionRef.current === pc
            && activeCallIdRef.current === callId
            && sameId(activeCallFriendIdRef.current, friendId)
        );
        if (!pc) return;

        try {
            if (signal.candidate) {
                if (!pc.remoteDescription && !pc.currentRemoteDescription) {
                    pendingIceCandidatesRef.current.push(signal.candidate);
                    return;
                }
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                return;
            }

            const description = signal.sdp;
            if (
                !description
                || typeof description !== 'object'
                || !['offer', 'answer'].includes(description.type)
                || typeof description.sdp !== 'string'
            ) return;

            await pc.setRemoteDescription(new RTCSessionDescription(description));
            if (!isCurrentPeer()) return;
            await flushPendingIceCandidates(pc, callId);
            if (description.type !== 'offer' || !isCurrentPeer()) return;

            const answer = await pc.createAnswer();
            if (!isCurrentPeer()) return;
            await pc.setLocalDescription(answer);
            if (isCurrentPeer() && socket?.connected) {
                socket.emit("webrtcSignal", {
                    to: friendId,
                    callId,
                    signal: { sdp: pc.localDescription },
                });
            }
        } catch (error) {
            if (isCurrentPeer()) {
                console.error("Lỗi xử lý WebRTC signal:", error);
            }
        }
    }, [flushPendingIceCandidates, friendId, socket]);

    const handleWebrtcSignal = useCallback((payload) => {
        signalingQueueRef.current = signalingQueueRef.current
            .catch(() => undefined)
            .then(() => processWebrtcSignal(payload));
        return signalingQueueRef.current;
    }, [processWebrtcSignal]);

    useEffect(() => {
        prepareIncomingCall(incomingCall);
    }, [incomingCall, prepareIncomingCall]);

    // Lắng nghe sự kiện Socket (Tin nhắn & Video Call)
    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (data) => {
            const isCurrentChat = 
                String(data?.matchId) === String(matchId) ||
                String(data?.senderId) === String(friendId) ||
                String(data?.receiverId) === String(friendId);

            if (isCurrentChat) {
                setMessages((prev) => {
                    const isDuplicate = prev.some(msg => 
                        (msg._id && msg._id === data._id) || 
                        (msg.message === data.message && Math.abs(new Date(msg.createdAt || Date.now()) - new Date(data.createdAt || Date.now())) < 1000)
                    );
                    if (isDuplicate) return prev;
                    return [...prev, data];
                });
            }
        };

        const handleIncomingCall = (call) => prepareIncomingCall(call);

        const handleCallAccepted = async ({ from, callId } = {}) => {
            if (
                !sameId(from, friendId)
                || activeCallIdRef.current !== callId
                || callStatusRef.current !== 'calling'
            ) return;

            const started = await startWebRTC(true, callId);
            if (!started) {
                endCallCleanup(true);
                return;
            }
            updateCallStatus('connected');
        };

        const handleCallRejected = ({ from, callId } = {}) => {
            if (!sameId(from, friendId) || activeCallIdRef.current !== callId) return;
            toast('Cuộc gọi đã bị từ chối hoặc kết thúc.', 'info');
            endCallCleanup(false);
        };

        const handleCallEnded = ({ from, callId } = {}) => {
            if (!sameId(from, friendId) || activeCallIdRef.current !== callId) return;
            toast('Đầu bên kia đã kết thúc cuộc gọi.', 'info');
            endCallCleanup(false);
        };

        const handleSocketDisconnect = () => {
            if (callStatusRef.current !== 'idle') {
                endCallCleanup(false);
            }
        };

        const handleMessageRecalled = (data) => {
            if (String(data?.matchId) !== String(matchId)) return;
            setMessages((previous) => previous.map((message) => String(message.id) === String(data.id) ? { ...message, recalled: true, message: '' } : message));
        };

        socket.on("receiveFriendMessage", handleReceiveMessage);
        socket.on("incomingCall", handleIncomingCall);
        socket.on("callAccepted", handleCallAccepted);
        socket.on("callRejected", handleCallRejected);
        socket.on("webrtcSignal", handleWebrtcSignal);
        socket.on("callEnded", handleCallEnded);
        socket.on('disconnect', handleSocketDisconnect);
        socket.on('friendMessageRecalled', handleMessageRecalled);
        
        return () => {
            socket.off("receiveFriendMessage", handleReceiveMessage);
            socket.off("incomingCall", handleIncomingCall);
            socket.off("callAccepted", handleCallAccepted);
            socket.off("callRejected", handleCallRejected);
            socket.off("webrtcSignal", handleWebrtcSignal);
            socket.off("callEnded", handleCallEnded);
            socket.off('disconnect', handleSocketDisconnect);
            socket.off('friendMessageRecalled', handleMessageRecalled);
        };
    }, [socket, matchId, friendId, prepareIncomingCall, startWebRTC, endCallCleanup, handleWebrtcSignal, toast, updateCallStatus]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showEmojiPicker]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callStatus]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

    useEffect(() => () => {
        const callId = activeCallIdRef.current;
        const peerId = activeCallFriendIdRef.current || friendId;
        if (callId && peerId && socket?.connected) {
            socket.emit('endCall', { to: peerId, callId });
        }
        activeCallIdRef.current = null;
        activeCallFriendIdRef.current = null;
        closePeerConnection();
        stopLocalStream();
    }, [closePeerConnection, friendId, socket, stopLocalStream]);

    const toggleAudio = () => {
        const stream = localStreamRef.current;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        const stream = localStreamRef.current;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Gửi tin nhắn văn bản
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !matchId || uploadingAttachment) return;

        const messageData = {
            matchId: matchId,
            senderId: currentUserId,
            receiverId: friendId,
            message: encodeChatMessage({ text: newMessage.trim(), attachment }),
        };

        try {
            const token = localStorage.getItem('token');
            // Gọi API lưu tin nhắn (đảm bảo baseURL hoặc proxy trỏ về đúng backend port)
            const response = await axios.post('/api/messages/send', messageData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const savedMessage = response.data.message;

            // Phát sự kiện qua Socket an toàn
            if (socket && typeof socket.emit === 'function') {
                socket.emit("sendFriendMessage", savedMessage);
            } else {
                console.warn("Socket chưa sẵn sàng để truyền sự kiện 'sendFriendMessage'");
            }

            setMessages((prev) => [...prev, savedMessage]);
            setNewMessage('');
            setAttachment(null);
            setShowEmojiPicker(false);
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
        }
    };

    const onEmojiClick = (emojiData) => {
        setNewMessage((prev) => prev + emojiData.emoji);
    };

    // Gửi file / ảnh
    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const validationError = validateChatUpload(file, type);
        if (validationError) {
            toast(validationError, 'error');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append(type === 'image' ? 'image' : 'file', file);
        setUploadingAttachment(true);

        try {
            const token = localStorage.getItem('token');
            const endpoint = type === 'image' ? '/api/upload/image' : '/api/upload/file';
            const res = await axios.post(endpoint, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.url || res.data.filePath;
            if (!url) throw new Error('Máy chủ không trả về đường dẫn tệp.');
            setAttachment({
                url,
                type,
                name: res.data.fileName || file.name,
                size: res.data.size || file.size,
                mimeType: res.data.mimeType || file.type,
            });
        } catch (err) {
            console.error("Lỗi upload file:", err);
            toast(err.response?.data?.message || err.message || 'Không thể tải tệp lên. Vui lòng thử lại.', 'error');
        } finally {
            setUploadingAttachment(false);
            e.target.value = '';
        }
    };

    const recallMessage = async (messageId) => {
        if (!await confirm({ title: 'Thu hồi tin nhắn?', message: 'Tin nhắn sẽ được thu hồi với mọi người trong cuộc trò chuyện.', confirmLabel: 'Thu hồi', danger: true })) return;
        setRecallingMessageId(messageId);
        try {
            const response = await axios.patch(`/api/messages/${messageId}/recall`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setMessages((previous) => previous.map((message) => String(message.id) === String(messageId) ? response.data.message : message));
        } catch (error) { toast(error.response?.data?.message || 'Không thể thu hồi tin nhắn.', 'error'); }
        finally { setRecallingMessageId(null); setActiveMessageId(null); }
    };

    const deleteMessage = async (messageId) => {
        if (!await confirm({ title: 'Xóa tin nhắn?', message: 'Tin nhắn chỉ bị xóa khỏi cuộc trò chuyện của bạn.', confirmLabel: 'Xóa', danger: true })) return;
        try {
            await axios.delete(`/api/messages/${messageId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setMessages((previous) => previous.filter((message) => String(message.id) !== String(messageId)));
        } catch (error) { toast(error.response?.data?.message || 'Không thể xóa tin nhắn.', 'error'); }
        finally { setActiveMessageId(null); }
    };

    const handleStartCall = async () => {
        if (!isOnline || callStatusRef.current !== 'idle') {
            if (!isOnline) {
                toast('Bạn bè đang offline!', 'info');
            }
            return;
        }

        if (!socket?.connected) {
            toast('Chưa kết nối được máy chủ cuộc gọi. Vui lòng thử lại.', 'error');
            return;
        }

        const callId = createCallId();
        activeCallIdRef.current = callId;
        activeCallFriendIdRef.current = friendId;
        updateCallStatus('calling');

        try {
            const stream = await ensureLocalStream();
            if (!stream || activeCallIdRef.current !== callId) return;

            socket.emit(
                "callUser",
                { to: friendId, callId },
                (result) => {
                    const settledCallId = result?.callId || callId;
                    if (!result?.ok) {
                        if (activeCallIdRef.current === callId) {
                            toast(result?.message || 'Không thể kết nối cuộc gọi.', 'error');
                            endCallCleanup(false);
                        }
                        return;
                    }

                    if (activeCallIdRef.current !== callId) {
                        socket.emit('endCall', { to: friendId, callId: settledCallId });
                    }
                }
            );
        } catch (error) {
            console.error("Lỗi bật camera:", error);
            toast('Vui lòng cấp quyền sử dụng Camera và Micro.', 'error');
            if (activeCallIdRef.current === callId) {
                endCallCleanup(false);
            }
        }
    };

    const handleAcceptCall = async () => {
        const caller = incomingCaller;
        const callId = caller?.callId;
        if (!caller?.from || !callId || !socket?.connected || activeCallIdRef.current !== callId) {
            return;
        }

        const started = await startWebRTC(false, callId);
        if (!started) {
            socket.emit("rejectCall", { to: caller.from, callId });
            endCallCleanup(false);
            return;
        }

        updateCallStatus('connected');
        socket.emit("acceptCall", { to: caller.from, callId });
    };

    const handleRejectCall = () => {
        const callId = incomingCaller?.callId || activeCallIdRef.current;
        if (socket?.connected && incomingCaller?.from && callId) {
            socket.emit("rejectCall", { to: incomingCaller.from, callId });
        }
        endCallCleanup(false);
    };

    const avatarSrc = getAvatarUrl(friend?.avatar, friend?.username);

    return (
        <div className={`chat-box-container ${variant} ${isExpanded ? 'expanded' : ''}`}>
            
            {callStatus !== 'idle' && (
                <div className="friend-call-overlay">
                    <div className="friend-call-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                                className="chat-status-dot" 
                                style={{ background: callStatus === 'connected' ? '#31a24c' : '#f1c40f', position: 'static' }}
                            ></span>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                {callStatus === 'calling' && `Đang gọi ${friendName}...`}
                                {callStatus === 'incoming' && `Cuộc gọi từ ${incomingCaller?.callerName || 'Bạn bè'}...`}
                                {callStatus === 'connected' && `Đang video với ${friendName}`}
                            </span>
                        </div>
                        {variant === 'floating' && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)} 
                                className="chat-icon-btn"
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                            >
                                {isExpanded ? <FaCompress /> : <FaExpand />}
                            </button>
                        )}
                    </div>

                    <div className="friend-call-body">
                        <video ref={remoteVideoRef} autoPlay playsInline className="friend-call-remote-video" />
                        <video ref={localVideoRef} autoPlay playsInline muted className="friend-call-local-video" />
                    </div>

                    <div className="friend-call-footer">
                        {callStatus === 'connected' && (
                            <>
                                <button onClick={toggleAudio} className="chat-icon-btn chat-call-control" title={isMuted ? 'Bật mic' : 'Tắt mic'} aria-label={isMuted ? 'Bật mic' : 'Tắt mic'} style={{ background: isMuted ? '#fa383e' : '#3a3b3c' }}>
                                    {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                                </button>
                                <button onClick={toggleVideo} className="chat-icon-btn chat-call-control" title={isVideoOff ? 'Bật camera' : 'Tắt camera'} aria-label={isVideoOff ? 'Bật camera' : 'Tắt camera'} style={{ background: isVideoOff ? '#fa383e' : '#3a3b3c' }}>
                                    {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                                </button>
                            </>
                        )}
                        {callStatus === 'incoming' && (
                            <button onClick={handleAcceptCall} className="chat-call-action chat-call-answer">
                                <FaPhone /> Nghe
                            </button>
                        )}
                        <button onClick={callStatus === 'incoming' ? handleRejectCall : endCallCleanup} className="chat-call-action chat-call-hangup">
                            <FaPhoneSlash /> {callStatus === 'incoming' ? 'Từ chối' : 'Kết thúc'}
                        </button>
                    </div>
                </div>
            )}

            <div className="chat-box-header">
                <div className="chat-friend-info">
                    <div className="chat-avatar-wrapper">
                        <img src={avatarSrc} alt={`Avatar of ${friendName}`} className="chat-avatar" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(friend?.username); }} />
                        <span className="chat-status-dot" style={{ background: isOnline ? '#31a24c' : '#808080' }}></span>
                    </div>
                    <div>
                        <h4 className="chat-friend-name">{friendName}</h4>
                        <span className="chat-friend-status-text" style={{ color: isOnline ? '#31a24c' : '#b0b3b8' }}>
                            {isOnline ? 'Đang hoạt động' : 'Offline'}
                        </span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                        onClick={handleStartCall} 
                        title={isOnline ? "Gọi video" : "Bạn bè đang offline"} 
                        disabled={!isOnline || callStatus !== 'idle'}
                        className="chat-icon-btn"
                        style={{ color: isOnline && callStatus === 'idle' ? '#2e89ff' : '#b0b3b8', cursor: isOnline && callStatus === 'idle' ? 'pointer' : 'not-allowed' }}
                    >
                        <FaVideo />
                    </button>
                    {onClose && (
                        <button onClick={() => { if (callStatus !== 'idle') endCallCleanup(); onClose(); }} className="chat-icon-btn" style={{ color: '#b0b3b8' }}>
                            <FaTimes />
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-messages-list">
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId) === String(currentUserId);
                    const data = parseChatMessage(msg.message);
                    const senderLabel = isMe ? 'Bạn' : friendName;
                    return (
                        <div key={index} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
                            <div className="chat-message-wrap">
                            <div className={`chat-message-stack ${isMe ? 'is-me' : 'is-them'}`}>
                                <span className="chat-message-sender">{senderLabel}</span>
                            <div 
                                className={`chat-message-bubble ${isMe ? 'is-me' : 'is-them'}`}
                                style={{ 
                                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', 
                                    background: isMe ? '#0084ff' : '#3a3b3c',
                                    color: isMe ? '#ffffff' : '#e4e6eb'
                                }}
                            >
                                {msg.recalled ? <em>Tin nhắn đã được thu hồi.</em> : <>
                                    {data.text && <div className="chat-message-text-content">{data.text}</div>}
                                    {data.attachment?.type === 'image' && <img className="chat-message-image" src={getAvatarUrl(data.attachment.url)} alt={data.attachment.name || 'Ảnh đính kèm'} />}
                                    {data.attachment?.type === 'file' && <a className="chat-message-file" href={getAvatarUrl(data.attachment.url)} target="_blank" rel="noreferrer">{data.attachment.name || 'Tệp đính kèm'}</a>}
                                </>}
                            </div>
                            </div>
                            {msg.id && <div className="chat-message-menu"><button type="button" aria-label="Tùy chọn tin nhắn" title="Tùy chọn tin nhắn" aria-expanded={activeMessageId === msg.id} onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}><FaEllipsisH /></button>{activeMessageId === msg.id && <div className="chat-message-menu-popover">{isMe && !msg.recalled && <button type="button" disabled={recallingMessageId === msg.id} onClick={() => recallMessage(msg.id)}><FaUndo /> {recallingMessageId === msg.id ? 'Đang thu hồi...' : 'Thu hồi với mọi người'}</button>}<button type="button" onClick={() => deleteMessage(msg.id)}><FaTrash /> Xóa với bạn</button></div>}</div>}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {showEmojiPicker && (
                <div className="chat-emoji-picker-container">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={280} height={320} />
                </div>
            )}

            <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept={CHAT_IMAGE_ACCEPT} onChange={(e) => handleFileUpload(e, 'image')} />
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={CHAT_FILE_ACCEPT} onChange={(e) => handleFileUpload(e, 'file')} />

            {attachment && <div className="chat-attachment-draft">{attachment.type === 'image' ? <img src={getAvatarUrl(attachment.url)} alt={attachment.name || 'Ảnh chờ gửi'} /> : <span>{attachment.name}</span>}<button type="button" onClick={() => setAttachment(null)} aria-label="Bỏ tệp đính kèm"><FaTimes /></button></div>}

            <form onSubmit={handleSendMessage} className="chat-input-form">
                <button type="button" onClick={() => imageInputRef.current.click()} className="chat-icon-btn" style={{ color: '#2e89ff' }} title="Gửi ảnh">
                    <FaImage />
                </button>
                <button type="button" onClick={() => fileInputRef.current.click()} className="chat-icon-btn" style={{ color: '#2e89ff' }} title="Gửi file">
                    <FaPaperclip />
                </button>
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="chat-icon-btn" style={{ color: '#2e89ff' }} title="Emoji">
                    <FaSmile />
                </button>

                <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Aa" 
                    className="chat-input-field"
                />

                <button type="submit" className="chat-icon-btn" style={{ color: '#0084ff' }} title="Gửi tin nhắn">
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
}
