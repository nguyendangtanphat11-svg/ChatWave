import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import "./Chat.css";

// Import các component
import WelcomeScreen from "../../components/chat/WelcomeScreen";
import DisconnectModal from "../../components/chat/DisconnectModal";
import ChatHeader from '../../components/chat/ChatHeader';
import VideoPanel from '../../components/chat/VideoPanel';
import ChatControls from '../../components/chat/ChatControls';
import ChatSidebar from '../../components/chat/ChatSidebar';

// --- Helper Functions ---
const getUserFromStorage = () => {
    try { 
        return JSON.parse(localStorage.getItem('user')); 
    } catch (e) { 
        return null; 
    }
};

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

const createMessageTime = () => new Date().toISOString();
const normalizeGenderPreference = (value) => ({ male: 'Nam', female: 'Nữ' }[value] || (['Nam', 'Nữ', 'Khác'].includes(value) ? value : 'all'));
const normalizeCountryPreference = (value) => (['VN', 'US', 'JP', 'KR', 'GB', 'AU', 'CA'].includes(value) ? value : 'all');

const ChatPage = ({ socket }) => {
    // State quản lý cuộc gọi, media và chat
    const [callState, setCallState] = useState('welcome'); // 'welcome', 'searching', 'in-call', 'disconnected'
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [cameraFilter, setCameraFilter] = useState('natural');
    const [partnerMediaState, setPartnerMediaState] = useState({ isCameraOff: false, isMuted: false, cameraFilter: 'natural' });
    const [, setIsSocketConnected] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [matchPreferences, setMatchPreferences] = useState({ gender: 'all', country: 'all' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Refs cho DOM elements và WebRTC/Socket objects
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const peerGenerationRef = useRef(0);
    const activePartnerSocketIdRef = useRef(null);
    const pendingIceCandidatesRef = useRef([]);
    const signalingQueueRef = useRef(Promise.resolve());
    const chatBoxRef = useRef(null);
    const [user] = useState(getUserFromStorage());
    const [searchParams] = useSearchParams();
    const initialMatchPreferences = {
        gender: normalizeGenderPreference(searchParams.get('gender')),
        country: normalizeCountryPreference(searchParams.get('country')),
    };

    // Giữ ref cho localStream để tránh closure stale trong các sự kiện socket/peer
    const localStreamRef = useRef(localStream);
    useEffect(() => {
        localStreamRef.current = localStream;
    }, [localStream]);

    const stopLocalStream = useCallback(() => {
        const stream = localStreamRef.current;
        localStreamRef.current = null;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }
        setLocalStream(null);
    }, []);

    const closePeerConnection = useCallback(() => {
        peerGenerationRef.current += 1;
        pendingIceCandidatesRef.current = [];
        signalingQueueRef.current = Promise.resolve();
        activePartnerSocketIdRef.current = null;

        const peer = peerRef.current;
        peerRef.current = null;
        if (peer) {
            peer.ontrack = null;
            peer.onicecandidate = null;
            peer.onconnectionstatechange = null;
            peer.close();
        }
        setRemoteStream(null);
    }, []);

    const resetConnection = useCallback((shouldEmitEvent = false) => {
        if (shouldEmitEvent && socketRef.current) {
            socketRef.current.emit('skip');
        }
        closePeerConnection();
        setMessages([]);
        setIsPartnerTyping(false);
        setPartnerInfo(null);
        setPartnerMediaState({ isCameraOff: false, isMuted: false, cameraFilter: 'natural' });
    }, [closePeerConnection]);

    const flushPendingIceCandidates = useCallback(async (peer, generation) => {
        while (
            peerRef.current === peer
            && peerGenerationRef.current === generation
            && pendingIceCandidatesRef.current.length > 0
        ) {
            const candidate = pendingIceCandidatesRef.current.shift();
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.warn('Không thể thêm ICE candidate đã chờ:', error);
            }
        }
    }, []);

    const processSignalingData = useCallback(async (data) => {
        const { from, signal } = data || {};
        const peer = peerRef.current;
        const partnerId = activePartnerSocketIdRef.current;
        const generation = peerGenerationRef.current;
        const isCurrentPeer = () => (
            peerRef.current === peer
            && peerGenerationRef.current === generation
            && String(activePartnerSocketIdRef.current) === String(partnerId)
        );

        if (!peer || !partnerId || String(from) !== String(partnerId) || !signal || typeof signal !== 'object') {
            return;
        }

        try {
            if (signal.type === 'ice-candidate') {
                if (!signal.candidate) return;
                if (!peer.remoteDescription && !peer.currentRemoteDescription) {
                    pendingIceCandidatesRef.current.push(signal.candidate);
                    return;
                }
                await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                return;
            }

            if ((signal.type !== 'offer' && signal.type !== 'answer') || typeof signal.sdp !== 'string') {
                return;
            }

            await peer.setRemoteDescription(new RTCSessionDescription({ type: signal.type, sdp: signal.sdp }));
            if (!isCurrentPeer()) return;

            await flushPendingIceCandidates(peer, generation);
            if (signal.type !== 'offer' || !isCurrentPeer()) return;

            const answer = await peer.createAnswer();
            if (!isCurrentPeer()) return;
            await peer.setLocalDescription(answer);
            if (isCurrentPeer() && socketRef.current?.connected) {
                socketRef.current.emit('signal', { to: partnerId, signal: { type: 'answer', sdp: answer.sdp } });
            }
        } catch (error) {
            if (isCurrentPeer()) {
                console.error("Lỗi xử lý dữ liệu signaling:", error);
            }
        }
    }, [flushPendingIceCandidates]);

    const handleSignalingData = useCallback((data) => {
        signalingQueueRef.current = signalingQueueRef.current
            .catch(() => undefined)
            .then(() => processSignalingData(data));
        return signalingQueueRef.current;
    }, [processSignalingData]);

    const createPeerConnection = useCallback(async (partnerId, initiator) => {
        if (typeof partnerId !== 'string' || !partnerId) return;

        closePeerConnection();
        const generation = peerGenerationRef.current;
        activePartnerSocketIdRef.current = partnerId;

        const peer = new RTCPeerConnection(peerConnectionConfig);
        peerRef.current = peer;
        const isCurrentPeer = () => (
            peerRef.current === peer
            && peerGenerationRef.current === generation
            && String(activePartnerSocketIdRef.current) === String(partnerId)
        );

        const currentStream = localStreamRef.current;
        if (currentStream) {
            currentStream.getTracks()
                .filter((track) => track.readyState === 'live')
                .forEach((track) => peer.addTrack(track, currentStream));
        }

        peer.ontrack = (event) => {
            if (!isCurrentPeer()) return;
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
                return;
            }

            const inboundStream = remoteVideoRef.current?.srcObject || new MediaStream();
            inboundStream.addTrack(event.track);
            setRemoteStream(inboundStream);
        };

        peer.onicecandidate = (event) => {
            if (event.candidate && isCurrentPeer() && socketRef.current?.connected) {
                socketRef.current.emit('signal', {
                    to: partnerId,
                    signal: { type: 'ice-candidate', candidate: event.candidate },
                });
            }
        };

        peer.onconnectionstatechange = () => {
            if (!isCurrentPeer() || peer.connectionState !== 'failed') return;
            socketRef.current?.emit('endCall');
            closePeerConnection();
            setCallState('disconnected');
        };

        if (!initiator) return;

        try {
            const offer = await peer.createOffer();
            if (!isCurrentPeer()) return;
            await peer.setLocalDescription(offer);
            if (isCurrentPeer() && socketRef.current?.connected) {
                socketRef.current.emit('signal', {
                    to: partnerId,
                    signal: { type: 'offer', sdp: offer.sdp },
                });
            }
        } catch (error) {
            if (isCurrentPeer()) {
                console.error("Lỗi tạo offer:", error);
            }
        }
    }, [closePeerConnection]);

    const cleanup = useCallback((fullLogout = false) => {
        if (socketRef.current && fullLogout) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        resetConnection();
        stopLocalStream();
    }, [resetConnection, stopLocalStream]);

    const startSearch = useCallback((stream, preferences = { gender: 'all', country: 'all' }) => {
        if (!stream) return;
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOff(stream.getVideoTracks()[0]?.enabled === false);
        setIsMuted(stream.getAudioTracks()[0]?.enabled === false);
        setMatchPreferences(preferences);
        setCallState('searching');
        if (socketRef.current?.connected) {
            socketRef.current.emit('joinQueue', { preferences });
        } else {
            setCallState('disconnected');
        }
    }, []);

    // Thiết lập Socket kết nối một lần duy nhất khi component mount
    useEffect(() => {
        if (!socket) return undefined;
        socketRef.current = socket;

        const handleConnect = () => {
            setIsSocketConnected(true);
        };

        const handleConnectError = (err) => {
            console.error("Lỗi kết nối Socket:", err.message);
            setIsSocketConnected(false);
        };

        const handleMatchFound = ({ partner, initiator }) => {
            const targetId = partner?.socketId || partner?.id || partner?._id || partner?.userId || partner?.user_id;
            if (typeof targetId !== 'string' || !targetId) {
                setCallState('disconnected');
                return;
            }
            setPartnerInfo(partner);
            setCallState("in-call");
            void createPeerConnection(targetId, Boolean(initiator));
        };

        const handleSignal = (data) => handleSignalingData(data);
        const handleChatMessage = (data) => {
            setMessages(prev => [...prev, {
                ...data,
                sender: 'partner',
                time: data.time || createMessageTime(),
            }]);
        };
        const handleTyping = () => setIsPartnerTyping(true);
        const handleStopTyping = () => setIsPartnerTyping(false);
        const handlePartnerMediaState = (state) => setPartnerMediaState((previous) => ({ ...previous, ...state }));
        const handlePartnerDisconnected = () => {
            resetConnection();
            setCallState("disconnected");
        };
        const handleDisconnect = () => {
            setIsSocketConnected(false);
            resetConnection();
            setCallState('disconnected');
        };

        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);
        socket.on("disconnect", handleDisconnect);
        socket.on("matchFound", handleMatchFound);
        socket.on("signal", handleSignal);
        socket.on("chatMessage", handleChatMessage);
        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("partnerMediaState", handlePartnerMediaState);
        socket.on("partnerDisconnected", handlePartnerDisconnected);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);
            socket.off("disconnect", handleDisconnect);
            socket.off("matchFound", handleMatchFound);
            socket.off("signal", handleSignal);
            socket.off("chatMessage", handleChatMessage);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("partnerMediaState", handlePartnerMediaState);
            socket.off("partnerDisconnected", handlePartnerDisconnected);
        };
    }, [socket, createPeerConnection, handleSignalingData, resetConnection]);

    useEffect(() => () => {
        if (activePartnerSocketIdRef.current && socketRef.current?.connected) {
            socketRef.current.emit('endCall');
        }
        closePeerConnection();
        stopLocalStream();
    }, [closePeerConnection, stopLocalStream]);

    // Tự động cuộn khung chat xuống dưới cùng
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isPartnerTyping]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() && callState === 'in-call') {
            const messageData = {
                type: 'text',
                message: inputValue.trim(),
                time: createMessageTime(),
            };
            socketRef.current.emit("chatMessage", messageData);
            setMessages(prev => [...prev, { ...messageData, sender: 'me' }]);
            setInputValue('');
            socketRef.current.emit('stopTyping');
        }
    };

    const handleUploadComplete = (fileData) => {
        if (callState === 'in-call') {
            const messageData = {
                type: fileData.type,
                url: fileData.url,
                fileName: fileData.fileName,
                size: fileData.size,
                mimeType: fileData.mimeType,
                time: createMessageTime(),
            };
            socketRef.current.emit("chatMessage", messageData);
            setMessages(prev => [...prev, { ...messageData, sender: 'me' }]);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (socketRef.current && callState === 'in-call') {
            if (val) {
                socketRef.current.emit('typing');
            } else {
                socketRef.current.emit('stopTyping');
            }
        }
    };

    const handleSkip = () => {
        setCallState('searching');
        resetConnection(true);
        if (socketRef.current?.connected) {
            socketRef.current.emit('joinQueue', { preferences: matchPreferences });
        } else {
            setCallState('disconnected');
        }
    };

    const handleEndCall = () => {
        if (socketRef.current) {
            socketRef.current.emit('endCall');
        }
        cleanup(false);
        setCallState('welcome');
    };

    const handleLogout = () => {
        window.dispatchEvent(new Event('auth:logout'));
        cleanup(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                const newCameraState = !videoTrack.enabled;
                setIsCameraOff(newCameraState);
                if (socketRef.current) {
                    socketRef.current.emit('mediaState', { isCameraOff: newCameraState, isMuted, cameraFilter });
                }
            }
        }
    };

    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const newMuteState = !audioTrack.enabled;
                setIsMuted(newMuteState);
                if (socketRef.current) {
                    socketRef.current.emit('mediaState', { isCameraOff, isMuted: newMuteState, cameraFilter });
                }
            }
        }
    };

    const handleFilterChange = (filter) => {
        setCameraFilter(filter);
        socketRef.current?.emit('mediaState', { isCameraOff, isMuted, cameraFilter: filter });
    };

    if (callState === 'welcome') {
        return <WelcomeScreen onStart={startSearch} initialPreferences={initialMatchPreferences} />;
    }

    return (
        <div className="chat-container fade-in">
            <ChatHeader
                callState={callState}
                onLogout={handleLogout}
                onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
                isSidebarOpen={isSidebarOpen}
                user={user}
            />
            <VideoPanel
    localVideoRef={localVideoRef}
    remoteVideoRef={remoteVideoRef}
    callState={callState}
    partnerInfo={partnerInfo}
    partnerMediaState={partnerMediaState}
    isCameraOff={isCameraOff}
    isRemoteCameraOff={partnerMediaState?.isCameraOff}
    remoteFilter={partnerMediaState?.cameraFilter}
    onFilterChange={handleFilterChange}
    myAvatar={user?.avatar}
    remoteAvatar={partnerInfo?.avatar}
    onCancelSearch={handleEndCall}
    localStream={localStream}
    remoteStream={remoteStream}
/>
            <ChatControls
                onMicToggle={toggleMic}
                onCameraToggle={toggleCamera}
                onSkip={handleSkip}
                onEndCall={handleEndCall}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                callState={callState}
                targetUserId={partnerInfo ? (partnerInfo.id || partnerInfo._id || partnerInfo.userId || partnerInfo.user_id) : null} 
                socket={socket}
                partnerInfo={partnerInfo}
            />
            <ChatSidebar
    messages={messages}
    inputValue={inputValue}
    handleInputChange={handleInputChange}
    handleSendMessage={handleSendMessage} // <--- Thêm dòng này vào
    partnerInfo={partnerInfo}
    user={user}
    chatBoxRef={chatBoxRef}
    isPartnerTyping={isPartnerTyping}
    callState={callState}
    isOpen={isSidebarOpen}
    onClose={() => setIsSidebarOpen(false)}
    onUploadComplete={handleUploadComplete}
/>
            {callState === 'disconnected' && <DisconnectModal onFindNew={handleSkip} onGoHome={handleEndCall} />}
        </div>
    );
};

export default ChatPage;
