import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- SVG Icons ---
const LogoIcon = () => <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 24C12 21.7909 13.7909 20 16 20C18.2091 20 20 21.7909 20 24C20 26.2091 18.2091 28 16 28C13.7909 28 12 26.2091 12 24Z" stroke="currentColor" strokeWidth="3"/><path d="M20 24C20 19.5817 23.5817 16 28 16C32.4183 16 36 19.5817 36 24C36 28.4183 32.4183 32 28 32C23.5817 32 20 28.4183 20 24Z" stroke="currentColor" strokeWidth="3"/></svg>;
const CameraIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m23 7-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const MicIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const CameraOffIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>;
const MicOffIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const WelcomeScreen = ({ onStart }) => {
    const [stream, setStream] = useState(null);
    const [permissionError, setPermissionError] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const getMedia = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setPermissionError(false);
        } catch (err) {
            console.error("Lỗi xin quyền media:", err);
            setPermissionError(true);
        }
    };

    useEffect(() => {
        getMedia();

        // Cleanup function to stop media tracks when component unmounts
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleCamera = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn(videoTrack.enabled);
        }
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicOn(audioTrack.enabled);
        }
    };

    const handleStart = () => {
        if (stream) {
            // Pass the existing stream to the parent component
            onStart(stream);
        }
    };

    return (
        <div className="welcome-background">
            <div className="welcome-glow-1"></div>
            <div className="welcome-glow-2"></div>
            <div className="welcome-card fade-in-up">
                <div className="welcome-header">
                    <div className="welcome-logo"><LogoIcon /><span>ChatWave</span></div>
                    <h1 className="welcome-title">Kết nối với mọi người trên toàn thế giới</h1>
                    <p className="welcome-description">Sẵn sàng cho những cuộc trò chuyện video ngẫu nhiên, an toàn và đầy thú vị.</p>
                </div>

                <div className="welcome-preview-wrapper">
                    <div className="welcome-preview-container">
                        {permissionError ? (
                            <div className="welcome-permission-error">
                                <span role="img" aria-label="warning">⚠️</span>
                                <h3>Yêu cầu quyền truy cập</h3>
                                <p>ChatWave cần quyền sử dụng Camera và Micro để bạn có thể bắt đầu.</p>
                                <button className="welcome-button primary small" onClick={getMedia}>Cấp quyền lại</button>
                            </div>
                        ) : (
                            <>
                                <video ref={videoRef} autoPlay playsInline muted className="welcome-video-preview" style={{ opacity: isCameraOn ? 1 : 0 }} />
                                {!isCameraOn && (
                                    <div className="welcome-camera-off-overlay">
                                        <CameraOffIcon />
                                        <span>Camera đã tắt</span>
                                    </div>
                                )}
                                <div className="welcome-video-badge live">LIVE</div>
                                <div className="welcome-video-badge name">{user?.username || 'Bạn'}</div>
                            </>
                        )}
                    </div>
                </div>

                <div className="welcome-status-row">
                    <div className={`welcome-status-card ${isCameraOn ? 'on' : 'off'}`}>
                        <span className="status-icon">{isCameraOn ? '🟢' : '🔴'}</span>
                        <div className="status-text">
                            <strong>Camera</strong>
                            <span>{isCameraOn ? 'Đang hoạt động' : 'Đã tắt'}</span>
                        </div>
                    </div>
                    <div className={`welcome-status-card ${isMicOn ? 'on' : 'off'}`}>
                        <span className="status-icon">{isMicOn ? '🟢' : '🔴'}</span>
                        <div className="status-text">
                            <strong>Microphone</strong>
                            <span>{isMicOn ? 'Đang hoạt động' : 'Đã tắt'}</span>
                        </div>
                    </div>
                </div>

                <div className="welcome-controls">
                    <button className={`welcome-icon-button ${!isCameraOn ? 'active' : ''}`} onClick={toggleCamera} disabled={!stream} title="Bật/Tắt Camera"><CameraIcon /></button>
                    <button className={`welcome-icon-button ${!isMicOn ? 'active' : ''}`} onClick={toggleMic} disabled={!stream} title="Bật/Tắt Micro"><MicIcon /></button>
                    <button className="welcome-icon-button" title="Cài đặt thiết bị" disabled={!stream}><SettingsIcon /></button>
                </div>

                <div className="welcome-actions">
                    <button className="welcome-button primary" onClick={handleStart} disabled={!stream || permissionError}>
                        🔍 Bắt đầu tìm người
                    </button>
                    <button className="welcome-button secondary" onClick={() => navigate('/')}>
                        🏠 Về trang chủ
                    </button>
                </div>

                <p className="welcome-tip">💡 Mẹo: Luôn giữ thái độ tôn trọng và cởi mở để có những cuộc trò chuyện tuyệt vời nhất.</p>
            </div>
        </div>
    );
};

export default WelcomeScreen;