import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from "socket.io-client";
import config from "../../config/config";
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
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
};

const peerConnectionConfig = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

const ChatPage = () => {
    // State management for call flow, media, and chat
    const [callState, setCallState] = useState('welcome'); // 'welcome', 'searching', 'in-call', 'disconnected'
    const [partnerInfo, setPartnerInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [partnerMediaState, setPartnerMediaState] = useState({ isCameraOff: false, isMuted: false });
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    // Refs for DOM elements and WebRTC/Socket objects
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const chatBoxRef = useRef();
    const [user] = useState(getUserFromStorage());

    const handleSignalingData = useCallback(async (data) => {
        if (!peerRef.current) return;
        const { from, signal } = data;

        try {
            if (signal.type === 'offer') {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await peerRef.current.createAnswer();
                await peerRef.current.setLocalDescription(answer);
                socketRef.current.emit('signal', { to: from, signal: { type: 'answer', sdp: answer.sdp } });
            } else if (signal.type === 'answer') {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.type === 'ice-candidate') {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (error) {
            console.error("Error handling signaling data:", error);
        }
    }, []);

    const createPeerConnection = useCallback(async (partnerId, initiator) => {
        // Close any existing peer connection before creating a new one
        if (peerRef.current) {
            peerRef.current.close();
        }

        peerRef.current = new RTCPeerConnection(peerConnectionConfig);

        localStreamRef.current.getTracks().forEach(track => {
            peerRef.current.addTrack(track, localStreamRef.current);
        });

        peerRef.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        peerRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('signal', {
                    to: partnerId,
                    signal: { type: 'ice-candidate', candidate: event.candidate },
                });
            }
        };

        if (initiator) {
            const offer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(offer);
            socketRef.current.emit('signal', {
                to: partnerId,
                signal: { type: 'offer', sdp: offer.sdp },
            });
        }
    }, []);

    const closePeerConnection = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
    }, []);

    const resetConnection = useCallback((shouldEmitEvent = false) => {
        if (shouldEmitEvent && socketRef.current) socketRef.current.emit('skip');
        closePeerConnection();
        setMessages([]);
        setPartnerInfo(null);
        setPartnerMediaState({ isCameraOff: false, isMuted: false });
    }, [closePeerConnection]);

    const startSearch = useCallback((stream) => {
        setCallState('searching');
        // Nhận stream từ WelcomeScreen
        localStreamRef.current = stream;
        
        // Hiển thị video của chính mình ngay lập tức
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
        
        // Tham gia hàng đợi tìm kiếm
        if (socketRef.current) socketRef.current.emit('joinQueue', user);
    }, [user]);

    const cleanup = useCallback((fullLogout = false) => {
        if (socketRef.current) {
            if (fullLogout) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }
        resetConnection();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }, [resetConnection]);

    useEffect(() => {
        if (!socketRef.current) {
           socketRef.current = io(config.SOCKET_URL);
        }

        const socket = socketRef.current;

        socket.on("connect", () => {
            setIsSocketConnected(true);
            console.log("Socket connected:", socket.id);
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
            setIsSocketConnected(false);
        });

        socket.on("matchFound", ({ partner, initiator }) => {
            setPartnerInfo(partner);
            setCallState("in-call");
            createPeerConnection(partner.socketId, initiator);
        });

        socket.on("signal", (data) => handleSignalingData(data));
        socket.on("chatMessage", (data) => {
            if (data && data.message) {
                setMessages(prev => [...prev, { text: data.message, sender: 'partner', time: data.time || new Date() }]);
            }
        });
        socket.on("typing", () => setIsPartnerTyping(true));
        socket.on("stopTyping", () => setIsPartnerTyping(false));
        socket.on("partnerMediaState", (state) => setPartnerMediaState(state));
        socket.on("partnerDisconnected", () => {
            resetConnection();
            setCallState("disconnected");
        });

        return () => {
            cleanup(true);
        };
    }, [cleanup]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isPartnerTyping]);
    useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
    }
}, [callState]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() && callState === 'in-call') {
            socketRef.current.emit("chatMessage", { message: inputValue });
            setMessages(prev => [...prev, { text: inputValue, sender: 'me', time: new Date() }]);
            setInputValue('');
            socketRef.current.emit('stopTyping');
        }
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        if (socketRef.current && callState === 'in-call') {
            if (e.target.value) {
                socketRef.current.emit('typing');
            } else {
                socketRef.current.emit('stopTyping');
            }
        }
    };

    const handleSkip = () => {
        setCallState('searching');
        resetConnection(true);
        socketRef.current.emit('joinQueue', user);
    };

    const handleEndCall = () => {
        if (socketRef.current) socketRef.current.emit('endCall');
        cleanup(false);
        setCallState('welcome');
    };

    const handleLogout = () => {
        cleanup(true);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                const newCameraState = !videoTrack.enabled;
                setIsCameraOff(newCameraState);
                socketRef.current.emit('mediaState', { isCameraOff: newCameraState, isMuted });
            }
        }
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                const newMuteState = !audioTrack.enabled;
                setIsMuted(newMuteState);
                socketRef.current.emit('mediaState', { isCameraOff, isMuted: newMuteState });
            }
        }
    };

    if (callState === 'welcome') {
        return <WelcomeScreen onStart={startSearch} />;
    }

     return (
         <div className="chat-container fade-in">
             <ChatHeader callState={callState} onLogout={handleLogout} user={user} />
             <VideoPanel
                 localVideoRef={localVideoRef}
                 remoteVideoRef={remoteVideoRef}
                 callState={callState}
                 partnerInfo={partnerInfo}
                 partnerMediaState={partnerMediaState}
                 isCameraOff={isCameraOff}
                 onCancelSearch={handleEndCall}
             />
             <ChatControls
                 onMicToggle={toggleMic}
                 onCameraToggle={toggleCamera}
                 onSkip={handleSkip}
                 onEndCall={handleEndCall}
                 isMuted={isMuted}
                 isCameraOff={isCameraOff}
                 callState={callState}
             />
             <ChatSidebar
                 messages={messages}
                 inputValue={inputValue}
                 setInputValue={(e) => handleInputChange(e)}
                 handleSendMessage={handleSendMessage}
                 partnerInfo={partnerInfo}
                 user={user}
                 chatBoxRef={chatBoxRef}
                 isPartnerTyping={isPartnerTyping}
                 callState={callState}
             />
             {callState === 'disconnected' && <DisconnectModal onFindNew={handleSkip} onGoHome={handleEndCall} />}
         </div>
     );
};

export default ChatPage;
